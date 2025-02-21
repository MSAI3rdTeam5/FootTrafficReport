# /home/azureuser/FootTrafficReport/media-server/Dockerfile

FROM node:18

# 1) 빌드에 필요한 패키지 설치
#    (mediasoup는 C++ 컴파일이 필요하므로 g++, make, python3 등 필수)
RUN apt-get update && apt-get install -y \
    python3 python3-pip \
    g++ make libssl-dev liburing-dev pkg-config \
    && rm -rf /var/lib/apt/lists/*

# 2) 작업 디렉토리 설정
WORKDIR /app

# 3) Node.js 의존성 설치
COPY package*.json ./
RUN npm install

# 4) 소스 복사
COPY . .

# 5) 포트 노출 (예: 3000 for WebSocket, 10000-10200/udp for WebRTC in docker-compose.yml)
EXPOSE 3000

# 6) 실행 명령: 단일 Node.js 프로세스로 mediasoup 서버 실행
CMD ["node", "index.js"]
