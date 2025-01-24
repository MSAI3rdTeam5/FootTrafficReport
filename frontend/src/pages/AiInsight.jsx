import React, { useEffect } from "react";
import { Link } from "react-router-dom";

/**
 * AI 인사이트 화면 (원본 HTML → React JSX 변환 예시)
 * 상단 네비게이션 바는 Monitor/Guide/Dashboard.jsx 등 기존 탭 구조와 동일하게,
 * "I See U", "내 모니터링", "AI 인사이트", "통계 분석", "사용 방법", "개인정보법 안내",
 * 오른쪽 알림/설정/프로필 순으로 배치.
 * 
 * ECharts는 window.echarts (CDN) 기준으로 가정.
 * index.html 등에서 <script src="https://cdnjs.cloudflare.com/ajax/libs/echarts/5.5.0/echarts.min.js"></script> 
 * 가 이미 로드되어 있다고 가정합니다.
 */
function AiInsight() {
  useEffect(() => {
    // ECharts 초기화 (CDN으로 window.echarts가 존재한다고 가정)
    if (window.echarts) {
      const chartDom = document.getElementById("visitChart");
      if (chartDom) {
        const chart = window.echarts.init(chartDom);
        const option = {
          animation: false,
          title: {
            text: "시간대별 예상 방문자",
            left: "center",
          },
          tooltip: {
            trigger: "axis",
          },
          xAxis: {
            type: "category",
            data: ["10시", "12시", "14시", "16시", "18시", "20시", "22시"],
          },
          yAxis: {
            type: "value",
          },
          series: [
            {
              data: [30, 80, 60, 50, 120, 100, 40],
              type: "line",
              smooth: true,
              color: "#4F46E5",
            },
          ],
        };
        chart.setOption(option);
      }
    }
  }, []);

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
              {/* 알림 버튼 */}
              <button className="p-2 rounded-full hover:bg-gray-100 relative">
                <i className="fas fa-bell text-gray-600"></i>
                <span className="absolute top-1 right-1 bg-red-500 rounded-full w-2 h-2"></span>
              </button>
              {/* 설정 버튼 */}
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
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-[calc(100vh-4rem)]">
          {/* 좌측 사이드바 */}
          <div className="w-64 border-r border-gray-200 pt-8">
            <nav className="space-y-1">
              <a
                href="#store-info"
                className="bg-custom text-white group flex items-center px-3 py-2 text-sm font-medium rounded-md"
              >
                <i className="fas fa-store w-6"></i>
                매장정보
              </a>
              <a
                href="#business-hours"
                className="text-gray-600 hover:bg-gray-50 group flex items-center px-3 py-2 text-sm font-medium rounded-md"
              >
                <i className="fas fa-clock w-6"></i>
                영업시간
              </a>
              <a
                href="#events-weather"
                className="text-gray-600 hover:bg-gray-50 group flex items-center px-3 py-2 text-sm font-medium rounded-md"
              >
                <i className="fas fa-calendar-alt w-6"></i>
                행사/날씨
              </a>
              <a
                href="#promotion"
                className="text-gray-600 hover:bg-gray-50 group flex items-center px-3 py-2 text-sm font-medium rounded-md"
              >
                <i className="fas fa-percentage w-6"></i>
                프로모션
              </a>
            </nav>
          </div>

          {/* 우측 본문 */}
          <div className="flex-1 min-w-0 bg-white">
            <div className="p-8">
              {/* 상단 타이틀 */}
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">전략/인사이트</h1>
                <p className="mt-1 text-sm text-gray-500">
                  매장 정보를 입력하여 AI 기반 전략을 받아보세요.
                </p>
              </div>

              {/* 입력 폼 */}
              <form>
                <div className="space-y-8">
                  {/* 매장 기본 정보 */}
                  <div id="store-info">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">
                      매장 기본 정보
                    </h2>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          업종
                        </label>
                        <select className="mt-1 block w-full !rounded-button border-gray-300 focus:border-custom focus:ring-custom">
                          <option>카페</option>
                          <option>레스토랑</option>
                          <option>의류매장</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          위치
                        </label>
                        <select className="mt-1 block w-full !rounded-button border-gray-300 focus:border-custom focus:ring-custom">
                          <option>서울시 강남구</option>
                          <option>서울시 서초구</option>
                          <option>서울시 송파구</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          평수
                        </label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                          <input
                            type="number"
                            className="block w-full !rounded-button border-gray-300 focus:border-custom focus:ring-custom"
                            placeholder="평수 입력"
                          />
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">㎡</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700">
                        고객 타겟
                      </label>
                      <div className="mt-2 grid grid-cols-3 gap-3">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            className="h-4 w-4 text-custom border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700">
                            가족단위
                          </span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            className="h-4 w-4 text-custom border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700">학생</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            className="h-4 w-4 text-custom border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700">
                            직장인
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* AI 전략 생성 버튼 */}
                  <div className="pt-6">
                    <button
                      type="button"
                      className="w-full flex justify-center py-3 px-4 border border-transparent !rounded-button shadow-sm text-sm font-medium text-white bg-custom hover:bg-custom/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-custom"
                    >
                      AI 전략 생성하기
                    </button>
                  </div>
                </div>
              </form>

              {/* 인사이트 결과 */}
              <div className="mt-12">
                <div className="bg-white shadow rounded-lg">
                  <div className="px-6 py-5 border-b border-gray-200">
                    <h3 className="text-lg font-medium leading-6 text-gray-900">
                      인사이트 결과
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      마지막 업데이트: 2024.02.14 15:30
                    </p>
                  </div>
                  <div className="px-6 py-5">
                    {/* 요약 카드 */}
                    <div className="grid grid-cols-3 gap-6">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="text-sm font-medium text-gray-500">
                          예상 방문자 수
                        </div>
                        <div className="mt-1 flex items-baseline">
                          <div className="text-2xl font-semibold text-gray-900">
                            1,200명
                          </div>
                          <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                            <i className="fas fa-arrow-up"></i>
                            <span className="ml-1">10%</span>
                          </div>
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="text-sm font-medium text-gray-500">
                          평균 체류 시간
                        </div>
                        <div className="mt-1 text-2xl font-semibold text-gray-900">
                          45분
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="text-sm font-medium text-gray-500">
                          예상 매출
                        </div>
                        <div className="mt-1 text-2xl font-semibold text-gray-900">
                          ₩2,500,000
                        </div>
                      </div>
                    </div>

                    {/* 차트 */}
                    <div className="mt-6">
                      <div id="visitChart" className="h-64"></div>
                    </div>

                    {/* 추천 전략 */}
                    <div className="mt-6">
                      <h4 className="text-base font-medium text-gray-900">
                        추천 전략
                      </h4>
                      <ul className="mt-3 space-y-3">
                        <li className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex">
                            <i className="fas fa-user-plus text-custom mt-1"></i>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">
                                금요일 18~20시 스태프 추가 1명 배치 필요
                              </p>
                              <p className="mt-1 text-sm text-gray-500">
                                피크 시간대 고객 서비스 품질 향상
                              </p>
                            </div>
                          </div>
                        </li>
                        <li className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex">
                            <i className="fas fa-ticket-alt text-custom mt-1"></i>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">
                                주말 온라인 쿠폰 발행 추천
                              </p>
                              <p className="mt-1 text-sm text-gray-500">
                                MZ세대 타겟 SNS 마케팅 연계
                              </p>
                            </div>
                          </div>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 하단 우측 챗봇 버튼 */}
      <div className="fixed bottom-6 right-6">
        <button
          type="button"
          className="!rounded-full bg-custom p-4 text-white shadow-lg hover:bg-custom/90"
        >
          <i className="fas fa-robot text-xl"></i>
        </button>
      </div>
    </div>
  );
}

export default AiInsight;
