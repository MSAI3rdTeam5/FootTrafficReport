/**
 * 챗봇 API를 호출하거나, 챗봇 응답을 생성하는 함수
 * @param {string} userQuestion 사용자가 입력한 질문
 * @returns {Promise<string>} 챗봇의 응답 텍스트
 */

export async function chatbot_recall(userQuestion) {
  try {
    // const response = await fetch("https://your-backend.com/api/chatbot", {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json",
    //   },
    //   body: JSON.stringify({ question: userQuestion }),
    // });
    // const data = await response.json();
    // return data.answer; // 서버에서 받은 답변 필드

    // 예시로 1초 뒤에 가짜 응답을 돌려주는 모의(mock) 함수
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(`챗봇 응답: [${userQuestion}]에 대한 답변입니다.`);
      }, 1000);
    });
  } catch (error) {
    console.error("챗봇 API 호출 실패:", error);
    throw error;
  }
}
