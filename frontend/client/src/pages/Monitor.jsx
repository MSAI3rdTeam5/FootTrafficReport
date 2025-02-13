import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import PrivacyOverlay from "./PrivacyOverlay";

function Monitor() {
  const location = useLocation();

  // ====== QR 모달 ======
  const [qrVisible, setQrVisible] = useState(false);
  const [qrTimestamp, setQrTimestamp] = useState(Date.now());
  const openQRModal = () => setQrVisible(true);
  const closeQRModal = () => setQrVisible(false);
  const refreshQR = () => setQrTimestamp(Date.now());

  // ====== 장치 등록 모달 ======
  const [deviceModalOpen, setDeviceModalOpen] = useState(false);
  const [deviceType, setDeviceType] = useState(null);
  const [deviceName, setDeviceName] = useState("");
  const [deviceIP, setDeviceIP] = useState("");
  const [devicePort, setDevicePort] = useState("");
  const [deviceUser, setDeviceUser] = useState("");
  const [devicePass, setDevicePass] = useState("");

  // ====== 개인정보법 안내 오버레이 ======
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const openPrivacy = () => setPrivacyOpen(true);
  const closePrivacy = () => setPrivacyOpen(false);

  // ====== 로그인된 유저 displayName ======
  const [displayName, setDisplayName] = useState("김관리자");
  useEffect(() => {
    fetch("/api/user", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.displayName) setDisplayName(data.displayName);
      })
      .catch(console.error);
  }, []);

  // ====== 등록된 카메라 목록 ======
  const [cameraList, setCameraList] = useState([]);

  // 탭 강조 로직
  const isMonitorActive = location.pathname === "/monitor";
  const isDashboardActive = location.pathname === "/dashboard";
  const isAiInsightActive = location.pathname === "/ai-insight";
  const isGuideActive = location.pathname === "/guide";

  // 장치등록 모달 열기/닫기
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
    setDeviceUser("");
    setDevicePass("");
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

  // ================= WebRTC (Janus) & EchoTest =================
  const [janus, setJanus] = useState(null);
  const [webcamHandle, setWebcamHandle] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // (A) “웹캠 선택” 모달 상태
  const [webcamModalOpen, setWebcamModalOpen] = useState(false);
  const [videoDevices, setVideoDevices] = useState([]); 
  const [selectedDeviceId, setSelectedDeviceId] = useState(""); 

  // (B) “웹캠 연결” 버튼 클릭 시: 장치 목록 나열 후 모달 표시
  const handleOpenWebcamSelect = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      // 비디오 입력만 추출
      const videoInputs = devices.filter((d) => d.kind === "videoinput");
      setVideoDevices(videoInputs);
      if (videoInputs.length > 0) {
        setSelectedDeviceId(videoInputs[0].deviceId); // 기본 선택
      } else {
        alert("사용 가능한 웹캠(비디오 장치)이 없습니다.");
      }
      setWebcamModalOpen(true);
    } catch (err) {
      console.error("enumerateDevices() error:", err);
      alert("장치 목록을 가져오지 못했습니다.");
    }
  };

  // (C) 선택된 카메라로 웹캠 연결
  const handleConfirmWebcamSelection = () => {
    if (!selectedDeviceId) {
      alert("카메라를 선택하세요!");
      return;
    }
    // 모달 닫고, 실제 WebRTC 연결 시도
    setWebcamModalOpen(false);
    handleWebcamConnect(selectedDeviceId);
  };

  // (D) Janus init + attach
  const handleWebcamConnect = (deviceId) => {
    if (!window.Janus) {
      alert("Janus.js not loaded");
      return;
    }
    window.Janus.init({
      debug: "all",
      callback: () => createJanusSession(deviceId),
    });
  };
  const createJanusSession = (deviceId) => {
    const serverUrl = "wss://msteam5iseeu.ddns.net/janus-ws/";
    const j = new window.Janus({
      server: serverUrl,
      success: () => {
        setJanus(j);
        attachEchoTestPlugin(j, deviceId);
      },
      error: (err) => {
        console.error("[Janus] init error:", err);
      },
    });
  };

  // (E) EchoTest attach with deviceId
  const attachEchoTestPlugin = (janusInstance, deviceId) => {
    janusInstance.attach({
      plugin: "janus.plugin.echotest",
      success: (pluginHandle) => {
        console.log("[Janus] attach success:", pluginHandle);
        setWebcamHandle(pluginHandle);

        // 먼저 audio/video 설정 전송
        const body = { audio: true, video: true };
        pluginHandle.send({ message: body });

        // createOffer, deviceId를 capture에 반영
        pluginHandle.createOffer({
          tracks: [
            { type: "audio", capture: true, recv: true },
            {
              type: "video",
              capture: { deviceId: { exact: deviceId } }, // 선택된 카메라
              recv: true,
            },
            { type: "data" },
          ],
          success: (jsep) => {
            console.log("[Janus] createOffer success! local JSEP:", jsep);
            pluginHandle.send({ message: body, jsep });
          },
          error: (error) => {
            console.error("[Janus] createOffer error:", error);
          },
        });
      },
      error: (err) => {
        console.error("[Janus] plugin attach error:", err);
      },
      onmessage: (msg, jsep) => {
        console.log("[Janus] onmessage:", msg, jsep);
        if (jsep) {
          // 약간의 딜레이 후 handleRemoteJsep
          setTimeout(() => {
            try {
              console.log("[Janus] handleRemoteJsep after delay:", jsep);
              webcamHandle.handleRemoteJsep({ jsep });
            } catch (e) {
              console.error("handleRemoteJsep error:", e);
            }
          }, 500);
        }
      },
      onlocaltrack: (track, on) => {
        console.log("[Janus] onlocaltrack:", track, on);
        if (!on) return;
        const stream = new MediaStream([track]);
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      },
      onremotetrack: (track, mid, on) => {
        console.log("[Janus] onremotetrack:", track, mid, on);
        if (!on) return;
        const stream = new MediaStream([track]);
        setRemoteStream(stream);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
        }
      },
      oncleanup: () => {
        console.log("[Janus] oncleanup");
        setLocalStream(null);
        setRemoteStream(null);
      },
    });
  };

  // 연결 해제
  const handleWebcamDisconnect = () => {
    if (webcamHandle) {
      webcamHandle.hangup();
      webcamHandle.detach();
      setWebcamHandle(null);
    }
    if (janus) {
      janus.destroy();
      setJanus(null);
    }
    setLocalStream(null);
    setRemoteStream(null);
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

        {/* 연결 방식 4개 박스 */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <div
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col items-center justify-center min-h-[200px] cursor-pointer hover:border-custom"
            onClick={() => openDeviceModal("CCTV")}
          >
            <i className="fas fa-video text-4xl text-custom mb-4"></i>
            <span className="text-gray-700">CCTV 연결</span>
          </div>

          {/* 웹캠 연결 (선택 모달) */}
          <div
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col items-center justify-center min-h-[200px] cursor-pointer hover:border-custom"
            onClick={handleOpenWebcamSelect} // ← 장치 목록 모달 열기
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
              <video
                ref={localVideoRef}
                autoPlay
                muted
                style={{ width: "320px", background: "#000" }}
              />
              <video
                ref={remoteVideoRef}
                autoPlay
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
          {/* QR 오버레이 (생략) */}
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
            {/* ... 폼 */}
            <form onSubmit={handleSubmitDevice}>
              {/* 폼 필드들 */}
              <div className="flex justify-end space-x-2 mt-6">
                <button type="button" onClick={closeDeviceModal} className="...">
                  취소
                </button>
                <button type="submit" className="...">
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

/** 연결된 장치 목록 */
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
