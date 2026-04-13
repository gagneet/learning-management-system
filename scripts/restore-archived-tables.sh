#!/bin/bash

set -euo pipefail

APP_DIR="/home/gagneet/lms"
ENV_FILE="${ENV_FILE:-$APP_DIR/.env.production}"
ARCHIVE_DIR="${ARCHIVE_DIR:-$APP_DIR/backups/db-legacy-archives}"
TRUNCATE_FIRST=false
ARCHIVE_FILE=""

DEFAULT_TABLES=(
  "AssessmentAge"
  "AgeAssessmentLesson"
  "StudentAgeAssessment"
  "AgePromotionTest"
  "AgePromotionAttempt"
  "AgeLessonCompletion"
  "AgeAssessmentHistory"
  "AdminLoginLog"
)

TABLES=()

while [[ $# -gt 0 ]]; do
  case $1 in
    --truncate)
      TRUNCATE_FIRST=true
      shift
      ;;
    --archive)
      ARCHIVE_FILE="$2"
      shift 2
      ;;
    *)
      TABLES+=("$1")
      shift
      ;;
  esac
done

if [ ! -f "$ENV_FILE" ]; then
  echo "Environment file not found: $ENV_FILE" >&2
  exit 1
fi

cd "$APP_DIR"

if [ -z "$ARCHIVE_FILE" ]; then
  ARCHIVE_FILE=$(ls -1t "$ARCHIVE_DIR"/legacy-prisma-drift-*.sql 2>/dev/null | head -1 || true)
fi

if [ -z "$ARCHIVE_FILE" ] || [ ! -f "$ARCHIVE_FILE" ]; then
  echo "Archive file not found. Pass --archive <path> or place an archive under $ARCHIVE_DIR" >&2
  exit 1
fi

if [ ${#TABLES[@]} -eq 0 ]; then
  TABLES=("${DEFAULT_TABLES[@]}")
fi

set -a
source "$ENV_FILE" >/dev/null 2>&1
set +a

DB_URL=$(node -e 'const u=new URL(process.env.DATABASE_URL); u.searchParams.delete("schema"); process.stdout.write(u.toString())')

extract_copy_block() {
  local table_name="$1"

  awk -v table="$table_name" '
    $0 ~ "^COPY public\\.\"" table "\" " { in_block=1 }
    in_block {
      print
      if ($0 == "\\.") {
        exit
      }
    }
  ' "$ARCHIVE_FILE"
}

if [ "$TRUNCATE_FIRST" = true ]; then
  truncate_sql='TRUNCATE TABLE'
  for i in "${!TABLES[@]}"; do
    if [ "$i" -gt 0 ]; then
      truncate_sql+=','
    fi
    truncate_sql+=" \"${TABLES[$i]}\""
  done
  truncate_sql+=' CASCADE;'
  printf '%s\n' "$truncate_sql" | psql "$DB_URL"
fi

for table in "${TABLES[@]}"; do
  block=$(extract_copy_block "$table")
  if [ -z "$block" ]; then
    echo "No COPY block found for $table in $ARCHIVE_FILE" >&2
    continue
  fi

  printf '%s\n' "$block" | psql "$DB_URL"
  echo "Restored $table from $(basename "$ARCHIVE_FILE")"
done
