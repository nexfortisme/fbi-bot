import type { Client, Message } from "discord.js";
import { callLLM } from "../llm";

export async function handleFbiReply(client: Client, message: Message): Promise<void> {
  if (message.author.bot) return;
  if (!client.user || !message.mentions.has(client.user.id)) return;

  let contextContent = message.content;

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
  }

  let snarkyText: string;
  try {
    snarkyText = await callLLM(contextContent);
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
