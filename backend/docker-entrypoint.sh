#!/bin/sh
set -e
if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is not set."
  exit 1
fi
echo "Applying idempotent schema patches..."
node scripts/ensure-schema.js

echo "Syncing database schema (drizzle push)..."
if npm run db:push -- --force; then
  echo "Drizzle push completed."
else
  echo "WARN: drizzle push failed (common in non-interactive Docker). Patches above were still applied."
fi
exec npm run start:prod
