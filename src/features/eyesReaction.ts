import type { Message } from "discord.js";
import { config } from "../config";

export async function handleEyesReaction(message: Message): Promise<void> {
  if (message.author.bot) return;
  if (Math.random() >= config.eyesReactionChance) return;

  try {
    await message.react("👀");
    console.log("Reacted with 👀");
  } catch (error) {
    console.error("Failed to react with 👀:", error);
  }
}
