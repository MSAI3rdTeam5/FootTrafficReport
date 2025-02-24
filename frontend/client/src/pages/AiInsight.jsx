import React, { useState, useEffect } from "react";
import { callReportGeneration } from "../utils/api";
import { callReportDownload } from "../utils/api";
import { callRerportSummary } from "../utils/api";

import PrivacyOverlay from "./PrivacyOverlay";
import ResponsiveNav from "../components/ResponsiveNav";
 
function AiInsight() {

  const [privacyOpen, setPrivacyOpen] = useState(false);
  // (2) Nav에서 이 함수를 호출 -> 오버레이 열림
  const handleOpenPrivacy = () => setPrivacyOpen(true);
  // (3) 오버레이 닫기
  const handleClosePrivacy = () => setPrivacyOpen(false);

  // [상태] 창업 여부, 업종, 날짜, CCTV 선택
  const [selectedCCTV, setSelectedCCTV] = useState("");
  const [isNewBusiness, setIsNewBusiness] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [storeInfo, setStoreInfo] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [summaries, setSummaries] = useState([]);
  const [reportId, setReportId] = useState(null);
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
 
    if (value === "아니오") {
      setBusinessType("예비창업자");
    } else {
      // "네"일 경우나 미선택일 때는 업종 입력을 초기화
      setBusinessType("");
    }
  };
 
  // // 보고서 가져오기
  const handleReport = async () => {
    // const reportId = result.id;  
 
    try {
      const result_report = await callRerportSummary(1);
      console.log("파일 가져오기:",result_report);
      const extractedSummaries = result_report.map(report => ({
        id: report.id,
        keywords: report.summary?.keywords || [], // keywords가 없을 경우 빈 리스트 반환
        textSummary: report.summary?.summary || "" // summary가 없을 경우 빈 문자열 반환
    }));
 
    console.log("추출된 Summary 데이터:", extractedSummaries);
 
    // 필요하면 상태로 저장
    setSummaries(extractedSummaries);
    } catch (error) {
      console.error("Error", error);
    }
  };
  const isValidDateRange = () => {
    if (!startDate || !endDate) return false;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffDays = (end - start) / (1000 * 60 * 60 * 24); // 일(day) 단위 차이 계산
    return diffDays >= 6;
  };
 
  // AI 보고서 생성 버튼
  const handleGenerateReport = async() => {
   
    const requestData = {
      pdf_file : "aaa.pdf",
      member_id: 1,            // memberid => member_id로 변경
      cctv_id: parseInt(selectedCCTV),
      report_title: "aaa",
      persona: isNewBusiness === "네" ? businessType : "예비창업자",
      start_date: startDate,
      end_date: endDate,
    };
    // ,member_id=2,cctv_id=1,report_title="generated_report",businessType, startDate, endDate
    console.log("Request Data:", requestData);
    if (!isValidDateRange()) {
      alert("⚠️ 데이터의 기간이 최소 일주일 이상이어야 합니다.");
      return;
    }
    setIsLoading(true);
    try {
      const result = await callReportGeneration(requestData);
      await handleReport();
      const parsedResult = typeof result === "string" ? JSON.parse(result) : result; // 문자열이면 JSON으로 변환
      console.log("Parsed result:", parsedResult);
 
      const id = parsedResult.id;
      setReportId(id);
     
      alert("AI 보고서가 생성되었습니다");  // result.id == report.id
    } catch (error) {
      console.error("Error generating report:", error);
      alert("보고서 생성 중 오류가 발생했습니다. 데이터의 기간이 올바른지 확인해주세요.");
    } finally {
      setIsLoading(false); // 로딩 해제
    }
  };
 
 
  // 보고서 다운로드 api
  const handleDownload = async (id) => {
    // const reportId = result.id;  // ⚡ 여기에 실제 report ID 넣기
 
    try {
      await callReportDownload(id);
      console.log(`파일 다운로드 완료: ${id}`);
    } catch (error) {
      console.error("파일 다운로드 실패:", error);
    }
  };
 
 
 
  useEffect(() => {
    handleReport();
  }, []);
 
  return (
    <div className="bg-gray-50 font-sans min-h-screen">
      {/* 공통 네비 바 */}
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
                placeholder="예) 매장명"
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
                  <option key={c.id} value={c.id}>
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
              className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white
                ${isLoading ? "bg-gray-400 cursor-not-allowed" : "bg-black hover:bg-black/90"}`}
              disabled={isLoading} // 로딩 중에는 버튼 비활성화
            >
              {isLoading ? "보고서를 생성합니다. 잠시만 기다려주세요." : "AI 보고서 생성하기"}
            </button>
        </div>
 
       
                     
           
        {/* 보고서 생성하기 */}    
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
        {summaries.length > 0 ? (
          summaries.map((summaryData) => (
            <div
              key={summaryData.id}
              className="bg-white shadow-lg rounded-xl p-6 border border-gray-200 transition-transform transform hover:scale-105 duration-300"
            >
              {/* 보고서 ID */}
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                📑 보고서 ID: {summaryData.id}
              </h3>
 
              {/* 주요 키워드 */}
              <div className="mb-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">🔍 주요 키워드:</p>
                <div className="flex flex-wrap gap-2">
                  {summaryData.keywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="bg-blue-100 text-blue-800 text-xs font-medium px-3 py-1 rounded-full"
                    >
                      #{keyword}
                    </span>
                  ))}
                </div>
              </div>
 
              {/* 간단 요약 */}
              <div className="mb-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">📝 간단 요약:</p>
                <blockquote className="border-l-4 border-blue-500 bg-gray-100 text-gray-700 italic p-3 rounded-md">
                  {summaryData.textSummary}
                </blockquote>
              </div>
 
              {/* 다운로드 버튼 */}
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  className="px-5 py-2 rounded-lg bg-black text-white hover:bg-gray-900 transition-colors"
                  onClick={() => handleDownload(summaryData.id)}
                >
                  📥 상세 내용 다운로드
                </button>
              </div>
            </div>
          ))
        ) : (
        <p className="text-center text-gray-600">📭 보고서 정보가 없습니다.</p>
      )}
    </div>
      </div>

      {/* 개인정보법 안내 오버레이 */}
      {privacyOpen && <PrivacyOverlay open={privacyOpen} onClose={handleClosePrivacy} />}
    </div>
  );
}
 
export default AiInsight;