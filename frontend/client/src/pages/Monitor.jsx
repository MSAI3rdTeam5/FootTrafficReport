// /home/azureuser/FootTrafficReport/frontend/client/src/pages/Monitor.jsx

import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import PrivacyOverlay from "./PrivacyOverlay";

// Socket.io + mediasoup-client
import { io } from "socket.io-client";
import { Device } from "mediasoup-client";
// CV 서비스 API 호출 (사람 감지)
import { callPeopleDetection } from "../utils/api";

function Monitor() {
  const location = useLocation();

  // === QR 모달 ===
  const [qrVisible, setQrVisible] = useState(false);
  const openQRModal = () => setQrVisible(true);
  const closeQRModal = () => setQrVisible(false);

  // === 장치 등록 모달 ===
  const [deviceModalOpen, setDeviceModalOpen] = useState(false);
  const [deviceType, setDeviceType] = useState(null);
  const [deviceName, setDeviceName] = useState("");
  const [deviceIP, setDeviceIP] = useState("");
  const [devicePort, setDevicePort] = useState("");

  // === 개인정보 오버레이 ===
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const openPrivacy = () => setPrivacyOpen(true);
  const closePrivacy = () => setPrivacyOpen(false);

  // === 로그인된 유저 표시 이름 ===
  const [displayName, setDisplayName] = useState("김관리자");
  useEffect(() => {
    console.log("[DBG] useEffect -> fetch /api/user");
    fetch("/api/user", { credentials: "include" })
      .then((res) => {
        if (!res.ok) {
          console.log("[DBG] /api/user 404 or error. status =", res.status);
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data && data.displayName) setDisplayName(data.displayName);
      })
      .catch((err) => console.error(err));
  }, []);

  // === 등록된 카메라 목록 ===
  const [cameraList, setCameraList] = useState([]);

  // === 페이지 탭 강조 로직 ===
  const isMonitorActive = location.pathname === "/monitor";
  const isDashboardActive = location.pathname === "/dashboard";
  const isAiInsightActive = location.pathname === "/ai-insight";
  const isChatbotActive = location.pathname === "/chatbot";
  const isGuideActive = location.pathname === "/guide";

  // === 장치등록 모달 함수 ===
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
    console.log("[장치 등록]", {
      deviceType,
      deviceName,
      deviceIP,
      devicePort,
      deviceUser,
      devicePass,
    });

    // 예: cameraId = deviceName, rtspUrl = "rtsp://IP:Port"
    // 실제로는 deviceUser/devicePass를 rtsp URL에 포함하거나,
    // 다른 방식으로 전달할 수도 있음
    const cameraId = deviceName || `cam-${Date.now()}`;
    const rtspUrl = `rtsp://${deviceIP || "192.168.0.10"}:${
      devicePort || "554"
    }`;

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

  // -----------------------------------------------------
  // SFU & mediasoup 관련: socket과 device를 useRef로 관리
  // -----------------------------------------------------
  const socketRef = useRef(null);
  const deviceRef = useRef(null);
  const [sendTransport, setSendTransport] = useState(null);
  // raw local stream (원본)
  const [localStream, setLocalStream] = useState(null);
  // processed stream (모자이크 처리된 캔버스 스트림)
  const [processedStream, setProcessedStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null); // 추후 consume 시 사용

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // Offscreen 캔버스 및 처리 관련 refs
  const canvasRef = useRef(null);
  const processingIntervalRef = useRef(null);

  // detectionBoxes: CV 서비스에서 받은 얼굴 영역 정보 (예: [{ x, y, width, height }, ...])
  const [detectionBoxes, setDetectionBoxes] = useState([]);
  const detectionBoxesRef = useRef([]);
  useEffect(() => {
    detectionBoxesRef.current = detectionBoxes;
  }, [detectionBoxes]);

  // CV 서비스 API를 주기적으로 호출하여 감지 결과 업데이트 (예시: 1초마다)
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        // 실제 사용 시 적절한 cctv_url, cctv_id를 전달해야 합니다.
        const result = await callPeopleDetection("dummy_url", "dummy_id");
        // result.detectionBoxes가 얼굴 영역 정보라고 가정 (예: [{ x, y, width, height }, ...])
        setDetectionBoxes(result.detectionBoxes || []);
      } catch (error) {
        console.error("Error in detection polling:", error);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // === 웹캠 선택 모달 상태 ===
  const [webcamModalOpen, setWebcamModalOpen] = useState(false);
  const [videoDevices, setVideoDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");

  // (A) "웹캠 연결" 버튼 클릭 시 – 먼저 getUserMedia({video: true})로 권한 팝업 띄우고 장치 목록 확보
  const handleOpenWebcamSelect = async () => {
    console.log("[DBG] handleOpenWebcamSelect start");
    try {
      const tempStream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      console.log("[DBG] 임시 스트림 획득:", tempStream.getTracks());
      tempStream.getTracks().forEach((t) => t.stop());
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter((d) => d.kind === "videoinput");
      console.log("[DBG] Found video inputs =>", videoInputs);
      setVideoDevices(videoInputs);
      if (videoInputs.length > 0) {
        setSelectedDeviceId(videoInputs[0].deviceId);
      } else {
        alert("사용 가능한 웹캠(비디오 장치)이 없습니다.");
      }
      setWebcamModalOpen(true);
    } catch (err) {
      console.error("[ERR] handleOpenWebcamSelect => getUserMedia error:", err);
      alert(
        "카메라 권한이 거부되었거나 접근할 수 없습니다.\n브라우저/OS 설정에서 카메라 허용을 확인해 주세요."
      );
    }
  };

  // (B) "웹캠 선택" 후 "확인" – 선택한 장치로 SFU 연결 및 스트림 전송
  const handleConfirmWebcamSelection = async () => {
    console.log(
      "[DBG] handleConfirmWebcamSelection. selectedDeviceId=",
      selectedDeviceId
    );
    if (!selectedDeviceId) {
      alert("카메라를 선택하세요!");
      return;
    }
    setWebcamModalOpen(false);
    if (!socketRef.current || !deviceRef.current) {
      console.log(
        "[DBG] SFU 미연결 또는 device 미로드 => handleConnectSFUAndProduce 호출"
      );
      await handleConnectSFUAndProduce(selectedDeviceId);
    } else {
      console.log("[DBG] SFU 이미 연결됨 => 바로 produce 실행");
      await handleStartWebcamWithDevice(selectedDeviceId);
    }
  };

  // (C) SFU 연결 + device 로드 + produce 동시에 실행
  async function handleConnectSFUAndProduce(deviceId) {
    console.log("[DBG] handleConnectSFU 시작...");
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
    const routerCaps = await getRouterCaps(s);
    console.log("[DBG] routerCaps 획득:", routerCaps);
    const dev = new Device();
    await dev.load({ routerRtpCapabilities: routerCaps });
    deviceRef.current = dev;
    console.log(
      "Mediasoup Device loaded. canProduceVideo =",
      dev.canProduce("video")
    );
    console.log("[DBG] handleConnectSFU 완료");
    await handleStartWebcamWithDevice(deviceId);
  }

  function getRouterCaps(sock) {
    console.log("[DBG] getRouterCaps 시작...");
    return new Promise((resolve, reject) => {
      sock.emit("getRouterRtpCapabilities", {}, (res) => {
        if (!res.success) {
          reject(new Error(res.error));
        } else {
          resolve(res.rtpCapabilities);
        }
      });
    });
  }

  // (D) 선택한 장치로 실제 getUserMedia, 오프스크린 캔버스 처리, transport 및 producer 생성
  async function handleStartWebcamWithDevice(deviceId) {
    console.log("[DBG] handleStartWebcamWithDevice. deviceId=", deviceId);
    const dev = deviceRef.current;
    const sock = socketRef.current;
    if (!dev || !sock) {
      console.warn("[WARN] SFU 관련 정보 부족");
      return;
    }
    const constraints = {
      video: {
        deviceId: { exact: deviceId },
        width: { ideal: 640 },
        height: { ideal: 480 },
        frameRate: { ideal: 30 },
      },
      audio: false,
    };
    console.log("[DBG] getUserMedia constraints=", constraints);
    let rawStream;
    try {
      rawStream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log("[DBG] getUserMedia 성공");
    } catch (err) {
      console.error("getUserMedia 실패:", err);
      alert("스트림 획득 오류: " + err.message);
      return;
    }
    // (1) 로컬 미리보기용 원본 스트림 저장
    setLocalStream(rawStream);

    // (2) Offscreen 캔버스 생성 및 처리:
    //   - 원본 영상을 캔버스에 그린 후, CV 서비스로부터 받은 detectionBoxes(얼굴 영역)에 대해서만 모자이크 효과 적용
    const videoTrack = rawStream.getVideoTracks()[0];
    const settings = videoTrack.getSettings();
    const width = settings.width || 640;
    const height = settings.height || 480;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvasRef.current = canvas;
    const ctx = canvas.getContext("2d");

    // 주기적으로 캔버스에 원본 영상을 그리면서, detectionBoxes 영역에만 모자이크 처리 적용
    const pixelation = 16; // 값이 클수록 모자이크 효과 강함
    const videoElem = document.createElement("video");
    videoElem.srcObject = rawStream;
    videoElem
      .play()
      .catch((err) => console.warn("videoElem play() error:", err));

    processingIntervalRef.current = setInterval(() => {
      // 전체 원본 영상 그리기
      ctx.drawImage(videoElem, 0, 0, width, height);
      // detectionBoxesRef.current에 있는 각 얼굴 영역에 대해 모자이크 처리
      detectionBoxesRef.current.forEach((box) => {
        // box: { x, y, width, height } – 이 값은 영상의 픽셀 단위로 가정
        const { x, y, width: w, height: h } = box;
        // 임시 캔버스에 해당 영역을 축소 후 다시 확대하여 픽셀화 효과 적용
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = w / pixelation;
        tempCanvas.height = h / pixelation;
        const tempCtx = tempCanvas.getContext("2d");
        tempCtx.drawImage(
          canvas,
          x,
          y,
          w,
          h,
          0,
          0,
          tempCanvas.width,
          tempCanvas.height
        );
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(
          tempCanvas,
          0,
          0,
          tempCanvas.width,
          tempCanvas.height,
          x,
          y,
          w,
          h
        );
      });
    }, 33); // 약 30fps

    // (3) 생성된 캔버스 스트림 (모자이크 처리된 영상) 저장
    const mosaicStream = canvas.captureStream(30);
    setProcessedStream(mosaicStream);

    // (4) 로컬 미리보기에 processedStream 표시
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = mosaicStream;
      localVideoRef.current
        .play()
        .catch((err) => console.warn("localVideo play() error:", err));
    }

    // (5) SFU 전송: 모자이크 처리된 스트림 사용
    const transportParams = await createTransport(sock, "send");
    const transport = dev.createSendTransport(transportParams);
    transport.on("connect", ({ dtlsParameters }, callback, errback) => {
      sock.emit(
        "connectTransport",
        { transportId: transport.id, dtlsParameters },
        (res) => {
          if (!res.success) {
            errback(res.error);
          } else {
            callback();
          }
        }
      );
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
          if (!res.success) {
            errback(res.error);
          } else {
            callback({ id: res.producerId });
          }
        }
      );
    });
    setSendTransport(transport);
    console.log("SendTransport 생성됨, id=", transport.id);
    try {
      const producer = await transport.produce({
        track: mosaicStream.getVideoTracks()[0],
      });
      console.log("Producer 생성됨, id =", producer.id);
    } catch (err) {
      console.error("produce 오류:", err);
    }
  }

  function createTransport(sock, direction) {
    return new Promise((resolve, reject) => {
      sock.emit("createTransport", { direction }, (res) => {
        if (!res.success) {
          reject(new Error(res.error));
        } else {
          resolve(res.transportParams);
        }
      });
    });
  }

  // (F) 연결 해제
  const handleWebcamDisconnect = () => {
    console.log("[DBG] handleWebcamDisconnect: 스트림 중지 및 연결 해제");
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    if (processedStream) {
      processedStream.getTracks().forEach((track) => track.stop());
    }
    setLocalStream(null);
    setProcessedStream(null);
    setRemoteStream(null);
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    if (processingIntervalRef.current)
      clearInterval(processingIntervalRef.current);
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

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* 상단 Nav */}
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
                    backgroundColor: isMonitorActive ? "#000" : "#f3f4f6",
                    color: isMonitorActive ? "#fff" : "#000",
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
                    backgroundColor: isDashboardActive ? "#000" : "#f3f4f6",
                    color: isDashboardActive ? "#fff" : "#000",
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
                    backgroundColor: isAiInsightActive ? "#000" : "#f3f4f6",
                    color: isAiInsightActive ? "#fff" : "#000",
                  }}
                >
                  AI 인사이트
                </Link>

                {/* 챗봇 */}
                <Link
                  to="/chatbot"
                  className={`inline-flex items-center px-1 pt-1 nav-link ${
                    isChatbotActive
                      ? "bg-black text-white font-medium"
                      : "text-gray-500 hover:text-black"
                  }`}
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: "0.375rem",
                    transition: "all 0.3s ease",
                    backgroundColor: isChatbotActive ? "#000000" : "#f3f4f6",
                    color: isChatbotActive ? "#ffffff" : "#000000",
                  }}
                >
                  챗봇
                </Link>

                {/* 사용 방법 */}

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
                    backgroundColor: isGuideActive ? "#000" : "#f3f4f6",
                    color: isGuideActive ? "#fff" : "#000",
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
                    backgroundColor: "#f3f4f6",
                    color: "#000",
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
                <img
                  className="h-8 w-8 rounded-full"
                  src="/기본프로필.png"
                  alt="사용자 프로필"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">
                  {displayName}
                </span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* 메인 컨텐츠 */}
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">CCTV 모니터링</h1>
          <button
            onClick={() => openDeviceModal("CCTV")} // 새 장치 연결(예시)
            className="rounded-button bg-black text-white px-4 py-2 flex items-center"
          >
            <i className="fas fa-plus mr-2"></i>새 장치 연결
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

        {/* 웹캠 영상 미리보기 (모자이크 처리된 영상 송출) */}
        {(processedStream || remoteStream) && (
          <div className="bg-white p-4 rounded-lg border mb-6">
            <h2 className="text-lg font-semibold mb-2">
              웹캠 실시간 미리보기 (모자이크 처리됨)
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
                  <br />
                  (가상 카메라 선택 시 검정 화면이 표시될 수 있습니다)
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
      {privacyOpen && (
        <PrivacyOverlay open={privacyOpen} onClose={closePrivacy} />
      )}
    </div>
  );
}

// 연결된 장치 목록 예시 컴포넌트
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
                  <span className="font-medium text-gray-700">
                    {cam.cameraId}
                  </span>
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
