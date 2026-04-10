#!/bin/sh
set -e
if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is not set."
  exit 1
fi
echo "Applying database migrations..."
npm run db:push -- --force || { echo "Failed to apply migrations"; exit 1; }
echo "Migrations applied successfully!"
exec npm run start:prod
