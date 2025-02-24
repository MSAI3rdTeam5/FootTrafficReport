// /home/azureuser/FootTrafficReport/frontend/client/src/pages/Monitor.jsx

import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import PrivacyOverlay from "./PrivacyOverlay";
import ResponsiveNav from "../components/ResponsiveNav";

// (NEW) CCTVMonitoring 컴포넌트 import
import CCTVMonitoring from "./CCTVMonitoring";


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
    // (2) Nav에서 이 함수를 호출 -> 오버레이 열림
  const handleOpenPrivacy = () => setPrivacyOpen(true);
    // (3) 오버레이 닫기
  const handleClosePrivacy = () => setPrivacyOpen(false);

  // (NEW) CCTVMonitoring “오버레이” 표시 여부
  const [showCCTVMonitoring, setShowCCTVMonitoring] = useState(false);
  // "웹캠 연결" 버튼 => CCTVMonitoring 오버레이 열기
  const handleOpenWebcamMonitoring = () => setShowCCTVMonitoring(true);
  // CCTVMonitoring 닫기 (onClose 콜백)
  const handleCloseCCTVMonitoring = () => setShowCCTVMonitoring(false);

  
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
  const [cameraList, setCameraList] = useState([
    { id: 1, name: "CCTV 1" },
    { id: 2, name: "CCTV 2" },
  ]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans">
      {/* 공통 네비 바 */}
      <ResponsiveNav onOpenPrivacy={handleOpenPrivacy} />

      {/* 메인 컨텐츠 */}
      <div className="pt-16 max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-200">CCTV 모니터링</h1>
          <button
            onClick={() => setDeviceModalOpen(true)} // 새 장치 연결(예시)
            className="rounded-button bg-black text-white px-4 py-2 flex items-center"
          >
            <i className="fas fa-plus mr-2"></i>새 장치 연결
          </button>
        </div>
        <div className="mb-4 text-gray-600">
          <span className="font-medium">환영합니다 {displayName}님!</span>
        </div>
        {/* 카메라 연결 그리드 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col items-center justify-center min-h-[200px] cursor-pointer hover:border-custom dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
            onClick={() => setDeviceModalOpen("CCTV")}
          >
            <i className="fas fa-video text-4xl text-custom mb-4"></i>
            <span className="text-gray-700">CCTV 연결</span>
          </div>
          <div
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col items-center justify-center min-h-[200px] cursor-pointer hover:border-custom dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
            onClick={handleOpenWebcamMonitoring}
          >
            <i className="fas fa-webcam text-4xl text-custom mb-4"></i>
            <span className="text-gray-700">웹캠 연결</span>
          </div>
          <div
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col items-center justify-center min-h-[200px] cursor-pointer hover:border-custom dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
            onClick={openQRModal}
          >
            <i className="fas fa-mobile-alt text-4xl text-custom mb-4"></i>
            <span className="text-gray-700">스마트폰 연결</span>
          </div>
          <div
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col items-center justify-center min-h-[200px] cursor-pointer hover:border-custom dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
            onClick={() => setDeviceType("Blackbox")}
          >
            <i className="fas fa-car text-4xl text-custom mb-4"></i>
            <span className="text-gray-700">블랙박스 연결</span>
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


      {/* (NEW) CCTVMonitoring - "오버레이"로 표시 */}
      {showCCTVMonitoring && (
        <CCTVMonitoring
          onClose={handleCloseCCTVMonitoring}
          // "selectedCamera"는 넘기지 않음
          // cctvmonitoring 내부에서 웹캠 연결/카메라 로직을 진행
        />
      )}

      {/* 개인정보법 안내 오버레이 */}
      {privacyOpen && <PrivacyOverlay open={privacyOpen} onClose={handleClosePrivacy} />}
    </div>
  );
}

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
