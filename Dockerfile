# my-chatbot/frontend/Dockerfile
FROM node:20.18.0

WORKDIR /app

# 複製 package.json / package-lock.json
COPY . .
RUN npm install -f

# 接收建置參數
ARG PORT=3000
ENV PORT=$PORT

# 啟動開發服務器
CMD ["npm", "run", "dev"]
