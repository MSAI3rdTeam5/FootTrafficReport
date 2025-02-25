import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { callReportGeneration } from "../utils/api";
import { callReportDownload } from "../utils/api";
import { callRerportSummary } from "../utils/api";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
dayjs.extend(utc);
dayjs.extend(timezone);

import PrivacyOverlay from "./PrivacyOverlay";
import ResponsiveNav from "../components/ResponsiveNav";

 
function AiInsight() {
  // [상태] 창업 여부, 업종, 날짜, CCTV 선택
  const [selectedCCTV, setSelectedCCTV] = useState("");
  const [isNewBusiness, setIsNewBusiness] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reportTitle, setReportTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [summaries, setSummaries] = useState([]);
  const [reportId, setReportId] = useState(null);
  const [cctvList, setCctvList] = useState([]);
 
  // 예시 CCTV 목록 (monitor.jsx 등에서 실제 등록 정보를 가져올 수도 있음)
  // const cctvOptions = [
  //   { id: 1, name: "정문 CCTV" },
  //   { id: 2, name: "로비 CCTV" },
  //   { id: 3, name: "주차장 CCTV" },
  // ];
 
  // UTC 시간을 KST로 변환하는 함수
  const formatKST = (utcTime) => {
    return dayjs.utc(utcTime).tz("Asia/Seoul").format("YYYY-MM-DD HH:mm:ss");
  };
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
      const result_report = await callRerportSummary(1); // memberid 넣어야됨됨
      console.log("파일 가져오기:",result_report);
      const extractedSummaries = result_report.map(report => ({
        id: report.id,
        report_title: report.report_title || "제목 없음", // 제목이 없을 경우 기본값 설정
        created_at: report.created_at,
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
      pdf_file : "report_generation.pdf",
      member_id: 1,            // memberid => member_id로 변경
      cctv_id: parseInt(selectedCCTV),
      report_title: reportTitle,
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
 
  const MEMBER_ID = 1; //여기도 강제로 집어넣은것 이 밑에 함수의 member_id도 수정필요
 
  //CCTV가져오는 함수
  useEffect(() => {
    async function fetchUserCCTVs() {
      try {
        const res = await fetch(`https://msteam5iseeu.ddns.net/api/cctvs/${MEMBER_ID}`);
        if (!res.ok) {
          throw new Error(`CCTV List Fetch Error: ${res.status}`);
        }
        const data = await res.json();
        setCctvList(data);
        if (data.length > 0) {
          setSelectedCCTV(data[0].id); // 첫 번째 CCTV 기본 선택
        }
      } catch (err) {
        console.error(err);
        setCctvList([]);
      }
    }
    fetchUserCCTVs(MEMBER_ID);
  }, [MEMBER_ID]);
 
  return (
    <div className="bg-gray-50 font-sans min-h-screen">
      {/* 상단 Nav */}
      <nav className="bg-white shadow">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* 왼쪽: "I See U" + 탭 */}
            <div className="flex items-center space-x-8">
              <span className="text-xl font-bold text-black">I See U</span>
              <div className="flex space-x-3">
                {/* 내 모니터링 탭 */}
                <Link
                  to="/monitor"
                  className="inline-flex items-center px-1 pt-1 nav-link text-gray-500 hover:text-black"
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: "0.375rem",
                    transition: "all 0.3s ease",
                    backgroundColor: "#f3f4f6",
                    color: "#000000",
                  }}
                >
                  내 모니터링
                </Link>
                {/* 통계 분석 탭 */}
                <Link
                  to="/dashboard"
                  className="inline-flex items-center px-1 pt-1 nav-link text-gray-500 hover:text-black"
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: "0.375rem",
                    transition: "all 0.3s ease",
                    backgroundColor: "#f3f4f6",
                    color: "#000000",
                  }}
                >
                  통계 분석
                </Link>
                {/* AI 인사이트 탭 (현재 페이지) */}
                <Link
                  to="/ai-insight"
                  className="inline-flex items-center px-1 pt-1 nav-link bg-black text-white font-medium"
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: "0.375rem",
                    transition: "all 0.3s ease",
                  }}
                >
                  AI 인사이트
                </Link>
 
                {/* 챗봇 */}
                <Link
                  to="/chatbot"
                  className="inline-flex items-center px-1 pt-1 nav-link text-gray-500 hover:text-black"
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: "0.375rem",
                    transition: "all 0.3s ease",
                    backgroundColor: "#f3f4f6",
                    color: "#000000",
                  }}
                >
                  챗봇
                </Link>
 
                {/* 사용 방법 */}
                <Link
                  to="/guide"
                  className="inline-flex items-center px-1 pt-1 nav-link text-gray-500 hover:text-black"
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: "0.375rem",
                    transition: "all 0.3s ease",
                    backgroundColor: "#f3f4f6",
                    color: "#000000",
                  }}
                >
                  사용 방법
                </Link>
                {/* 개인정보법 안내 */}
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
 
            {/* 오른쪽: 알림/설정/사용자 프로필 */}
            <div className="flex items-center">
              <button className="p-2 rounded-full hover:bg-gray-100 relative">
                <i className="fas fa-bell text-gray-600"></i>
                <span className="absolute top-1 right-1 bg-red-500 rounded-full w-2 h-2"></span>
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
                  김관리자
                </span>
              </div>
            </div>
          </div>
        </div>
      </nav>
 
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
                  보고서 제목
                </label>
                <input
                  type="text"
                  placeholder="예) 1주차 보고서"
                  className="block w-full rounded-md border-gray-300 focus:border-custom focus:ring-custom"
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
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
                {cctvList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.cctv_name}
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
          <div className="relative">
            {/* 🌀 로딩 화면 */}
            {isLoading && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-lg shadow-lg text-center">
                  <p className="text-lg font-semibold">AI 보고서를 생성 중...</p>
                  <div className="mt-4">
                    <div className="w-16 h-16 border-4 border-gray-300 border-t-black rounded-full animate-spin mx-auto"></div>
                  </div>
                </div>
              </div>
            )}
 
          <button
            type="button"
            onClick={handleGenerateReport}
            className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-black/90 focus:outline-none ${
              isLoading ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={isLoading}
          >
            AI 보고서 생성하기
          </button>
        </div>
      </div>      
       
                     
           
        {/* 보고서 생성하기 */}    
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
  {summaries.length > 0 ? (
    summaries.map((summaryData) => {
      // ✅ KST 변환
      const createdAtKST = formatKST(summaryData.created_at);
 
      return (
        <div
          key={summaryData.id}
          className="bg-white shadow-lg rounded-2xl p-6 transition-transform hover:scale-[1.02]"
        >
          {/* 보고서 제목 */}
          <h3 className="text-2xl font-extrabold text-gray-900 mb-3 flex items-center">
            📑 {summaryData.report_title ? summaryData.report_title : "제목 없음"}
          </h3>
          {/* 생성 날짜 */}
          <p className="text-xs text-gray-500 mb-4">
            생성 시간: <span className="font-medium">{createdAtKST}</span>
          </p>
 
          {/* 주요 키워드 */}
          <div className="mb-3">
            <p className="text-sm font-semibold text-gray-700 mb-1">🏷️ 주요 키워드:</p>
            <div className="flex flex-wrap gap-2">
              {summaryData.keywords.length > 0 ? (
                summaryData.keywords.map((keyword, index) => (
                  <span
                    key={index}
                    className="bg-blue-100 text-blue-600 text-xs font-semibold px-3 py-1 rounded-full"
                  >
                    {keyword}
                  </span>
                ))
              ) : (
                <span className="text-gray-400 text-sm">키워드 없음</span>
              )}
            </div>
          </div>
 
          {/* 간단 요약 */}
          <div className="bg-gray-100 p-4 rounded-lg shadow-sm">
            <p className="text-sm text-gray-700 leading-relaxed">
              <strong>📄 간단 요약:</strong> {summaryData.textSummary || "요약 없음"}
            </p>
          </div>
 
          {/* 다운로드 버튼 */}
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              className="px-4 py-2 border border-gray-800 rounded-md text-gray-800 hover:bg-gray-800 hover:text-white transition-all"
              onClick={() => handleDownload(summaryData.id)}
            >
              📥 상세 내용 다운로드
            </button>
          </div>
        </div>
      );
    })
  ) : (
    <p className="text-center text-gray-500">📌 보고서 정보가 없습니다.</p>
  )}
  </div>
 
 
 
 
 
 
      </div>
    </div>
  );
}
 
export default AiInsight;