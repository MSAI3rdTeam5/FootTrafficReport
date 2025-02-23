// /home/azureuser/FootTrafficReport/media-server/index.js

"use strict";

// .env 파일의 환경변수를 로드
require("dotenv").config();

const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const mediasoup = require("mediasoup");

const ANNOUNCED_IP = process.env.PUBLIC_IP || "YOUR.PUBLIC.IP";
const MIN_PORT = parseInt(process.env.MEDIASOUP_MIN_PORT || 10000, 10);
const MAX_PORT = parseInt(process.env.MEDIASOUP_MAX_PORT || 10200, 10);

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Mediasoup Worker/Router
let worker;
let router;

/**
 * (A) Mediasoup Worker 및 Router 초기화
 */
async function startMediasoup() {
  // 1) Worker 생성, UDP 포트 범위 지정
  worker = await mediasoup.createWorker({
    rtcMinPort: MIN_PORT,
    rtcMaxPort: MAX_PORT,
    // (선택) verbose한 로그
    logLevel: "debug",
    logTags: ["transport", "rtp", "rtcp", "ice", "dtls", "rtx"],
  });

  // 2) Router 생성 (코덱 설정)
  router = await worker.createRouter({
    mediaCodecs: [
      { kind: "audio", mimeType: "audio/opus", clockRate: 48000, channels: 2 },
      { kind: "video", mimeType: "video/VP8", clockRate: 90000 },
      // 필요시 => { kind: "video", mimeType: "video/H264", clockRate: 90000 }
    ],
  });

  console.log("[mediasoup] Worker/Router created =>", {
    rtcMinPort: MIN_PORT,
    rtcMaxPort: MAX_PORT,
    announcedIp: ANNOUNCED_IP,
  });
}

/**
 * (B) Socket.IO 시그널링 처리
 */
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // 1) router RTP Capabilities
  socket.on("getRouterRtpCapabilities", (data, callback) => {
    try {
      const rtpCapabilities = router.rtpCapabilities;
      callback({ success: true, rtpCapabilities });
    } catch (err) {
      console.error("getRouterRtpCapabilities error:", err);
      callback({ success: false, error: err.toString() });
    }
  });

  // 2) createTransport (send or recv)
  socket.on("createTransport", async ({ direction }, callback) => {
    try {
      const transport = await router.createWebRtcTransport({
        listenIps: [{ ip: "0.0.0.0", announcedIp: ANNOUNCED_IP }],
        enableUdp: true,
        enableTcp: true,
        preferUdp: true,
        initialAvailableOutgoingBitrate: 800000,
      });

      console.log(
        `[SFU] WebRtcTransport created => id=${transport.id}, direction=${direction}`
      );

      const transportParams = {
        id: transport.id,
        iceParameters: transport.iceParameters,
        iceCandidates: transport.iceCandidates,
        dtlsParameters: transport.dtlsParameters,
      };

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
      if (socket.data.sendTransport && socket.data.sendTransport.id === transportId) {
        transport = socket.data.sendTransport;
      } else if (socket.data.recvTransport && socket.data.recvTransport.id === transportId) {
        transport = socket.data.recvTransport;
      } else {
        throw new Error(`No transport with id=${transportId}`);
      }

      await transport.connect({ dtlsParameters });
      console.log(`[SFU] Transport connected => id=${transport.id}`);
      callback({ success: true });
    } catch (err) {
      console.error("connectTransport error:", err);
      callback({ success: false, error: err.toString() });
    }
  });

  // 4) Producer 생성
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
      console.log(`[SFU] Producer created => id=${producer.id}, kind=${kind}`);

      if (!socket.data.producers) {
        socket.data.producers = [];
      }
      socket.data.producers.push(producer);

      producer.on("transportclose", () => {
        console.log(`[SFU] Producer's transport closed => ${producer.id}`);
      });

      // 여기서 PlainTransport 등의 추가 로직을 제거!
      // 즉, 모자이크 파이프라인(RTP Out) 없이 끝남.

      callback({ success: true, producerId: producer.id });
    } catch (err) {
      console.error("produce error:", err);
      callback({ success: false, error: err.toString() });
    }
  });

  // 5) Consumer 생성 (옵션)
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
        paused: true,
      });
      console.log(`[SFU] Consumer created => id=${consumer.id}, producer=${producerId}`);

      if (!socket.data.consumers) {
        socket.data.consumers = [];
      }
      socket.data.consumers.push(consumer);

      // consumerParams 반환
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

    // cleanup
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
    // PlainTransport-related data (removed)
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
      console.log("[INFO] PlainTransport for mosaic? Removed. Now only WebRTC remains!");
    });
  })
  .catch((err) => {
    console.error("Error starting Mediasoup:", err);
  });
