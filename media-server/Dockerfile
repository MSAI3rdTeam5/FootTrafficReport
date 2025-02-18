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
COPY package*.json ./
RUN npm install
COPY . .

EXPOSE 3000
CMD ["node", "index.js"]
