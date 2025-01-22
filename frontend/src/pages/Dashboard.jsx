import React, { useEffect } from "react";

// ECharts를 npm install 대신 CDN 쓰는 경우:
// window.echarts로 접근하려면 index.html에 <script src="...echarts.min.js"></script> 추가
// 아래 코멘트된 예시처럼 useEffect에서 접근해 볼 수 있습니다.
/*
useEffect(() => {
  if (window.echarts) {
    const chart = window.echarts.init(document.getElementById("statsChart"));
    // chart.setOption({...});
  }
}, []);
*/

function Dashboard() {
  return (
    <div className="bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <img
                  className="h-8 w-auto"
                  src="https://ai-public.creatie.ai/gen_page/logo_placeholder.png"
                  alt="I See U"
                />
              </div>
            </div>
            <div className="flex items-center">
              <button className="p-2 rounded-full hover:bg-gray-100 relative">
                <i className="fas fa-bell text-gray-600"></i>
                <span className="absolute top-1 right-1 bg-red-500 rounded-full w-2 h-2"></span>
              </button>
              <div className="ml-4 flex items-center">
                <img
                  className="h-8 w-8 rounded-full"
                  src="https://creatie.ai/ai/api/search-image?query=professional headshot of person..."
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
      <div className="flex h-screen bg-gray-50">
        <aside className="w-64 bg-white shadow-lg">
          <div className="h-full px-3 py-4">
            <ul className="space-y-2">
              <li>
                <a
                  href="#"
                  className="flex items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100 active"
                >
                  <i className="fas fa-chart-line w-6 h-6"></i>
                  <span className="ml-3">대시보드</span>
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="flex items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100"
                >
                  <i className="fas fa-video w-6 h-6"></i>
                  <span className="ml-3">CCTV 관리</span>
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="flex items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100"
                >
                  <i className="fas fa-history w-6 h-6"></i>
                  <span className="ml-3">작업 이력</span>
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="flex items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100"
                >
                  <i className="fas fa-cog w-6 h-6"></i>
                  <span className="ml-3">설정</span>
                </a>
              </li>
            </ul>
          </div>
        </aside>
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-6 py-8">
            <h1 className="text-2xl font-semibold text-gray-900">유동인구 분석 대시보드</h1>

            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {/* 카드 예시들 */}
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-custom/10 rounded-md p-3">
                      <i className="fas fa-tasks text-custom"></i>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          오늘의 방문자
                        </dt>
                        <dd className="text-lg font-semibold text-gray-900">1,234</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-custom/10 rounded-md p-3">
                      <i className="fas fa-check-circle text-custom"></i>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          평균 체류 시간
                        </dt>
                        <dd className="text-lg font-semibold text-gray-900">15분</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-custom/10 rounded-md p-3">
                      <i className="fas fa-users text-custom"></i>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          재방문율
                        </dt>
                        <dd className="text-lg font-semibold text-gray-900">32%</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900">
                  실시간 매장 모니터링
                </h3>
                <div className="mt-4">
                  <div className="relative rounded-lg overflow-hidden mx-auto max-w-xl">
                    <img
                      src="https://creatie.ai/ai/api/search-image?query=security camera footage..."
                      alt="CCTV 1"
                      className="w-full h-64 object-cover"
                    />
                    <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-sm">
                      카메라 #1
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900">
                  시간대별 방문자 통계
                </h3>
                {/* ECharts가 렌더링될 영역 */}
                <div id="statsChart" className="h-80"></div>
              </div>
            </div>

            <div className="mt-8">
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">최근 인사이트</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          분석 내용
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          카메라
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          상태
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          시작 시간
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          작업자
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          점심 시간대 피크 분석
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          카메라 #1
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            완료
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          2024-01-20 09:00
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          김관리자
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          매장 체류 시간 분석
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          카메라 #2
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            진행중
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          2024-01-20 10:30
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          이분석
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
    </div>
  );
}

export default Dashboard;
