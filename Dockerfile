# syntax=docker/dockerfile:1

FROM oven/bun:1 AS builder

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY tsconfig.json index.ts ./
COPY src ./src

RUN bun build --compile --outfile=fbi-bot -e ffmpeg-static index.ts

FROM debian:bookworm-slim AS runtime

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /app/fbi-bot ./fbi-bot
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x docker-entrypoint.sh fbi-bot

USER nobody

ENV NODE_ENV=production

ENTRYPOINT ["./docker-entrypoint.sh"]
