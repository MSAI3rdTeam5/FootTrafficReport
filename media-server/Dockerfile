FROM node:18

RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    g++ \
    make \
    libssl-dev \
    liburing-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# package.json과 관련 파일만 먼저 복사하고 의존성 설치
COPY package*.json ./
RUN npm install

# .env 파일과 나머지 소스 코드 복사
COPY .env ./
COPY . .

EXPOSE 3000
CMD ["node", "index.js"]
