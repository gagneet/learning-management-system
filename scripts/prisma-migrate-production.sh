#!/bin/bash

set -euo pipefail

APP_DIR="/home/gagneet/lms"
ENV_FILE="${ENV_FILE:-$APP_DIR/.env.production}"

if [ ! -f "$ENV_FILE" ]; then
  echo "Environment file not found: $ENV_FILE" >&2
  exit 1
fi

cd "$APP_DIR"

if [ ! -d "prisma/migrations" ] || [ -z "$(find prisma/migrations -mindepth 1 -maxdepth 1 -type d -print -quit)" ]; then
  echo "No Prisma migrations found in prisma/migrations" >&2
  exit 1
fi

set -a
source "$ENV_FILE" >/dev/null 2>&1
set +a

npx prisma migrate status || true
npx prisma migrate deploy
