// src/pages/Guide.jsx
import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
// 만약 개인정보법 안내를 오버레이로 쓰신다면 import PrivacyOverlay from "./PrivacyOverlay";

function Guide() {
  const location = useLocation();

  // 탭 활성화 로직
  const isMonitorActive = location.pathname === "/monitor";
  const isDashboardActive = location.pathname === "/dashboard";
  const isAiInsightActive = location.pathname === "/ai-insight";
  const isChatbotActive = location.pathname === "/chatbot";
  const isGuideActive = location.pathname === "/guide";
  const isPrivacyActive = location.pathname === "/privacy";

  // 개인정보 오버레이
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const handleOpenPrivacy = () => setPrivacyOpen(true);
  const handleClosePrivacy = () => setPrivacyOpen(false);

  //사이드바 확장
  const sidebarRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop =
        window.pageYOffset || document.documentElement.scrollTop;

      if (sidebarRef.current) {
        sidebarRef.current.style.height = `${window.innerHeight}px`;
        sidebarRef.current.style.top = scrollTop > 64 ? "0" : "64px";
      }
    };

    const handleResize = () => {
      if (sidebarRef.current) {
        sidebarRef.current.style.height = `${window.innerHeight}px`;
      }
    };

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  //회원 탈퇴 확인 창
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const handleWithdrawClick = () => {
    setShowWithdrawModal(true);
  };
  const handleCloseModal = () => {
    setShowWithdrawModal(false);
  };

  // 개인정보법 안내는 버튼/링크/오버레이 방식에 따라 추가 로직 가능

  // 예: 개인정보법 안내 오버레이
  // const [privacyOpen, setPrivacyOpen] = useState(false);
  // const openPrivacy = () => setPrivacyOpen(true);
  // const closePrivacy = () => setPrivacyOpen(false);

  return (
    <div className="bg-gray-50 min-h-screen font-['Noto_Sans_KR']">
      {/* 상단 Nav */}
      <ResponsiveNav onOpenPrivacy={handleOpenPrivacy} />

      {/* 메인 레이아웃 */}
      <div className="min-h-screen flex">
        {/* 좌측 사이드바 (앵커) */}
        <aside
          ref={sidebarRef}
          className="w-64 bg-white border-r border-gray-200 fixed h-full overflow-y-auto transition-all duration-300"
        >
          <div className="p-6">
            <nav>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#intro"
                    className="block px-4 py-2 text-custom hover:bg-gray-100 rounded-lg"
                  >
                    앱 소개
                  </a>
                </li>
                <li>
                  <a
                    href="#device"
                    className="block px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    장치 등록 방법
                  </a>
                </li>
                <li>
                  <a
                    href="#monitor"
                    className="block px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    실시간 모니터링
                  </a>
                </li>
                <li>
                  <a
                    href="#stats"
                    className="block px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    통계 분석 활용
                  </a>
                </li>
                <li>
                  <a
                    href="#faq"
                    className="block px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    FAQ &amp; 주의사항
                  </a>
                </li>
                <li>
                  <a
                    href="#extra"
                    className="block px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    부가 안내
                  </a>
                </li>
              </ul>
            </nav>
          </div>
        </aside>

        <main className="ml-64 flex-1">
          {/* 본문 내용 (앱 소개, 장치 등록 방법, 실시간 모니터링, 통계 분석 활용, FAQ, 부가 안내 등) */}
          <div className="max-w-7xl mx-auto px-6 pt-8 pb-16">
            {/* #intro */}
            <section id="intro" className="mb-16">
              <h2 className="text-2xl font-bold mb-6">1. 앱 소개</h2>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-700 mb-6">
                  I See U는 다양한 디바이스(CCTV, 블랙박스, 웹캠, 스마트폰
                  등)로부터 실시간 영상을 모니터링하고, 방문자 통계·분석 자료를
                  한눈에 확인할 수 있는 솔루션입니다.
                </p>
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="font-bold mb-4">주요 대상</h3>
                    <ul className="space-y-2">
                      <li className="flex items-center">
                        <i className="fas fa-store text-custom mr-3"></i>매장
                        관리자
                      </li>
                      <li className="flex items-center">
                        <i className="fas fa-shield-alt text-custom mr-3"></i>
                        보안 담당자
                      </li>
                      <li className="flex items-center">
                        <i className="fas fa-microscope text-custom mr-3"></i>
                        연구원
                      </li>
                    </ul>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="font-bold mb-4">핵심 기능</h3>
                    <ul className="space-y-2">
                      <li className="flex items-center">
                        <i className="fas fa-video text-custom mr-3"></i>실시간
                        모니터링
                      </li>
                      <li className="flex items-center">
                        <i className="fas fa-chart-line text-custom mr-3"></i>
                        시간대별 방문자 통계
                      </li>
                      <li className="flex items-center">
                        <i className="fas fa-clock text-custom mr-3"></i>피크
                        시간대·체류 시간 분석
                      </li>
                      <li className="flex items-center">
                        <i className="fas fa-file-download text-custom mr-3"></i>
                        보고서 다운로드
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* #device */}
            <section id="device" className="mb-16">
              <h2 className="text-2xl font-bold mb-6">2. 장치 등록 방법</h2>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="space-y-8">
                  <div>
                    <h3 className="text-lg font-bold mb-4">
                      2.1. 새 장치 연결
                    </h3>
                    <ol className="list-decimal list-inside space-y-2 ml-4">
                      <li>"새 장치 연결" 버튼을 클릭합니다.</li>
                      <li>
                        CCTV/블랙박스/웹캠/스마트폰 등 장치 유형을 선택합니다.
                      </li>
                    </ol>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold mb-4">
                      2.2. IP 기반 장치(CCTV/블랙박스)
                    </h3>
                    <ul className="space-y-2 ml-4">
                      <li>
                        IP/도메인 + 포트 + 계정/비밀번호 입력 후 등록
                        (ONVIF·RTSP 등)
                      </li>
                      <li>
                        포트포워딩, 공유기 설정 등 네트워크 환경 세팅 필요
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold mb-4">
                      2.3. QR 연동(웹캠·스마트폰 등)
                    </h3>
                    <ul className="space-y-2 ml-4">
                      <li>"QR 코드 스캔" 화면을 열고,</li>
                      <li>모바일·웹캠 카메라로 QR 코드를 촬영하면 자동 연결</li>
                      <li>
                        장치가 정상 등록되면, 실시간 모니터링 화면에 추가됨
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* #monitor */}
            <section id="monitor" className="mb-16">
              <h2 className="text-2xl font-bold mb-6">
                3. 실시간 모니터링 화면 사용법
              </h2>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="mb-6">
                  <img
                    src="/가이드1.png"
                    alt="모니터링 화면"
                    className="w-full rounded-lg mb-4"
                  />
                </div>
                <div className="space-y-4">
                  <p>
                    내 모니터링 화면 혹은 통계 분석 화면 내의 "실시간 모니터링"
                    섹션에서, 등록된 화면(2×2 블록 등)을 확인할 수 있습니다.
                  </p>
                  <p>
                    원하는 화면을 클릭해 체크박스를 선택할 수 있습니다. 선택된
                    화면은 하단 목록에 표시됩니다.
                  </p>
                  <p>
                    "새 장치 연결" 버튼을 통해 다른 디바이스도 지속해서 추가
                    가능.
                  </p>
                  <div className="bg-blue-50 border-l-4 border-black p-4 mt-4">
                    <p className="text-sm">
                      <i className="fas fa-info-circle text-black mr-2"></i>TIP:
                      네트워크 상태가 불안정하면 영상이 끊길 수 있습니다.
                      가능하면 유선 LAN 또는 안정된 Wi-Fi를 이용해주세요.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* #stats */}
            <section id="stats" className="mb-16">
              <h2 className="text-2xl font-bold mb-6">4. 통계 분석 활용</h2>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div>
                    <h3 className="text-lg font-bold mb-4">
                      4.1. 시간대별 방문자 통계
                    </h3>
                    <img
                      src="/가이드2.png"
                      alt="시간대별 방문자 통계"
                      className="w-full rounded-lg"
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold mb-4">4.2. 현황 통계</h3>
                    <div className="space-y-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span>오늘 방문자</span>
                          <span className="text-green-500">+15.2%</span>
                        </div>
                        <div className="text-2xl font-bold mt-2">2,458명</div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span>평균 체류 시간</span>
                          <span className="text-red-500">-5.3%</span>
                        </div>
                        <div className="text-2xl font-bold mt-2">32분</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-4">4.3. 최근 인사이트</h3>
                  <div className="space-y-4">
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">
                          점심 시간대 피크 분석
                        </span>
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                          완료
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        12:00~13:00 방문자 증가율 분석 완료
                      </p>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">매장 체류 시간 분석</span>
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                          진행중
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        주간 체류 시간 패턴 분석중
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* #faq */}
            <section id="faq" className="mb-16">
              <h2 className="text-2xl font-bold mb-6">5. FAQ &amp; 주의사항</h2>
              <div className="bg-white rounded-lg shadow">
                <div className="divide-y divide-gray-200">
                  <details className="p-6 group">
                    <summary className="flex justify-between items-center cursor-pointer">
                      <span className="font-medium">포트포워딩이 뭔가요?</span>
                      <span className="transition group-open:rotate-180">
                        <i className="fas fa-chevron-down"></i>
                      </span>
                    </summary>
                    <p className="mt-4 text-gray-600">
                      외부에서 내부망 CCTV에 접속하려면 공유기
                      설정(포트포워딩)이 필요합니다.
                    </p>
                  </details>
                  <details className="p-6 group">
                    <summary className="flex justify-between items-center cursor-pointer">
                      <span className="font-medium">
                        RTSP 프로토콜이 안 보입니다.
                      </span>
                      <span className="transition group-open:rotate-180">
                        <i className="fas fa-chevron-down"></i>
                      </span>
                    </summary>
                    <p className="mt-4 text-gray-600">
                      웹 브라우저는 RTSP를 직접 재생하지 못하는 경우가 많아,
                      중간에 WebRTC/HLS 변환이 필요할 수 있습니다.
                    </p>
                  </details>
                  <details className="p-6 group">
                    <summary className="flex justify-between items-center cursor-pointer">
                      <span className="font-medium">
                        QR 코드 스캔이 실패합니다.
                      </span>
                      <span className="transition group-open:rotate-180">
                        <i className="fas fa-chevron-down"></i>
                      </span>
                    </summary>
                    <p className="mt-4 text-gray-600">
                      모바일 앱 권한(카메라) 또는 인터넷 연결 상태를
                      확인해주세요.
                    </p>
                  </details>
                  <details className="p-6 group">
                    <summary className="flex justify-between items-center cursor-pointer">
                      <span className="font-medium">개인정보 유의</span>
                      <span className="transition group-open:rotate-180">
                        <i className="fas fa-chevron-down"></i>
                      </span>
                    </summary>
                    <p className="mt-4 text-gray-600">
                      CCTV·블랙박스 영상을 녹화·분석 시 개인정보 보호법 등 관련
                      법령을 준수해야 합니다.
                    </p>
                  </details>
                </div>
              </div>
            </section>

            {/* #extra */}
            <section id="extra" className="mb-16">
              <h2 className="text-2xl font-bold mb-6">6. 부가 안내</h2>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="flex items-start space-x-4">
                    <div className="bg-gray-100 p-3 rounded-full">
                      <i className="fas fa-cog text-black text-xl"></i>
                    </div>
                    <div>
                      <h3 className="font-bold mb-2">설정</h3>
                      <p className="text-gray-600">
                        사용자 프로필·비밀번호 변경, 알림 설정 등을 관리할 수
                        있습니다.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="bg-gray-100 p-3 rounded-full">
                      <i className="fas fa-bell text-black text-xl"></i>
                    </div>
                    <div>
                      <h3 className="font-bold mb-2">알림</h3>
                      <p className="text-gray-600">
                        카메라 오프라인, 특정 이벤트 감지 시 알림을 받을 수
                        있습니다.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div class="mt-8 text-center">
                <button
                  class="!rounded-button bg-red-50 text-red-600 px-6 py-3 hover:bg-red-100 transition-colors"
                  onClick={handleWithdrawClick}
                >
                  {" "}
                  회원 탈퇴
                </button>
              </div>

              {showWithdrawModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg p-8 max-w-sm w-full mx-4 flex flex-col items-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
                      <i className="fas fa-trash-alt text-red-600 text-2xl"></i>
                    </div>

                    <h2 className="text-xl font-semibold text-gray-900 mb-2 text-center">
                      정말 탈퇴하시겠어요?
                    </h2>

                    <p className="text-gray-500 text-center mb-8">
                      계정은 삭제되어 복구되지 않습니다.
                    </p>

                    <div className="flex flex-col w-full gap-3">
                      <button
                        className="w-full py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
                        onClick={() => {
                          alert("회원 탈퇴가 완료되었습니다.");
                          handleCloseModal();
                        }}
                      >
                        탈퇴
                      </button>
                      <button
                        className="w-full py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                        onClick={handleCloseModal}
                      >
                        취소
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>
        </main>
      </div>

      {/* 개인정보법 안내 오버레이 (있다면) */}
      {/* {privacyOpen && (
        <PrivacyOverlay open={privacyOpen} onClose={closePrivacy} />
      )} */}
    </div>
  );
}

export default Guide;
