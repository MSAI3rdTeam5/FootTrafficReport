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
export async function callPeopleDetection(fileBlob, cctvId) {
  try {
    const formData = new FormData();
    formData.append("file", fileBlob, "frame.png");
    formData.append("cctv_id", String(cctvId));

    const response = await fetch("https://msteam5iseeu.ddns.net/people-detection/yolo_mosaic", {
      method: "POST",
      headers: getAuthHeaders(),  // 필요하면 인증 헤더
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`/yolo_mosaic failed: ${response.status} ${response.statusText}`);
    }

    // 서버는 PNG 이미지 Blob을 반환 => 여기서 blob으로 받음
    const resultBlob = await response.blob();
    return resultBlob;
  } catch (error) {
    console.error("Error in callYoloMosaic:", error);
    throw error;
  }
}

// Report-generation API 호출
export async function callReportGeneration(requestData) {
  try {
     
      const requestBody = {
          pdf_file: requestData.pdf_file,
          member_id: requestData.member_id,
          cctv_id: requestData.cctv_id,
          report_title: requestData.report_title,
          persona: requestData.persona ,
          start_date: requestData.start_date,
          end_date: requestData.end_date
      };

      console.log("Request body:", requestBody);  // body 값을 확인하기 위한 로그

      const response = await fetch("https://msteam5iseeu.ddns.net/report-generation/report", {
        method: "POST",
        headers: getAuthHeaders(), //Authorization
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
          throw new Error(`Report generation failed: ${response.statusText}`);
      }

      return await response.json();
  } catch (error) {
      console.error("Error in callReportGeneration:", error);
      throw error;
  }
}


// Report-generation 보고서 다운 API
export async function callReportDownload(reportId, savePath = "report.pdf") {
try {
    const url = `https://msteam5iseeu.ddns.net/api/report/${reportId}/download`;

    console.log("Downloading report from:", url); // URL 로그 확인

    const customHeaders = getAuthHeaders(); //Authorization
    // Blob 응답 => Accept 설정이 필요하다면 customHeaders["Accept"] = "application/pdf"; 등 가능

    const response = await fetch(url, {
        method: "GET",
        headers: customHeaders
    });

    if (!response.ok) {
        throw new Error(`Report download failed: ${response.statusText}`);
    }

    // Blob 데이터 변환
    const blob = await response.blob();
    const urlObject = URL.createObjectURL(blob);
   
    // <a> 태그를 이용해 파일 다운로드
    const a = document.createElement("a");
    a.href = urlObject;
    a.download = savePath;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    console.log(`PDF가 ${savePath}로 저장되었습니다.`);
    return true; // 다운로드 성공
} catch (error) {
    console.error("Error in callReportDownload:", error);
    return false; // 다운로드 실패
}
}


// Report-generation 보고서 요약 API 호출
export async function callRerportSummary(member_id) {
try {
    const url = `https://msteam5iseeu.ddns.net/api/report/${member_id}`;

    console.log("Downloading report from:", url); // URL 로그 확인

    const response = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders() //Authorization
    });

    if (!response.ok) {
        throw new Error(`Report download failed: ${response.statusText}`);
    }

   
    let reports_summary = await response.json();
    console.log(`response: ${JSON.stringify(reports_summary)}`);
    reports_summary = reports_summary
        .sort((a, b) => b.id - a.id) // ID가 큰 순서대로 정렬
        .slice(0, 4); // 상위 4개만 선택

    console.log(`Filtered response: ${JSON.stringify(reports_summary)}`);
    return reports_summary; // 다운로드 성공

} catch (error) {
    console.error("Error in callReportDownload:", error);
    return false; // 다운로드 실패
}
}

//chatbot API 호출
export async function getChatbotResponse(userQuestion) {
  try {
    const endpoint = `https://msteam5iseeu.ddns.net/chatbot/ask?question=${userQuestion}`;

    const payload = { question: userQuestion };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: getAuthHeaders(),  //Authorization
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
