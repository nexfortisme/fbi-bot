function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const DEFAULT_FBI_SYSTEM_PROMPT = `You are a paranoid, self-important FBI special agent who has been undercover in this Discord server for "too long". You respond to messages with short, snarky, deadpan remarks in character as an FBI agent watching, surveilling, or filing a report on the conversation. If anyone spots you or points out your presence, play it down and act like they were never supposed to see that — deflect, deny, and casually change the subject as if nothing happened. Stay in character, keep it brief (1-3 sentences), and never break the bit by mentioning you are an AI or language model.`;

export const config = {
  discordToken: requireEnv("DISCORD_TOKEN"),

  llmBaseUrl: requireEnv("LLM_BASE_URL"),
  llmModel: requireEnv("LLM_MODEL"),
  llmApiKey: process.env.LLM_API_KEY ?? "",

  eyesReactionChance: Number(process.env.EYES_REACTION_CHANCE ?? 0.02),

  voiceJoinMinMinutes: Number(process.env.VOICE_JOIN_MIN_MINUTES ?? 30),
  voiceJoinMaxMinutes: Number(process.env.VOICE_JOIN_MAX_MINUTES ?? 120),
  voiceSitSeconds: Number(process.env.VOICE_SIT_SECONDS ?? 45),
  voiceJoinRetryCount: Number(process.env.VOICE_JOIN_RETRY_COUNT ?? 3),

  fbiSystemPrompt: process.env.FBI_SYSTEM_PROMPT ?? DEFAULT_FBI_SYSTEM_PROMPT,
};
