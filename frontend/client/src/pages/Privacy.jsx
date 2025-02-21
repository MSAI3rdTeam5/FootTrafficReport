import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";

function Privacy() {
  const location = useLocation();

  // 탭 활성화 로직
  const isMonitorActive = location.pathname === "/monitor";
  const isDashboardActive = location.pathname === "/dashboard";
  const isAiInsightActive = location.pathname === "/ai-insight";
  const isChatbotActive = location.pathname === "/chatbot";
  const isGuideActive = location.pathname === "/guide";
  const isPrivacyActive = location.pathname === "/privacy";

  return (
    <div className="bg-gray-50 min-h-screen font-['Noto_Sans_KR']">
      <nav className="bg-white shadow">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-8">
              <span className="text-xl font-bold text-black">I See U</span>
              <div className="flex space-x-3">
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
                <Link
                  to="/chatbot"
                  className={`inline-flex items-center px-1 pt-1 nav-link ${
                    isChatbotActive
                      ? "bg-black text-white font-medium"
                      : "text-gray-500 hover:text-black"
                  }`}
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: "0.375rem",
                    transition: "all 0.3s ease",
                    backgroundColor: isChatbotActive ? "#000000" : "#f3f4f6",
                    color: isChatbotActive ? "#ffffff" : "#000000",
                  }}
                >
                  챗봇
                </Link>
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
                <Link
                  to="/privacy"
                  className={`inline-flex items-center px-1 pt-1 nav-link ${
                    isPrivacyActive
                      ? "bg-black text-white font-medium"
                      : "text-gray-500 hover:text-white"
                  }`}
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: "0.375rem",
                    transition: "all 0.3s ease",
                    backgroundColor: isPrivacyActive ? "#000000" : "#f3f4f6",
                    color: isPrivacyActive ? "#ffffff" : "#000000",
                  }}
                >
                  개인정보법 안내
                </Link>
              </div>
            </div>

            {/* 오른쪽 알림/설정/프로필 */}
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

      {/* 개인정보보호법 안내 내용 */}
      <main className="max-w-8xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white rounded-lg shadow px-5 py-6 sm:px-6 max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center border-b pb-4">
              CCTV 영상 개인정보법 안내
            </h2>

            <section class="bg-white rounded-lg shadow-sm p-6 mb-8">
              {" "}
              <h2 class="text-xl font-semibold text-gray-900 mb-4">
                <i class="fas fa-video mr-2 text-custom"></i>CCTV 운영 목적
              </h2>
              <p class="text-gray-600 mb-4">
                통계 분석: 매장 방문자 수, 체류 시간, 시간대별 혼잡도 등을
                파악하여 운영 효율을 높이기 위해 영상을 사용합니다.
              </p>{" "}
              <p class="text-gray-600">
                안전 및 보안: 고객과 직원 안전, 도난·사고 예방을 위한 협력 보안
                목적입니다.
              </p>{" "}
              <p className="mt-4 text-gray-600 mb-4">
                * 본 앱은 개인 식별이 아닌, <strong>통계·운영 효율성</strong>{" "}
                향상을 위한 데이터를 중점으로 처리합니다.
              </p>
              {/* 관련 법률 조항 */}
              <div className="mt-4 bg-gray-100 text-gray-600 text-xs p-4 rounded-lg">
                <p>
                  ※ 관련 법률 조항
                  <br />
                  - 개인정보 보호법 제25조 제1항: CCTV 설치·운영 목적을 명시하고
                  있습니다.
                  <br />
                  - 개인정보 보호법 시행령 제3조: 통계작성, 학술연구 등의 목적을
                  위한 개인정보 처리 근거를 제공합니다.
                  <br />
                </p>
              </div>
            </section>

            <section class="bg-white rounded-lg shadow-sm p-6 mb-8">
              <h2 class="text-xl font-semibold text-gray-900 mb-4">
                {" "}
                <i class="fas fa-map-marker-alt mr-2 text-custom"></i>설치 장소
                및 고지
              </h2>
              <p class="text-gray-600 mb-4">
                설치 장소: 매장 출입구, 내부 주요 구역, 계산대 주변 등
              </p>{" "}
              <p class="text-gray-600 mb-4">
                안내문: 매장 내 출입구 등에 CCTV 설치 안내문 비치
              </p>{" "}
              <p className="mt-4 text-gray-600 mb-4">
                고객 동의: 매장 이용시, CCTV 촬영 및 통계 분석에 대한 안내
              </p>
              <div className="mt-4 bg-gray-100 text-gray-600 text-xs p-4 rounded-lg">
                <p>
                  ※ 관련 법률 조항
                  <br />
                  - 개인정보 보호법 제25조 제4항: CCTV 설치 사실 및 설치 목적
                  등을 정보주체가 쉽게 알아볼 수 있도록 안내판 설치 등 필요한
                  조치를 하여야 합니다.
                  <br />
                </p>
              </div>{" "}
            </section>

            <section class="bg-white rounded-lg shadow-sm p-6 mb-8">
              <h2 class="text-xl font-semibold text-gray-900 mb-4">
                {" "}
                <i class="fas fa-database mr-2 text-custom"></i>데이터 비식별화
                및 활용
              </h2>
              <ul class="space-y-3 text-gray-600">
                {" "}
                <li>
                  <i class="fas fa-check text-custom mr-2"></i>비식별 처리: 얼굴
                  신체 정보를 저장하지 않고, 통계 자료만 추출
                </li>{" "}
                <li>
                  <i class="fas fa-check text-custom mr-2"></i>AI 분석: 인원
                  흐름, 통행도, 방문 패턴 등 산출
                </li>{" "}
                <li>
                  <i class="fas fa-check text-custom mr-2"></i>재식별 금지: 분석
                  후 원영상은 즉시 마스킹·삭제 처리
                </li>{" "}
              </ul>
              <div className="mt-4 bg-gray-100 text-gray-600 text-xs p-4 rounded-lg">
                <p>
                  ※ 관련 법률 조항
                  <br />
                  - 개인정보 보호법 제25조 제5항 및 동법 시행령 제25조:
                  개인영상정보 제공 시 식별 가능한 개인의 얼굴 등을 알아볼 수
                  없도록 처리해야 합니다.
                  <br />
                </p>
              </div>{" "}
            </section>

            <section class="bg-white rounded-lg shadow-sm p-6 mb-8">
              <h2 class="text-xl font-semibold text-gray-900 mb-4">
                {" "}
                <i class="fas fa-clock mr-2 text-custom"></i>보관 기간 및 폐기
              </h2>
              <div class="border-l-4 border-custom pl-4 space-y-4">
                {" "}
                <p class="text-gray-600">
                  보관 기간: 원영상은 최대 30일 등 최소 기간만 보관 후 자동 삭제
                </p>{" "}
                <p class="text-gray-600">
                  폐기 절차: 목적 달성 후 영상·데이터 영구 삭제
                </p>
                <p class="text-gray-600">
                  예외 사항: 법적 분쟁 수사 협조 필요 시 별도 보안 보관
                </p>
              </div>
              <div className="mt-4 bg-gray-100 text-gray-600 text-xs p-4 rounded-lg">
                <p>
                  ※ 관련 법률 조항
                  <br />
                  - 개인정보 보호법 제21조: 개인정보의 파기에 관한 사항을
                  규정하고 있습니다.
                  <br />
                  - 개인정보 보호법 시행령 제41조: 영상정보처리기기 운영자는
                  수집한 개인영상정보를 보관 기간이 만료한 때에는 지체 없이
                  파기하여야 합니다.
                  <br />
                </p>
              </div>{" "}
            </section>

            <section class="bg-white rounded-lg shadow-sm p-6 mb-8">
              {" "}
              <h2 class="text-xl font-semibold text-gray-900 mb-4">
                <i class="fas fa-user-shield mr-2 text-custom"></i>접근 권한 및
                관리자
              </h2>
              <p class="text-gray-600 mb-4">
                보안 담당자 또는 지정된 관리자만 영상 및 통계 데이터를 열람할 수
                있으며, 접근 로그를 기록 관리합니다.
              </p>{" "}
              <p class="text-gray-600">문의: security@mycompany.co.kr</p>
              <div className="mt-4 bg-gray-100 text-gray-600 text-xs p-4 rounded-lg">
                <p>
                  ※ 관련 법률 조항
                  <br />
                  - 개인정보 보호법 제29조: 개인정보처리자는 개인정보에 대한
                  접근 권한을 제한하는 등 안전성 확보에 필요한 조치를 하여야
                  합니다.
                  <br />
                </p>
              </div>{" "}
            </section>

            <section class="bg-white rounded-lg shadow-sm p-6 mb-8">
              {" "}
              <h2 class="text-xl font-semibold text-gray-900 mb-4">
                <i class="fas fa-gavel mr-2 text-custom"></i>법령 준수
              </h2>
              <p class="text-gray-600">
                개인정보 보호법 등 관계 법령 및 회사 내부 정책을 준수합니다.
                필요시 GDPR, 통신비밀 보호법 등 해외 법령도 고려됩니다.
              </p>{" "}
              <div className="mt-4 bg-gray-100 text-gray-600 text-xs p-4 rounded-lg">
                <p>
                  ※ 관련 법률 조항
                  <br />
                  - 개인정보 보호법 제3조: 개인정보 보호 원칙을 규정하고
                  있습니다.
                  <br />
                  - 정보통신망 이용촉진 및 정보보호 등에 관한 법률:
                  정보통신서비스 제공자의 개인정보 보호 의무를 규정하고
                  있습니다.
                  <br />
                </p>
              </div>{" "}
            </section>

            <section class="bg-white rounded-lg shadow-sm p-6 mb-8">
              <h2 class="text-xl font-semibold text-gray-900 mb-4">
                {" "}
                <i class="fas fa-user-lock mr-2 text-custom"></i>이용자의 권리
              </h2>
              <p class="text-gray-600">
                본인이 식별되는 영상에 대해 열람 삭제를 요청할 수 있으며, 절차는
                관련 법령에 따릅니다.
              </p>
              <div className="mt-4 bg-gray-100 text-gray-600 text-xs p-4 rounded-lg">
                <p>
                  ※ 관련 법률 조항
                  <br />
                  - 개인정보 보호법 제35조, 제36조, 제37조: 정보주체의 열람권,
                  정정·삭제 요구권, 처리정지 요구권을 규정하고 있습니다.
                  <br />
                </p>
              </div>{" "}
            </section>
          </div>
        </div>
      </main>

      {/* 푸터 */}
      <footer class="bg-white border-t mt-12">
        <div class="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {" "}
          <div class="text-center text-gray-500 text-sm">
            <p class="mb-2">
              개인정보 관련 문의: privacy@mycompany.co.kr / 000-0000-0000
            </p>{" "}
            <p>CCTV 운영 보안 문의: security@mycompany.co.kr / 000-0000-0000</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Privacy;
