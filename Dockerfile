# 菸蒂快篩 APP：前端（Vite）＋後端（PocketBase）打包成同一個容器
# 部署平台（Coolify / deploy.techedu.cc）：建置方式選「我有 Dockerfile」，Port 填 8090，
# 勾選 Persistent Storage，資料夾路徑填 /app/data。

# ---------- 1. 建置前端 ----------
FROM node:22-alpine AS web
WORKDIR /web
COPY cigarette-screening-app/package.json cigarette-screening-app/package-lock.json ./
RUN npm ci
COPY cigarette-screening-app/ ./
# 不設定 VITE_POCKETBASE_URL：正式版直接連同一個網址（同源）
RUN npm run build

# ---------- 2. PocketBase ----------
FROM alpine:3.20
ARG PB_VERSION=0.39.10
ARG TARGETARCH=amd64
RUN apk add --no-cache unzip ca-certificates \
 && wget -q "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_${TARGETARCH}.zip" -O /tmp/pb.zip \
 && unzip /tmp/pb.zip pocketbase -d /app/ \
 && rm /tmp/pb.zip

WORKDIR /app
COPY pocketbase-deploy/pb_migrations ./pb_migrations
COPY pocketbase-deploy/entrypoint.sh ./entrypoint.sh
COPY --from=web /web/dist ./pb_public
RUN chmod +x /app/entrypoint.sh /app/pocketbase && mkdir -p /app/data

EXPOSE 8090
CMD ["/app/entrypoint.sh"]
