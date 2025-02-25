// src/pages/Guide.jsx
import React, { useState, useEffect, useRef } from "react";
import PrivacyOverlay from "./PrivacyOverlay";
import ResponsiveNav from "../components/ResponsiveNav";

function Guide() {
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const handleOpenPrivacy = () => setPrivacyOpen(true);
  const handleClosePrivacy = () => setPrivacyOpen(false);

  // 사이드바
  const sidebarRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      if (sidebarRef.current) {
        sidebarRef.current.style.height = `${window.innerHeight}px`;
        // 원래 로직: scrollTop > 64 ? "0" : "64px";
        sidebarRef.current.style.top = scrollTop > 64 ? "0" : "64px";
      }
    };
    const handleResize = () => {
      if (sidebarRef.current) {
        sidebarRef.current.style.height = `${window.innerHeight}px`;
      }
    };

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // 회원 탈퇴 모달
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const handleWithdrawClick = () => setShowWithdrawModal(true);
  const handleCloseModal = () => setShowWithdrawModal(false);

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen font-['Noto_Sans_KR'] flex flex-col">
      {/* 상단 Nav */}
      <ResponsiveNav onOpenPrivacy={handleOpenPrivacy} />

      {/* 메인 래퍼 (사이드바 + 컨텐츠) */}
      <div className="flex-1 flex">
        {/* 사이드바 스타일 개선 */}
        <aside
          ref={sidebarRef}
          className="
            hidden md:block
            w-72  /* 너비 증가 */
            bg-gradient-to-b from-white to-gray-50  /* 그라데이션 배경 */
            dark:from-gray-800 dark:to-gray-900
            border-r border-gray-200 dark:border-gray-700
            fixed
            h-full
            overflow-y-auto
            transition-all
            duration-300
            shadow-lg  /* 그림자 강화 */
            z-20
            backdrop-blur-sm  /* 블러 효과 */
          "
          style={{ top: "64px", height: `${window.innerHeight}px` }}
        >
          <div className="p-8"> {/* 패딩 증가 */}
            <nav>
              <h3 className="text-sm font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">
                안내서 목차
              </h3>
              <ul className="space-y-3"> {/* 간격 조정 */}
                <li>
                  <a 
                    href="#intro" 
                    className="
                      block
                      px-4
                      py-3  /* 패딩 증가 */
                      text-lg
                      font-medium
                      rounded-xl  /* 모서리 더 둥글게 */
                      transition-all
                      duration-200
                      hover:bg-gray-100
                      dark:hover:bg-gray-700
                      hover:shadow-md  /* 호버 시 그림자 */
                      hover:translate-x-1  /* 호버 시 살짝 이동 */
                      text-gray-700
                      dark:text-gray-300
                      border border-transparent
                      hover:border-gray-200
                      dark:hover:border-gray-600
                    "
                  >
                    <i className="fas fa-home mr-3 text-custom"></i>
                    앱 소개
                  </a>
                </li>
                <li>
                  <a 
                    href="#device" 
                    className="block px-4 py-3 text-lg font-medium rounded-xl transition-all duration-200
                      hover:bg-gray-100 dark:hover:bg-gray-700 hover:shadow-md hover:translate-x-1
                      text-gray-700 dark:text-gray-300 border border-transparent hover:border-gray-200 dark:hover:border-gray-600"
                  >
                    <i className="fas fa-video mr-3 text-custom"></i>
                    장치 등록 방법
                  </a>
                </li>
                <li>
                  <a 
                    href="#monitor" 
                    className="block px-4 py-3 text-lg font-medium rounded-xl transition-all duration-200
                      hover:bg-gray-100 dark:hover:bg-gray-700 hover:shadow-md hover:translate-x-1
                      text-gray-700 dark:text-gray-300 border border-transparent hover:border-gray-200 dark:hover:border-gray-600"
                  >
                    <i className="fas fa-desktop mr-3 text-custom"></i>
                    실시간 모니터링
                  </a>
                </li>
                <li>
                  <a 
                    href="#stats" 
                    className="block px-4 py-3 text-lg font-medium rounded-xl transition-all duration-200
                      hover:bg-gray-100 dark:hover:bg-gray-700 hover:shadow-md hover:translate-x-1
                      text-gray-700 dark:text-gray-300 border border-transparent hover:border-gray-200 dark:hover:border-gray-600"
                  >
                    <i className="fas fa-chart-bar mr-3 text-custom"></i>
                    통계 분석 활용
                  </a>
                </li>
                <li>
                  <a 
                    href="#ai-insight" 
                    className="block px-4 py-3 text-lg font-medium rounded-xl transition-all duration-200
                      hover:bg-gray-100 dark:hover:bg-gray-700 hover:shadow-md hover:translate-x-1
                      text-gray-700 dark:text-gray-300 border border-transparent hover:border-gray-200 dark:hover:border-gray-600"
                  >
                    <i className="fas fa-robot mr-3 text-custom"></i>
                    AI 인사이트
                  </a>
                </li>
                <li>
                  <a 
                    href="#chatbot" 
                    className="block px-4 py-3 text-lg font-medium rounded-xl transition-all duration-200
                      hover:bg-gray-100 dark:hover:bg-gray-700 hover:shadow-md hover:translate-x-1
                      text-gray-700 dark:text-gray-300 border border-transparent hover:border-gray-200 dark:hover:border-gray-600"
                  >
                    <i className="fas fa-comments mr-3 text-custom"></i>
                    정책 문답 챗봇
                  </a>
                </li>
                <li>
                  <a 
                    href="#faq" 
                    className="block px-4 py-3 text-lg font-medium rounded-xl transition-all duration-200
                      hover:bg-gray-100 dark:hover:bg-gray-700 hover:shadow-md hover:translate-x-1
                      text-gray-700 dark:text-gray-300 border border-transparent hover:border-gray-200 dark:hover:border-gray-600"
                  >
                    <i className="fas fa-question-circle mr-3 text-custom"></i>
                    FAQ & 주의사항
                  </a>
                </li>
                <li>
                  <a 
                    href="#extra" 
                    className="block px-4 py-3 text-lg font-medium rounded-xl transition-all duration-200
                      hover:bg-gray-100 dark:hover:bg-gray-700 hover:shadow-md hover:translate-x-1
                      text-gray-700 dark:text-gray-300 border border-transparent hover:border-gray-200 dark:hover:border-gray-600"
                  >
                    <i className="fas fa-info-circle mr-3 text-custom"></i>
                    부가 안내
                  </a>
                </li>
              </ul>
            </nav>
          </div>
        </aside>

        {/* 메인 컨텐츠 */}
        <main className="flex-1">
          <div className="max-w-7xl mx-auto px-6 pt-8 pb-16 md:ml-72">
            {/* #intro */}
            <section id="intro" className="mb-16">
              <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
                1. 앱 소개
              </h2>
              <div className="bg-white dark:bg-gray-800 dark:text-gray-200 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
                <p className="text-gray-700 dark:text-gray-300 mb-6">
                  I See U는 다양한 디바이스(CCTV, 블랙박스, 웹캠, 스마트폰 등)로부터
                  실시간 영상을 모니터링하고, 방문자 통계·분석 자료를 한눈에
                  확인할 수 있는 솔루션입니다.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                    <h3 className="font-bold mb-4 text-gray-900 dark:text-gray-100">
                      주요 대상
                    </h3>
                    <ul className="space-y-2 text-gray-700 dark:text-gray-200">
                      <li className="flex items-center">
                        <i className="fas fa-store text-custom mr-3"></i>매장 관리자
                      </li>
                      <li className="flex items-center">
                        <i className="fas fa-shield-alt text-custom mr-3"></i>보안 담당자
                      </li>
                      <li className="flex items-center">
                        <i className="fas fa-microscope text-custom mr-3"></i>시장 연구자
                      </li>
                    </ul>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                    <h3 className="font-bold mb-4 text-gray-900 dark:text-gray-100">
                      핵심 기능
                    </h3>
                    <ul className="space-y-2 text-gray-700 dark:text-gray-200">
                      <li className="flex items-center">
                        <i className="fas fa-video text-custom mr-3"></i>실시간 유동인구 집계
                      </li>
                      <li className="flex items-center">
                        <i className="fas fa-chart-line text-custom mr-3"></i>
                        시간대별 유동인구 통계
                      </li>
                      <li className="flex items-center">
                        <i className="fas fa-clock text-custom mr-3"></i>
                        정책 문답 챗봇 서비스
                      </li>
                      <li className="flex items-center">
                        <i className="fas fa-file-download text-custom mr-3"></i>
                        AI 리포트 생성 및및 다운로드
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* #device */}
            <section id="device" className="mb-16">
              <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
                2. 장치 등록 방법
              </h2>
              <div className="bg-white dark:bg-gray-800 dark:text-gray-200 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
                <div className="space-y-8">
                    <div>
                      <h3 className="text-lg font-bold mb-4">
                        2.1. 새 장치 연결
                      </h3>
                      <ol className="list-decimal list-inside space-y-2 ml-4">
                        <li>"새 장치 연결" 버튼을 클릭합니다.</li>
                        <li>
                          CCTV/블랙박스/웹캠/스마트폰 등 장치 유형을 선택합니다.
                        </li>
                      </ol>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold mb-4">
                        2.2. IP 기반 장치(CCTV/블랙박스)
                      </h3>
                      <ul className="space-y-2 ml-4">
                        <li>
                          IP/도메인 + 포트 + 계정/비밀번호 입력 후 등록
                          (ONVIF·RTSP 등)
                        </li>
                        <li>
                          포트포워딩, 공유기 설정 등 네트워크 환경 세팅 필요
                        </li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold mb-4">
                        2.3. QR 연동(웹캠·스마트폰 등)
                      </h3>
                      <ul className="space-y-2 ml-4">
                        <li>"QR 코드 스캔" 화면을 열고,</li>
                        <li>모바일·웹캠 카메라로 QR 코드를 촬영하면 자동 연결</li>
                        <li>
                          장치가 정상 등록되면, 실시간 모니터링 화면에 추가됨
                        </li>
                      </ul>
                    </div>
                  </div>
              </div>
            </section>

            {/* #monitor 섹션 수정 */}
            <section id="monitor" className="mb-16">
              <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
                3. 실시간 모니터링 화면 사용법
              </h2>
              <div className="bg-white dark:bg-gray-800 dark:text-gray-200 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
                <div className="space-y-8">
                  {/* 3.1 기본 화면 구성 */}
                  <div>
                    <h3 className="text-lg font-bold mb-4">3.1. 기본 화면 구성</h3>
                    <div className="mb-6">
                      <img
                        src="/monitering.png"
                        alt="모니터링 화면"
                        className="w-full rounded-lg mb-4"
                      />
                    </div>
                    <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                      <li>• 실시간 영상 스트리밍 (원본/모자이크 전환 가능)</li>
                      <li>• 화면 좌측: 실시간 영상, 녹화/스냅샷 도구</li>
                      <li>• 화면 우측: 실시간 감지 로그</li>
                    </ul>
                  </div>

                  {/* 3.2 영상 제어 */}
                  <div>
                    <h3 className="text-lg font-bold mb-4">3.2. 영상 제어 기능</h3>
                    <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                      <li>• 녹화: 현재 화면을 동영상으로 저장 (webm 형식)</li>
                      <li>• 스냅샷: 현재 화면을 이미지로 저장 (png 형식)</li>
                      <li>• 화질 설정: HD/FHD/4K 해상도 선택 가능</li>
                      <li>• 이전/다음 카메라로 전환 가능</li>
                    </ul>
                  </div>

                  {/* 3.3 실시간 로그 */}
                  <div>
                    <h3 className="text-lg font-bold mb-4">3.3. 실시간 로그 확인</h3>
                    <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                      <li>• 방문자 감지 시 자동으로 로그 생성</li>
                      <li>• 감지 시각, 성별, 연령대 정보 표시</li>
                      <li>• 감지된 이미지 클릭 시 상세 보기 가능</li>
                      <li>• 이벤트 필터링 및 새로고침 기능</li>
                    </ul>
                  </div>

                  {/* 네트워크 TIP */}
                  <div className="bg-blue-50 border-l-4 border-black p-4 mt-4">
                    <p className="text-sm">
                      <i className="fas fa-info-circle text-black mr-2"></i>TIP:
                      네트워크 상태가 불안정하면 영상이 끊길 수 있습니다.
                      가능하면 유선 LAN 또는 안정된 Wi-Fi를 이용해주세요.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* #stats 섹션 수정 */}
            <section id="stats" className="mb-16">
              <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
                4. 통계 분석 활용
              </h2>
              <div className="bg-white dark:bg-gray-800 dark:text-gray-200 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-2 gap-6 mb-8">
                    <div>
                      <h3 className="text-lg font-bold mb-4">
                        4.1. 실시간 통계 대시보드
                      </h3>
                      <ul className="space-y-3 text-gray-600 dark:text-gray-300">
                        <li>• CCTV별 방문자 수 실시간 모니터링</li>
                        <li>• 시간대별/일별/주별/월별 데이터 확인</li>
                        <li>• 연령대 및 성별 방문자 비율 분석</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold mb-4">4.2. 핵심 지표</h3>
                      <ul className="space-y-3 text-gray-600 dark:text-gray-300">
                        <li>• 총 방문자 수</li>
                        <li>• 피크 시간대 정보</li>
                        <li>• 주요 연령대 분포</li>
                        <li>• 성별 방문자 비율</li>
                      </ul>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold mb-4">4.3. 차트 분석</h3>
                    <div className="space-y-4">
                      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <h4 className="font-medium mb-2">시간대별 방문자 통계</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          • 24시간 시간대별 방문자 추이 그래프<br />
                          • 연령대별(청소년/성인/노인) 방문자 분포<br />
                          • 일일 피크타임 분석
                        </p>
                      </div>
                      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <h4 className="font-medium mb-2">성별 비율 차트</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          • 남성/여성 방문자 비율 파이차트<br />
                          • 시간대별 성별 방문 패턴 분석<br />
                          • 주 방문 성별 통계
                        </p>
                      </div>
                    </div>
                  </div>
              </div>
            </section>

            {/* AI 인사이트 섹션 추가 */}
            <section id="ai-insight" className="mb-16">
              <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
                5. AI 인사이트
              </h2>
              <div className="bg-white dark:bg-gray-800 dark:text-gray-200 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
                <div className="space-y-8">
                  <div>
                    <h3 className="text-lg font-bold mb-4">5.1. 분석 보고서 생성</h3>
                    <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                      <li>• 보고서 제목과 분석할 CCTV를 선택합니다</li>
                      <li>• 창업 여부와 업종 정보를 입력합니다</li>
                      <li>• 분석할 기간을 선택합니다 (최소 1주일 이상)</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold mb-4">5.2. AI 분석 항목</h3>
                    <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                      <li>• 유동인구 트렌드 분석</li>
                      <li>• 주요 방문 시간대 및 패턴</li>
                      <li>• 성별/연령대별 방문 특성</li>
                      <li>• 창업 적합도 분석</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold mb-4">5.3. 보고서 활용</h3>
                    <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                      <li>• 생성된 보고서는 PDF로 다운로드 가능</li>
                      <li>• 주요 키워드와 요약 정보 제공</li>
                      <li>• 데이터 기반 의사결정 지원</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* 챗봇 섹션 수정 */}
            <section id="chatbot" className="mb-16">
              <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
                6. 정책 문답 챗봇
              </h2>
              <div className="bg-white dark:bg-gray-800 dark:text-gray-200 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
                <div className="space-y-8">
                  <div>
                    <h3 className="text-lg font-bold mb-4">6.1. 챗봇 사용 방법</h3>
                    <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                      <li>• '새 대화 시작하기' 버튼으로 대화를 시작합니다</li>
                      <li>• 궁금한 정책을 자연어로 질문하세요</li>
                      <li>• 대화 내용은 PDF로 저장할 수 있습니다</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold mb-4">6.2. 필수 입력 정보</h3>
                    <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                      <li>• 거주 지역 (시/도, 시/군/구)</li>
                      <li>• 신분 (예비창업자, 소상공인 등)</li>
                      <li>• 관심 분야 또는 업종</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold mb-4">6.3. 질문 예시</h3>
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <p className="text-gray-600 dark:text-gray-400 mb-2">잘 작성된 질문 예시:</p>
                      <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                        <li>"경기도 구리시에 살고있는 예비창업자입니다. 식당 창업을 준비중인데 지원받을 수 있는 정책을 알려주세요."</li>
                        <li>"서울시 강남구의 1인 사업자입니다. IT 서비스 관련 지원 정책이 궁금합니다."</li>
                      </ul>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold mb-4">6.4. 대화 내용 저장</h3>
                    <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                      <li>• 대화 화면 우측 상단의 다운로드 버튼을 클릭</li>
                      <li>• PDF 형식으로 저장됩니다</li>
                      <li>• 파일명: ISeeU_Chat[날짜].pdf</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* FAQ 섹션 수정 */}
            <section id="faq" className="mb-16">
              <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
                7. FAQ & 주의사항
              </h2>
              <div className="bg-white dark:bg-gray-800 dark:text-gray-200 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                <div className="space-y-6 p-6">
                  <div>
                    <h3 className="text-lg font-bold mb-4">7.1. 시스템 요구사항</h3>
                    <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                      <li>• 최신 버전의 웹 브라우저 (Chrome, Firefox, Safari 등)</li>
                      <li>• 안정적인 인터넷 연결 (최소 10Mbps 이상 권장)</li>
                      <li>• WebRTC 지원 브라우저 필요</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold mb-4">7.2. 자주 묻는 질문</h3>
                    <ul className="space-y-4 text-gray-600 dark:text-gray-400">
                      <li><strong>Q: 영상이 자주 끊깁니다.</strong><br/>
                          A: 네트워크 상태를 확인하고, 가능하면 유선 연결을 사용하세요.</li>
                      <li><strong>Q: 통계 데이터가 표시되지 않아요.</strong><br/>
                          A: 브라우저 캐시를 삭제하고 다시 시도해보세요.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* 부가 안내 섹션 수정 */}
            <section id="extra" className="mb-16">
              <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
                8. 부가 안내
              </h2>
              <div className="bg-white dark:bg-gray-800 dark:text-gray-200 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-2 gap-6 mb-8">
                    {/* 기존 설정/알림 카드 유지 */}
                    <div className="flex items-start space-x-4">
                      <div className="bg-gray-100 p-3 rounded-full">
                        <i className="fas fa-cog text-black text-xl"></i>
                      </div>
                      <div>
                        <h3 className="font-bold mb-2">설정</h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          사용자 프로필·비밀번호 변경, 알림 설정 등을 관리할 수 있습니다.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-4">
                      <div className="bg-gray-100 p-3 rounded-full">
                        <i className="fas fa-bell text-black text-xl"></i>
                      </div>
                      <div>
                        <h3 className="font-bold mb-2">알림</h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          카메라 오프라인, 특정 이벤트 감지 시 알림을 받을 수 있습니다.
                        </p>
                      </div>
                    </div>
                </div>

                {/* 모델 명세서 다운로드 섹션 추가 */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
                  <h3 className="text-lg font-bold mb-4">모델 명세서 다운로드</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <a 
                      href="/docs/cv_model_algorithm.pdf" 
                      download="llm_model_algorithm.pdf"
                      className="flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full mr-4">
                        <i className="fas fa-camera text-blue-600 dark:text-blue-300"></i>
                      </div>
                      <div>
                        <h4 className="font-medium mb-1">CV 모델 명세서</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          유동인구 집계모델 기능명세서
                        </p>
                      </div>
                      <i className="fas fa-download ml-auto text-gray-400"></i>
                    </a>
                    <a 
                      href="/docs/llm_model_algorithm.pdf" 
                      download="cv_model_algorithm.pdf" 
                      className="flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full mr-4">
                        <i className="fas fa-robot text-green-600 dark:text-green-300"></i>
                      </div>
                      <div>
                        <h4 className="font-medium mb-1">LLM 모델 명세서</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          리포트 생성기 및 정책 문답 챗봇 기능 명세서
                        </p>
                      </div>
                      <i className="fas fa-download ml-auto text-gray-400"></i>
                    </a>
                  </div>
                </div>

                {/* 회원 탈퇴 버튼 */}
                <div className="mt-8 text-center">
                  <button
                    className="rounded-button bg-red-50 text-red-600 px-6 py-3 hover:bg-red-100 dark:bg-red-900 dark:hover:bg-red-800 dark:text-red-200 transition-colors"
                    onClick={handleWithdrawClick}
                  >
                    회원 탈퇴
                  </button>
                </div>
                {showWithdrawModal && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 dark:text-gray-200 rounded-lg p-8 max-w-sm w-full mx-4 flex flex-col items-center border border-gray-200 dark:border-gray-700">
                      <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mb-6">
                        <i className="fas fa-trash-alt text-red-600 text-2xl"></i>
                      </div>
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2 text-center">
                        정말 탈퇴하시겠어요?
                      </h2>
                      <p className="text-gray-500 dark:text-gray-300 text-center mb-8">
                        계정은 삭제되어 복구되지 않습니다.
                      </p>
                      <div className="flex flex-col w-full gap-3">
                        <button
                          className="w-full py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
                          onClick={() => {
                            alert("회원 탈퇴가 완료되었습니다.");
                            handleCloseModal();
                          }}
                        >
                          탈퇴
                        </button>
                        <button
                          className="w-full py-3 bg-gray-100 dark:bg-gray-700 dark:text-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                          onClick={handleCloseModal}
                        >
                          취소
                          </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>
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

export default Guide;
