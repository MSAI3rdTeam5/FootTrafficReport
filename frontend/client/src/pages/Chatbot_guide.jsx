// GuidePage.jsx
import React, { useState } from "react";
<<<<<<< HEAD
import { Link } from "react-router-dom";

import PrivacyOverlay from "./PrivacyOverlay";
import ResponsiveNav from "../components/ResponsiveNav";

const GuidePage = () => {

  const [privacyOpen, setPrivacyOpen] = useState(false);
        // (2) Nav에서 이 함수를 호출 -> 오버레이 열림
  const handleOpenPrivacy = () => setPrivacyOpen(true);
        // (3) 오버레이 닫기
  const handleClosePrivacy = () => setPrivacyOpen(false);


  return (
    <div className="bg-gray-50 dark:bg-gray-900 font-[Noto_Sans_KR] min-h-screen flex flex-col">
      {/* 상단 네비 바 */}
      <ResponsiveNav onOpenPrivacy={handleOpenPrivacy} />

      {/* 메인 콘텐츠 */}
      <main className="flex-1 pt-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 안내사항 섹션 */}
        <div className="bg-custom text-white rounded-lg p-6 mb-8 dark:bg-black/90">
          <h2 className="text-xl font-bold mb-2">📢 안내사항</h2>
          <p className="text-white/90 text-sm">
            정확한 맞춤 추천을 위해 아래 <strong>필수 정보</strong>를 포함하여 질문해 주세요.
          </p>
        </div>

        {/* 2-Column 그리드 (필수 입력 정보 / 질문 예시) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* 필수 입력 정보 */}
          <div className="bg-white dark:bg-gray-800 dark:text-gray-200 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
              필수 입력 정보
            </h3>
            <ul className="space-y-3 text-sm">
=======
import { Link, useLocation } from "react-router-dom";

const GuidePage = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(true);

  // 상단 탭 활성 로직
  const isMonitorActive = location.pathname === "/monitor";
  const isDashboardActive = location.pathname === "/dashboard";
  const isAiInsightActive = location.pathname === "/ai-insight";
  const isChatbotActive = location.pathname === "/chatbot";
  const isGuideActive = location.pathname === "/guide";

  return (
    <div className="bg-gray-50 font-[Noto_Sans_KR]">
      {/* 상단 Nav */}
      <nav className="bg-white shadow">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* 왼쪽: 로고 + 탭 */}
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
                    backgroundColor: isMonitorActive ? "#000000" : "#f3f4f6",
                    color: isMonitorActive ? "#ffffff" : "#000000",
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
                    backgroundColor: isDashboardActive ? "#000000" : "#f3f4f6",
                    color: isDashboardActive ? "#ffffff" : "#000000",
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
                    backgroundColor: isAiInsightActive ? "#000000" : "#f3f4f6",
                    color: isAiInsightActive ? "#ffffff" : "#000000",
                  }}
                >
                  AI 인사이트
                </Link>
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
                <button
                  type="button"
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

            {/* 오른쪽: 알림/설정/사용자 */}
            <div className="flex items-center relative">
              <button className="p-2 rounded-full hover:bg-gray-100 relative">
                <i className="fas fa-bell text-gray-600"></i>
                <span className="absolute top-1 right-1 bg-red-500 rounded-full w-2 h-2" />
              </button>
              <button className="ml-3 p-2 rounded-full hover:bg-gray-100">
                <i className="fas fa-cog text-gray-600"></i>
              </button>
              {!isAuthenticated ? (
                <div className="ml-4">
                  <Link
                    to="/login"
                    className="inline-flex items-center px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600"
                  >
                    로그인
                  </Link>
                </div>
              ) : (
                <div className="ml-4 flex items-center relative">
                  <button
                    className="flex items-center p-2 rounded-full hover:bg-gray-100"
                    onClick={() => setIsOpen(!isOpen)}
                  >
                    <img
                      className="h-8 w-8 rounded-full"
                      src="/기본프로필.png"
                      alt="사용자 프로필"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">
                      김관리자
                    </span>
                  </button>
                  {isOpen && (
                    <div
                      className="absolute right-0 top-full mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5"
                      role="menu"
                    >
                      <a
                        href="#"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        role="menuitem"
                      >
                        프로필 설정
                      </a>
                      <a
                        href="#"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        role="menuitem"
                      >
                        계정 관리
                      </a>
                      <a
                        href="#"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        role="menuitem"
                      >
                        알림 설정
                      </a>
                      <div className="border-t border-gray-100 my-1"></div>
                      <a
                        href="#"
                        className="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                        role="menuitem"
                      >
                        로그아웃
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* 메인 콘텐츠 */}
      <main className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-custom text-white rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-2">📢 안내사항</h2>
          <p className="text-white/90">
            정확한 맞춤 추천을 위해 아래 필수 정보를 포함하여 질문해 주세요.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* 필수 입력 정보 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">필수 입력 정보</h3>
            <ul className="space-y-3">
>>>>>>> hotfix/urgent-bug
              <li className="flex items-center">
                <i className="fas fa-check-circle text-custom mr-2"></i>
                <span>거주 지역 (시/도, 시/군/구)</span>
              </li>
              <li className="flex items-center">
                <i className="fas fa-check-circle text-custom mr-2"></i>
                <span>신분 (예: 예비창업자, 소상공인 등)</span>
              </li>
              <li className="flex items-center">
                <i className="fas fa-check-circle text-custom mr-2"></i>
                <span>관심 분야 또는 업종</span>
              </li>
            </ul>
          </div>

          {/* 질문 예시 */}
<<<<<<< HEAD
          <div className="bg-white dark:bg-gray-800 dark:text-gray-200 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
              질문 예시
            </h3>
            <div className="space-y-3 text-sm">
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-200">
                "경기도 구리시에 살고있는 예비창업자입니다. 식당 창업을 준비중인데
                지원받을 수 있는 정책을 알려주세요."
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-200">
                "서울시 강남구의 1인 사업자입니다. IT 서비스 관련 지원 정책이 궁금합니다."
=======
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">질문 예시</h3>
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 rounded-lg">
                "경기도 구리시에 살고있는 예비창업자입니다. 식당 창업을
                준비중인데 지원받을 수 있는 정책을 알려주세요."
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                "서울시 강남구의 1인 사업자입니다. IT 서비스 관련 지원 정책이
                궁금합니다."
>>>>>>> hotfix/urgent-bug
              </div>
            </div>
          </div>
        </div>

        {/* 대화 시작하기 영역 */}
<<<<<<< HEAD
        <div className="bg-white dark:bg-gray-800 dark:text-gray-200 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
            대화 시작하기
          </h3>
          <div className="flex justify-center">
            <Link to="/chatbotpage">
              <button className="bg-custom dark:bg-black hover:bg-custom/90 text-white px-8 py-3 rounded-lg flex items-center gap-2">
=======
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">대화 시작하기</h3>
          <div className="flex justify-center">
            <Link to="/chatbotpage">
              <button className="bg-custom hover:bg-custom/90 text-white px-8 py-3 rounded-lg flex items-center gap-2">
>>>>>>> hotfix/urgent-bug
                <i className="fas fa-plus-circle"></i>새 대화 시작하기
              </button>
            </Link>
          </div>
        </div>

<<<<<<< HEAD
        <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
=======
        <div className="mt-8 text-center text-sm text-gray-500">
>>>>>>> hotfix/urgent-bug
          <p>
            추가 도움이 필요하시다면{" "}
            <Link to="/guide" className="text-custom hover:underline">
              사용방법
            </Link>
            을 확인해주세요.
          </p>
        </div>
      </main>
<<<<<<< HEAD

      {/* 개인정보법 안내 오버레이 */}
      {privacyOpen && (
        <PrivacyOverlay open={privacyOpen} onClose={handleClosePrivacy} />
      )}
=======
>>>>>>> hotfix/urgent-bug
    </div>
  );
};

<<<<<<< HEAD
export default GuidePage;
=======
export default GuidePage;
>>>>>>> hotfix/urgent-bug
