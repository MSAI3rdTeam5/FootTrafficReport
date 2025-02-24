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
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody)  // JSON.stringify 전에 확인
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

    const response = await fetch(url, {
        method: "GET"
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
        method: "GET"
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
