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

let worker;
let router;

/**
 * (A) Mediasoup Worker 및 Router 초기화
 */
async function startMediasoup() {
  // Worker 생성 (UDP 포트 범위 지정)
  worker = await mediasoup.createWorker({
    rtcMinPort: MIN_PORT,
    rtcMaxPort: MAX_PORT,
    // (추가) debug & logTags
    logLevel: 'debug',
    logTags: ['transport', 'rtp', 'rtcp', 'ice', 'dtls', 'rtx']
  });

  // Router 생성 (코덱 설정)
  router = await worker.createRouter({
    mediaCodecs: [
      { kind: "audio", mimeType: "audio/opus", clockRate: 48000, channels: 2 },
      { kind: "video", mimeType: "video/VP8", clockRate: 90000 },
      // 필요시 { kind: 'video', mimeType: 'video/H264', clockRate: 90000 }
    ],
  });

  console.log("[mediasoup] Worker/Router created =>", {
    rtcMinPort: MIN_PORT,
    rtcMaxPort: MAX_PORT,
    announcedIp: ANNOUNCED_IP
  });
}

/**
 * (B) Socket.IO 시그널링 처리
 */
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  /**
   * 1) getRouterRtpCapabilities
   */
  socket.on("getRouterRtpCapabilities", (data, callback) => {
    try {
      const rtpCapabilities = router.rtpCapabilities;
      callback({ success: true, rtpCapabilities });
    } catch (err) {
      console.error("getRouterRtpCapabilities error:", err);
      callback({ success: false, error: err.toString() });
    }
  });

  /**
   * 2) createTransport
   *    브라우저(클라이언트)는 send or recv로 구분
   */
  socket.on("createTransport", async ({ direction }, callback) => {
    try {
      const transport = await router.createWebRtcTransport({
        listenIps: [{ ip: "0.0.0.0", announcedIp: ANNOUNCED_IP }],
        enableUdp: true,
        enableTcp: true,
        preferUdp: true,
        initialAvailableOutgoingBitrate: 800000,
      });

      console.log(`[SFU] WebRtcTransport created: ${transport.id} (dir=${direction})`);

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

  /**
   * 3) connectTransport (DTLS 연결)
   */
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

  /**
   * 4) Producer 생성
   */
  socket.on("produce", async ({ transportId, kind, rtpParameters }, callback) => {
    try {
      // sendTransport 여부 확인
      const transport = socket.data.sendTransport && socket.data.sendTransport.id === transportId
        ? socket.data.sendTransport
        : null;

      if (!transport) {
        throw new Error("No sendTransport for produce");
      }

      // Producer 생성
      const producer = await transport.produce({ kind, rtpParameters });
      console.log(`[SFU] Producer created => id=${producer.id}, kind=${kind}`);

      if (!socket.data.producers) {
        socket.data.producers = [];
      }
      socket.data.producers.push(producer);

      producer.on("transportclose", () => {
        console.log(`[SFU] Producer's transport closed => ${producer.id}`);
      });

      callback({ success: true, producerId: producer.id });

      // (★) 비디오 Producer라면 PlainTransport + consume => RTP Out
      if (kind === "video") {
        console.log(`[INFO] Creating PlainTransport for video Producer (${producer.id})...`);

        let plainTransport;
        try {
          plainTransport = await router.createPlainTransport({
            listenIp: { ip: "0.0.0.0", announcedIp: ANNOUNCED_IP },
            port: 0,
            rtcpMux: false,
            comedia: false,  // SFU가 먼저 bind
          });
        } catch (e) {
          console.error("[ERROR] createPlainTransport failed =>", e);
          return; // 더 이상 진행 불가
        }

        console.log("[INFO] PlainTransport created =>", plainTransport.id);

        // debug events
        plainTransport.on("transportclose", () => {
          console.log("[DEBUG] PlainTransport closed =>", plainTransport.id);
        });
        plainTransport.on("trace", (trace) => {
          console.log("[DEBUG] PlainTransport trace =>", trace);
        });

        let rtpConsumer;
        try {
          rtpConsumer = await plainTransport.consume({
            producerId: producer.id,
            rtpCapabilities: router.rtpCapabilities,
            paused: false,
          });
        } catch (e) {
          console.error("[ERROR] plainTransport.consume failed =>", e);
          return;
        }

        console.log("[INFO] RTP Consumer created =>", rtpConsumer.id);

        socket.data.plainTransport = plainTransport;
        socket.data.rtpConsumer = rtpConsumer;

        // tuple 이벤트
        plainTransport.on("tuple", (tuple) => {
          console.log(`[INFO] plainTransport 'tuple' => IP=${tuple.localIp}, Port=${tuple.localPort}`);

          // 브라우저에 알림
          socket.emit("rtpPortAssigned", {
            localIp: tuple.localIp,
            localPort: tuple.localPort,
          });

          if (!plainTransport.rtcpMux && plainTransport.rtcpTuple) {
            console.log(
              `[INFO] RTCP => IP=${plainTransport.rtcpTuple.localIp}, Port=${plainTransport.rtcpTuple.localPort}`
            );
          }
        });

        // (선택) rtpstate 이벤트
        plainTransport.on("rtpstate", (state) => {
          console.log(`[INFO] plainTransport 'rtpstate' => ${JSON.stringify(state)}`);
        });
      }
    } catch (err) {
      console.error("produce error:", err);
      callback({ success: false, error: err.toString() });
    }
  });

  /**
   * 5) Consumer 생성 (옵션)
   */
  socket.on("consume", async ({ producerId, transportId }, callback) => {
    try {
      const transport = socket.data.recvTransport && socket.data.recvTransport.id === transportId
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
      console.log(`[SFU] Consumer created => ${consumer.id}, producer=${producerId}`);

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

  /**
   * 6) disconnect
   */
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
    if (socket.data.plainTransport) {
      socket.data.plainTransport.close();
    }
    if (socket.data.rtpConsumer) {
      socket.data.rtpConsumer.close();
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
      console.log("[INFO] SRS or any other streaming server might be separate if configured.");
    });
  })
  .catch((err) => {
    console.error("Error starting Mediasoup:", err);
  });
