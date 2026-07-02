#!/bin/sh
set -e

# Inside Docker, localhost/127.0.0.1 refer to the container — not the host machine.
if [ -n "${LLM_BASE_URL:-}" ]; then
  LLM_BASE_URL=$(printf '%s' "$LLM_BASE_URL" | sed \
    -e 's|//localhost|//host.docker.internal|g' \
    -e 's|//127\.0\.0\.1|//host.docker.internal|g')
  export LLM_BASE_URL
fi

exec ./fbi-bot
