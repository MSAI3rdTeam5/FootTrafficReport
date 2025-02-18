// /home/azureuser/FootTrafficReport/frontend/client/src/pages/Monitor.jsx

import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import PrivacyOverlay from "./PrivacyOverlay";

// Socket.io + mediasoup-client
import { io } from "socket.io-client";
import { Device } from "mediasoup-client";

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
    console.log("[DBG] useEffect -> fetch /api/user (테스트용)");
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

  // -----------------------------------------------------
  // SFU & mediasoup 관련: socket/device를 useRef로 관리
  // -----------------------------------------------------
  const socketRef = useRef(null);
  const deviceRef = useRef(null);
  const [sendTransport, setSendTransport] = useState(null);

  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null); // 추후 consume 시 사용할 수 있음

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // === 웹캠 선택 모달 ===
  const [webcamModalOpen, setWebcamModalOpen] = useState(false);
  const [videoDevices, setVideoDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");

  // (A) “웹캠 연결” 버튼 클릭 시 - 사전에 getUserMedia({video:true})로 권한 팝업 띄우기
  const handleOpenWebcamSelect = async () => {
    console.log("[DBG] handleOpenWebcamSelect start");

    try {
      // 1) 먼저 권한 팝업을 띄우기 위해, 최소 constraints로 getUserMedia 호출
      //    (success 시 카메라를 잠깐 사용했다가 곧바로 정지)
      let tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
      console.log("[DBG] got tempStream => tracks:", tempStream.getTracks());
      // track stop
      tempStream.getTracks().forEach((t) => t.stop());

      // 2) 그 후 enumerateDevices
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
      console.error("[ERR] handleOpenWebcamSelect => getUserMedia simple call error:", err);
      alert("카메라 권한이 거부되었거나, 접근할 수 없습니다.\n브라우저/OS 설정에서 카메라를 허용해 주세요.");
    }
  };

  // (B) 웹캠 선택 후 "확인"
  const handleConfirmWebcamSelection = async () => {
    console.log("[DBG] handleConfirmWebcamSelection. selectedDeviceId=", selectedDeviceId);

    if (!selectedDeviceId) {
      alert("카메라를 선택하세요!");
      return;
    }
    setWebcamModalOpen(false);

    // SFU + produce 로직 (단일 함수)
    // 이미 연결되어 있는지 여부에 따라 분기
    if (!socketRef.current || !deviceRef.current) {
      console.log("[DBG] SFU not connected or device not loaded => calling handleConnectSFU...");
      await handleConnectSFUAndProduce(selectedDeviceId);
    } else {
      console.log("[DBG] SFU already connected => proceed to produce webcam...");
      // 바로 produce
      console.log("[DBG] => got s, dev => now produce webcam...");
      await handleStartWebcamWithDevice(selectedDeviceId);
    }
  };

  // (C) SFU 연결 + device 로드 + produce를 한 번에
  async function handleConnectSFUAndProduce(deviceId) {
    console.log("[DBG] handleConnectSFU start...");

    // 1) socket 연결
    const s = io("https://msteam5iseeu.ddns.net", {
      path: "/socket.io", // nginx location /socket.io/ 사용 시
      transports: ["websocket", "polling"],
    });
    socketRef.current = s;

    console.log("[DBG] socket created. Waiting for connect event...");
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

    // 2) getRouterCaps
    const routerCaps = await getRouterCaps(s);
    console.log("[DBG] got routerCaps =>", routerCaps);

    // 3) Mediasoup Device 생성
    const dev = new Device();
    await dev.load({ routerRtpCapabilities: routerCaps });
    deviceRef.current = dev;

    console.log("Mediasoup Device loaded. canProduceVideo =", dev.canProduce("video"));
    console.log("[DBG] handleConnectSFU done!");

    // 4) 연결 후 곧바로 webcam produce 시도
    console.log("[DBG] => got s, dev => now produce webcam...");
    await handleStartWebcamWithDevice(deviceId);
  }

  function getRouterCaps(sock) {
    console.log("[DBG] getRouterCaps() start...");
    return new Promise((resolve, reject) => {
      sock.emit("getRouterRtpCapabilities", {}, (res) => {
        if (!res.success) {
          return reject(new Error(res.error));
        }
        resolve(res.rtpCapabilities);
      });
    });
  }

  // (D) getUserMedia + transport + produce
  async function handleStartWebcamWithDevice(deviceId) {
    console.log("[DBG] handleStartWebcamWithDevice. deviceId=", deviceId);

    const dev = deviceRef.current;
    const sock = socketRef.current;
    console.log("[DBG] mediasoupDevice=", dev, "socket=", sock);

    if (!dev) {
      console.warn("[WARN] deviceRef.current is null => can't produce");
      return;
    }
    if (!sock) {
      console.warn("[WARN] socketRef.current is null => can't produce");
      return;
    }

    // 1) getUserMedia
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
    let stream = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log("[DBG] getUserMedia success => resolution:", constraints.video);
    } catch (err) {
      console.error("getUserMedia failed with constraints=", constraints, err);
      alert("handleStartWebcamWithDevice error: " + err.message);
      return;
    }

    // 2) 로컬 미리보기
    if (localStream) {
      localStream.getTracks().forEach((t) => t.stop());
    }
    setLocalStream(stream);

    // video 태그에 srcObject 할당 + play() 시도
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
      localVideoRef.current
        .play()
        .catch((err) => console.warn("localVideo play() error:", err));
    }

    // 3) createSendTransport
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
    console.log("SendTransport created, id=", transport.id);

    // (E) produce track
    const videoTrack = stream.getVideoTracks()[0];
    try {
      const producer = await transport.produce({ track: videoTrack });
      console.log("Producer created, id =", producer.id);
    } catch (err) {
      console.error("produce error:", err);
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
    console.log("[DBG] handleWebcamDisconnect: stopping local stream & closing transports");
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    setLocalStream(null);
    setRemoteStream(null);

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    // sendTransport close
    if (sendTransport) {
      sendTransport.close();
      setSendTransport(null);
    }

    // 소켓 disconnect
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
            {/* 왼쪽 탭 */}
            <div className="flex items-center space-x-8">
              <span className="text-xl font-bold text-black">I See U</span>
              <div className="flex space-x-3">
                <Link
                  to="/monitor"
                  className={
                    "inline-flex items-center px-1 pt-1 nav-link " +
                    (isMonitorActive
                      ? "bg-black text-white font-medium"
                      : "text-gray-500 hover:text-black")
                  }
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: "0.375rem",
                    transition: "all 0.3s ease",
                    backgroundColor: isMonitorActive ? "#000000" : "#f3f4f6",
                    color: isMonitorActive ? "#ffffff" : "#000000",
                  }}
                >
                  내 모니터링
                </Link>

                <Link
                  to="/dashboard"
                  className={
                    "inline-flex items-center px-1 pt-1 nav-link " +
                    (isDashboardActive
                      ? "bg-black text-white font-medium"
                      : "text-gray-500 hover:text-black")
                  }
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: "0.375rem",
                    transition: "all 0.3s ease",
                    backgroundColor: isDashboardActive ? "#000000" : "#f3f4f6",
                    color: isDashboardActive ? "#ffffff" : "#000000",
                  }}
                >
                  통계 분석
                </Link>

                <Link
                  to="/ai-insight"
                  className={
                    "inline-flex items-center px-1 pt-1 nav-link " +
                    (isAiInsightActive
                      ? "bg-black text-white font-medium"
                      : "text-gray-500 hover:text-black")
                  }
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: "0.375rem",
                    transition: "all 0.3s ease",
                    backgroundColor: isAiInsightActive ? "#000000" : "#f3f4f6",
                    color: isAiInsightActive ? "#ffffff" : "#000000",
                  }}
                >
                  AI 인사이트
                </Link>

                <Link
                  to="/guide"
                  className={
                    "inline-flex items-center px-1 pt-1 nav-link " +
                    (isGuideActive
                      ? "bg-black text-white font-medium"
                      : "text-gray-500 hover:text-black")
                  }
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: "0.375rem",
                    transition: "all 0.3s ease",
                    backgroundColor: isGuideActive ? "#000000" : "#f3f4f6",
                    color: isGuideActive ? "#ffffff" : "#000000",
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
                    color: "#000000",
                  }}
                >
                  개인정보법 안내
                </button>
              </div>
            </div>

            {/* 오른쪽 */}
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
            onClick={() => openDeviceModal("CCTV")}
            className="rounded-button bg-black text-white px-4 py-2 flex items-center"
          >
            <i className="fas fa-plus mr-2"></i>
            새 장치 연결
          </button>
        </div>

        <div className="mb-4 text-gray-600">
          <span className="font-medium">환영합니다 {displayName}님!</span>
        </div>

        {/* 연결 방식 4개 카드 */}
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
            onClick={handleOpenWebcamSelect} // 사전 getUserMedia 호출이 포함된 함수
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

        {/* 웹캠 영상 미리보기 */}
        {(localStream || remoteStream) && (
          <div className="bg-white p-4 rounded-lg border mb-6">
            <h2 className="text-lg font-semibold mb-2">웹캠 실시간 미리보기</h2>
            <div className="flex space-x-4">
              {/* localVideo는 muted + playsInline + autoPlay */}
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
              {/* 폼 필드들 */}
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

              {/* ID/PW 등 필요시 추가 */}

              <div className="flex justify-end space-x-2 mt-6">
                <button
                  type="button"
                  onClick={closeDeviceModal}
                  className="border border-gray-300 px-4 py-2 rounded"
                >
                  취소
                </button>
                <button type="submit" className="bg-black text-white px-4 py-2 rounded">
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
                  (가상 카메라를 선택 시 검정 화면이 표시될 수 있습니다)
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
