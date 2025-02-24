// client/src/utils/api.js
import { apiRequest } from "../utils/apiWrapper";
import { getAuthHeaders } from "../utils/auth";


/**
 * 현재 회원 프로필 + 401 처리 + 재시도 API
 */
export async function getMemberProfile() {
  return await apiRequest("/api/members/me", { method: "GET" });
}


/**
 * 사람 감지 API 호출
 * - Nginx 리버스 프록시를 통해 people-detection 서비스의 /detect 엔드포인트로 요청합니다.
 * - 프론트엔드에서 전달한 cctv_url과 cctv_id를 payload에 포함합니다.
 */
export async function callPeopleDetection(cctv_url, cctv_id) {
  try {
    const endpoint = "https://msteam5iseeu.ddns.net/people-detection/detect";
    const payload = { cctv_url, cctv_id };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(
        `People detection API error: ${response.status} ${response.statusText}`
      );
    }
    return await response.json();
  } catch (error) {
    console.error("Error calling people-detection API:", error);
    throw error;
  }
}

/**
 * 리포트 생성 API 호출
 * - 환경변수(VITE_REPORT_GENERATION_URL)를 통해 백엔드 리포트 생성 API의 기본 URL을 사용합니다.
 * - 제목(title)과 데이터 요약(dataSummary)을 payload에 포함합니다.
 */
export async function callReportGeneration(title, dataSummary) {
  try {
    const endpoint = "https://msteam5iseeu.ddns.net/report-generation/report";
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title, data_summary: dataSummary }),
    });

    if (!response.ok) {
      throw new Error(
        `Report generation API error: ${response.status} ${response.statusText}`
      );
    }
    return await response.json();
  } catch (error) {
    console.error("Error in callReportGeneration:", error);
    throw error;
  }
}


/**
 * 챗봇 API 호출
 */
