import { ChannelType, type Client, type Guild } from "discord.js";
import {
  entersState,
  joinVoiceChannel,
  VoiceConnectionStatus,
} from "@discordjs/voice";
import { config } from "../config";

function randomMs(minMinutes: number, maxMinutes: number): number {
  const minMs = minMinutes * 60_000;
  const maxMs = maxMinutes * 60_000;
  return minMs + Math.random() * (maxMs - minMs);
}

function takeRandom<T>(items: T[]): T {
  const index = Math.floor(Math.random() * items.length);
  return items.splice(index, 1)[0]!;
}

async function attemptDropIn(guild: Guild): Promise<void> {
  const candidates = [
    ...guild.channels.cache.filter((channel) => channel.type === ChannelType.GuildVoice).values(),
  ];

  if (candidates.length === 0) {
    console.log(`[voiceJoin] Guild "${guild.name}" has no voice channels, skipping this cycle.`);
    return;
  }

  for (let attempt = 1; attempt <= config.voiceJoinRetryCount && candidates.length > 0; attempt++) {
    const channel = takeRandom(candidates);
    const connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: guild.id,
      adapterCreator: guild.voiceAdapterCreator,
    });

    try {
      await entersState(connection, VoiceConnectionStatus.Ready, 10_000);
      console.log(`[voiceJoin] Joined "${channel.name}" in "${guild.name}".`);

      await new Promise((resolve) => setTimeout(resolve, config.voiceSitSeconds * 1_000));

      connection.destroy();
      console.log(`[voiceJoin] Left "${channel.name}" in "${guild.name}".`);
      return;
    } catch (error) {
      console.error(
        `[voiceJoin] Attempt ${attempt}/${config.voiceJoinRetryCount} failed for "${channel.name}" in "${guild.name}":`,
        error,
      );
      connection.destroy();
    }
  }

  console.log(`[voiceJoin] Giving up on "${guild.name}" until the next window.`);
}

function scheduleNextDropIn(guild: Guild): void {
  const delay = randomMs(config.voiceJoinMinMinutes, config.voiceJoinMaxMinutes);
  setTimeout(async () => {
    try {
      await attemptDropIn(guild);
    } catch (error) {
      console.error(`[voiceJoin] Unexpected error for guild "${guild.name}":`, error);
    } finally {
      scheduleNextDropIn(guild);
    }
  }, delay);
}

export function startVoiceJoinLoop(client: Client): void {
  for (const guild of client.guilds.cache.values()) {
    scheduleNextDropIn(guild);
  }
}
