// src/pages/PrivacyOverlay.jsx
import React from "react";

/**
 * 개인정보법 안내 오버레이 컴포넌트
 * - props:
 *   - open (boolean): true면 오버레이 표시
 *   - onClose (function): 닫기 버튼 클릭 시 호출
 */
function PrivacyOverlay({ open, onClose }) {
  if (!open) return null; // open이 false면 렌더링하지 않음

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 rounded-lg relative shadow-lg">
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-black"
        >
          <i className="fas fa-times text-xl"></i>
        </button>

        <h1 className="text-2xl font-bold mb-4">CCTV 영상 개인정보 안내</h1>

        {/* 본문 내용 (예시) */}
        <div className="space-y-6 text-sm text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-lg font-bold mb-2">1. CCTV 운영 목적</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>
                <strong>통계 분석</strong>: 매장 방문자 수, 체류 시간, 시간대별
                혼잡도 등을 파악하여 운영 효율을 높이기 위해 영상을 사용합니다.
              </li>
              <li>
                <strong>안전 및 보안</strong>: 고객과 직원 안전, 도난·사고 예방을
                위한 일반 보안 목적.
              </li>
            </ul>
            <p className="mt-2 text-gray-600">
              *본 앱은 개인 식별이 아닌, <strong>통계·운영 효율성</strong> 향상을 위한
              데이터를 중점으로 처리합니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-2">2. 설치 장소 및 고지</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>
                <strong>설치 장소</strong>: 매장 출입구, 내부 주요 구역, 계산대
                주변 등
              </li>
              <li>
                <strong>안내문</strong>: 매장 내 출입구 등에 CCTV 설치 안내문을
                비치
              </li>
              <li>
                <strong>고객 동의</strong>: 매장 이용 시, CCTV 촬영 및 통계 분석에
                대한 안내
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-2">3. 데이터 비식별화 및 활용</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>
                <strong>비식별 처리</strong>: 얼굴·신체 정보를 저장하지 않고, 통계
                지표만 추출
              </li>
              <li>
                <strong>AI 분석</strong>: 인원 흐름, 혼잡도, 방문 패턴 등 산출
              </li>
              <li>
                <strong>재식별 금지</strong>: 분석 후 원영상은 즉시 마스킹·삭제 처리
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-2">4. 보관 기간 및 폐기</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>
                <strong>보관 기간</strong>: 원영상은 최대 30일 등 최소 기간만
                보관 후 자동 삭제
              </li>
              <li>
                <strong>폐기 절차</strong>: 목적 달성 후 영상·데이터 영구 삭제
              </li>
              <li>
                <strong>예외 사항</strong>: 법적 분쟁, 수사 협조 필요 시 별도 분리
                보관
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-2">5. 접근 권한 및 관리자</h2>
            <p>
              보안 담당자 또는 지정된 관리자만 영상 및 통계 데이터를 열람할 수
              있으며, 접근 로그를 기록·관리합니다.
            </p>
            <p className="mt-1 text-gray-600">문의: security@mycompany.co.kr</p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-2">6. 법령 준수</h2>
            <p>
              개인정보 보호법 등 관계 법령 및 회사 내부 정책을 준수합니다.
              필요시 GDPR, 통신비밀 보호법 등 해외 법령도 고려됩니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-2">7. 이용자의 권리</h2>
            <p>
              본인이 식별되는 영상에 대해 열람·삭제를 요청할 수 있으며, 절차는
              관련 법령에 따릅니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-2">8. 문의 안내</h2>
            <p>
              개인정보 관련 문의: privacy@mycompany.co.kr / 000-0000-0000
              <br />
              CCTV 운영·보안 문의: security@mycompany.co.kr / 000-0000-0000
            </p>
          </section>

          <section>
            
            <p className="text-sm text-gray-600 mt-4">
              *본 안내는 요약본이며, 자세한 내용은 회사의 개인정보처리방침을
              참조해 주세요.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

export default PrivacyOverlay;