# my-chatbot/frontend/Dockerfile
FROM node:20.18.0

WORKDIR /app

# 複製 package.json / package-lock.json
COPY package*.json ./
RUN npm install -f

# 複製所有源代碼
COPY . .

# 暴露端口 3000
EXPOSE 3000

# 啟動開發服務器
CMD ["npm", "run", "dev"]
