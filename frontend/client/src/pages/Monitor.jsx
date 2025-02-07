// src/pages/Monitor.jsx

import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import PrivacyOverlay from "./PrivacyOverlay";

// API 호출 헬퍼 함수 임포트
import { callPeopleDetection } from "../utils/api";

function Monitor() {
  const location = useLocation();

  // 1) QR 모달 상태
  const [qrVisible, setQrVisible] = useState(false);
  const [qrTimestamp, setQrTimestamp] = useState(Date.now());
  const openQRModal = () => setQrVisible(true);
  const closeQRModal = () => setQrVisible(false);
  const refreshQR = () => setQrTimestamp(Date.now());

  // 2) 장치등록 모달 상태
  const [deviceModalOpen, setDeviceModalOpen] = useState(false);
  const [deviceType, setDeviceType] = useState(null);

  // 폼 입력(장치정보)
  const [deviceName, setDeviceName] = useState("");
  const [deviceIP, setDeviceIP] = useState("");
  const [devicePort, setDevicePort] = useState("");
  const [deviceUser, setDeviceUser] = useState("");
  const [devicePass, setDevicePass] = useState("");

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
  const handleSubmitDevice = (e) => {
    e.preventDefault();
    console.log("[장치 등록]", {
      deviceType,
      deviceName,
      deviceIP,
      devicePort,
      deviceUser,
      devicePass,
    });
    setDeviceModalOpen(false);
  };

  // 탭 강조 로직
  const isMonitorActive = location.pathname === "/monitor";
  const isDashboardActive = location.pathname === "/dashboard";
  const isAiInsightActive = location.pathname === "/ai-insight";
  const isGuideActive = location.pathname === "/guide";

  // 개인정보법 안내 오버레이 상태
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const openPrivacy = () => setPrivacyOpen(true);
  const closePrivacy = () => setPrivacyOpen(false);

  // ---- [추가] 로그인된 사용자의 displayName 관리 ----
  const [displayName, setDisplayName] = useState("김관리자");
  useEffect(() => {
    console.log("Monitor useEffect triggered");
    // 서버에서 현재 유저 정보 가져오기 (예시)
    fetch("/api/user", { credentials: "include" })
      .then((res) => {
        if (!res.ok) {
          // 로그인 안 된 상태 등
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data && data.displayName) {
          setDisplayName(data.displayName);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch user info:", err);
      });
  }, []);

  // === [추가: 실시간 영상 오버레이 상태] ===
  const [showVideoOverlay, setShowVideoOverlay] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  // 모달 상태에 추가 데이터를 포함하도록 확장
  const [videoOverlayData, setVideoOverlayData] = useState(null);

  // 장치 클릭 시 오버레이 열기
  // const openVideoOverlay = (device) => {
  //   setSelectedDevice(device);
  //   setShowVideoOverlay(true);
  // };
    // 오버레이 닫기
  // const closeVideoOverlay = () => {
  //   setSelectedDevice(null);
  //   setShowVideoOverlay(false);
  // };
  const openVideoOverlayWithDetection = async (deviceInfo) => {
    // deviceInfo에 cctv_url, cctv_id 추가 (예시 값; 실제 값은 장치 정보에서 받아야 함)
    const cctv_url = "https://videos-3.earthcam.com/fecnetwork/32781.flv/chunklist_w678325738.m3u8?t=wFpB2Fyz3qRC%2BL7EEuRepKwbaynYM1VRHVhMSXiPmu6doVjT%2BpI06iVNLdLPV4ra&td=202502042208"; // 예시: 실제 CCTV 영상 URL
    const cctv_id = "1"; // 예시: 장치 고유 ID

    try {
      // people-detection API 호출
      const detectionData = await callPeopleDetection(cctv_url, cctv_id);
      // detectionData가 { videoStreamUrl, recognitionLog } 형태라고 가정
      // 모달에 device 정보와 detectionData를 합쳐서 전달
      setVideoOverlayData({
        ...deviceInfo,
        videoStreamUrl: detectionData.videoStreamUrl,
        recognitionLog: detectionData.recognitionLog,
      });
    } catch (error) {
      console.error("Failed to call people-detection service:", error);
      // 에러 처리 (예: 알림 표시)
    }
  };


  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* 상단 Nav */}
      <nav className="bg-white shadow">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* 왼쪽: "I See U" + 탭 */}
            <div className="flex items-center space-x-8">
              <span className="text-xl font-bold text-black">I See U</span>
              <div className="flex space-x-3">
                {/* 내 모니터링 (현재 화면) */}
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
                    backgroundColor: isMonitorActive ? "#000000" : "#f3f4f6",
                    color: isMonitorActive ? "#ffffff" : "#000000",
                  }}
                >
                  내 모니터링
                </Link>

                {/* 통계 분석 */}
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
                    backgroundColor: isDashboardActive ? "#000000" : "#f3f4f6",
                    color: isDashboardActive ? "#ffffff" : "#000000",
                  }}
                >
                  통계 분석
                </Link>

                {/* AI 인사이트 */}
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
                    backgroundColor: isAiInsightActive ? "#000000" : "#f3f4f6",
                    color: isAiInsightActive ? "#ffffff" : "#000000",
                  }}
                >
                  AI 인사이트
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
                    backgroundColor: isGuideActive ? "#000000" : "#f3f4f6",
                    color: isGuideActive ? "#ffffff" : "#000000",
                  }}
                >
                  사용 방법
                </Link>

                {/* 개인정보법 안내 (오버레이) */}
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

            {/* 오른쪽: 알림 - 설정 - 사용자 */}
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
            <i className="fas fa-plus mr-2"></i>
            새 장치 연결
          </button>
        </div>
        <div className="mb-4 text-gray-600">
          <span className="font-medium">환영합니다 {displayName}님!</span>
        </div>

        {/* 연결 방식 4개 박스 */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          {/* CCTV 연결 */}
          <div
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col items-center justify-center min-h-[200px] cursor-pointer hover:border-custom"
            onClick={() => openDeviceModal("CCTV")}
          >
            <i className="fas fa-video text-4xl text-custom mb-4"></i>
            <span className="text-gray-700">CCTV 연결</span>
          </div>
          {/* 웹캠 연결 */}
          <div
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col items-center justify-center min-h-[200px] cursor-pointer hover:border-custom"
            onClick={openQRModal}
          >
            <i className="fas fa-webcam text-4xl text-custom mb-4"></i>
            <span className="text-gray-700">웹캠 연결</span>
          </div>
          {/* 스마트폰 연결 */}
          <div
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col items-center justify-center min-h-[200px] cursor-pointer hover:border-custom"
            onClick={openQRModal}
          >
            <i className="fas fa-mobile-alt text-4xl text-custom mb-4"></i>
            <span className="text-gray-700">스마트폰 연결</span>
          </div>
          {/* 블랙박스 연결 */}
          <div
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col items-center justify-center min-h-[200px] cursor-pointer hover:border-custom"
            onClick={() => openDeviceModal("Blackbox")}
          >
            <i className="fas fa-car text-4xl text-custom mb-4"></i>
            <span className="text-gray-700">블랙박스 연결</span>
          </div>
        </div>

        {/* 연결된 장치 목록 예시 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">연결된 장치</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* 정문 CCTV (온라인) */}
              <div
                className="relative cursor-pointer"
                onClick={() =>
                  openVideoOverlayWithDetection({
                    title: "정문 CCTV",
                    status: "온라인",
                    location: "서울시 강남구",
                  })
                }
              >
                <div className="w-full h-[180px] rounded-lg overflow-hidden">
                  <img
                    src="/정문.png"
                    alt="정문 CCTV"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute top-2 left-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    온라인
                  </span>
                </div>
                <div className="mt-2">
                  <h3 className="text-sm font-medium text-gray-900">
                    정문 CCTV
                  </h3>
                  <p className="text-sm text-gray-500">서울시 강남구</p>
                </div>
              </div>

              {/* 로비 CCTV (온라인) */}
              <div
                className="relative cursor-pointer"
                onClick={() =>
                  openVideoOverlayWithDetection({
                    title: "로비 CCTV",
                    status: "온라인",
                    location: "서울시 강남구",
                  })
                }
              >
                <div className="w-full h-[180px] rounded-lg overflow-hidden">
                  <img
                    src="/로비.png"
                    alt="로비 CCTV"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute top-2 left-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    온라인
                  </span>
                </div>
                <div className="mt-2">
                  <h3 className="text-sm font-medium text-gray-900">
                    로비 CCTV
                  </h3>
                  <p className="text-sm text-gray-500">서울시 강남구</p>
                </div>
              </div>

              {/* 주차장 CCTV (오프라인) */}
              <div
                className="relative cursor-pointer"
                onClick={() =>
                  openVideoOverlayWithDetection({
                    title: "주차장 CCTV",
                    status: "오프라인",
                    location: "서울시 강남구",
                  })
                }
              >
                <div className="w-full h-[180px] rounded-lg overflow-hidden">
                  <img
                    src="/주차장.png"
                    alt="주차장 CCTV"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute top-2 left-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    오프라인
                  </span>
                </div>
                <div className="mt-2">
                  <h3 className="text-sm font-medium text-gray-900">
                    주차장 CCTV
                  </h3>
                  <p className="text-sm text-gray-500">서울시 강남구</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="bg-white border-t border-gray-200 mt-8">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="text-center text-sm text-gray-500">
            © 2024 I See U. All rights reserved.
          </div>
        </div>
      </footer>

      {/* ====== QR 모달 ====== */}
      {qrVisible && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="relative bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
            {/* 닫기 버튼 */}
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-custom transition-colors rounded-button p-2"
              onClick={closeQRModal}
            >
              <i className="fas fa-times text-xl"></i>
            </button>

            {/* 새로고침 버튼 */}
            <button
              className="absolute top-4 left-4 text-gray-400 hover:text-custom transition-colors rounded-button p-2"
              onClick={refreshQR}
              title="QR 새로고침"
            >
              <i className="fas fa-sync-alt text-xl"></i>
            </button>

            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-800">QR 코드 스캔</h1>
              <div className="mt-2 text-sm text-gray-500">연결 대기 중...</div>
            </div>

            <div className="relative w-64 h-64 mx-auto mb-6">
              <div className="absolute inset-0 border-2 border-custom rounded-lg"></div>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=https://example.com&t=${qrTimestamp}`}
                alt="QR Code"
                className="w-full h-full p-3"
              />
              <div className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-custom" />
              <div className="absolute -top-2 -right-2 w-4 h-4 border-t-2 border-r-2 border-custom" />
              <div className="absolute -bottom-2 -left-2 w-4 h-4 border-b-2 border-l-2 border-custom" />
              <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-custom" />
            </div>

            <div className="text-center text-sm text-gray-600 leading-relaxed max-w-sm mx-auto">
              <p>
                모바일 또는 웹캠 카메라로 해당 QR 코드를 촬영하시면 간편하게 실시간
                연동이 가능합니다
              </p>
            </div>

            <div className="mt-6 flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-500">스캔 준비 완료</span>
            </div>
          </div>
        </div>
      )}

      {/* ====== 장치등록 모달 ====== */}
      {deviceModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white w-full max-w-md p-6 rounded-lg relative">
            {/* 닫기 버튼 */}
            <button
              onClick={closeDeviceModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-custom"
            >
              <i className="fas fa-times text-xl"></i>
            </button>

            <h2 className="text-xl font-bold mb-4">
              {deviceType === "CCTV" ? "CCTV 연결 정보" : "블랙박스 연결 정보"}
            </h2>

            <div className="text-sm text-gray-600 mb-4">
              {deviceType === "CCTV" ? (
                <>
                  <p>
                    IP 카메라 / NVR 등과 연결하기 위해 IP 주소와 포트, 계정 정보를
                    입력하세요.
                  </p>
                  <p>ONVIF나 RTSP 등 프로토콜을 사용할 수 있습니다.</p>
                  <p className="mt-2 text-xs text-gray-400">
                    (예: rtsp://192.168.0.10:554, 포트포워딩 필요)
                  </p>
                </>
              ) : (
                <>
                  <p>
                    블랙박스를 네트워크로 연결하거나, 제조사 클라우드 계정을 통해
                    실시간 영상을 볼 수 있습니다.
                  </p>
                  <p className="mt-2 text-xs text-gray-400">
                    (예: cloud.blackbox.com 계정 / IP 직접 연결 등)
                  </p>
                </>
              )}
            </div>

            <form onSubmit={handleSubmitDevice}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  장치 이름
                </label>
                <input
                  type="text"
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-custom focus:border-custom"
                  placeholder={
                    deviceType === "CCTV" ? "예) 정문 CCTV" : "예) 차량 블랙박스"
                  }
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  IP / 도메인
                </label>
                <input
                  type="text"
                  value={deviceIP}
                  onChange={(e) => setDeviceIP(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-custom focus:border-custom"
                  placeholder="예) 192.168.0.10 or mydevice.example.com"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  포트
                </label>
                <input
                  type="text"
                  value={devicePort}
                  onChange={(e) => setDevicePort(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-custom focus:border-custom"
                  placeholder="예) 554"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  계정 (ID)
                </label>
                <input
                  type="text"
                  value={deviceUser}
                  onChange={(e) => setDeviceUser(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-custom focus:border-custom mb-2"
                  placeholder="예) admin"
                />

                <label className="block text-sm font-medium text-gray-700 mb-1">
                  비밀번호
                </label>
                <input
                  type="password"
                  value={devicePass}
                  onChange={(e) => setDevicePass(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-custom focus:border-custom"
                  placeholder="패스워드"
                />
              </div>

              <div className="flex justify-end space-x-2 mt-6">
                <button
                  type="button"
                  onClick={closeDeviceModal}
                  className="rounded-button border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="rounded-button bg-black text-white px-4 py-2 text-sm hover:bg-black/90"
                >
                  등록
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 개인정보법 안내 오버레이 */}
      {privacyOpen && <PrivacyOverlay open={privacyOpen} onClose={closePrivacy} />}

      {/* ====== 실시간 영상 오버레이 ====== */}
      {videoOverlayData && (
        <LiveVideoOverlay
          device={videoOverlayData}
          onClose={() => setVideoOverlayData(null)}
        />
      )}
    </div>
  );
}

/**
 * 실시간 영상 오버레이
 * - 상단에 영상 제목
 * - 좌측: 실시간 영상(Placeholder), 우측: 로그 창(Placeholder)
 */
function LiveVideoOverlay({ device, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      {/* 오버레이 박스 */}
      <div className="bg-white w-11/12 max-w-5xl h-5/6 rounded-md shadow-lg relative flex flex-col">
        {/* 헤더 영역 */}
        <div className="px-4 py-2 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">
            {device.title || "실시간 영상"}
          </h2>
          <button
            className="text-gray-600 hover:text-gray-900"
            onClick={onClose}
          >
            닫기
          </button>
        </div>

        {/* 내용 영역 */}
        <div className="flex flex-1 overflow-hidden">
          {/* 좌측: 실시간 영상 (추후 스트리밍/서버 연결) */}
          <div className="flex-1 border-r p-4 flex items-center justify-center">
            {device.videoStreamUrl ? (
              <video className="w-full h-full" controls autoPlay>
                <source src={device.videoStreamUrl} type="application/x-mpegURL" />
                브라우저가 비디오 태그를 지원하지 않습니다.
              </video>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <span className="text-gray-500">실시간 영상 없음</span>
              </div>
            )}
          </div>

          {/* 우측: 로그 (추후 DB 연동) */}
          <div className="w-1/3 p-4 flex flex-col">
            <h3 className="font-semibold mb-2 text-gray-800">데이터 로그</h3>
            <div className="flex-1 bg-gray-50 rounded p-2 overflow-auto text-sm text-gray-700">
              {device.recognitionLog ? (
                  <pre>{device.recognitionLog}</pre>
                ) : (
                  <p>로그 없음</p>
                )}
              {/* 임의의 로그 예시 */}
              {/* <p>[12:01:23] 남성, 30대</p>
              <p>[12:05:10] 여성, 20대</p>
              <p>[12:10:33] 남성, 40대</p>
              <p>[12:15:47] 여성, 50대</p>
              <p>[12:20:59] 남성, 20대</p> */}
              {/* ... */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Monitor;
