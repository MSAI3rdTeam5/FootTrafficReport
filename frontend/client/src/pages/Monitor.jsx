// /home/azureuser/FootTrafficReport/frontend/client/src/pages/Monitor.jsx

import React, { useState, useEffect, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import PrivacyOverlay from "./PrivacyOverlay";
import ResponsiveNav from "../components/ResponsiveNav";

// (NEW) AppContext
import { AppContext } from "../context/AppContext";

function Monitor() {
  const navigate = useNavigate();

  // ------------------------------------------------------------
  // (1) Context에서 가져오기
  // ------------------------------------------------------------
  const {
    setLocalStream,
    canvasRef,
    setCctvId
  } = useContext(AppContext);


  // === 로컬 state ===
  const [qrVisible, setQrVisible] = useState(false);
  const openQRModal = () => setQrVisible(true);
  const closeQRModal = () => setQrVisible(false);

  const [deviceModalOpen, setDeviceModalOpen] = useState(false);
  const [deviceType, setDeviceType] = useState(null);
  const [deviceName, setDeviceName] = useState("");
  const [deviceIP, setDeviceIP] = useState("");
  const [devicePort, setDevicePort] = useState("");

  const [privacyOpen, setPrivacyOpen] = useState(false);
  const handleOpenPrivacy = () => setPrivacyOpen(true);
  const handleClosePrivacy = () => setPrivacyOpen(false);

  const [cameraList, setCameraList] = useState([]);

  // 웹캠 선택 모달
  const [webcamModalOpen, setWebcamModalOpen] = useState(false);
  const [videoDevices, setVideoDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");

  // remoteStream (옵션)
  const [remoteStream, setRemoteStream] = useState(null);

  // 비디오 태그 레퍼런스
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // ------------------------------------------------------------
  // "웹캠 연결" 버튼 => 웹캠 목록 모달 열기
  // ------------------------------------------------------------
  const handleOpenWebcamSelect = async () => {
    try {
      const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
      tempStream.getTracks().forEach((t) => t.stop());

      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter((d) => d.kind === "videoinput");
      if (videoInputs.length === 0) {
        alert("사용 가능한 웹캠이 없습니다.");
        return;
      }
      setSelectedDeviceId(videoInputs[0].deviceId);
      setVideoDevices(videoInputs);
      setWebcamModalOpen(true);
    } catch (err) {
      console.error("handleOpenWebcamSelect error:", err);
      alert("카메라 권한이 필요합니다.");
    }
  };

  // ------------------------------------------------------------
  // "웹캠 선택" 모달 => "확인"
  // ------------------------------------------------------------
  const handleConfirmWebcamSelection = async () => {
    if (!selectedDeviceId) {
      alert("카메라를 선택하세요!");
      return;
    }
    setWebcamModalOpen(false);

    try {
      // (1) 로컬 스트림 획득
      const rawStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          deviceId: { exact: selectedDeviceId },
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 30 },
        },
        audio: false,
      });
      // (B) 전역 context에 localStream 세팅
      setLocalStream(rawStream);

      // cctvId 예시로 2번 => 실제 카메라 ID
      setCctvId(2);

      // (C) 이제 CCTVMonitoring 페이지로 이동
      navigate("/cctv-monitoring");


    //   // 로컬 프리뷰
      // if (localVideoRef.current) {
      //   localVideoRef.current.srcObject = rawStream;
      //   await localVideoRef.current.play().catch((err) => {
      //     console.warn("localVideo play error:", err);
      //   });
      // }
      // console.log("[DBG] local webcam opened =>", rawStream.getTracks());
    } catch (err) {
      console.error("getUserMedia 실패:", err);
      alert("카메라 열기에 실패했습니다: " + err.message);
      return;
    }

    // (2) SFU 연결 + produce
    // try {
    //   if (!socketRef.current || !deviceRef.current) {
    //     console.log("[DBG] SFU 미연결 => handleConnectSFU()");
    //     await handleConnectSFU();
    //   }
    //   console.log("[DBG] SFU 연결 상태 => produceVideoTrack");
    //   await produceVideoTrack(rawStream);
    // } catch (err) {
    //   console.error("SFU produce error:", err);
    // }
  };


  // // ------------------------------------------------------------
  // // localStream 연결 후 일정 시간 후 /cctv-monitoring으로 전환
  // // ------------------------------------------------------------
  // useEffect(() => {
  //   if (localStream) {
  //     const timer = setTimeout(() => {
  //       navigate("/cctv-monitoring");
  //     }, 5000);
  //     return () => clearTimeout(timer);
  //   }
  // }, [localStream, navigate]);

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen flex flex-col">
      <ResponsiveNav onOpenPrivacy={handleOpenPrivacy} />

      <div className="flex-1 pt-20 max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            CCTV 모니터링
          </h1>
          <button
            onClick={() => {
              setDeviceType("CCTV");
              setDeviceModalOpen(true);
            }}
            className="rounded-button bg-black text-white px-4 py-2 flex items-center"
          >
            <i className="fas fa-plus mr-2"></i> 새 장치 연결
          </button>
        </div>

        <div className="mb-4 text-gray-600 dark:text-gray-400">
          <span className="font-medium">환영합니다 관리자님!</span>
        </div>

        {/* 장치 연결 버튼들 */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <div
            className="bg-white dark:bg-gray-800 dark:text-gray-200 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center min-h-[200px] cursor-pointer hover:border-custom"
            onClick={() => {
              setDeviceType("CCTV");
              setDeviceModalOpen(true);
            }}
          >
            <i className="fas fa-video text-4xl text-custom mb-4"></i>
            <span className="text-gray-700 dark:text-gray-300">CCTV 연결</span>
          </div>
          <div
            className="bg-white dark:bg-gray-800 dark:text-gray-200 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center min-h-[200px] cursor-pointer hover:border-custom"
            onClick={handleOpenWebcamSelect}
          >
            <i className="fas fa-webcam text-4xl text-custom mb-4"></i>
            <span className="text-gray-700 dark:text-gray-300">웹캠 연결</span>
          </div>
          <div
            className="bg-white dark:bg-gray-800 dark:text-gray-200 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center min-h-[200px] cursor-pointer hover:border-custom"
            onClick={openQRModal}
          >
            <i className="fas fa-mobile-alt text-4xl text-custom mb-4"></i>
            <span className="text-gray-700 dark:text-gray-300">스마트폰 연결</span>
          </div>
          <div
            className="bg-white dark:bg-gray-800 dark:text-gray-200 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center min-h-[200px] cursor-pointer hover:border-custom"
            onClick={() => {
              setDeviceType("Blackbox");
              setDeviceModalOpen(true);
            }}
          >
            <i className="fas fa-car text-4xl text-custom mb-4"></i>
            <span className="text-gray-700 dark:text-gray-300">블랙박스 연결</span>
          </div>
        </div>

        {/* (2) 원본 미리보기 (WebRTC) */}
        {/* {(localStream || remoteStream) && (
          <div className="bg-white dark:bg-gray-800 dark:text-gray-200 p-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
            <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
              웹캠 실시간 미리보기 (원본)
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
            </button> */}

            {/* 모자이크 결과 (2FPS) */}
            {/* {mosaicImageUrl && (
              <div className="mt-6">
                <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">
                  모자이크 결과 (2FPS)
                </h3>
                <img
                  src={mosaicImageUrl}
                  alt="모자이크 결과"
                  style={{ width: "320px", border: "1px solid #ccc" }}
                />
              </div>
            )}
          </div>
        )} */}

        {/* Canvas for mosaic (숨김) */}
        <canvas ref={canvasRef} width={640} height={480} style={{ display: "none" }} />

        {/* 연결된 장치 목록 */}
        <ConnectedDevices cameraList={cameraList} />
      </div>

      {/* 푸터 영역 */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            © 2025 I See U. All rights reserved.
          </div>
        </div>
      </footer>

      {/* QR 모달 */}
      {qrVisible && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white dark:bg-gray-800 dark:text-gray-200 p-6 rounded border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
              스마트폰 연결
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              이 QR 코드를 스캔하세요.
            </p>
            <button
              onClick={closeQRModal}
              className="px-4 py-2 bg-black text-white rounded"
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {/* 장치등록 모달 */}
      {deviceModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white dark:bg-gray-800 dark:text-gray-200 w-full max-w-md p-6 rounded-lg relative border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setDeviceModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-custom"
            >
              <i className="fas fa-times text-xl"></i>
            </button>
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
              {deviceType === "CCTV" ? "CCTV 연결 정보" : "블랙박스 연결 정보"}
            </h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                // handleSubmitDevice()
              }}
            >
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  장치 이름
                </label>
                <input
                  type="text"
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md shadow-sm"
                  placeholder="예: 복도1 카메라"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  IP
                </label>
                <input
                  type="text"
                  value={deviceIP}
                  onChange={(e) => setDeviceIP(e.target.value)}
                  className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md shadow-sm"
                  placeholder="예: 192.168.0.10"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Port
                </label>
                <input
                  type="text"
                  value={devicePort}
                  onChange={(e) => setDevicePort(e.target.value)}
                  className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md shadow-sm"
                  placeholder="예: 554"
                />
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  type="button"
                  onClick={() => setDeviceModalOpen(false)}
                  className="border border-gray-300 dark:border-gray-600 px-4 py-2 rounded text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
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
          <div className="bg-white dark:bg-gray-800 dark:text-gray-200 w-full max-w-md p-6 rounded-lg relative border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setWebcamModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-custom"
            >
              <i className="fas fa-times text-xl"></i>
            </button>
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
              웹캠 선택
            </h2>
            {videoDevices.length === 0 ? (
              <p className="text-red-500">사용 가능한 카메라가 없습니다.</p>
            ) : (
              <>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  사용할 카메라 장치를 선택하세요
                </p>
                <select
                  className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md px-3 py-2 text-sm mb-4"
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
                    className="rounded-button border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
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
        <PrivacyOverlay open={privacyOpen} onClose={handleClosePrivacy} />
      )}
    </div>
  );
}

// 연결된 장치 목록 (예시)
function ConnectedDevices({ cameraList }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-6">
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-200 mb-4">
          연결된 장치
        </h2>
        {cameraList.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">
            아직 등록된 카메라가 없습니다.
          </p>
        ) : (
          <ul className="space-y-3">
            {cameraList.map((cam) => (
              <li
                key={cam.cameraId}
                className="p-2 bg-gray-50 dark:bg-gray-700 rounded"
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700 dark:text-gray-200">
                    {cam.cameraId}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-300">
                    {cam.hlsUrl}
                  </span>
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
