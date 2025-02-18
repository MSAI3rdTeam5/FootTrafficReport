"use strict";

const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const mediasoup = require("mediasoup");

// 1) 환경 변수 로드 (PUBLIC_IP 등)
const ANNOUNCED_IP = process.env.PUBLIC_IP || "YOUR.PUBLIC.IP"; 
// 필요시 환경 변수로 RTP 포트 범위를 세부 지정해도 됨
const MIN_PORT = process.env.MEDIASOUP_MIN_PORT || 10000;
const MAX_PORT = process.env.MEDIASOUP_MAX_PORT || 10200;

const app = express();
const server = http.createServer(app);

// Socket.IO 기본 path => '/socket.io'
// Nginx proxy_pass "/socket.io/" => http://media-sfu:3000/socket.io/
const io = socketIO(server);

let worker;
let router;

/**
 * (A) Mediasoup Worker/Router 초기화
 */
async function startMediasoup() {
  worker = await mediasoup.createWorker({
    rtcMinPort: MIN_PORT,
    rtcMaxPort: MAX_PORT,
    // 필요시 logLevel, logTags 설정
  });

  router = await worker.createRouter({
    mediaCodecs: [
      // 최소 2가지 코덱(오디오/비디오) 정의
      { kind: "audio", mimeType: "audio/opus", clockRate: 48000, channels: 2 },
      { kind: "video", mimeType: "video/VP8", clockRate: 90000 },
    ],
  });

  console.log("Mediasoup Worker/Router created!");
}

/**
 * (B) Socket.io 시그널링
 */
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // 1) router.rtpCapabilities 요청
  socket.on("getRouterRtpCapabilities", (data, callback) => {
    try {
      const rtpCapabilities = router.rtpCapabilities;
      callback({ success: true, rtpCapabilities });
    } catch (err) {
      console.error("getRouterRtpCapabilities error:", err);
      callback({ success: false, error: err.toString() });
    }
  });

  // 2) createTransport
  socket.on("createTransport", async ({ direction }, callback) => {
    try {
      const transport = await router.createWebRtcTransport({
        listenIps: [
          // Azure VM의 공인 IP or 도메인
          { ip: "0.0.0.0", announcedIp: ANNOUNCED_IP },
        ],
        enableUdp: true,
        enableTcp: true,
        preferUdp: true,
        initialAvailableOutgoingBitrate: 800000,
      });

      console.log(`WebRtcTransport created: ${transport.id} (dir=${direction})`);

      const transportParams = {
        id: transport.id,
        iceParameters: transport.iceParameters,
        iceCandidates: transport.iceCandidates,
        dtlsParameters: transport.dtlsParameters,
      };

      // 소켓 data에 기억 (send/recv 구분)
      if (direction === "recv") {
        socket.data.recvTransport = transport;
      } else {
        socket.data.sendTransport = transport;
      }

      callback({ success: true, transportParams });
    } catch (err) {
      console.error("createTransport error:", err);
      callback({ success: false, error: err.toString() });
    }
  });

  // 3) connectTransport (DTLS)
  socket.on("connectTransport", async ({ transportId, dtlsParameters }, callback) => {
    try {
      let transport;
      if (socket.data.sendTransport?.id === transportId) {
        transport = socket.data.sendTransport;
      } else if (socket.data.recvTransport?.id === transportId) {
        transport = socket.data.recvTransport;
      } else {
        throw new Error(`No transport with id=${transportId}`);
      }

      await transport.connect({ dtlsParameters });
      console.log("Transport connected, id=", transport.id);

      callback({ success: true });
    } catch (err) {
      console.error("connectTransport error:", err);
      callback({ success: false, error: err.toString() });
    }
  });

  // 4) produce (Publish)
  socket.on("produce", async ({ transportId, kind, rtpParameters }, callback) => {
    try {
      const transport = (socket.data.sendTransport?.id === transportId)
        ? socket.data.sendTransport
        : null;
      if (!transport) {
        throw new Error("No sendTransport for produce");
      }

      const producer = await transport.produce({ kind, rtpParameters });
      console.log("Producer created:", producer.id, kind);

      if (!socket.data.producers) {
        socket.data.producers = [];
      }
      socket.data.producers.push(producer);

      producer.on("transportclose", () => {
        console.log("Producer's transport closed:", producer.id);
      });

      callback({ success: true, producerId: producer.id });
    } catch (err) {
      console.error("produce error:", err);
      callback({ success: false, error: err.toString() });
    }
  });

  // 5) consume (Subscribe)
  socket.on("consume", async ({ producerId, transportId }, callback) => {
    try {
      const transport = (socket.data.recvTransport?.id === transportId)
        ? socket.data.recvTransport
        : null;
      if (!transport) {
        throw new Error("No recvTransport for consume");
      }

      const consumer = await transport.consume({
        producerId,
        rtpCapabilities: router.rtpCapabilities,
        paused: true, // 구독 직후 일단 paused로 생성
      });
      console.log("Consumer created:", consumer.id, "producerId=", producerId);

      if (!socket.data.consumers) {
        socket.data.consumers = [];
      }
      socket.data.consumers.push(consumer);

      const consumerParams = {
        producerId,
        id: consumer.id,
        kind: consumer.kind,
        rtpParameters: consumer.rtpParameters,
        type: consumer.type,
      };

      callback({ success: true, consumerParams });
    } catch (err) {
      console.error("consume error:", err);
      callback({ success: false, error: err.toString() });
    }
  });

  // 6) disconnect
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);

    if (socket.data.sendTransport) {
      socket.data.sendTransport.close();
    }
    if (socket.data.recvTransport) {
      socket.data.recvTransport.close();
    }
    if (socket.data.producers) {
      socket.data.producers.forEach((p) => p.close());
    }
    if (socket.data.consumers) {
      socket.data.consumers.forEach((c) => c.close());
    }
  });
});

/**
 * (C) 서버 실행
 */
startMediasoup()
  .then(() => {
    const PORT = 3000;
    server.listen(PORT, () => {
      console.log(`Mediasoup server listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error(err);
  });
