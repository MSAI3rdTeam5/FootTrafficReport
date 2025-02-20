export async function getChatbotResponse(userQuestion) {
  try {
    const response = await fetch("https://msteam5iseeu.ddns.net/chatbot/ask", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ question: userQuestion }), // 사용자 질문 전송
    });

    const data = await response.json(); // 응답 JSON 파싱

    // 챗봇이 정보를 찾지 못한 경우 처리
    if (
      data ===
      "제가 해당 질문에 대한 정보를 찾지 못했습니다. 다른 질문을 시도해 주세요!"
    ) {
      return "죄송합니다. 관련 정보를 찾을 수 없습니다. 다른 질문을 해주세요!";
    }

    return data; // 정상적인 챗봇 응답 반환
  } catch (error) {
    console.error("Chatbot API 호출 중 오류 발생:", error);
    return "오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";
  }
}
