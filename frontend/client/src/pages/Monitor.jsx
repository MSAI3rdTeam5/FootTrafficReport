// /home/azureuser/FootTrafficReport/frontend/client/src/pages/Monitor.jsx

import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import PrivacyOverlay from "./PrivacyOverlay";

// Socket.io + mediasoup-client
import { io } from "socket.io-client";
import { Device } from "mediasoup-client";

// (A) SRS WebRTC 플레이어
import { startSrsWebrtcPlayer, stopSrsWebrtcPlayer } from "../utils/srswebrtc";

function Monitor() {
  const location = useLocation();

  // === 모달/오버레이 등 ===
  const [qrVisible, setQrVisible] = useState(false);
  const openQRModal = () => setQrVisible(true);
  const closeQRModal = () => setQrVisible(false);

  const [deviceModalOpen, setDeviceModalOpen] = useState(false);
  const [deviceType, setDeviceType] = useState(null);
  const [deviceName, setDeviceName] = useState("");
  const [deviceIP, setDeviceIP] = useState("");
  const [devicePort, setDevicePort] = useState("");

  const [privacyOpen, setPrivacyOpen] = useState(false);
  const openPrivacy = () => setPrivacyOpen(true);
  const closePrivacy = () => setPrivacyOpen(false);

  // === 로그인된 유저 표시 ===
  const [displayName, setDisplayName] = useState("김관리자");
  useEffect(() => {
    // 예시: fetch /api/user
    fetch("/api/user", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.displayName) setDisplayName(data.displayName);
      })
      .catch((err) => console.error(err));
  }, []);

  // === 카메라 목록 ===
  const [cameraList, setCameraList] = useState([]);

  // === 라우팅 탭 강조 ===
  const isMonitorActive = location.pathname === "/monitor";
  const isDashboardActive = location.pathname === "/dashboard";
  const isAiInsightActive = location.pathname === "/ai-insight";
  const isGuideActive = location.pathname === "/guide";

  // === 장치등록 모달 ===
  const openDeviceModal = (type) => {
    setDeviceType(type);
    setDeviceModalOpen(true);
  };
  const closeDeviceModal = () => {
    setDeviceModalOpen(false);
    setDeviceType(null);
    setDeviceName("");
    setDeviceIP("");
    setDevicePort("");
  };

  const handleSubmitDevice = async (e) => {
    e.preventDefault();
    const cameraId = deviceName || `cam-${Date.now()}`;
    const rtspUrl = `rtsp://${deviceIP || "192.168.0.10"}:${devicePort || "554"}`;

    try {
      const res = await fetch("/api/cameras", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cameraId, rtspUrl }),
      });
      const data = await res.json();
      if (data.success) {
        setCameraList((prev) => [...prev, { cameraId, hlsUrl: data.hlsUrl }]);
      } else {
        alert(data.error || "카메라 등록 실패");
      }
    } catch (err) {
      console.error("Failed to register camera:", err);
    }
    closeDeviceModal();
  };

  // ----------------------------------------------------------------------------------
  // Mediasoup SFU & Socket.IO
  // ----------------------------------------------------------------------------------
  const socketRef = useRef(null);
  const deviceRef = useRef(null);
  const [sendTransport, setSendTransport] = useState(null);

  const [localStream, setLocalStream] = useState(null);
  const [processedStream, setProcessedStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const canvasRef = useRef(null);
  const processingIntervalRef = useRef(null);

  // 웹캠 선택 모달
  const [webcamModalOpen, setWebcamModalOpen] = useState(false);
  const [videoDevices, setVideoDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");

  // (A) 동적으로 할당된 RTP 포트
  const [dynamicPort, setDynamicPort] = useState(null);

  useEffect(() => {
    // (1) Socket.io 이벤트: "rtpPortAssigned"
    //    => SFU가 PlainTransport bind 완료 시점에 emit
    //    => 이걸로 동적 포트를 가져옴
    if (socketRef.current) {
      socketRef.current.on("rtpPortAssigned", ({ localIp, localPort }) => {
        console.log("[DBG] rtpPortAssigned => IP=", localIp, "Port=", localPort);
        setDynamicPort(localPort);
      });
    }
  }, [socketRef.current]);

  // "웹캠 연결" 버튼 => 장치 선택 모달 열기
  const handleOpenWebcamSelect = async () => {
    try {
      const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
      tempStream.getTracks().forEach((t) => t.stop());
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter((d) => d.kind === "videoinput");
      if (videoInputs.length > 0) {
        setSelectedDeviceId(videoInputs[0].deviceId);
      } else {
        alert("사용 가능한 웹캠이 없습니다.");
      }
      setVideoDevices(videoInputs);
      setWebcamModalOpen(true);
    } catch (err) {
      console.error("handleOpenWebcamSelect error:", err);
      alert("카메라 권한이 필요합니다.");
    }
  };

  // "웹캠 선택" -> "확인"
  const handleConfirmWebcamSelection = async () => {
    if (!selectedDeviceId) {
      alert("카메라를 선택하세요!");
      return;
    }
    setWebcamModalOpen(false);

    if (!socketRef.current || !deviceRef.current) {
      console.log("[DBG] SFU 미연결 => handleConnectSFUAndProduce 호출");
      await handleConnectSFUAndProduce(selectedDeviceId);
    } else {
      console.log("[DBG] SFU 이미 연결됨 => produce 실행");
      await handleStartWebcamWithDevice(selectedDeviceId);
    }
  };

  async function handleConnectSFUAndProduce(deviceId) {
    console.log("[DBG] handleConnectSFU 시작...");
    // 소켓 연결
    const s = io("https://msteam5iseeu.ddns.net", {
      path: "/socket.io",
      transports: ["websocket", "polling"],
    });
    socketRef.current = s;

    await new Promise((resolve, reject) => {
      s.on("connect", () => {
        console.log("[SFU] socket connected:", s.id);
        resolve();
      });
      s.on("connect_error", (err) => {
        console.error("[SFU] socket connect error:", err);
        reject(err);
      });
    });

    // 라우터 capabilities
    const routerCaps = await getRouterCaps(s);
    const dev = new Device();
    await dev.load({ routerRtpCapabilities: routerCaps });
    deviceRef.current = dev;

    console.log("Mediasoup Device loaded. canProduceVideo =", dev.canProduce("video"));
    await handleStartWebcamWithDevice(deviceId);
  }

  function getRouterCaps(sock) {
    return new Promise((resolve, reject) => {
      sock.emit("getRouterRtpCapabilities", {}, (res) => {
        if (!res.success) reject(new Error(res.error));
        else resolve(res.rtpCapabilities);
      });
    });
  }

  async function handleStartWebcamWithDevice(deviceId) {
    const dev = deviceRef.current;
    const sock = socketRef.current;
    if (!dev || !sock) {
      console.warn("[WARN] SFU 관련 정보 부족");
      return;
    }

    let rawStream;
    try {
      rawStream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: { exact: deviceId },
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 30 },
        },
        audio: false,
      });
    } catch (err) {
      console.error("getUserMedia 실패:", err);
      alert(err.message);
      return;
    }
    setLocalStream(rawStream);

    // 간단 모자이크
    const videoTrack = rawStream.getVideoTracks()[0];
    const settings = videoTrack.getSettings();
    const width = settings.width || 640;
    const height = settings.height || 480;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvasRef.current = canvas;
    const ctx = canvas.getContext("2d");

    const videoElem = document.createElement("video");
    videoElem.srcObject = rawStream;
    videoElem.play().catch((err) => console.warn("videoElem play() error:", err));

    processingIntervalRef.current = setInterval(() => {
      ctx.drawImage(videoElem, 0, 0, width, height);
      // 모자이크 처리...
    }, 33);

    const mosaicStream = canvas.captureStream(30);
    setProcessedStream(mosaicStream);

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = mosaicStream;
      localVideoRef.current.play().catch((err) => console.warn("localVideo play error:", err));
    }

    // transport
    const transportParams = await createTransport(sock, "send");
    const transport = dev.createSendTransport(transportParams);

    transport.on("connect", ({ dtlsParameters }, callback, errback) => {
      sock.emit("connectTransport", { transportId: transport.id, dtlsParameters }, (res) => {
        if (!res.success) errback(res.error);
        else callback();
      });
    });
    transport.on("produce", (produceParams, callback, errback) => {
      sock.emit(
        "produce",
        {
          transportId: transport.id,
          kind: produceParams.kind,
          rtpParameters: produceParams.rtpParameters,
        },
        (res) => {
          if (!res.success) errback(res.error);
          else callback({ id: res.producerId });
        }
      );
    });
    setSendTransport(transport);

    try {
      await transport.produce({ track: mosaicStream.getVideoTracks()[0] });
      console.log("[DBG] Producer 생성 완료");
    } catch (err) {
      console.error("produce error:", err);
    }
  }

  function createTransport(sock, direction) {
    return new Promise((resolve, reject) => {
      sock.emit("createTransport", { direction }, (res) => {
        if (!res.success) reject(new Error(res.error));
        else resolve(res.transportParams);
      });
    });
  }

  // 웹캠 연결 해제
  const handleWebcamDisconnect = () => {
    if (localStream) {
      localStream.getTracks().forEach((t) => t.stop());
    }
    if (processedStream) {
      processedStream.getTracks().forEach((t) => t.stop());
    }
    setLocalStream(null);
    setProcessedStream(null);

    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;

    if (processingIntervalRef.current) clearInterval(processingIntervalRef.current);

    if (sendTransport) {
      sendTransport.close();
      setSendTransport(null);
    }
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    deviceRef.current = null;
  };

  // ---------------------------------------------------------------------------
  // (추가) SRS WebRTC + /start_rtp_pipeline
  // ---------------------------------------------------------------------------
  const handlePlaySrsWebrtc = async () => {
    // 1) 만약 dynamicPort가 null이면 아직 SFU에서 포트를 못 받음
    if (!dynamicPort) {
      console.warn("[DBG] No dynamic port assigned from SFU yet.");
      alert("SFU에서 할당된 포트를 못 받았습니다. 잠시 후 다시 시도하세요.");
      return;
    }

    // 2) /start_rtp_pipeline 호출
    //    rtp_url => rtp://media-sfu:{{dynamicPort}}
    const rtpUrl = `rtp://media-sfu:${dynamicPort}`;
    const rtmpUrl = "rtmp://srs:1935/live/mosaic_webrtc";

    try {
      const res = await fetch(
        `/start_rtp_pipeline?rtp_url=${encodeURIComponent(rtpUrl)}&rtmp_url=${encodeURIComponent(
          rtmpUrl
        )}`,
        { method: "POST" }
      );
      const data = await res.json();
      console.log("[DBG] /start_rtp_pipeline result =>", data);
    } catch (err) {
      console.error("[ERR] /start_rtp_pipeline fetch error:", err);
    }

    // 3) SRS WebRTC 재생
    const webrtcUrl = "webrtc://msteam5iseeu.ddns.net/live/mosaic_webrtc";
    console.log("[DBG] Playing SRS =>", webrtcUrl);

    if (!window.SrsRtcPlayerAsync) {
      console.error("[ERR] SrsRtcPlayerAsync not found in window.");
      return;
    }
    const videoEl = document.getElementById("srsWebrtcVideo");
    if (!videoEl) {
      console.error("[ERR] <video id='srsWebrtcVideo'> not found.");
      return;
    }

    try {
      const player = new window.SrsRtcPlayerAsync({ video: videoEl });
      await player.play(webrtcUrl);
      console.log("[DBG] SRS WebRTC play success");
    } catch (err) {
      console.error("[DBG] SRS WebRTC play error:", err);
    }
  };

  const handleStopSrsWebrtc = () => {
    // (선택) TODO: stop player
    console.log("[DBG] handleStopSrsWebrtc: not implemented");
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <nav className="bg-white shadow">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-8">
              <span className="text-xl font-bold text-black">I See U</span>
              <div className="flex space-x-3">
                <Link
                  to="/monitor"
                  className={`inline-flex items-center px-1 pt-1 nav-link ${
                    isMonitorActive
                      ? "bg-black text-white font-medium"
                      : "text-gray-500 hover:text-black"
                  }`}
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: "0.375rem",
                    transition: "all 0.3s ease",
                  }}
                >
                  내 모니터링
                </Link>
                <Link
                  to="/dashboard"
                  className={`inline-flex items-center px-1 pt-1 nav-link ${
                    isDashboardActive
                      ? "bg-black text-white font-medium"
                      : "text-gray-500 hover:text-black"
                  }`}
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: "0.375rem",
                    transition: "all 0.3s ease",
                  }}
                >
                  통계 분석
                </Link>
                <Link
                  to="/ai-insight"
                  className={`inline-flex items-center px-1 pt-1 nav-link ${
                    isAiInsightActive
                      ? "bg-black text-white font-medium"
                      : "text-gray-500 hover:text-black"
                  }`}
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: "0.375rem",
                    transition: "all 0.3s ease",
                  }}
                >
                  AI 인사이트
                </Link>
                <Link
                  to="/guide"
                  className={`inline-flex items-center px-1 pt-1 nav-link ${
                    isGuideActive
                      ? "bg-black text-white font-medium"
                      : "text-gray-500 hover:text-black"
                  }`}
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: "0.375rem",
                    transition: "all 0.3s ease",
                  }}
                >
                  사용 방법
                </Link>
                <button
                  type="button"
                  onClick={openPrivacy}
                  className="inline-flex items-center px-1 pt-1 text-gray-500 hover:text-black nav-link"
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: "0.375rem",
                    transition: "all 0.3s ease",
                  }}
                >
                  개인정보법 안내
                </button>
              </div>
            </div>
            <div className="flex items-center">
              <button className="p-2 rounded-full hover:bg-gray-100 relative">
                <i className="fas fa-bell text-gray-600"></i>
                <span className="absolute top-1 right-1 bg-red-500 rounded-full w-2 h-2" />
              </button>
              <button className="ml-3 p-2 rounded-full hover:bg-gray-100">
                <i className="fas fa-cog text-gray-600"></i>
              </button>
              <div className="ml-4 flex items-center">
                <img className="h-8 w-8 rounded-full" src="/기본프로필.png" alt="사용자 프로필" />
                <span className="ml-2 text-sm font-medium text-gray-700">{displayName}</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">CCTV 모니터링</h1>
          <button
            onClick={() => openDeviceModal("CCTV")}
            className="rounded-button bg-black text-white px-4 py-2 flex items-center"
          >
            <i className="fas fa-plus mr-2"></i> 새 장치 연결
          </button>
        </div>
        <div className="mb-4 text-gray-600">
          <span className="font-medium">환영합니다 {displayName}님!</span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <div
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col items-center justify-center min-h-[200px] cursor-pointer hover:border-custom"
            onClick={() => openDeviceModal("CCTV")}
          >
            <i className="fas fa-video text-4xl text-custom mb-4"></i>
            <span className="text-gray-700">CCTV 연결</span>
          </div>
          <div
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col items-center justify-center min-h-[200px] cursor-pointer hover:border-custom"
            onClick={handleOpenWebcamSelect}
          >
            <i className="fas fa-webcam text-4xl text-custom mb-4"></i>
            <span className="text-gray-700">웹캠 연결</span>
          </div>
          <div
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col items-center justify-center min-h-[200px] cursor-pointer hover:border-custom"
            onClick={openQRModal}
          >
            <i className="fas fa-mobile-alt text-4xl text-custom mb-4"></i>
            <span className="text-gray-700">스마트폰 연결</span>
          </div>
          <div
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col items-center justify-center min-h-[200px] cursor-pointer hover:border-custom"
            onClick={() => openDeviceModal("Blackbox")}
          >
            <i className="fas fa-car text-4xl text-custom mb-4"></i>
            <span className="text-gray-700">블랙박스 연결</span>
          </div>
        </div>

        {/* (1) Mediasoup 실시간 미리보기 */}
        {(processedStream || remoteStream) && (
          <div className="bg-white p-4 rounded-lg border mb-6">
            <h2 className="text-lg font-semibold mb-2">
              웹캠 실시간 미리보기 (모자이크 처리됨, Mediasoup)
            </h2>
            <div className="flex space-x-4">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                style={{ width: "320px", background: "#000" }}
              />
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                style={{ width: "320px", background: "#333" }}
              />
            </div>
            <button
              onClick={handleWebcamDisconnect}
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded"
            >
              웹캠 연결 종료
            </button>
          </div>
        )}

        {/* (2) SRS 모자이크 영상 (WebRTC) */}
        <div className="bg-white p-4 rounded-lg border mb-6">
          <h2 className="text-lg font-semibold mb-2">모자이크 영상 (WebRTC)</h2>
          <p className="text-sm text-gray-500 mb-2">
            SFU → <strong>동적 포트</strong> → <strong>rtp_pipeline.py</strong> → SRS → 브라우저 WebRTC
          </p>
          <div className="mt-4">
            <button
              onClick={handlePlaySrsWebrtc}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition mr-2"
            >
              SRS WebRTC 재생
            </button>
            <button
              onClick={handleStopSrsWebrtc}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
            >
              WebRTC 중지
            </button>

            <div className="mt-2">
              <video
                id="srsWebrtcVideo"
                autoPlay
                playsInline
                muted
                style={{ width: "320px", background: "#222" }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">
              ※ <strong>주의</strong>: webrtc://msteam5iseeu.ddns.net/live/mosaic_webrtc
            </p>
          </div>
        </div>

        <ConnectedDevices cameraList={cameraList} />
      </div>

      <footer className="bg-white border-t border-gray-200 mt-8">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="text-center text-sm text-gray-500">
            © 2024 I See U. All rights reserved.
          </div>
        </div>
      </footer>

      {/* QR 모달 */}
      {qrVisible && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded">
            <h3 className="text-lg font-semibold mb-2">스마트폰 연결</h3>
            <p>이 QR 코드를 스캔하세요.</p>
            <button onClick={closeQRModal}>닫기</button>
          </div>
        </div>
      )}

      {/* 장치등록 모달 */}
      {deviceModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white w-full max-w-md p-6 rounded-lg relative">
            <button
              onClick={closeDeviceModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-custom"
            >
              <i className="fas fa-times text-xl"></i>
            </button>
            <h2 className="text-xl font-bold mb-4">
              {deviceType === "CCTV" ? "CCTV 연결 정보" : "블랙박스 연결 정보"}
            </h2>
            <form onSubmit={handleSubmitDevice}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  장치 이름
                </label>
                <input
                  type="text"
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                  placeholder="예: 복도1 카메라"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  IP
                </label>
                <input
                  type="text"
                  value={deviceIP}
                  onChange={(e) => setDeviceIP(e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                  placeholder="예: 192.168.0.10"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Port
                </label>
                <input
                  type="text"
                  value={devicePort}
                  onChange={(e) => setDevicePort(e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                  placeholder="예: 554"
                />
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  type="button"
                  onClick={closeDeviceModal}
                  className="border border-gray-300 px-4 py-2 rounded"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="bg-black text-white px-4 py-2 rounded"
                >
                  등록
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* "웹캠 선택" 모달 */}
      {webcamModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white w-full max-w-md p-6 rounded-lg relative">
            <button
              onClick={() => setWebcamModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-custom"
            >
              <i className="fas fa-times text-xl"></i>
            </button>
            <h2 className="text-xl font-bold mb-4">웹캠 선택</h2>
            {videoDevices.length === 0 ? (
              <p className="text-red-500">사용 가능한 카메라가 없습니다.</p>
            ) : (
              <>
                <p className="text-sm text-gray-600 mb-4">
                  사용할 카메라 장치를 선택하세요
                </p>
                <select
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mb-4"
                  value={selectedDeviceId}
                  onChange={(e) => setSelectedDeviceId(e.target.value)}
                >
                  {videoDevices.map((dev) => (
                    <option key={dev.deviceId} value={dev.deviceId}>
                      {dev.label || `Camera (${dev.deviceId})`}
                    </option>
                  ))}
                </select>
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => setWebcamModalOpen(false)}
                    className="rounded-button border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleConfirmWebcamSelection}
                    className="rounded-button bg-black text-white px-4 py-2 text-sm hover:bg-black/90"
                  >
                    확인
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 개인정보법 안내 오버레이 */}
      {privacyOpen && <PrivacyOverlay open={privacyOpen} onClose={closePrivacy} />}
    </div>
  );
}

function ConnectedDevices({ cameraList }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">연결된 장치</h2>
        {cameraList.length === 0 ? (
          <p className="text-gray-500">아직 등록된 카메라가 없습니다.</p>
        ) : (
          <ul className="space-y-3">
            {cameraList.map((cam) => (
              <li key={cam.cameraId} className="p-2 bg-gray-50 rounded">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700">{cam.cameraId}</span>
                  <span className="text-xs text-gray-400">{cam.hlsUrl}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default Monitor;
