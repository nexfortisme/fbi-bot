import { existsSync, readdirSync } from "node:fs";
import { basename, join } from "node:path";
import { ChannelType, type Client, type Guild, type VoiceBasedChannel } from "discord.js";
import {
  AudioPlayerStatus,
  createAudioPlayer,
  createAudioResource,
  entersState,
  joinVoiceChannel,
  type VoiceConnection,
  VoiceConnectionStatus,
} from "@discordjs/voice";
import { config } from "../config";

const CLIP_EXTENSIONS = new Set([".mp3", ".ogg", ".webm", ".wav"]);

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function randomMs(minMinutes: number, maxMinutes: number): number {
  return randomBetween(minMinutes * 60_000, maxMinutes * 60_000);
}

function takeRandom<T>(items: T[]): T {
  const index = Math.floor(Math.random() * items.length);
  return items.splice(index, 1)[0]!;
}

function resolveAssetsDir(): string {
  const candidates = [
    join(import.meta.dir, "../../assets"),
    join(process.cwd(), "assets"),
  ];
  for (const dir of candidates) {
    if (existsSync(dir)) return dir;
  }
  return candidates[0]!;
}

function listAudioClips(): string[] {
  const assetsDir = resolveAssetsDir();
  if (!existsSync(assetsDir)) return [];

  return readdirSync(assetsDir)
    .filter((name) => CLIP_EXTENSIONS.has(name.slice(name.lastIndexOf(".")).toLowerCase()))
    .map((name) => join(assetsDir, name));
}

function channelHasPeople(channel: VoiceBasedChannel): boolean {
  return channel.members.some((member) => !member.user.bot);
}

async function playRandomClip(connection: VoiceConnection): Promise<void> {
  const clips = listAudioClips();
  if (clips.length === 0) {
    console.warn("[voiceJoin] No audio clips found in assets/, skipping playback.");
    return;
  }

  const clipPath = clips[Math.floor(Math.random() * clips.length)]!;
  const player = createAudioPlayer();
  const subscription = connection.subscribe(player);
  const resource = createAudioResource(clipPath);

  player.play(resource);
  console.log(`[voiceJoin] Playing "${basename(clipPath)}".`);

  try {
    await entersState(player, AudioPlayerStatus.Playing, 5_000);
    await entersState(player, AudioPlayerStatus.Idle, 30_000);
  } catch (error) {
    console.error(`[voiceJoin] Failed to play "${basename(clipPath)}":`, error);
    player.stop(true);
  } finally {
    subscription?.unsubscribe();
  }
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

      const pauseMs = randomBetween(
        config.voicePauseMinSeconds * 1_000,
        config.voicePauseMaxSeconds * 1_000,
      );
      console.log(`[voiceJoin] Waiting ${(pauseMs / 1_000).toFixed(1)}s before acting.`);
      await new Promise((resolve) => setTimeout(resolve, pauseMs));

      if (channelHasPeople(channel)) {
        await playRandomClip(connection);
      } else {
        console.log(`[voiceJoin] "${channel.name}" is empty, leaving silently.`);
      }

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
