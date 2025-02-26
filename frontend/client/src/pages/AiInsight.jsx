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
  // 프로필 상태 추가
  const [profile, setProfile] = useState(null);
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
  const [reportTitle, setReportTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [summaries, setSummaries] = useState([]);
  const [reportId, setReportId] = useState(null);
  const [cctvList, setCctvList] = useState([]);

  // 하드코딩된 MEMBER_ID 제거

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

  // 프로필과 보고서 정보 가져오기
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          console.error('No access token found');
          window.location.href = '/login';
          return;
        }

        const response = await fetch('https://msteam5iseeu.ddns.net/api/members/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });

        if (response.status === 401) {
          // 토큰이 만료된 경우 리프레시 토큰으로 새로운 액세스 토큰 발급
          const refreshToken = localStorage.getItem('refresh_token'); // refreshToken -> refresh_token
          if (refreshToken) {
            const refreshResponse = await fetch('https://msteam5iseeu.ddns.net/api/refresh', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ refresh_token: refreshToken })
            });

            if (refreshResponse.ok) {
              const { access_token } = await refreshResponse.json();
              localStorage.setItem('access_token', access_token); // accessToken -> access_token
              // 새 토큰으로 다시 프로필 요청
              const retryResponse = await fetch('https://msteam5iseeu.ddns.net/api/members/me', {
                headers: {
                  'Authorization': `Bearer ${access_token}`,
                  'Accept': 'application/json'
                }
              });
              if (retryResponse.ok) {
                const data = await retryResponse.json();
                setProfile(data);
                return;
              }
            }
          }
          // 리프레시 실패 시 로그인 페이지로 리다이렉트
          window.location.href = '/login';
          return;
        }

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        setProfile(data);

        // 프로필 정보를 받아온 후 바로 보고서 정보도 가져오기
        const result_report = await callRerportSummary(data.id);
        const extractedSummaries = result_report.map(report => ({
          id: report.id,
          report_title: report.report_title || "제목 없음",
          created_at: report.created_at,
          keywords: report.summary?.keywords || [],
          textSummary: report.summary?.summary || ""
        }));
        setSummaries(extractedSummaries);
      } catch (err) {
        console.error("Failed to get profile or reports:", err);
        window.location.href = '/login';
      }
    };
    fetchData();
  }, []); // 컴포넌트 마운트 시 한 번만 실행

  // CCTV 목록 가져오기 - profile.id 사용
  useEffect(() => {
    if (!profile) return; // profile 없으면 실행하지 않음

    async function fetchUserCCTVs() {
      try {
        const res = await fetch(`https://msteam5iseeu.ddns.net/api/cctvs/${profile.id}`);
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
    fetchUserCCTVs();
  }, [profile]);

  // 보고서 가져오기 - profile.id 사용
  const handleReport = async () => {
    if (!profile) return;

    try {
      const result_report = await callRerportSummary(profile.id);
      console.log("파일 가져오기:", result_report);
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

  // AI 보고서 생성 버튼 - profile.id 사용
  const handleGenerateReport = async () => {
    if (!profile) return;

    const requestData = {
      pdf_file: "report_generation.pdf",
      member_id: profile.id,
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

  // profile이 없을 때 보여줄 로딩 상태
  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-300 dark:border-gray-600 border-t-black dark:border-t-white rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">사용자 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 font-sans min-h-screen flex flex-col">
      {/* 상단 Nav */}
      <ResponsiveNav onOpenPrivacy={handleOpenPrivacy} />

      {/* 메인 컨테이너 */}
      <div className="flex-1 pt-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {/* 상단 타이틀 */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            전략/인사이트
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            아래 정보를 입력하여 AI 기반 보고서를 생성해 보세요.
          </p>
        </div>

        {/* 입력 섹션 */}
        <div className="bg-white dark:bg-gray-800 dark:text-gray-200 shadow rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          {/* (1행) 보고서 제목 / 분석할 CCTV */}
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                보고서 제목
              </label>
              <input
                type="text"
                placeholder="예) 1주차 보고서"
                className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:border-custom focus:ring-custom"
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                분석할 CCTV
              </label>
              <select
                className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:border-custom focus:ring-custom"
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

          {/* (2행) 창업 여부 / 업종 입력 */}
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                창업 여부
              </label>
              <select
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:border-custom focus:ring-custom"
                value={isNewBusiness}
                onChange={handleIsNewBusinessChange}
              >
                <option value="">선택</option>
                <option value="네">네</option>
                <option value="아니오">아니오</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                업종 입력
              </label>
              <input
                type="text"
                placeholder="예) 카페, 레스토랑 등"
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:border-custom focus:ring-custom"
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                disabled={isNewBusiness !== "네"}
              />
            </div>
          </div>

          {/* (3행) 날짜 */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                데이터 시작 일자
              </label>
              <input
                type="date"
                className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:border-custom focus:ring-custom"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                데이터 종료 일자
              </label>
              <input
                type="date"
                className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:border-custom focus:ring-custom"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* 보고서 생성하기 버튼 + 로딩 모달 */}
          <div className="relative">
            {isLoading && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white dark:bg-gray-800 dark:text-gray-200 p-6 rounded-lg shadow-lg text-center border border-gray-200 dark:border-gray-700">
                  <p className="text-lg font-semibold">AI 보고서를 생성 중...</p>
                  <div className="mt-4">
                    <div className="w-16 h-16 border-4 border-gray-300 dark:border-gray-600 border-t-black dark:border-t-white rounded-full animate-spin mx-auto"></div>
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

        {/* 보고서 목록 */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          {summaries.length > 0 ? (
            summaries.map((summaryData) => {
              const createdAtKST = formatKST(summaryData.created_at);
              return (
                <div
                  key={summaryData.id}
                  className="bg-white dark:bg-gray-800 dark:text-gray-200 shadow-lg rounded-2xl p-6 border border-gray-200 dark:border-gray-700 transition-transform hover:scale-[1.02]"
                >
                  <h3 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100 mb-3 flex items-center">
                    📑 {summaryData.report_title || "제목 없음"}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                    생성 시간: <span className="font-medium">{createdAtKST}</span>
                  </p>

                  {/* 주요 키워드 */}
                  <div className="mb-3">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      🏷️ 주요 키워드:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {summaryData.keywords && summaryData.keywords.length > 0 ? (
                        summaryData.keywords.map((keyword, index) => (
                          <span
                            key={index}
                            className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-100 text-xs font-semibold px-3 py-1 rounded-full"
                          >
                            {keyword}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500 text-sm">
                          키워드 없음
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 간단 요약 */}
                  <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg shadow-sm">
                    <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">
                      <strong>📄 간단 요약:</strong>{" "}
                      {summaryData.textSummary || "요약 없음"}
                    </p>
                  </div>

                  {/* 다운로드 버튼 */}
                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      className="px-4 py-2 border border-gray-800 dark:border-gray-300 rounded-md text-gray-800 dark:text-gray-200 hover:bg-gray-800 hover:text-white dark:hover:bg-gray-300 dark:hover:text-black transition-all"
                      onClick={() => handleDownload(summaryData.id)}
                    >
                      📥 상세 내용 다운로드
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400">
              📌 보고서 정보가 없습니다.
            </p>
          )}
        </div>
      </div>

      {/* 개인정보법 안내 오버레이 */}
      {privacyOpen && (
        <PrivacyOverlay open={privacyOpen} onClose={handleClosePrivacy} />
      )}
    </div>
  );
}

export default AiInsight;