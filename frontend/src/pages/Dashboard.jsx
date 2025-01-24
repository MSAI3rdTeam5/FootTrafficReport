// src/pages/Dashboard.jsx

import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
// 만약 개인정보법 안내 오버레이를 사용한다면 import PrivacyOverlay from "./PrivacyOverlay";
// (아래 예시에서는 오버레이 코드가 있으면 함께 유지)

function Dashboard() {
  const location = useLocation();

  // 탭 활성 로직
  const isMonitorActive = location.pathname === "/monitor";
  const isDashboardActive = location.pathname === "/dashboard";
  const isAiInsightActive = location.pathname === "/ai-insight";
  const isGuideActive = location.pathname === "/guide";
  // 개인정보법 안내는 오버레이일 수도, Link일 수도 있음

  // 2×2 Grid + 이미지 + 체크박스
  const [screens, setScreens] = useState([
    { id: 1, selected: false },
    { id: 2, selected: false },
    { id: 3, selected: false },
    { id: 4, selected: false },
  ]);

  // 체크박스 토글
  const toggleScreen = (id) => {
    setScreens((prev) =>
      prev.map((scr) =>
        scr.id === id ? { ...scr, selected: !scr.selected } : scr
      )
    );
  };

  // 개인정보법 안내 오버레이 (있다면)
  // const [privacyOpen, setPrivacyOpen] = useState(false);
  // const openPrivacy = () => setPrivacyOpen(true);
  // const closePrivacy = () => setPrivacyOpen(false);

  return (
    <div className="bg-gray-50">
      {/* 상단 Nav */}
      <nav className="bg-white shadow">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* 왼쪽 탭 (I See U + 내 모니터링 / 통계 분석 / AI 인사이트 / 사용 방법 / 개인정보법 안내) */}
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

                {/* 개인정보법 안내 - 버튼 or Link (아래는 버튼 예시) */}
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
                  // onClick={openPrivacy}
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
      <div className="flex bg-gray-50" style={{ height: "calc(100vh - 4rem)" }}>
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-6 py-8">
            <h1 className="text-2xl font-semibold text-gray-900">통계 분석</h1>

            {/* (이하, 기존 Dashboard 콘텐츠: 2x2 Grid, 현황 통계, 최근 인사이트 등) */}
            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* 실시간 모니터링 섹션 */}
              <div className="bg-white shadow rounded-lg p-6 relative">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    실시간 모니터링
                  </h3>
                  <button className="rounded-button bg-black text-white px-4 py-2 flex items-center">
                    <i className="fas fa-plus mr-2"></i>
                    새 장치 연결
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {screens.map((scr) => (
                    <div
                      key={scr.id}
                      className="relative cursor-pointer"
                      onClick={() => toggleScreen(scr.id)}
                    >
                      <input
                        type="checkbox"
                        checked={scr.selected}
                        readOnly
                        className="absolute top-2 left-2 w-5 h-5 z-10 pointer-events-none"
                      />
                      <img
                        src="/통계1.png"
                        alt={`화면${scr.id}`}
                        className="w-full h-[180px] object-contain border border-gray-200"
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-3 text-sm text-gray-600">
                  선택된 화면:{" "}
                  {screens
                    .filter((s) => s.selected)
                    .map((s) => `화면${s.id}`)
                    .join(", ") || "(없음)"}
                </div>
              </div>

              {/* 시간대별 방문자 통계 */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900">
                  시간대별 방문자 통계
                </h3>
                <div className="mt-4 flex justify-center">
                  <img
                    src="/통계2.png"
                    alt="통계2"
                    className="w-full h-[360px] object-contain border border-gray-200"
                  />
                </div>
              </div>
            </div>

            {/* 현황 통계 */}
            <div className="mt-8">
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  현황 통계
                </h2>
              </div>
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-6 py-4">
                  <div className="p-6">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                            구분
                          </th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                            오늘
                          </th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                            어제
                          </th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                            지난주 평균
                          </th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                            증감률
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-base font-medium text-gray-800">
                            총 방문자 수
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-base text-gray-800">
                            1,234명
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-base text-gray-800">
                            1,156명
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-base text-gray-800">
                            1,089명
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-base text-green-600">
                            +6.7%
                          </td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-base font-medium text-gray-800">
                            피크 시간대
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-base text-gray-800">
                            12:00-13:00
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-base text-gray-800">
                            12:00-13:00
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-base text-gray-800">
                            12:00-13:00
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-base text-gray-800">
                            -
                          </td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-base font-medium text-gray-800">
                            평균 체류 시간
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-base text-gray-800">
                            32분
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-base text-gray-800">
                            35분
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-base text-gray-800">
                            33분
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-base text-red-600">
                            -8.6%
                          </td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-base font-medium text-gray-800">
                            주요 소지품
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-base text-gray-800">
                            가방(45%), 핸드폰(38%)
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-base text-gray-800">
                            가방(42%), 핸드폰(40%)
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-base text-gray-800">
                            가방(43%), 핸드폰(39%)
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-base text-gray-800">
                            -
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex space-x-4 items-center">
                      <div className="relative">
                        <input
                          type="date"
                          className="block w-40 pl-2 pr-2 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-custom focus:border-custom sm:text-sm"
                          id="start-date"
                        />
                      </div>
                      <span className="text-gray-500">~</span>
                      <div className="relative">
                        <input
                          type="date"
                          className="block w-40 pl-2 pr-2 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-custom focus:border-custom sm:text-sm"
                          id="end-date"
                        />
                      </div>
                      <button className="ml-4 px-4 py-2 bg-black text-white rounded-md hover:bg-black/90 transition-colors">
                        조회
                      </button>
                    </div>
                    <button className="px-4 py-2 text-black border border-black rounded-md hover:bg-black/10 transition-colors">
                      보고서 다운로드
                    </button>
                  </div>
                </div>
              </div>

              {/* 최근 인사이트 */}
              <div className="mt-8 bg-white shadow rounded-lg overflow-hidden">
                <div className="px-6 pt-4">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    최근 인사이트
                  </h2>
                </div>
                <div className="overflow-x-auto px-6 pb-4" id="insights-table">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                          날짜
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                          분석 유형
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                          주요 내용
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                          상태
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-base text-gray-800">
                          2024-01-15
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-base font-medium text-gray-800">
                          점심 시간대 피크 분석
                        </td>
                        <td className="px-6 py-4 text-base text-gray-800">
                          <p>• 12:00-13:00 시간대 최대 혼잡도 관찰</p>
                          <p>• 평균 대비 45% 증가한 방문객 수</p>
                          <p>• 주로 회사원 위주의 방문 패턴</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            완료
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-base text-gray-800">
                          2024-01-14
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-base font-medium text-gray-800">
                          매장 체류 시간 분석
                        </td>
                        <td className="px-6 py-4 text-base text-gray-800">
                          <p>• 평균 체류 시간 32분</p>
                          <p>• 주말 체류 시간 평일 대비 15% 증가</p>
                          <p>• 가족 단위 방문객 체류 시간 최대</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            완료
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* 개인정보법 안내 오버레이 (있다면 여기에) */}
      {/* {privacyOpen && (
        <PrivacyOverlay open={privacyOpen} onClose={closePrivacy} />
      )} */}
    </div>
  );
}

export default Dashboard;
