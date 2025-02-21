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
// azure container를 껴서 넣는 형식... DB가 필요 거쳐야 할수도.. 토큰 생성 후 받아야 함!!

// import { io } from "socket.io-client"
// const socket io("https://msteam5iseeu.ddns.net");

//const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
//chatbot API 호출 예시
// export async function getChatbotResponse(userQuestion) {
//   try {
//     const response = await fetch("/chatbot/ask", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({ question: userQuestion }),
//     });

//     const data = await response.json(); // 응답 JSON 파싱

//     // 챗봇이 정보를 찾지 못한 경우 처리
//     if (
//       data ===
//       "제가 해당 질문에 대한 정보를 찾지 못했습니다. 다른 질문을 시도해 주세요!"
//     ) {
//       return "죄송합니다. 관련 정보를 찾을 수 없습니다. 다른 질문을 해주세요!";
//     }

//     return data; // 정상적인 챗봇 응답 반환
//   } catch (error) {
//     console.error("Chatbot API 호출 중 오류 발생:", error);
//     return "오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";
//   }
// }
export async function getChatbotResponse(userQuestion) {
  try {
    const endpoint = "https://msteam5iseeu.ddns.net/chatbot/ask"; // 직접 DDNS 주소 사용

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
