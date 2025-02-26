# server/Dockerfile

FROM node:18-slim
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# server 폴더 안에 있는 package.json과 lock 파일 복사
COPY package*.json ./
RUN npm install

# 서버 소스 복사
COPY src ./src


EXPOSE 4000

CMD ["node", "src/index.js"]