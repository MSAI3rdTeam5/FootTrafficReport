// /home/azureuser/FootTrafficReport/frontend/client/src/webrtc/mediasoupclient.js

import { Device } from 'mediasoup-client';
import { io } from 'socket.io-client';

let socket = null;
let device = null;

// Optional: Keep references to transports, producers, consumers
let sendTransport;
let recvTransport;

/**
 * SFU 연결 (Socket.io)
 * @param {string} serverUrl e.g. "https://msteam5iseeu.ddns.net"
 */
export async function connectToSFU(serverUrl) {
  if (socket) {
    console.warn("Already connected to SFU.");
    return;
  }

  // socket.io 연결 (Nginx가 /sfu-ws/ 프록시 → Node /socket.io)
  socket = io(serverUrl, {
    path: "/sfu-ws/socket.io",   // 중요!
    // transports: ["websocket"], // 필요하면 명시
  });

  await new Promise((resolve, reject) => {
    socket.on('connect', () => {
      console.log("[mediasoupClient] socket connected:", socket.id);
      resolve();
    });
    socket.on('connect_error', (err) => {
      console.error("[mediasoupClient] socket connect error:", err);
      reject(err);
    });
  });

  // 1) getRouterRtpCapabilities
  const routerRtpCapabilities = await getRouterCaps();

  // 2) Create Device
  device = new Device();
  await device.load({ routerRtpCapabilities });
  console.log('[mediasoupClient] Device loaded, canProduce video =', device.canProduce('video'));
}

/** 내부 함수: SFU로부터 router caps 가져오기 */
function getRouterCaps() {
  return new Promise((resolve, reject) => {
    socket.emit('getRouterRtpCapabilities', {}, (res) => {
      if (!res?.success) {
        return reject(new Error(res?.error || "Failed to get router caps"));
      }
      resolve(res.rtpCapabilities);
    });
  });
}

/**
 * 웹캠 시작 + SFU Publish
 */
export async function startWebcam() {
  if (!device) {
    throw new Error("No mediasoup Device loaded. Call connectToSFU() first!");
  }
  // 1) getUserMedia
  const stream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: false
  });

  // 2) createTransport("send")
  const sendTransportParams = await createTransport("send");
  sendTransport = device.createSendTransport(sendTransportParams);

  // on connect
  sendTransport.on('connect', ({ dtlsParameters }, callback, errback) => {
    socket.emit('connectTransport', { 
      transportId: sendTransport.id, 
      dtlsParameters 
    }, (res) => {
      if (!res.success) {
        errback(new Error(res.error));
      } else {
        callback();
      }
    });
  });

  // on produce
  sendTransport.on('produce', (produceParams, callback, errback) => {
    socket.emit('produce', {
      transportId: sendTransport.id,
      kind: produceParams.kind,
      rtpParameters: produceParams.rtpParameters
    }, (res) => {
      if (!res.success) {
        errback(new Error(res.error));
      } else {
        callback({ id: res.producerId });
      }
    });
  });

  // 3) produce track
  const videoTrack = stream.getVideoTracks()[0];
  const producer = await sendTransport.produce({ track: videoTrack });
  console.log('Producer created, id=', producer.id);

  return stream;
}

/** 내부 함수: socket.emit("createTransport") → transportParams */
function createTransport(direction) {
  return new Promise((resolve, reject) => {
    socket.emit('createTransport', { direction }, (res) => {
      if (!res?.success) {
        return reject(new Error(res?.error || "createTransport failed"));
      }
      // 서버에서 transportParams or transportParams
      resolve(res.transportParams || res.transportOptions || res.transportParams);
    });
  });
}

/**
 * 연결 해제
 */
export function disconnectSFU() {
  if (sendTransport) {
    sendTransport.close();
    sendTransport = null;
  }
  if (socket) {
    socket.close();
    socket = null;
  }
  device = null;
  console.log("[mediasoupClient] SFU disconnected.");
}
