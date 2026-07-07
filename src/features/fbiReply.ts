import type { Client, Message } from "discord.js";
import { callLLM } from "../llm";

async function collectImageDataUrls(message: Message): Promise<string[]> {
  const imageDataUrls: string[] = [];
  for (const attachment of message.attachments.values()) {
    if (!attachment.contentType?.startsWith("image/")) continue;
    try {
      const response = await fetch(attachment.url);
      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`);
      }
      const base64 = Buffer.from(await response.arrayBuffer()).toString("base64");
      imageDataUrls.push(`data:${attachment.contentType};base64,${base64}`);
    } catch (error) {
      console.error(`Failed to download attachment ${attachment.url}:`, error);
    }
  }
  return imageDataUrls;
}

export async function handleFbiReply(client: Client, message: Message): Promise<void> {
  if (message.author.bot) return;
  if (!client.user || !message.mentions.has(client.user.id)) return;

  let contextContent = message.content;
  const imageDataUrls: string[] = [];

  if (message.reference) {
    let referencedMessage: Message;
    try {
      referencedMessage = await message.fetchReference();
    } catch (error) {
      console.error("Failed to fetch referenced message:", error);
      return;
    }

    if (referencedMessage.author.bot) {
      // Never respond to mentions inside a reply to any bot's message.
      return;
    }

    contextContent = referencedMessage.content;
    imageDataUrls.push(...(await collectImageDataUrls(referencedMessage)));
  }

  imageDataUrls.push(...(await collectImageDataUrls(message)));

  let snarkyText: string;
  try {
    snarkyText = await callLLM(contextContent, imageDataUrls);
  } catch (error) {
    console.error("Failed to generate FBI reply:", error);
    return;
  }

  try {
    await message.reply(snarkyText);
  } catch (error) {
    console.error("Failed to send FBI reply:", error);
  }
}
