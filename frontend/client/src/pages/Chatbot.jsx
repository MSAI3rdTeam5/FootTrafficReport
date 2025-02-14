import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

function ChatbotPage() {
  const location = useLocation();

  // 상단 탭 활성 로직
  const isMonitorActive = location.pathname === "/monitor";
  const isDashboardActive = location.pathname === "/dashboard";
  const isAiInsightActive = location.pathname === "/ai-insight";
  const isChatbotActive = location.pathname === "/chatbot";
  const isGuideActive = location.pathname === "/guide";

  // 대화 목록
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);

  // 메시지 입력
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
    const now = new Date();
    const newId = Date.now();
    const newConv = {
      id: newId,
      title: `새 대화 ${conversations.length + 1}`,
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
          text: "새로운 대화를 시작합니다! 무엇을 도와드릴까요?",
        },
      ],
    };

    setConversations((prev) => [...prev, newConv]);
    setActiveConversationId(newId);
  };

  // 메시지 전송 로직
  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    if (!activeConversationId) return; // 혹시 활성 대화가 없으면 리턴

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

    setInputMessage("");

    // 1초 뒤 봇 응답
    setTimeout(() => {
      const botMsg = {
        id: Date.now(),
        sender: "bot",
        text: "챗봇 응답 예시입니다!",
      };
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === activeConversationId
            ? { ...conv, messages: [...conv.messages, botMsg] }
            : conv
        )
      );
    }, 1000);
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
            <div className="flex items-center">
              <button className="p-2 rounded-full hover:bg-gray-100 relative">
                <i className="fas fa-bell text-gray-600"></i>
                <span className="absolute top-1 right-1 bg-red-500 rounded-full w-2 h-2" />
              </button>
              <button className="ml-3 p-2 rounded-full hover:bg-gray-100">
                <i className="fas fa-cog text-gray-600"></i>
              </button>
              <div className="ml-4 flex items-center">
                <img
                  className="h-8 w-8 rounded-full"
                  src="/기본프로필.png"
                  alt="사용자 프로필"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">
                  김관리자
                </span>
              </div>
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
                              <button
                                className="w-full text-left px-4 py-2 text-sm text-black hover:bg-gray-100"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRenameConversation(conv.id);
                                  toggleMenu(conv.id);
                                }}
                              >
                                이름 바꾸기
                              </button>
                              <button
                                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-red-500"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteConversation(conv.id);
                                  toggleMenu(conv.id);
                                }}
                              >
                                삭제
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
                  <button className="p-2 text-gray-500 hover:text-gray-700 rounded">
                    <i className="fas fa-download"></i>
                  </button>
                  <button className="p-2 text-gray-500 hover:text-gray-700 rounded">
                    <i className="fas fa-ellipsis-v"></i>
                  </button>
                </div>
              </div>

              {/* 메시지 목록 (스크롤) */}
              <div className="flex-1 p-6 overflow-y-auto">
                {!activeConversation ? (
                  <div className="text-gray-500">
                    메시지를 입력하면 새 대화가 시작됩니다.
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
                        ? "메시지를 입력하세요..."
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
