#!/usr/bin/env bash
# Pull the latest main and rebuild the production stack on the Droplet.
set -euo pipefail
cd "$(dirname "$0")"

if [ ! -f .env ]; then
  echo "Missing .env: set JWT_SECRET, GEMMA_PROVIDER and GEMINI_API_KEY first." >&2
  exit 1
fi
if ! grep -qE '^JWT_SECRET=.{32,}' .env; then
  echo "JWT_SECRET in .env must be at least 32 characters (openssl rand -hex 32)." >&2
  exit 1
fi

compose() { docker compose -f docker-compose.yml -f docker-compose.prod.yml "$@"; }

git pull --ff-only
compose up -d --build --remove-orphans
docker image prune -f
compose ps
