"use strict";

// .env 파일의 환경변수를 로드 (파일 경로는 프로젝트 루트에 있어야 합니다)
require("dotenv").config();

const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const mediasoup = require("mediasoup");

// .env 파일에 정의된 PUBLIC_IP를 사용합니다.
const ANNOUNCED_IP = process.env.PUBLIC_IP || "YOUR.PUBLIC.IP";
// 필요시 MEDIASOUP_MIN_PORT와 MEDIASOUP_MAX_PORT도 .env에 추가하세요.
const MIN_PORT = process.env.MEDIASOUP_MIN_PORT || 10000;
const MAX_PORT = process.env.MEDIASOUP_MAX_PORT || 10200;

const app = express();
const server = http.createServer(app);

// Socket.IO 기본 경로: '/socket.io'
// Nginx에서 proxy_pass "/socket.io/"로 설정되어 있음
const io = socketIO(server);

// -------------------------------
// (추가) SRS 관련 안내 (supervisord에서 별도 프로세스로 실행)
// -------------------------------
// 이 Node.js 앱(미디어수프 SFU)와는 별개로, supervisord가 /srs/trunk/objs/srs -c /usr/local/srs/conf/srs.conf
// 명령을 백그라운드로 실행하고 있습니다.
// 따라서 SRS HTTP API(포트 1985) 등은 이 코드에서 직접 다루지 않습니다.
// -------------------------------

let worker;
let router;

/**
 * (A) Mediasoup Worker 및 Router 초기화
 */
async function startMediasoup() {
  // Mediasoup Worker 생성
  worker = await mediasoup.createWorker({
    rtcMinPort: MIN_PORT,
    rtcMaxPort: MAX_PORT,
    // 필요에 따라 logLevel, logTags 설정 가능
  });

  // Router 생성 - 사용할 mediaCodecs 지정
  router = await worker.createRouter({
    mediaCodecs: [
      { kind: "audio", mimeType: "audio/opus", clockRate: 48000, channels: 2 },
      { kind: "video", mimeType: "video/VP8", clockRate: 90000 },
    ],
  });

  console.log("Mediasoup Worker/Router created!");
}

/**
 * (B) Socket.IO 시그널링 처리
 */
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // 1) router.rtpCapabilities 요청 처리
  socket.on("getRouterRtpCapabilities", (data, callback) => {
    try {
      const rtpCapabilities = router.rtpCapabilities;
      callback({ success: true, rtpCapabilities });
    } catch (err) {
      console.error("getRouterRtpCapabilities error:", err);
      callback({ success: false, error: err.toString() });
    }
  });

  // 2) WebRtcTransport 생성 요청 처리
  socket.on("createTransport", async ({ direction }, callback) => {
    try {
      const transport = await router.createWebRtcTransport({
        listenIps: [
          // 0.0.0.0로 리슨하고, 공인 IP는 환경변수로 지정합니다.
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

      // 송수신 구분하여 transport 저장
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

  // 3) DTLS 연결 요청 처리 (connectTransport)
  socket.on("connectTransport", async ({ transportId, dtlsParameters }, callback) => {
    try {
      let transport;
      if (socket.data.sendTransport && socket.data.sendTransport.id === transportId) {
        transport = socket.data.sendTransport;
      } else if (socket.data.recvTransport && socket.data.recvTransport.id === transportId) {
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

  // 4) Producer 생성 요청 처리 (produce)
  socket.on("produce", async ({ transportId, kind, rtpParameters }, callback) => {
    try {
      const transport =
        socket.data.sendTransport && socket.data.sendTransport.id === transportId
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

  // 5) Consumer 생성 요청 처리 (consume)
  socket.on("consume", async ({ producerId, transportId }, callback) => {
    try {
      const transport =
        socket.data.recvTransport && socket.data.recvTransport.id === transportId
          ? socket.data.recvTransport
          : null;
      if (!transport) {
        throw new Error("No recvTransport for consume");
      }

      const consumer = await transport.consume({
        producerId,
        rtpCapabilities: router.rtpCapabilities,
        paused: true, // 생성 후 일단 paused 상태
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

  // 6) 클라이언트 연결 종료 시 처리
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
      console.log("Note: SRS is also running (via supervisord) in the same container if configured.");
    });
  })
  .catch((err) => {
    console.error("Error starting Mediasoup:", err);
  });
