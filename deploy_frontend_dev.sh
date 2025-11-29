#!/bin/bash

NETWORK=itri-net
DEV_IMAGE_NAME="itri-intent-dashboard-dev"        # 開發版鏡像名稱
DEV_CONTAINER_NAME="itri-intent-dashboard-dev"    # 開發版容器名稱
PROD_IMAGE_NAME="itri-intent-dashboard-prod"      # 生產版鏡像名稱
PROD_CONTAINER_NAME="itri-intent-dashboard-prod"  # 生產版容器名稱
ENV_FILE=".env"                                   # 環境變數檔案

set -e

# 1) 停止並移除生產容器
docker stop $DEV_CONTAINER_NAME || true
docker rm $DEV_CONTAINER_NAME || true
docker stop $PROD_CONTAINER_NAME || true
docker rm $PROD_CONTAINER_NAME || true

# 2) 讀取 .env 內的環境變數
source $ENV_FILE

echo "--- 正在建置 Development 鏡像 ---"

# 3) 重新 build docker image
docker build --no-cache \
  -f Dockerfile.dev \
  --build-arg PORT=${FRONTEND_PORT} \
  -t $DEV_IMAGE_NAME .

echo "--- 正在啟動 Development 容器 ($DEV_CONTAINER_NAME) ---"

# 4) 執行容器
docker run -d \
  --name $DEV_CONTAINER_NAME \
  -p ${FRONTEND_PORT}:${FRONTEND_PORT} \
  -v $(pwd):/app \
  -v /app/node_modules \
  $DEV_IMAGE_NAME

echo "開發容器已啟動"