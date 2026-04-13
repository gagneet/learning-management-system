#!/bin/bash

set -euo pipefail

APP_DIR="/home/gagneet/lms"
ENV_FILE="${ENV_FILE:-$APP_DIR/.env.production}"
ARCHIVE_DIR="${ARCHIVE_DIR:-$APP_DIR/backups/db-legacy-archives}"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
ARCHIVE_FILE="$ARCHIVE_DIR/legacy-prisma-drift-$TIMESTAMP.sql"
COUNTS_FILE="$ARCHIVE_DIR/legacy-prisma-drift-$TIMESTAMP-counts.txt"

TABLES=("$@")

if [ ${#TABLES[@]} -eq 0 ]; then
  echo "No unmanaged legacy tables configured for archival."
  echo "Pass explicit table names (for example: public.\"SomeOldTable\") when you need to archive true schema drift."
  exit 0
fi

if [ ! -f "$ENV_FILE" ]; then
  echo "Environment file not found: $ENV_FILE" >&2
  exit 1
fi

cd "$APP_DIR"
mkdir -p "$ARCHIVE_DIR"

set -a
source "$ENV_FILE" >/dev/null 2>&1
set +a

DB_URL=$(node -e 'const u=new URL(process.env.DATABASE_URL); u.searchParams.delete("schema"); process.stdout.write(u.toString())')

pg_dump "$DB_URL" \
  --no-owner \
  --no-privileges \
  --file="$ARCHIVE_FILE" \
  "${TABLES[@]/#/--table=}"

{
  for table in "${TABLES[@]}"; do
    simple_name=${table#*.}
    simple_name=${simple_name//\"/}
    printf "SELECT '%s=' || count(*) FROM %s;\n" "$simple_name" "$table"
  done
} | psql "$DB_URL" -At > "$COUNTS_FILE"

echo "Archived legacy Prisma drift tables to:"
echo "  $ARCHIVE_FILE"
echo "  $COUNTS_FILE"
