// src/utils/api.js

export async function callPeopleDetection(cctv_url, cctv_id) {
    try {
      // 요청 URL: Nginx 리버스 프록시를 통해 people-detection 서비스로 요청
      const endpoint = "https://msteam5iseeu.ddns.net/people-detection/detect";
      
      // 요청 payload에 cctv_url과 cctv_id 포함
      const payload = { cctv_url, cctv_id };
  
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
  
      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }
      // 응답은 { videoStreamUrl, recognitionLog } 등의 데이터를 포함한다고 가정
      return await response.json();
    } catch (error) {
      console.error("Error calling people-detection API:", error);
      throw error;
    }
  }
  
  
  // Report-generation API 호출 예시
  export async function callReportGeneration(title, dataSummary) {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_REPORT_GENERATION_URL}/generate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, data_summary: dataSummary }),
        }
      );
      if (!response.ok) {
        throw new Error(`Report generation failed: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error in callReportGeneration:", error);
      throw error;
    }
  }
  