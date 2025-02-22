"use strict";

// .env 파일의 환경변수를 로드
require("dotenv").config();

const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const mediasoup = require("mediasoup");

const ANNOUNCED_IP = process.env.PUBLIC_IP || "YOUR.PUBLIC.IP";
const MIN_PORT = process.env.MEDIASOUP_MIN_PORT || 10000;
const MAX_PORT = process.env.MEDIASOUP_MAX_PORT || 10200;

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

let worker;
let router;

/**
 * (A) Mediasoup Worker 및 Router 초기화
 */
async function startMediasoup() {
  worker = await mediasoup.createWorker({
    rtcMinPort: MIN_PORT,
    rtcMaxPort: MAX_PORT,
  });

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

  // 2) WebRtcTransport 생성 요청
  socket.on("createTransport", async ({ direction }, callback) => {
    try {
      const transport = await router.createWebRtcTransport({
        listenIps: [{ ip: "0.0.0.0", announcedIp: ANNOUNCED_IP }],
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

  // 3) DTLS 연결
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
      console.log("Producer created:", producer.id, kind);

      if (!socket.data.producers) {
        socket.data.producers = [];
      }
      socket.data.producers.push(producer);

      producer.on("transportclose", () => {
        console.log("Producer's transport closed:", producer.id);
      });

      callback({ success: true, producerId: producer.id });

      // **(추가) 비디오 Producer에 대해 PlainTransport로 RTP Out을 뽑아낸다**
      if (kind === "video") {
        console.log(`[INFO] Creating PlainTransport for video Producer (${producer.id})...`);

        // 1) PlainTransport 생성 (임의 포트 할당 => port: 0)
        const plainTransport = await router.createPlainTransport({
          listenIp: { ip: "0.0.0.0", announcedIp: ANNOUNCED_IP },
          port: 0,         // OS가 사용가능한 포트를 자동 할당
          rtcpMux: false,  // RTP + RTCP 분리
          comedia: false,  // SFU가 먼저 송신
        });

        console.log("[INFO] PlainTransport created, id=", plainTransport.id);

        // 2) PlainTransport.consume() -> RTP Out
        const rtpConsumer = await plainTransport.consume({
          producerId: producer.id,
          rtpCapabilities: router.rtpCapabilities,
          paused: false,
        });

        console.log("[INFO] RTP Consumer created, id=", rtpConsumer.id);

        // (옵션) 관리 용도로 socket.data에 저장
        socket.data.plainTransport = plainTransport;
        socket.data.rtpConsumer = rtpConsumer;

        /** 
         * (중요) v3에서 plainTransport.rtpTuple가 아직 undefined일 수 있음.
         *  => 'tuple' 이벤트로 bind 완료시점을 포착
         */
        plainTransport.on('tuple', (tuple) => {
          // 'tuple' 이벤트는 RTP 바인딩이 끝나 실제 IP/Port가 할당되면 호출됨
          console.log(`[INFO] plainTransport on('tuple'): IP=${tuple.localIp}, Port=${tuple.localPort}`);

          // (예시) 프론트엔드로 동적 포트 전달
          socket.emit("rtpPortAssigned", {
            localIp: tuple.localIp,
            localPort: tuple.localPort
          });

          // RTCP 확인
          if (!plainTransport.rtcpMux && plainTransport.rtcpTuple) {
            const rtcp = plainTransport.rtcpTuple;
            console.log(`[INFO] plainTransport => RTCP IP=${rtcp.localIp}, Port=${rtcp.localPort}`);
          }
        });

        // (선택) rtpstate 이벤트 (mediasoup v3.10~)
        plainTransport.on('rtpstate', (state) => {
          console.log(`[INFO] plainTransport 'rtpstate' => ${JSON.stringify(state)}`);
        });
      }
    } catch (err) {
      console.error("produce error:", err);
      callback({ success: false, error: err.toString() });
    }
  });

  // 5) Consumer 생성
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

    // PlainTransport/RTP Consumer도 정리
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
      console.log("Note: SRS is also running in a separate container if configured.");
    });
  })
  .catch((err) => {
    console.error("Error starting Mediasoup:", err);
  });
