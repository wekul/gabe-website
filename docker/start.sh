#!/bin/sh
set -eu

echo "Waiting for database..."
until bunx prisma db push >/dev/null 2>&1; do
  echo "Database not ready yet. Retrying in 2s..."
  sleep 2
done

echo "Database ready. Starting app..."
exec bun run start
