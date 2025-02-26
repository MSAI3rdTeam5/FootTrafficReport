// GuidePage.jsx
import React, { useState } from "react";
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
              </div>
            </div>
          </div>
        </div>

        {/* 대화 시작하기 영역 */}
        <div className="bg-white dark:bg-gray-800 dark:text-gray-200 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
            대화 시작하기
          </h3>
          <div className="flex justify-center">
            <Link to="/chatbotpage">
              <button className="bg-custom dark:bg-black hover:bg-custom/90 text-white px-8 py-3 rounded-lg flex items-center gap-2">
                <i className="fas fa-plus-circle"></i>새 대화 시작하기
              </button>
            </Link>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>
            추가 도움이 필요하시다면{" "}
            <Link to="/guide" className="text-custom hover:underline">
              사용방법
            </Link>
            을 확인해주세요.
          </p>
        </div>
      </main>

      {/* 개인정보법 안내 오버레이 */}
      {privacyOpen && (
        <PrivacyOverlay open={privacyOpen} onClose={handleClosePrivacy} />
      )}
    </div>
  );
};

<<<<<<< HEAD
export default GuidePage;
=======
export default GuidePage;
>>>>>>> hotfix
