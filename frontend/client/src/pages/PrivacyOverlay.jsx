// src/pages/PrivacyOverlay.jsx
import React, { useEffect } from "react";

/**
 * 개인정보법 안내 오버레이 컴포넌트
 * - props:
 *   - open (boolean): true면 오버레이 표시
 *   - onClose (function): 닫기 버튼 클릭 시 호출
 */
function PrivacyOverlay({ open, onClose }) {

  // Body 스크롤 막기
  useEffect(() => {
    if (open) {
      // 모달 열릴 때
      document.body.style.overflow = "hidden";
    } else {
      // 모달 닫힐 때
      document.body.style.overflow = "";
    }
    // 컴포넌트 언마운트 시에도 복원
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null; // 오픈이 false면 렌더링 X

  // (A) 배경 클릭 시 모달 닫기 핸들러
  const handleOverlayClick = (e) => {
    // e.target이 오버레이 자기 자신인지 확인 (모달 박스를 클릭한 게 아니라)
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black bg-opacity-50 flex justify-center items-start pt-16 pb-8"
      onClick={handleOverlayClick}
    >
      <div className="relative bg-white w-full max-w-5xl mx-auto rounded-lg shadow px-4 sm:px-6 lg:px-8 py-6 mt-4 mb-12 overflow-y-auto max-h-screen">
        
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <i className="fas fa-times text-xl"></i>
        </button>

        {/* 본문 내용 시작 */}
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center border-b pb-4">
          CCTV 영상 개인정보법 안내
        </h2>

        {/* section 1 */}
        <section className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            <i className="fas fa-video mr-2 text-custom"></i>CCTV 운영 목적
          </h2>
          <p className="text-gray-600 mb-4">
            통계 분석: 매장 방문자 수, 체류 시간, 시간대별 혼잡도 등을
            파악하여 운영 효율을 높이기 위해 영상을 사용합니다.
          </p>
          <p className="text-gray-600">
            안전 및 보안: 고객과 직원 안전, 도난·사고 예방을 위한 협력 보안
            목적입니다.
          </p>
          <p className="mt-4 text-gray-600 mb-4">
            * 본 앱은 개인 식별이 아닌, <strong>통계·운영 효율성</strong> 향상을
            위한 데이터를 중점으로 처리합니다.
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

        {/* section 2 */}
        <section className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            <i className="fas fa-map-marker-alt mr-2 text-custom"></i>설치 장소 및 고지
          </h2>
          <p className="text-gray-600 mb-4">
            설치 장소: 매장 출입구, 내부 주요 구역, 계산대 주변 등
          </p>
          <p className="text-gray-600 mb-4">
            안내문: 매장 내 출입구 등에 CCTV 설치 안내문 비치
          </p>
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
          </div>
        </section>

        {/* section 3 */}
        <section className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            <i className="fas fa-database mr-2 text-custom"></i>데이터 비식별화 및 활용
          </h2>
          <ul className="space-y-3 text-gray-600">
            <li>
              <i className="fas fa-check text-custom mr-2"></i>비식별 처리: 얼굴
              신체 정보를 저장하지 않고, 통계 자료만 추출
            </li>
            <li>
              <i className="fas fa-check text-custom mr-2"></i>AI 분석: 인원 흐름,
              통행도, 방문 패턴 등 산출
            </li>
            <li>
              <i className="fas fa-check text-custom mr-2"></i>재식별 금지: 분석 후
              원영상은 즉시 마스킹·삭제 처리
            </li>
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
          </div>
        </section>

        {/* section 4 */}
        <section className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            <i className="fas fa-clock mr-2 text-custom"></i>보관 기간 및 폐기
          </h2>
          <div className="border-l-4 border-custom pl-4 space-y-4">
            <p className="text-gray-600">
              보관 기간: 원영상은 최대 30일 등 최소 기간만 보관 후 자동 삭제
            </p>
            <p className="text-gray-600">
              폐기 절차: 목적 달성 후 영상·데이터 영구 삭제
            </p>
            <p className="text-gray-600">
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
          </div>
        </section>

        {/* section 5 */}
        <section className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            <i className="fas fa-user-shield mr-2 text-custom"></i>접근 권한 및 관리자
          </h2>
          <p className="text-gray-600 mb-4">
            보안 담당자 또는 지정된 관리자만 영상 및 통계 데이터를 열람할 수
            있으며, 접근 로그를 기록·관리합니다.
          </p>
          <p className="text-gray-600">문의: security@mycompany.co.kr</p>
          <div className="mt-4 bg-gray-100 text-gray-600 text-xs p-4 rounded-lg">
            <p>
              ※ 관련 법률 조항
              <br />
              - 개인정보 보호법 제29조: 개인정보처리자는 개인정보에 대한
              접근 권한을 제한하는 등 안전성 확보에 필요한 조치를 하여야
              합니다.
              <br />
            </p>
          </div>
        </section>

        {/* section 6 */}
        <section className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            <i className="fas fa-gavel mr-2 text-custom"></i>법령 준수
          </h2>
          <p className="text-gray-600">
            개인정보 보호법 등 관계 법령 및 회사 내부 정책을 준수합니다. 필요시
            GDPR, 통신비밀 보호법 등 해외 법령도 고려됩니다.
          </p>
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
          </div>
        </section>

        {/* section 7 */}
        <section className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            <i className="fas fa-user-lock mr-2 text-custom"></i>이용자의 권리
          </h2>
          <p className="text-gray-600">
            본인이 식별되는 영상에 대해 열람·삭제를 요청할 수 있으며, 절차는
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
          </div>
        </section>

        {/* 푸터 */}
        <footer className="bg-white border-t mt-12">
          <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center text-gray-500 text-sm">
              <p className="mb-2">
                개인정보 관련 문의: privacy@mycompany.co.kr / 000-0000-0000
              </p>
              <p>CCTV 운영 보안 문의: security@mycompany.co.kr / 000-0000-0000</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default PrivacyOverlay;