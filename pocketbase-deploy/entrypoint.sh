#!/bin/sh
set -e
DATA_DIR=/app/data/pb_data

# 有設定 PB_ADMIN_EMAIL / PB_ADMIN_PASSWORD 環境變數就建立（或更新）後台管理員
if [ -n "$PB_ADMIN_EMAIL" ] && [ -n "$PB_ADMIN_PASSWORD" ]; then
  /app/pocketbase superuser upsert "$PB_ADMIN_EMAIL" "$PB_ADMIN_PASSWORD" \
    --dir="$DATA_DIR" --migrationsDir=/app/pb_migrations
fi

exec /app/pocketbase serve --http=0.0.0.0:8090 \
  --dir="$DATA_DIR" \
  --migrationsDir=/app/pb_migrations \
  --publicDir=/app/pb_public
