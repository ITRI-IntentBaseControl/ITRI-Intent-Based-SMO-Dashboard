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

echo "--- 正在建置 Production 鏡像 ---"

# 3) 重新 build docker image
docker build --no-cache \
  -f Dockerfile.prod \
  --build-arg PORT=${FRONTEND_PORT} \
  --build-arg PROTOCAL=${PROTOCAL} \
  --build-arg HOST=${HOST} \
  --build-arg API_PORT=${API_PORT} \
  --build-arg API_ROOT=${API_ROOT} \
  --build-arg API_VERSION=${API_VERSION} \
  -t $PROD_IMAGE_NAME .

echo "--- 正在啟動 Production 容器 ($PROD_CONTAINER_NAME) ---"

# 4) 執行容器
# --env-file: 將 .env 檔案中的所有變數傳遞給 'npm run start' (用於 API 路由, SSR)
docker run -d \
  --name $PROD_CONTAINER_NAME \
  --network $NETWORK \
  -p ${FRONTEND_PORT}:${FRONTEND_PORT} \
  --env-file $ENV_FILE \
  $PROD_IMAGE_NAME
  
echo "生產容器已啟動"