import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";

function Dashboard() {
  const location = useLocation();

  // 탭 활성 로직
  const isMonitorActive = location.pathname === "/monitor";
  const isDashboardActive = location.pathname === "/dashboard";
  const isAiInsightActive = location.pathname === "/ai-insight";
  const isGuideActive = location.pathname === "/guide";

  // 상단 CCTV 선택 & 기간 선택
  const [selectedCCTV, setSelectedCCTV] = useState("CCTV 1");
  const [selectedPeriod, setSelectedPeriod] = useState("오늘");

  // 버튼 목록(예시)
  const cctvList = ["CCTV 1", "CCTV 2", "CCTV 3"];
  const periodList = ["오늘", "어제", "1주일", "1달"];

  // 차트 전환(시간대별, 성별 비율, etc.)
  const chartModes = ["time", "gender"];
  const [chartIndex, setChartIndex] = useState(0);
  const currentChart = chartModes[chartIndex];

  const handlePrevChart = () => {
    setChartIndex((prev) => (prev - 1 + chartModes.length) % chartModes.length);
  };

  const handleNextChart = () => {
    setChartIndex((prev) => (prev + 1) % chartModes.length);
  };

  return (
    <div className="bg-gray-50">
      {/* 상단 Nav */}
      <nav className="bg-white shadow">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* 왼쪽 탭 */}
            <div className="flex items-center space-x-8">
              <span className="text-xl font-bold text-black">I See U</span>
              <div className="flex space-x-3">
                {/* 내 모니터링 */}
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

                {/* 통계 분석 (현재 페이지) */}
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

            {/* 오른쪽 알림/설정/사용자 */}
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
                  김관리자
                </span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* 메인 레이아웃 */}
      <div className="flex bg-gray-50" style={{ minHeight: "calc(100vh - 4rem)" }}>
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-6 py-8">
            <h1 className="text-2xl font-semibold text-gray-900 mb-6">통계 분석</h1>

            {/* 상단 CCTV 선택 버튼들 */}
            <div className="flex items-center space-x-4 mb-6">
              {cctvList.map((cctv) => (
                <button
                  key={cctv}
                  onClick={() => setSelectedCCTV(cctv)}
                  className={`px-4 py-2 rounded-md transition-colors ${
                    selectedCCTV === cctv
                      ? "bg-black text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {cctv}
                </button>
              ))}
            </div>

            {/* 기간 선택 버튼들 */}
            <div className="flex items-center space-x-4 mb-8">
              {periodList.map((period) => (
                <button
                  key={period}
                  onClick={() => setSelectedPeriod(period)}
                  className={`px-4 py-2 rounded-md transition-colors ${
                    selectedPeriod === period
                      ? "bg-black text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>

            {/* 하단 2-Column 레이아웃: 좌측(현황 통계 표), 우측(차트) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 왼쪽: 현황 통계 (표) */}
              <div className="bg-white shadow rounded-lg overflow-hidden p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  현황 통계
                </h2>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        구분
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        {selectedPeriod}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-base font-medium text-gray-800">
                        총 방문자 수
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-base text-gray-800">
                        {/* 예시 데이터 */}
                        {selectedPeriod === "오늘" ? "1,234명" : "데이터 예시"}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-base font-medium text-gray-800">
                        평균 체류 시간
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-base text-gray-800">
                        32분
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-base font-medium text-gray-800">
                        피크 시간대
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-base text-gray-800">
                        12:00-13:00
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-base font-medium text-gray-800">
                        주요 소지품
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-base text-gray-800">
                        가방(45%), 핸드폰(38%)
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* 오른쪽: 차트 영역 */}
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {currentChart === "time" ? "시간대별 방문자 통계" : "성별 비율"}
                  </h2>
                  {/* 화살표 아이콘 */}
                  <div className="space-x-3">
                    <button
                      className="p-2 rounded-full hover:bg-gray-100 border border-gray-200"
                      onClick={handlePrevChart}
                    >
                      <i className="fas fa-chevron-left text-gray-500"></i>
                    </button>
                    <button
                      className="p-2 rounded-full hover:bg-gray-100 border border-gray-200"
                      onClick={handleNextChart}
                    >
                      <i className="fas fa-chevron-right text-gray-500"></i>
                    </button>
                  </div>
                </div>
                <div className="mt-4 flex justify-center">
                  {/* 예시로 chartType 별로 다른 이미지/그래프를 표시 */}
                  {currentChart === "time" ? (
                    <img
                      src="/통계2.png"
                      alt="시간대별 방문자 통계"
                      className="w-full h-[360px] object-contain border border-gray-200"
                    />
                  ) : (
                    <img
                      src="/통계_gender.png"
                      alt="성별 비율 통계 (예시)"
                      className="w-full h-[360px] object-contain border border-gray-200"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* (현황 통계 및 최근 인사이트 제거) */}
          </div>
        </main>
      </div>
    </div>
  );
}

export default Dashboard;
