// GuidePage.jsx
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";

import PrivacyOverlay from "./PrivacyOverlay";
import ResponsiveNav from "../components/ResponsiveNav";

const GuidePage = () => {

  const [privacyOpen, setPrivacyOpen] = useState(false);
        // (2) Nav에서 이 함수를 호출 -> 오버레이 열림
  const handleOpenPrivacy = () => setPrivacyOpen(true);
        // (3) 오버레이 닫기
  const handleClosePrivacy = () => setPrivacyOpen(false);


  return (
    <div className="bg-gray-50 font-[Noto_Sans_KR]">
      {/* 공통 네비 바 */}
      <ResponsiveNav onOpenPrivacy={handleOpenPrivacy} />

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
              </div>
            </div>
          </div>
        </div>

        {/* 대화 시작하기 영역 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">대화 시작하기</h3>
          <div className="flex justify-center">
            <Link to="/chatbotpage">
              <button className="bg-custom hover:bg-custom/90 text-white px-8 py-3 rounded-lg flex items-center gap-2">
                <i className="fas fa-plus-circle"></i>새 대화 시작하기
              </button>
            </Link>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
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
        {privacyOpen && <PrivacyOverlay open={privacyOpen} onClose={handleClosePrivacy} />}
    </div>
  );
};

export default GuidePage;