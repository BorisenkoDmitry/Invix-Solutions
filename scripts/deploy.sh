#!/usr/bin/env sh
set -eu

cd "$(dirname "$0")/.."

env_file="${ENV_FILE:-.env.production}"
if [ ! -f "$env_file" ]; then
  echo "Missing $env_file. Copy .env.example and configure server credentials first." >&2
  exit 1
fi

docker compose -p invix-solutions --env-file "$env_file" config --quiet
docker compose -p invix-solutions --env-file "$env_file" build
docker compose -p invix-solutions --env-file "$env_file" up -d \
  --scale backend=2 --scale frontend=2 --scale bot=2 \
  --wait --wait-timeout 180
docker compose -p invix-solutions --env-file "$env_file" ps
