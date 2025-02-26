import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { getChatbotResponse } from "../utils/api";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

function ChatbotPage() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  // 로그인 상태 (실제 프로젝트에서는 인증 Context 또는 전역 상태로 관리)
  const [isAuthenticated, setIsAuthenticated] = useState(true);

  // 상단 탭 활성 로직
  const isMonitorActive = location.pathname === "/monitor";
  const isDashboardActive = location.pathname === "/dashboard";
  const isAiInsightActive = location.pathname === "/ai-insight";
  const isChatbotActive = location.pathname === "/chatbot";
  const isGuideActive = location.pathname === "/guide";

  //초기 대화
  const daysOfWeek = ["일", "월", "화", "수", "목", "금", "토"];
  const now = new Date();
  const month = now.getMonth() + 1;
  const date = now.getDate();
  const dayOfWeek = daysOfWeek[now.getDay()];

  const initialConversationId = Date.now();
  const initialConversation = {
    id: initialConversationId,
    title: `대화 1 - ${month}월 ${date}일(${dayOfWeek})`,
    date: now.toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }),
    messages: [
      {
        id: initialConversationId + 1,
        sender: "bot",
        text: "안녕하세요 ! 저는 AI 정책 추천 챗봇 입니다. ",
      },
      {
        id: initialConversationId + 2,
        sender: "bot",
        text: "정확한 추천을 위해, 거주 지역(시/도, 시/군/구)·신분(예비창업자, 소상공인 등)·관심 업종 등을 구체적으로 포함해 질문해 주세요.",
      },
    ],
  };

  const [conversations, setConversations] = useState([initialConversation]);
  const [activeConversationId, setActiveConversationId] = useState(
    initialConversationId
  );

  // 입력창 상태
  const [inputMessage, setInputMessage] = useState("");

  // 목록 표시/숨기기 상태
  const [showList, setShowList] = useState(true);

  // 메뉴 열림 상태 (어떤 대화에 대해 메뉴가 열려 있는지)
  const [activeMenuId, setActiveMenuId] = useState(null);

  // 현재 활성 대화
  const activeConversation = conversations.find(
    (c) => c.id === activeConversationId
  );

  // 새 대화 버튼
  const handleNewConversation = () => {
    const daysOfWeek = ["일", "월", "화", "수", "목", "금", "토"];

    const now = new Date();
    const newId = Date.now();
    const month = now.getMonth() + 1;
    const date = now.getDate();
    const dayOfWeek = daysOfWeek[now.getDay()];

    const conversationNumber = conversations.length + 1;

    // 예: "대화 #1 - 2월 21일(금)"
    const newTitle = `대화 ${conversationNumber} - ${month}월 ${date}일(${dayOfWeek})`;

    const newConv = {
      id: newId,
      title: newTitle,
      date: now.toLocaleString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }),
      messages: [
        {
          id: newId + 1,
          sender: "bot",
          text: "안녕하세요 ! 저는 AI 정책 추천 챗봇 입니다. ",
        },
        {
          id: newId + 2,
          sender: "bot",
          text: "정확한 추천을 위해, 거주 지역(시/도, 시/군/구)·신분(예비창업자, 소상공인 등)·관심 업종 등을 구체적으로 포함해 질문해 주세요.",
        },
      ],
    };

    setConversations((prev) => [...prev, newConv]);
    setActiveConversationId(newId);
  };

  // 메시지 전송 로직
  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    if (!activeConversationId) return; // 활성 대화가 없으면 리턴

    // 사용자 메시지
    const userMsg = {
      id: Date.now(),
      sender: "user",
      text: inputMessage,
    };

    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === activeConversationId
          ? { ...conv, messages: [...conv.messages, userMsg] }
          : conv
      )
    );

    // 로딩(타이핑) 상태 메시지 추가 (옵션)
    const typingMsgId = Date.now() + 1;
    const typingMsg = {
      id: typingMsgId,
      sender: "bot",
      text: "응답을 준비 중입니다...",
    };

    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === activeConversationId
          ? { ...conv, messages: [...conv.messages, typingMsg] }
          : conv
      )
    );

    try {
      // 실제 백엔드 API 호출
      const answer = await getChatbotResponse(inputMessage);

      // 봇 응답 메시지와 저장 안내 메시지를 생성합니다.
      const newAnswerMessage = {
        id: Date.now(),
        sender: "bot",
        text: answer,
      };
      const newSaveMessage = {
        id: Date.now() + 1,
        sender: "bot",
        text: "채팅 내용을 저장하고 싶으면 오른쪽 상단 '다운로드' 버튼을 눌러주세요.",
      };

      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === activeConversationId
            ? {
                ...conv,
                messages: conv.messages
                  .filter((msg) => msg.id !== typingMsgId)
                  // .concat({ id: Date.now(), sender: "bot", text: answer }),
                  .concat([newAnswerMessage, newSaveMessage]),
              }
            : conv
        )
      );
    } catch (error) {
      console.error("챗봇 응답 에러:", error);
      setConversations((prev) =>
        prev.map((conv) => {
          if (conv.id === activeConversationId) {
            return {
              ...conv,
              messages: conv.messages
                .filter((msg) => msg.id !== typingMsgId)
                .concat({
                  id: Date.now(),
                  sender: "bot",
                  text: "오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
                }),
            };
          }
          return conv;
        })
      );
    }
  };

  // 목록 토글 버튼
  const toggleList = () => {
    setShowList((prev) => !prev);
  };

  // 점 세개 메뉴 열기/닫기
  const toggleMenu = (id) => {
    setActiveMenuId((prev) => (prev === id ? null : id));
  };

  // 대화 삭제
  const handleDeleteConversation = (id) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConversationId === id) {
      setActiveConversationId(null);
    }
  };

  //PDF 다운로드
  const handleDownloadPDF = async () => {
    if (!activeConversation) {
      alert("내보낼 대화가 없습니다.");
      return;
    }

    const chatElement = document.getElementById("chatContainer");
    if (!chatElement) {
      alert("대화 영역을 찾을 수 없습니다.");
      return;
    }

    const originalStyles = {
      height: chatElement.style.height,
      maxHeight: chatElement.style.maxHeight,
      overflow: chatElement.style.overflow,
    };

    try {
      chatElement.style.height = "auto";
      chatElement.style.maxHeight = "none";
      chatElement.style.overflow = "visible";

      await new Promise((r) => setTimeout(r, 100));

      const canvas = await html2canvas(chatElement, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF("p", "pt", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const imgProps = pdf.getImageProperties(imgData);
      const imgWidth = imgProps.width;
      const imgHeight = imgProps.height;

      const today = new Date();
      const formattedDate = today.toISOString().split("T")[0];

      let newHeight = (imgHeight * pdfWidth) / imgWidth;
      if (newHeight > pdfHeight) {
        newHeight = pdfHeight;
      }

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, newHeight);
      pdf.save(`ISeeU_Chat${formattedDate}.pdf`);
    } catch (err) {
      console.error("PDF 생성 에러:", err);
      alert("PDF 생성 중 오류가 발생했습니다.");
    } finally {
      chatElement.style.height = originalStyles.height;
      chatElement.style.maxHeight = originalStyles.maxHeight;
      chatElement.style.overflow = originalStyles.overflow;
    }
  };

  return (
    <div className="bg-gray-50">
      {/* 상단 Nav */}
      <nav className="bg-white shadow">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* 왼쪽: 로고 + 탭 */}
            <div className="flex items-center space-x-8">
              <span className="text-xl font-bold text-black">I See U</span>
              <div className="flex space-x-3">
                <Link
                  to="/monitor"
                  className={`inline-flex items-center px-1 pt-1 nav-link ${
                    isMonitorActive
                      ? "bg-black text-white font-medium"
                      : "text-gray-500 hover:text-black"
                  }`}
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: "0.375rem",
                    transition: "all 0.3s ease",
                    backgroundColor: isMonitorActive ? "#000000" : "#f3f4f6",
                    color: isMonitorActive ? "#ffffff" : "#000000",
                  }}
                >
                  내 모니터링
                </Link>
                <Link
                  to="/dashboard"
                  className={`inline-flex items-center px-1 pt-1 nav-link ${
                    isDashboardActive
                      ? "bg-black text-white font-medium"
                      : "text-gray-500 hover:text-black"
                  }`}
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: "0.375rem",
                    transition: "all 0.3s ease",
                    backgroundColor: isDashboardActive ? "#000000" : "#f3f4f6",
                    color: isDashboardActive ? "#ffffff" : "#000000",
                  }}
                >
                  통계 분석
                </Link>
                <Link
                  to="/ai-insight"
                  className={`inline-flex items-center px-1 pt-1 nav-link ${
                    isAiInsightActive
                      ? "bg-black text-white font-medium"
                      : "text-gray-500 hover:text-black"
                  }`}
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: "0.375rem",
                    transition: "all 0.3s ease",
                    backgroundColor: isAiInsightActive ? "#000000" : "#f3f4f6",
                    color: isAiInsightActive ? "#ffffff" : "#000000",
                  }}
                >
                  AI 인사이트
                </Link>
                <Link
                  to="/chatbot"
                  className={`inline-flex items-center px-1 pt-1 nav-link ${
                    isChatbotActive
                      ? "bg-black text-white font-medium"
                      : "text-gray-500 hover:text-black"
                  }`}
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: "0.375rem",
                    transition: "all 0.3s ease",
                    backgroundColor: isChatbotActive ? "#000000" : "#f3f4f6",
                    color: isChatbotActive ? "#ffffff" : "#000000",
                  }}
                >
                  챗봇
                </Link>
                <Link
                  to="/guide"
                  className={`inline-flex items-center px-1 pt-1 nav-link ${
                    isGuideActive
                      ? "bg-black text-white font-medium"
                      : "text-gray-500 hover:text-black"
                  }`}
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: "0.375rem",
                    transition: "all 0.3s ease",
                    backgroundColor: isGuideActive ? "#000000" : "#f3f4f6",
                    color: isGuideActive ? "#ffffff" : "#000000",
                  }}
                >
                  사용 방법
                </Link>
                <button
                  type="button"
                  className="inline-flex items-center px-1 pt-1 text-gray-500 hover:text-black nav-link"
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: "0.375rem",
                    transition: "all 0.3s ease",
                    backgroundColor: "#f3f4f6",
                    color: "#000000",
                  }}
                >
                  개인정보법 안내
                </button>
              </div>
            </div>

            {/* 오른쪽: 알림/설정/사용자 */}
            <div className="flex items-center relative">
              <button className="p-2 rounded-full hover:bg-gray-100 relative">
                <i className="fas fa-bell text-gray-600"></i>
                <span className="absolute top-1 right-1 bg-red-500 rounded-full w-2 h-2" />
              </button>
              <button className="ml-3 p-2 rounded-full hover:bg-gray-100">
                <i className="fas fa-cog text-gray-600"></i>
              </button>

              {/* 프로필 & 로그아웃 드롭다운 */}
              {!isAuthenticated ? (
                <div className="ml-4">
                  <Link
                    to="/login"
                    className="inline-flex items-center px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600"
                  >
                    로그인
                  </Link>
                </div>
              ) : (
                <div className="ml-4 flex items-center relative">
                  <button
                    className="flex items-center p-2 rounded-full hover:bg-gray-100"
                    onClick={() => setIsOpen(!isOpen)}
                  >
                    <img
                      className="h-8 w-8 rounded-full"
                      src="/기본프로필.png"
                      alt="사용자 프로필"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">
                      김관리자
                    </span>
                  </button>

                  {/* 드롭다운 메뉴 */}
                  {isOpen && (
                    <div
                      className="absolute right-0 top-full mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5"
                      role="menu"
                    >
                      <a
                        href="#"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        role="menuitem"
                      >
                        프로필 설정
                      </a>
                      <a
                        href="#"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        role="menuitem"
                      >
                        계정 관리
                      </a>
                      <a
                        href="#"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        role="menuitem"
                      >
                        알림 설정
                      </a>
                      <div className="border-t border-gray-100 my-1"></div>
                      <a
                        href="#"
                        className="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                        role="menuitem"
                      >
                        로그아웃
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* 메인 레이아웃 */}
      <div className="flex bg-gray-50 justify-center py-8">
        {/* 고정 크기 박스 (챗봇 화면 고정) */}
        <div className="bg-white rounded-lg shadow-sm h-[700px] w-[1200px]">
          <div className="flex h-full">
            {/* 왼쪽: 대화 목록 패널 (조건부 렌더링) */}
            {showList && (
              <div className="w-80 border-r border-gray-200 p-4 overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-medium text-gray-900">
                    대화 목록
                  </h2>
                  <div className="flex items-center">
                    {/* 새 대화 버튼 */}
                    <button
                      className="!rounded-button bg-custom text-white px-4 py-2 text-sm font-medium"
                      onClick={handleNewConversation}
                    >
                      새 대화
                    </button>

                    {/* 목록 숨기기 */}
                    <div className="relative group ml-2">
                      <button
                        className="p-2 text-gray-500 hover:text-gray-700 rounded"
                        onClick={toggleList}
                      >
                        <i className="fas fa-chevron-left"></i>
                      </button>
                      {/* 사이드바 닫기 안내 툴팁 */}
                      <div
                        className="
                          absolute
                          left-1/2
                          -translate-x-1/2
                          top-full
                          mt-2
                          px-2 py-1
                          text-xs
                          text-white
                          bg-gray-800
                          rounded
                          opacity-0
                          group-hover:opacity-80
                          pointer-events-none
                          transition-opacity
                          whitespace-nowrap
                        "
                      >
                        목록 닫기
                      </div>
                    </div>
                  </div>
                </div>
                {conversations.length === 0 ? (
                  <div className="text-gray-500 text-sm">
                    아직 대화가 없습니다.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {conversations.map((conv) => {
                      const isActive = conv.id === activeConversationId;
                      return (
                        <div
                          key={conv.id}
                          className={`relative p-3 rounded-lg cursor-pointer transition-colors ${
                            isActive
                              ? "bg-black text-white"
                              : "bg-gray-50 hover:bg-gray-100 text-gray-900"
                          }`}
                          onClick={() => {
                            setActiveConversationId(conv.id);
                            setActiveMenuId(null);
                          }}
                        >
                          <div className="text-sm font-medium">
                            {conv.title}
                          </div>
                          <div
                            className={`text-xs mt-1 ${
                              isActive ? "text-gray-200" : "text-gray-500"
                            }`}
                          >
                            {conv.date}
                          </div>

                          {/* 점 세 개 메뉴 버튼 */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation(); // 부모 클릭 이벤트 막기
                              toggleMenu(conv.id);
                            }}
                            className="absolute top-2 right-2 p-1 text-gray-500 hover:text-gray-700 rounded focus:outline-none"
                          >
                            <i className="fas fa-ellipsis-v"></i>
                          </button>

                          {/* 점 세 개 눌렀을 때 나오는 드롭다운 메뉴 */}
                          {activeMenuId === conv.id && (
                            <div className="absolute top-8 right-2 w-32 bg-white border border-gray-200 rounded shadow-md z-10">
                              {/* <button
                                className="w-full text-left px-4 py-2 text-sm text-black hover:bg-gray-100"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRenameConversation(conv.id);
                                  toggleMenu(conv.id);
                                }}
                              >
                                이름 바꾸기
                              </button> */}
                              <button
                                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-red-500"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteConversation(conv.id);
                                  toggleMenu(conv.id);
                                }}
                              >
                                대화내용 삭제
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 오른쪽: 채팅 영역 */}
            <div className="flex-1 flex flex-col">
              {/* 채팅 헤더 */}
              <div className="border-b border-gray-200 p-4 flex items-center justify-between">
                <div className="flex items-center">
                  {/* 목록이 숨겨진 경우 => 오른쪽 체브론 */}
                  {!showList ? (
                    <button
                      className="mr-3 p-2 text-gray-500 hover:text-gray-700 rounded"
                      onClick={toggleList}
                    >
                      <i className="fas fa-chevron-right"></i>
                    </button>
                  ) : null}

                  <div className="h-2 w-2 rounded-full bg-green-400 mr-2"></div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {activeConversation
                      ? activeConversation.title
                      : "AI 어시스턴트"}
                  </h3>
                </div>
                <div className="flex space-x-2">
                  {/* 다운로드 버튼 + 툴팁 */}
                  <div className="relative group">
                    <button
                      className="p-2 text-gray-500 hover:text-gray-700 rounded"
                      onClick={handleDownloadPDF}
                    >
                      <i className="fas fa-download"></i>
                    </button>
                    {/* 툴팁 */}
                    <div
                      className="
                        absolute
                        whitespace-nowrap
                        bg-black
                        text-white
                        text-xs
                        rounded
                        px-2
                        py-1
                        opacity-0
                        group-hover:opacity-100
                        transition-opacity
                        duration-300
                        -top-5
                        left-1/2
                        transform
                        -translate-x-1/2
                      "
                    >
                      다운로드
                    </div>
                  </div>
                </div>
              </div>

              {/* 메시지 목록 (스크롤) */}
              <div id="chatContainer" className="flex-1 p-6 overflow-y-auto">
                {!activeConversation ? (
                  <div className="text-gray-500">
                    메시지를 입력하면 대화가 시작됩니다.
                  </div>
                ) : (
                  <div className="space-y-6">
                    {activeConversation.messages.map((msg) => {
                      const isUser = msg.sender === "user";
                      return (
                        <div
                          key={msg.id}
                          className={`flex items-start ${
                            isUser ? "justify-end" : ""
                          }`}
                        >
                          {/* 봇 아이콘 */}
                          {!isUser && (
                            <div className="flex-shrink-0">
                              <div className="h-8 w-8 rounded-full bg-custom flex items-center justify-center">
                                <i className="fas fa-robot text-white"></i>
                              </div>
                            </div>
                          )}
                          <div
                            className={`${
                              isUser
                                ? "bg-custom text-white"
                                : "bg-gray-100 text-gray-900 ml-3"
                            } rounded-lg p-4 max-w-3xl ${isUser ? "mr-3" : ""}`}
                          >
                            <p className="text-sm">{msg.text}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 입력창 */}
              <div className="border-t border-gray-200 p-4 bg-white">
                <div className="flex items-center">
                  <textarea
                    className="flex-1 form-input border-gray-300 focus:border-custom focus:ring-custom rounded-lg resize-none"
                    placeholder={
                      activeConversation
                        ? "메시지를 입력해주세요. "
                        : "대화를 먼저 선택해주세요."
                    }
                    rows={3}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    disabled={!activeConversation}
                  ></textarea>
                  <button
                    className="!rounded-button ml-4 bg-custom text-white px-6 py-2 self-end"
                    onClick={handleSendMessage}
                    disabled={!activeConversation}
                  >
                    <i className="fas fa-paper-plane mr-2"></i>
                    전송
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatbotPage;