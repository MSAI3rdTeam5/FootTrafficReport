// /home/azureuser/FootTrafficReport/frontend/client/src/pages/Monitor.jsx

import React, { useState, useEffect, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import PrivacyOverlay from "./PrivacyOverlay";
import ResponsiveNav from "../components/ResponsiveNav";
import { getMemberProfile } from "../utils/api";

// Socket.io + mediasoup-client
import { io } from "socket.io-client";
import { Device } from "mediasoup-client";

// (NEW) AppContext import
import { AppContext } from "../context/AppContext";

function Monitor() {
  const navigate = useNavigate();

  // ------------------------------------------------------------
  // (NEW) Context에서 가져오기
  // ------------------------------------------------------------
  const {
    localStream,
    setLocalStream,
    mosaicImageUrl,
    setMosaicImageUrl,
    canvasRef,
    isProcessingRef,
  } = useContext(AppContext);

  // ------------------------------------------------------------
  // (NEW) "shouldDisconnect" 감지 → 자동 웹캠 종료
  // ------------------------------------------------------------

  // === (나머지 로컬 state / ref) ===
  const [qrVisible, setQrVisible] = useState(false);
  const openQRModal = () => setQrVisible(true);
  const closeQRModal = () => setQrVisible(false);

  const [deviceModalOpen, setDeviceModalOpen] = useState(false);
  const [deviceType, setDeviceType] = useState(null);
  const [deviceName, setDeviceName] = useState("");
  const [deviceIP, setDeviceIP] = useState("");
  const [devicePort, setDevicePort] = useState("");

  const [privacyOpen, setPrivacyOpen] = useState(false);
    // (2) Nav에서 이 함수를 호출 -> 오버레이 열림
  const handleOpenPrivacy = () => setPrivacyOpen(true);
    // (3) 오버레이 닫기
  const handleClosePrivacy = () => setPrivacyOpen(false);

  const [cameraList, setCameraList] = useState([]);

  // SFU 관련
  const socketRef = useRef(null);
  const deviceRef = useRef(null);
  const [sendTransport, setSendTransport] = useState(null);

  // remoteStream (옵션), localVideo, remoteVideo
  const [remoteStream, setRemoteStream] = useState(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // ------------------------------------------------------------
  // 로그인된 유저 표시
  // ------------------------------------------------------------
//   const [profile, setProfile] = useState(null);
//   const [loading, setLoading] = useState(true);

//  useEffect(() => {
//     getMemberProfile()
//       .then((data) => {
//         setProfile(data);
//       })
//       .catch((err) => {
//         console.error("Failed to get profile:", err);
//         setProfile(null); // 또는 그대로 null
//       })
//       .finally(() => {
//         setLoading(false);
//       });
//   }, []);

//   if (!profile) return <div>Loading...</div>;
  // {profile.id} or {profile.email} or {profile.name} or {profile.subscription_plan} => 로그인 사용자 정보 변수

  // ------------------------------------------------------------
  // "웹캠 연결" 버튼 => 웹캠 목록 모달 열기
  // ------------------------------------------------------------
  const handleOpenWebcamSelect = async () => {
    try {
      // 임시로 getUserMedia 권한 확인
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

  // (카메라 선택 모달 관련)
  const [webcamModalOpen, setWebcamModalOpen] = useState(false);
  const [videoDevices, setVideoDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");

  const handleConfirmWebcamSelection = async () => {
    if (!selectedDeviceId) {
      alert("카메라를 선택하세요!");
      return;
    }
    setWebcamModalOpen(false);

    // (1) 로컬 스트림 획득
    let rawStream;
    try {
      rawStream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: { exact: selectedDeviceId },
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 30 },
        },
        audio: false,
      });
      setLocalStream(rawStream);

      // 로컬 프리뷰
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = rawStream;
        await localVideoRef.current.play().catch((err) => {
          console.warn("localVideo play error:", err);
        });
      }
      console.log("[DBG] local webcam opened =>", rawStream.getTracks());
    } catch (err) {
      console.error("getUserMedia 실패:", err);
      alert("카메라 열기에 실패했습니다: " + err.message);
      return;
    }

    // (2) SFU 연결 + produce
    try {
      if (!socketRef.current || !deviceRef.current) {
        console.log("[DBG] SFU 미연결 => handleConnectSFU()");
        await handleConnectSFU();
      }
      console.log("[DBG] SFU 연결 상태 => produceVideoTrack");
      await produceVideoTrack(rawStream);
    } catch (err) {
      console.error("SFU produce error:", err);
    }
  };

  // ------------------------------------------------------------
  // SFU 연결
  // ------------------------------------------------------------
  async function handleConnectSFU() {
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

    const routerCaps = await new Promise((resolve, reject) => {
      s.emit("getRouterRtpCapabilities", {}, (res) => {
        if (!res.success) return reject(new Error(res.error));
        resolve(res.rtpCapabilities);
      });
    });

    const dev = new Device();
    await dev.load({ routerRtpCapabilities: routerCaps });
    deviceRef.current = dev;
    console.log("Mediasoup Device loaded => canProduceVideo =", dev.canProduce("video"));
  }

  async function produceVideoTrack(rawStream) {
    if (!deviceRef.current || !socketRef.current) {
      console.warn("[WARN] SFU device/socket not ready.");
      return;
    }
    const dev = deviceRef.current;
    const sock = socketRef.current;

    let transport = sendTransport;
    if (!transport) {
      const transportParams = await createTransport(sock, "send");
      transport = dev.createSendTransport(transportParams);

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
    }

    try {
      await transport.produce({ track: rawStream.getVideoTracks()[0] });
      console.log("[DBG] Producer(원본) 생성 완료");
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

  // ------------------------------------------------------------
  // 웹캠 연결 해제
  // ------------------------------------------------------------
  const handleWebcamDisconnect = () => {
    if (localStream) {
      localStream.getTracks().forEach((t) => t.stop());
    }
    setLocalStream(null);

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

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

  // ------------------------------------------------------------
  // 2FPS 모자이크 로직
  // ------------------------------------------------------------
  useEffect(() => {
    if (!localStream) {
      setMosaicImageUrl(null);
      return;
    }
    const intervalId = setInterval(() => {
      if (!localVideoRef.current) return;
      if (isProcessingRef.current) return;

      isProcessingRef.current = true;
      const ctx = canvasRef.current.getContext("2d");
      ctx.drawImage(localVideoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);

      canvasRef.current.toBlob(async (blob) => {
        if (!blob) {
          isProcessingRef.current = false;
          return;
        }
        try {
          const formData = new FormData();
          formData.append("file", blob, "frame.png");
          const res = await fetch("/yolo_mosaic", { method: "POST", body: formData });
          if (!res.ok) throw new Error(`/yolo_mosaic error: ${res.status}`);

          const resultBlob = await res.blob();
          const imgUrl = URL.createObjectURL(resultBlob);
          setMosaicImageUrl(imgUrl);
        } catch (err) {
          console.error("auto-mosaic error:", err);
        } finally {
          isProcessingRef.current = false;
        }
      }, "image/png");
    }, 100);

    return () => clearInterval(intervalId);
  }, [localStream, setMosaicImageUrl, isProcessingRef]);

  // ------------------------------------------------------------
  // localStream 연결 후 일정 시간 후 /cctv-monitoring으로 전환
  // ------------------------------------------------------------
  useEffect(() => {
    if (localStream) {
      const timer = setTimeout(() => {
        navigate("/cctv-monitoring");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [localStream, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* 공통 네비 바 */}
      <ResponsiveNav onOpenPrivacy={handleOpenPrivacy} />

      {/* 메인 컨텐츠 */}
      <div className="max-w-8xl pt-20 mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">CCTV 모니터링</h1>
          <button
            onClick={() => setDeviceModalOpen(true)}
            className="rounded-button bg-black text-white px-4 py-2 flex items-center"
          >
            <i className="fas fa-plus mr-2"></i> 새 장치 연결
          </button>
        </div>
        <div className="mb-4 text-gray-600">
          <span className="font-medium">환영합니다 관리자님!</span>
        </div>

        {/* (1) 장치 연결 버튼들 */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <div
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col items-center justify-center min-h-[200px] cursor-pointer hover:border-custom"
            onClick={() => setDeviceModalOpen(true)}
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
            onClick={() => setDeviceType("Blackbox")}
          >
            <i className="fas fa-car text-4xl text-custom mb-4"></i>
            <span className="text-gray-700">블랙박스 연결</span>
          </div>
        </div>

        {/* (2) 원본 미리보기 (WebRTC) */}
        {(localStream || remoteStream) && (
          <div className="bg-white p-4 rounded-lg border mb-6">
            <h2 className="text-lg font-semibold mb-2">웹캠 실시간 미리보기 (원본)</h2>
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

            {/* 모자이크 결과 (2FPS) */}
            {mosaicImageUrl && (
              <div className="mt-6">
                <h3 className="font-semibold mb-2">모자이크 결과 (2FPS)</h3>
                <img
                  src={mosaicImageUrl}
                  alt="모자이크 결과"
                  style={{ width: "320px", border: "1px solid #ccc" }}
                />
              </div>
            )}
          </div>
        )}

        {/* Canvas for mosaic */}
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          style={{ display: "none" }}
        />

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
              onClick={() => setDeviceModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-custom"
            >
              <i className="fas fa-times text-xl"></i>
            </button>
            <h2 className="text-xl font-bold mb-4">
              {deviceType === "CCTV" ? "CCTV 연결 정보" : "블랙박스 연결 정보"}
            </h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                // handleSubmitDevice() 등은 필요 시 구현
              }}
            >
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
                <label className="block text-sm font-medium text-gray-700">IP</label>
                <input
                  type="text"
                  value={deviceIP}
                  onChange={(e) => setDeviceIP(e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                  placeholder="예: 192.168.0.10"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Port</label>
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
                  onClick={() => setDeviceModalOpen(false)}
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
      {privacyOpen && <PrivacyOverlay open={privacyOpen} onClose={handleClosePrivacy} />}
    </div>
  );
}

// 연결된 장치 목록 (예시)
function ConnectedDevices({ cameraList }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-6">
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-200 mb-4">연결된 장치</h2>
        {cameraList.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">아직 등록된 카메라가 없습니다.</p>
        ) : (
          <ul className="space-y-3">
            {cameraList.map((cam) => (
              <li key={cam.cameraId} className="p-2 bg-gray-50 dark:bg-gray-700 rounded">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700 dark:text-gray-200">{cam.cameraId}</span>
                  <span className="text-xs text-gray-400 dark:text-gray-300">{cam.hlsUrl}</span>
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
