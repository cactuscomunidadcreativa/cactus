#!/bin/bash

# Quick Supabase migration runner
# Usage: ./scripts/db-migrate.sh [file.sql]

set -e

# Load env
if [ -f .env.local ]; then
  export $(grep -E '^(NEXT_PUBLIC_SUPABASE_URL|SUPABASE_SERVICE_ROLE_KEY)=' .env.local | xargs)
fi

if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "❌ Missing Supabase credentials"
  exit 1
fi

# Extract project ref from URL
PROJECT_REF=$(echo $NEXT_PUBLIC_SUPABASE_URL | sed 's|https://\([^.]*\).*|\1|')

run_sql() {
  local sql_file=$1
  echo "📦 Running: $sql_file"

  # Use Supabase REST API to run SQL
  curl -s -X POST \
    "${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql" \
    -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "Content-Type: application/json" \
    -d "{\"query\": $(cat "$sql_file" | jq -Rs .)}" \
    && echo " ✅" || echo " ⚠️  May need manual execution"
}

if [ -n "$1" ]; then
  # Run specific file
  if [ -f "supabase/migrations/$1" ]; then
    run_sql "supabase/migrations/$1"
  elif [ -f "supabase/migrations/$1.sql" ]; then
    run_sql "supabase/migrations/$1.sql"
  else
    echo "❌ File not found: $1"
    exit 1
  fi
else
  # Run all migrations
  for file in supabase/migrations/*.sql; do
    run_sql "$file"
  done
fi

echo "✨ Done!"
