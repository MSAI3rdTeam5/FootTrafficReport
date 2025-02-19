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
    const baseUrl = import.meta.env.VITE_REPORT_GENERATION_URL;
    if (!baseUrl) {
      throw new Error("VITE_REPORT_GENERATION_URL is not defined in environment variables.");
    }
    const endpoint = `${baseUrl}/generate`;
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
