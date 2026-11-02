#!/bin/sh
set -e
# 路徑預設給 Dockerfile 用；Nixpacks 部署時由 package.json 的 start 指令覆寫
PB_BIN="${PB_BIN:-/app/pocketbase}"
PB_MIGRATIONS="${PB_MIGRATIONS:-/app/pb_migrations}"
PB_PUBLIC="${PB_PUBLIC:-/app/pb_public}"
# 資料一律放在永久儲存資料夾 /app/data
DATA_DIR="${PB_DATA_DIR:-/app/data/pb_data}"
mkdir -p "$DATA_DIR"

# 有設定 PB_ADMIN_EMAIL / PB_ADMIN_PASSWORD 環境變數就建立（或更新）後台管理員
if [ -n "$PB_ADMIN_EMAIL" ] && [ -n "$PB_ADMIN_PASSWORD" ]; then
  "$PB_BIN" superuser upsert "$PB_ADMIN_EMAIL" "$PB_ADMIN_PASSWORD" \
    --dir="$DATA_DIR" --migrationsDir="$PB_MIGRATIONS"
fi

exec "$PB_BIN" serve --http=0.0.0.0:8090 \
  --dir="$DATA_DIR" \
  --migrationsDir="$PB_MIGRATIONS" \
  --publicDir="$PB_PUBLIC"
