// client/src/pages/Dashboard.jsx

import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import * as echarts from "echarts";
import PrivacyOverlay from "./PrivacyOverlay";
import ResponsiveNav from "../components/ResponsiveNav";

// (1) 회원 ID를 하드코딩(또는 로그인 세션에서 가져옴)
const MEMBER_ID = 1;

function Dashboard() {
  const location = useLocation();


  // 개인정보 오버레이
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const handleOpenPrivacy = () => setPrivacyOpen(true);
  const handleClosePrivacy = () => setPrivacyOpen(false);

  // ------------------------------
  // (2) CCTV 목록 State
  // ------------------------------
  const [cctvList, setCctvList] = useState([]);
  const [selectedCCTV, setSelectedCCTV] = useState(null); // 숫자 or null

  // ------------------------------
  // (3) 기간 선택
  // ------------------------------
  const periodList = ["오늘", "어제", "1주일", "1달"];
  const [selectedPeriod, setSelectedPeriod] = useState("오늘");

  // -----------------------------------------------
  // 차트 모드 (시간대별/성별)
  // -----------------------------------------------
  const chartModes = ["time", "gender"];
  const [chartIndex, setChartIndex] = useState(0);
  const currentChart = chartModes[chartIndex];

  const handlePrevChart = () => {
    setChartIndex((prev) => (prev - 1 + chartModes.length) % chartModes.length);
  };
  const handleNextChart = () => {
    setChartIndex((prev) => (prev + 1) % chartModes.length);
  };

  // -----------------------------------------------
  // 현황 통계
  // -----------------------------------------------
  const [stats, setStats] = useState({
    totalVisitors: 0,
    peakTime: "00:00-00:00",
    mainAgeRange: "N/A",
    mainGender: "N/A",
  });

  // ------------------------------
  // (A) CCTV 목록 가져오기
  // ------------------------------
  useEffect(() => {
    async function fetchUserCCTVs(memberId) {
      try {
        const res = await fetch(`/api/cctvs/${memberId}`);
        if (!res.ok) {
          throw new Error(`CCTV List Fetch Error: ${res.status}`);
        }
        const data = await res.json();
        return data; // [{id, member_id, cctv_name, api_url, location}, ...]
      } catch (err) {
        console.error(err);
        return [];
      }
    }

    fetchUserCCTVs(MEMBER_ID).then((data) => {
      console.log("cctv_info 목록:", data);
      setCctvList(data);
      if (data.length > 0) {
        // 첫번째 CCTV를 기본 선택
        setSelectedCCTV(data[0].id);
      }
    });
  }, []);

  // ---------------------------
  // (A) API 호출 함수 (예시)
  // ---------------------------
  async function fetchPersonCounts(cctvId) {
    try {
      // 백엔드 라우트: /person_count/{cctv_id}
      // ex) /person_count/1
      const response = await fetch(`api/person_count/${cctvId}`);
  
      // 404 처리 (no records found)
      if (response.status === 404) {
        console.warn(`No records found for cctv_id=${cctvId}`);
        return []; // 빈 배열 반환 (에러 대신 빈 데이터로 처리)
      }
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
      console.log("PersonCount 목록:", data);
      return data;
    } catch (error) {
      console.error("에러 발생:", error);
      // null 또는 빈 배열 등, 호출부에서 구분 가능
      return null;
    }
  }

  // ---------------------------
  // (B) 날짜 필터 함수들
  // ---------------------------
  const filterTodayData = (data) => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    return data.filter((row) => {
      const rowDate = new Date(row.timestamp);
      return rowDate >= startOfToday && rowDate <= endOfToday;
    });
  };

  const filterYesterdayData = (data) => {
    const now = new Date();
    const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0);
    const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59);

    return data.filter((row) => {
      const rowDate = new Date(row.timestamp);
      return rowDate >= startOfYesterday && rowDate <= endOfYesterday;
    });
  };

  const filterWeekdayData = (data) => {
    const now = new Date();
    const startOfWeekday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7, 0, 0, 0);
    const endOfWeekday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    return data.filter((row) => {
      const rowDate = new Date(row.timestamp);
      return rowDate >= startOfWeekday && rowDate <= endOfWeekday;
    });
  };

  const filterMonthData = (data) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate(), 0, 0, 0);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    return data.filter((row) => {
      const rowDate = new Date(row.timestamp);
      return rowDate >= startOfMonth && rowDate <= endOfMonth;
    });
  };

  // ---------------------------
  // (C) 통계 계산
  // ---------------------------
  const calculateStats = (data) => {
    let total = 0;
    let peakCount = 0;
    let peakHour = "";
    let sumMale = 0;
    let sumFemale = 0;
    let sumYoung = 0; // 20~59
    let sumMiddle = 0; // 60 이상
    let sumMinor = 0; // 0~19

    data.forEach((row) => {
      const hourTotal =
        row.male_young_adult +
        row.female_young_adult +
        row.male_middle_aged +
        row.female_middle_aged +
        row.male_minor +
        row.female_minor;

      total += hourTotal;

      // 피크 시간대
      if (hourTotal > peakCount) {
        peakCount = hourTotal;
        const dateObj = new Date(row.timestamp);
        const h = dateObj.getHours();
        const hStr = String(h).padStart(2, "0");
        const nextHStr = String((h + 1) % 24).padStart(2, "0");
        peakHour = `${hStr}:00 - ${nextHStr}:00`;
      }

      // 성별
      sumMale += row.male_young_adult + row.male_middle_aged + row.male_minor;
      sumFemale += row.female_young_adult + row.female_middle_aged + row.female_minor;

      // 연령대
      sumYoung += row.male_young_adult + row.female_young_adult;
      sumMiddle += row.male_middle_aged + row.female_middle_aged;
      sumMinor += row.male_minor + row.female_minor;
    });

    if (total === 0) {
      return {
        totalVisitors: 0,
        peakTime: "00:00-00:00",
        mainAgeRange: "N/A",
        mainGender: "N/A",
      };
    }

    const mainGender = sumMale > sumFemale ? "남성" : "여성";
    let mainAgeRange = "N/A";
    if (sumYoung >= sumMiddle && sumYoung >= sumMinor) {
      mainAgeRange = "성인층 (20세~59세)";
    } else if (sumMiddle >= sumYoung && sumMiddle >= sumMinor) {
      mainAgeRange = "노인층 (60세 이상)";
    } else {
      mainAgeRange = "청소년층(19세 이하)";
    }

    return {
      totalVisitors: total,
      peakTime: peakHour,
      mainAgeRange,
      mainGender,
    };
  };

  // -----------------------------------------------
  // (D) Echarts 설정
  // -----------------------------------------------
  const chartRef = useRef(null);
  const [chartInstance, setChartInstance] = useState(null);

  // 차트 초기화
  useEffect(() => {
    if (chartRef.current) {
      const instance = echarts.init(chartRef.current);
      setChartInstance(instance);
    }
  }, []);


  // -----------------------------------------------
  // (E) 데이터 로드 + 차트 업데이트
  // -----------------------------------------------
  useEffect(() => {
    if (selectedCCTV == null || !chartInstance) return; // 아직 CCTV 선택 안됨 or 차트 인스턴스 미생성

    const loadData = async () => {
      
      // 1) person_count/{selectedCCTV} 호출
      const data = await fetchPersonCounts(selectedCCTV);

      // 2) 기간 필터
      let filtered = data;
      if (selectedPeriod === "오늘") {
        filtered = filterTodayData(filtered);
      } else if (selectedPeriod === "어제") {
        filtered = filterYesterdayData(filtered);
      } else if (selectedPeriod === "1주일") {
        filtered = filterWeekdayData(filtered);
      } else if (selectedPeriod === "1달") {
        filtered = filterMonthData(filtered);
      }

      // 3) 통계 계산
      const result = calculateStats(filtered);
      setStats(result);

      // 차트 업데이트
      if (!chartInstance) return;

      // 4) 차트 모드(시간대별, 성별)
      if (currentChart === "time") {
        updateLineChart(filtered);
      } else {
        updatePieChart(filtered);
      }
    };
    loadData();
    // dependencies
  }, [selectedCCTV, selectedPeriod, currentChart, chartInstance]);

  // ---------------------------------------------------
  // (H) CCTV 버튼 렌더링
  // ---------------------------------------------------
  const cctvButtons = cctvList.map((c) => {
    const isActive = selectedCCTV === c.id;
    return (
      <button
        key={c.id}
        onClick={() => setSelectedCCTV(c.id)}
        className={`px-4 py-2 rounded-md transition-colors ${
          isActive
            ? "bg-black text-white"
            : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
        }`}
      >
        {c.cctv_name}
      </button>
    );
  });

  // ---------------------------------------------------
  // (I) 기간 버튼 렌더링
  // ---------------------------------------------------
  const periodButtons = periodList.map((p) => {
    const isActive = selectedPeriod === p;
    return (
      <button
        key={p}
        onClick={() => setSelectedPeriod(p)}
        className={`px-4 py-2 rounded-md transition-colors ${
          isActive
            ? "bg-black text-white"
            : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
        }`}
      >
        {p}
      </button>
    );
  });


  // -----------------------------------------------
  // 라인 차트(시간대별)
  // -----------------------------------------------
  const updateLineChart = (filteredData) => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const totalArr = new Array(24).fill(0);
    const teenArr = new Array(24).fill(0);
    const adultArr = new Array(24).fill(0);
    const seniorArr = new Array(24).fill(0);

    filteredData.forEach((row) => {
      const dateObj = new Date(row.timestamp);
      const h = dateObj.getHours();
      const minor = row.male_minor + row.female_minor;
      const young = row.male_young_adult + row.female_young_adult;
      const middle = row.male_middle_aged + row.female_middle_aged;
      const sum = minor + young + middle;

      if (h >= 0 && h < 24) {
        totalArr[h] += sum;
        teenArr[h] += minor;
        adultArr[h] += young;
        seniorArr[h] += middle;
      }
    });

    const xAxisData = hours.map((h) => `${String(h).padStart(2, "0")}시`);
    const option = {
      tooltip: {
        trigger: "axis",
        formatter: (params) => {
          let res = params[0].axisValue + "<br/>";
          params.forEach((p) => {
            res += `${p.seriesName}: ${p.value}명<br/>`;
          });
          return res;
        },
      },
      legend: {
        show: true,
        top: 20,
        left: "center",
        data: ["총 방문자", "청소년층", "성인층", "노년층"],
      },
      xAxis: {
        type: "category",
        data: xAxisData,
      },
      yAxis: {
        type: "value",
      },
      series: [
        {
          name: "총 방문자",
          type: "line",
          data: totalArr,
          color: "#5470c6",
          smooth: true,
        },
        {
          name: "청소년층",
          type: "line",
          data: teenArr,
          color: "#ee6666",
          smooth: true,
        },
        {
          name: "성인층",
          type: "line",
          data: adultArr,
          color: "#73c0de",
          smooth: true,
        },
        {
          name: "노년층",
          type: "line",
          data: seniorArr,
          color: "#3ba272",
          smooth: true,
        },
      ],
    };
    chartInstance.setOption(option);
  };

  // -----------------------------------------------
  // 파이 차트(성별 비율)
  // -----------------------------------------------
  const updatePieChart = (filteredData) => {
    chartInstance.clear();

    let sumMale = 0;
    let sumFemale = 0;
    filteredData.forEach((row) => {
      sumMale += row.male_young_adult + row.male_middle_aged + row.male_minor;
      sumFemale += row.female_young_adult + row.female_middle_aged + row.female_minor;
    });

    const total = sumMale + sumFemale;
    const malePercent = total === 0 ? 0 : ((sumMale / total) * 100).toFixed(1);
    const femalePercent = total === 0 ? 0 : ((sumFemale / total) * 100).toFixed(1);

    const option = {
      animation: false,
      tooltip: { trigger: "item" },
      legend: {
        orient: "vertical",
        top: 20,
        left: 20,
        data: [`남성 ${malePercent}%`, `여성 ${femalePercent}%`],
      },
      series: [
        {
          name: "성별 비율",
          type: "pie",
          radius: "50%",
          data: [
            { value: sumMale, name: `남성 ${malePercent}%` },
            { value: sumFemale, name: `여성 ${femalePercent}%` },
          ],
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: "rgba(0, 0, 0, 0.5)",
            },
          },
        },
      ],
    };
    chartInstance.setOption(option);
  };

  return (
    /* 메인 컨테이너: 다크 모드 배경 + 최소 높이 */
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 공통 Nav 바, onOpenPrivacy 함수 전달 */}
      <ResponsiveNav onOpenPrivacy={handleOpenPrivacy} />

      {/* 메인 레이아웃 (화면 아래쪽) */}
      <div className="flex bg-gray-50 dark:bg-gray-900 pt-16" style={{ minHeight: "calc(100vh - 4rem)" }}>
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-6 py-8">
            {/* 제목 */}
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-200 mb-6">
              통계 분석
            </h1>

            {/* CCTV 선택 버튼들 */}
            <div className="flex flex-wrap gap-4 mb-6">{cctvButtons}</div>

            {/* 기간 선택 버튼들 */}
            <div className="flex flex-wrap gap-4 mb-8">{periodButtons}</div>

            {/* 하단 2-Column: 좌(현황통계), 우(차트) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 왼쪽: 현황 통계 */}
              <div className="bg-white dark:bg-gray-800 dark:text-gray-200 shadow rounded-lg p-6">
                {/* 데이터 없을 때 경고 */}
                {stats.totalVisitors === 0 && (
                  <div className="bg-yellow-50 dark:bg-yellow-900 border-l-4 border-yellow-400 p-4 mb-6">
                    <div className="flex items-center">
                      <i className="fas fa-exclamation-triangle text-yellow-400 mr-3"></i>
                      <p className="text-sm text-yellow-700 dark:text-yellow-200">
                        데이터를 불러올 수 없습니다. CCTV 연결 상태를 확인해주세요.
                      </p>
                    </div>
                    <p className="text-xs text-yellow-600 dark:text-yellow-300 mt-2">
                      심야 시간대(00시~01시)는 데이터가 제한될 수 있습니다.
                    </p>
                  </div>
                )}

                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-200 mb-4">
                  현황 통계
                </h2>
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                        구분
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                        {selectedPeriod}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    <tr>
                      <td className="px-6 py-4 text-base font-medium text-gray-800 dark:text-gray-100">
                        총 방문자 수
                      </td>
                      <td className="px-6 py-4 text-base text-gray-800 dark:text-gray-100">
                        {stats.totalVisitors}명
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 text-base font-medium text-gray-800 dark:text-gray-100">
                        피크 시간대
                      </td>
                      <td className="px-6 py-4 text-base text-gray-800 dark:text-gray-100">
                        {stats.peakTime}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 text-base font-medium text-gray-800 dark:text-gray-100">
                        주요 연령대
                      </td>
                      <td className="px-6 py-4 text-base text-gray-800 dark:text-gray-100">
                        {stats.mainAgeRange}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 text-base font-medium text-gray-800 dark:text-gray-100">
                        주요 성별
                      </td>
                      <td className="px-6 py-4 text-base text-gray-800 dark:text-gray-100">
                        {stats.mainGender}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* 오른쪽: 차트 영역 */}
              <div className="bg-white dark:bg-gray-800 dark:text-gray-200 shadow rounded-lg p-6 relative">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-200">
                    {currentChart === "time"
                      ? "시간대별 방문자 통계"
                      : "성별 비율"}
                  </h2>
                  <div className="space-x-3">
                    <button
                      className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600"
                      onClick={handlePrevChart}
                    >
                      <i className="fas fa-chevron-left text-gray-500 dark:text-gray-300"></i>
                    </button>
                    <button
                      className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600"
                      onClick={handleNextChart}
                    >
                      <i className="fas fa-chevron-right text-gray-500 dark:text-gray-300"></i>
                    </button>
                  </div>
                </div>

                {/* Echarts 컨테이너 */}
                <div
                  ref={chartRef}
                  style={{ width: "100%", height: "360px" }}
                  className="dark:bg-gray-800"
                />

                {/* 방문자=0 → 차트 덮는 오버레이 */}
                {stats.totalVisitors === 0 && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-white dark:bg-gray-800">
                    <i className="fas fa-chart-pie text-gray-300 text-5xl mb-4"></i>
                    <p className="text-gray-500 dark:text-gray-400 text-base">
                      데이터가 없습니다
                    </p>
                    <p className="text-gray-400 dark:text-gray-500 text-xs mt-2">
                      심야 시간대(00시~01시)는 데이터가 제한될 수 있습니다.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* 개인정보법 안내 오버레이 */}
      {privacyOpen && (
        <PrivacyOverlay open={privacyOpen} onClose={handleClosePrivacy} />
      )}
    </div>
  );
}

export default Dashboard;