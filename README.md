# fbi-bot

A Discord bot that:

- Replies with a snarky, LLM-generated "FBI agent" remark whenever it's @mentioned (using the replied-to message as context if the mention is inside a reply).
- Randomly joins a voice channel, sits silently for ~45 seconds, then leaves.
- Randomly reacts to messages with 👀.

## Setup

Install dependencies:

```bash
bun install
```

Copy the example env file and fill in your values:

```bash
cp example.env .env
```

`.env` requires:

- `DISCORD_TOKEN` — your bot's token from the [Discord Developer Portal](https://discord.com/developers/applications). Make sure the **Message Content Intent** is enabled under Bot settings.
- `LLM_BASE_URL` / `LLM_MODEL` — your local OpenAI-compatible LLM server (e.g. LM Studio, llama.cpp server, Ollama's `/v1` endpoint). No API key is required for local servers.

See `example.env` for optional tunables (reaction chance, voice join timing/retries, system prompt).

## Run

```bash
bun run index.ts
```

Or with auto-reload during development:

```bash
bun --hot index.ts
```

## Build

Compile a standalone executable (Bun is only needed to build, not to run):

```bash
bun build --compile --outfile=fbi-bot -e ffmpeg-static index.ts
```

`-e ffmpeg-static` excludes an optional dependency pulled in by `@discordjs/voice` that this bot does not use (voice join is silent).

Run the binary with a `.env` file in the same directory (or set env vars directly):

```bash
./fbi-bot
```

Cross-compile for another platform:

```bash
# Linux x64 (typical VPS)
bun build --compile --target=bun-linux-x64 --outfile=fbi-bot -e ffmpeg-static index.ts

# Linux ARM64 (e.g. Raspberry Pi, Graviton)
bun build --compile --target=bun-linux-arm64 --outfile=fbi-bot -e ffmpeg-static index.ts

# Windows x64
bun build --compile --target=bun-windows-x64 --outfile=fbi-bot.exe -e ffmpeg-static index.ts
```

## Invite the bot to a server

Use this link to add the bot (grants View Channel, Send Messages, Read Message History, Add Reactions, and Connect permissions):

```md
https://discord.com/oauth2/authorize?client_id=1521852692815679609&scope=bot&permissions=3213376
```

---

This project was created using `bun init` in bun v1.3.14. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
