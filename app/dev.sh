#!/usr/bin/env sh
set -eu

cd "$(dirname "$0")"

if [ "${1:-}" = "--docker" ]; then
  if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
    exec docker compose up --build
  fi

  if command -v docker-compose >/dev/null 2>&1; then
    exec docker-compose up --build
  fi

  echo "Docker Compose is not available. Run without --docker for native dev." >&2
  exit 1
fi

if [ ! -d node_modules ]; then
  npm install
fi

exec npm run dev
