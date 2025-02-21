/**
 * 사람 감지 API 호출
 * - Nginx 리버스 프록시를 통해 people-detection 서비스의 /detect 엔드포인트로 요청합니다.
 * - 프론트엔드에서 전달한 cctv_url과 cctv_id를 payload에 포함합니다.
 */
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

//chatbot API 호출 예시
export async function getChatbotResponse(userQuestion) {
  try {
    const endpoint = `https://msteam5iseeu.ddns.net/chatbot/ask?question=${userQuestion}`;

    const payload = { question: userQuestion };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Chatbot API error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error calling Chatbot API:", error);
    throw error;
  }
}
