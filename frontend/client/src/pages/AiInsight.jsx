import React, { useState } from "react";
import { Link } from "react-router-dom";
import PrivacyOverlay from "./PrivacyOverlay";
import ResponsiveNav from "../components/ResponsiveNav";


function AiInsight() {
  // [상태] 창업 여부, 업종, 날짜, CCTV 선택
  const [isNewBusiness, setIsNewBusiness] = useState(""); // ""이면 아직 미선택
  const [businessType, setBusinessType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedCCTV, setSelectedCCTV] = useState("");

  // 개인정보 오버레이
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const handleOpenPrivacy = () => setPrivacyOpen(true);
  const handleClosePrivacy = () => setPrivacyOpen(false);
  

  // 예시 CCTV 목록 (monitor.jsx 등에서 실제 등록 정보를 가져올 수도 있음)
  const cctvOptions = [
    { id: 1, name: "정문 CCTV" },
    { id: 2, name: "로비 CCTV" },
    { id: 3, name: "주차장 CCTV" },
  ];

  // 창업 여부 선택 시 처리
  const handleIsNewBusinessChange = (e) => {
    const value = e.target.value;
    setIsNewBusiness(value);
    if (value !== "네") {
      // "아니오"이거나 ""(미선택)이면 업종 입력 초기화
      setBusinessType("");
    }
  };

  // AI 보고서 생성 버튼
  const handleGenerateReport = () => {
    // 실제 보고서 생성 로직 (fetch / API 등)
    alert("AI 보고서를 생성합니다. (예시)");
  };

  return (
    <div className="bg-gray-50 font-sans min-h-screen">
      {/* 상단 Nav */}
      <ResponsiveNav onOpenPrivacy={handleOpenPrivacy} />

      {/* 메인 레이아웃 */}
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
        {/* 상단 타이틀 */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">전략/인사이트</h1>
          <p className="mt-1 text-sm text-gray-500">
            아래 정보를 입력하여 AI 기반 보고서를 생성해 보세요.
          </p>
        </div>

        {/* 입력 섹션 */}
        <div className="bg-white shadow rounded-lg p-6">
          {/* 1행: 매장 기본 정보 / 분석할 CCTV */}
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            {/* 매장 기본 정보 */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                매장 기본 정보
              </label>
              <input
                type="text"
                placeholder="예) 매장 이름 또는 요약 정보 입력"
                className="block w-full rounded-md border-gray-300 focus:border-custom focus:ring-custom"
              />
            </div>
            {/* 분석할 CCTV */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                분석할 CCTV
              </label>
              <select
                className="block w-full rounded-md border-gray-300 focus:border-custom focus:ring-custom"
                value={selectedCCTV}
                onChange={(e) => setSelectedCCTV(e.target.value)}
              >
                <option value="">CCTV를 선택하세요</option>
                {cctvOptions.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 2행: 창업 여부 / 업종 입력 */}
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            {/* 창업 여부 */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700">
                창업 여부
              </label>
              <select
                className="mt-1 block w-full rounded-md border-gray-300 focus:border-custom focus:ring-custom"
                value={isNewBusiness}
                onChange={handleIsNewBusinessChange}
              >
                <option value="">선택</option>
                <option value="네">네</option>
                <option value="아니오">아니오</option>
              </select>
            </div>

            {/* 업종 입력 (창업 여부가 "네"일 때만 활성) */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700">
                업종 입력
              </label>
              <input
                type="text"
                placeholder="예) 카페, 레스토랑 등"
                className="mt-1 block w-full rounded-md border-gray-300 focus:border-custom focus:ring-custom"
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                disabled={isNewBusiness !== "네"}
              />
            </div>
          </div>

          {/* 3행: 데이터 시작 일자 / 데이터 종료 일자 */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            {/* 시작 일자 */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                데이터 시작 일자
              </label>
              <input
                type="date"
                className="block w-full rounded-md border-gray-300 focus:border-custom focus:ring-custom"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            {/* 종료 일자 */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                데이터 종료 일자
              </label>
              <input
                type="date"
                className="block w-full rounded-md border-gray-300 focus:border-custom focus:ring-custom"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* AI 보고서 생성하기 버튼 */}
          <button
            type="button"
            onClick={handleGenerateReport}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-black/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
          >
            AI 보고서 생성하기
          </button>
        </div>

        {/* 보고서 영역 */}
        <div className="mt-12 bg-white shadow rounded-lg">
          <div className="px-6 py-5 border-b border-gray-200">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              AI 보고서
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              생성된 보고서 내용이 표시됩니다.
            </p>
          </div>
          <div className="px-6 py-5">
            {/* 보고서 제목 */}
            <div className="mb-4">
              <h4 className="text-base font-semibold text-gray-900">
                예시 보고서 제목
              </h4>
            </div>

            {/* 주요 키워드 + 요약 */}
            <div className="mb-4">
              <p className="text-sm text-gray-700">
                <strong>주요 키워드:</strong> #혼잡도 #매출예측 #직장인유동인구
              </p>
              <p className="mt-2 text-sm text-gray-600">
                <strong>간단 요약:</strong> 이번 주말 저녁 시간대에 20대~30대
                방문자 증가가 예상되며, 매출 상승 기회가 높습니다.
              </p>
            </div>

            {/* 보고서 결과 내용(임시) */}
            <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700 leading-relaxed">
              <p>
                • 예상 방문자 수: 약 1,500명
                <br />
                • 평균 체류 시간: 40분
                <br />
                • 예상 매출: 3,000,000원
                <br />• 프로모션 제안: 20대 직장인을 위한 SNS 이벤트
              </p>
            </div>

            {/* 다운로드 버튼 */}
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-black rounded-md text-black hover:bg-black/10 transition-colors"
              >
                상세 내용 다운로드
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 하단 우측 챗봇 버튼 (기존 유지) */}
      <div className="fixed bottom-6 right-6">
        <button
          type="button"
          className="rounded-full bg-black p-4 text-white shadow-lg hover:bg-black/90"
        >
          <i className="fas fa-robot text-xl"></i>
        </button>
      </div>
    </div>
  );
}

export default AiInsight;
