import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { getChatbotResponse } from "../utils/api";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
<<<<<<< HEAD

import PrivacyOverlay from "./PrivacyOverlay";
import ResponsiveNav from "../components/ResponsiveNav";
=======
>>>>>>> hotfix/urgent-bug

function ChatbotPage() {
  const [privacyOpen, setPrivacyOpen] = useState(false);
      // (2) Nav에서 이 함수를 호출 -> 오버레이 열림
  const handleOpenPrivacy = () => setPrivacyOpen(true);
      // (3) 오버레이 닫기
  const handleClosePrivacy = () => setPrivacyOpen(false);

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

<<<<<<< HEAD
=======
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

>>>>>>> hotfix/urgent-bug
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
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen flex flex-col">
      {/* 공통 네비 바 */}
      <ResponsiveNav onOpenPrivacy={handleOpenPrivacy} />

      {/* 메인 레이아웃 */}
      <div className="flex-1 pt-20 flex justify-center py-8 bg-gray-50 dark:bg-gray-900">
        {/* 고정 크기 박스 (챗봇 화면) - 반응형: 모바일에서 너무 큰 경우 대비 */}
        <div className="bg-white dark:bg-gray-800 dark:text-gray-200 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 h-[700px] w-full max-w-[1200px]">
          <div className="flex h-full">
            {/* 왼쪽: 대화 목록 패널 (조건부 렌더링) */}
            {showList && (
              <div className="hidden md:flex md:flex-col w-80 border-r border-gray-200 dark:border-gray-700 p-4 overflow-y-auto overflow-x-hidden">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    대화 목록
                  </h2>
                  <div className="flex items-center space-x-2">
                    {/* 새 대화 버튼 */}
                    <button
                      className="rounded-button bg-custom text-white px-4 py-2 text-sm font-medium"
                      onClick={handleNewConversation}
                    >
                      새 대화
                    </button>

                    {/* 목록 숨기기 */}
                    <div className="relative group">
                      <button
                        className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-200 rounded"
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
                          bg-black
                          rounded
                          opacity-0
                          group-hover:opacity-100
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
                  <div className="text-gray-500 dark:text-gray-400 text-sm">
                    아직 대화가 없습니다.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {conversations.map((conv) => {
                      const isActive = conv.id === activeConversationId;
                      return (
                        <div
                          key={conv.id}
                          onClick={() => {
                            setActiveConversationId(conv.id);
                            setActiveMenuId(null);
                          }}
                          className={`relative p-3 rounded-lg cursor-pointer transition-colors ${
                            isActive
                              ? "bg-black text-white"
                              : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100"
                          }`}
                        >
                          <div className="text-sm font-medium">
                            {conv.title}
                          </div>
                          <div
                            className={`text-xs mt-1 ${
                              isActive ? "text-gray-200" : "text-gray-500 dark:text-gray-300"
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
                            className="absolute top-2 right-2 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100 rounded focus:outline-none"
                          >
                            <i className="fas fa-ellipsis-v"></i>
                          </button>

                          {/* 점 세 개 눌렀을 때 나오는 드롭다운 메뉴 */}
                          {activeMenuId === conv.id && (
<<<<<<< HEAD
                            <div className="absolute top-8 right-2 w-32 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded shadow-md z-10">
                              {/* 이름 바꾸기 버튼 등 필요시 추가 */}
                              <button
                                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600 text-red-500"
=======
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
>>>>>>> hotfix/urgent-bug
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
              <div className="border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between bg-white dark:bg-gray-800">
                <div className="flex items-center">
                  {/* 목록이 숨겨진 경우 => 오픈 버튼(모바일 전용) */}
                  {!showList && (
                    <button
                      className="mr-3 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100 rounded"
                      onClick={toggleList}
                    >
                      <i className="fas fa-chevron-right"></i>
                    </button>
                  )}

                  <div className="h-2 w-2 rounded-full bg-green-400 mr-2"></div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    {activeConversation
                      ? activeConversation.title
                      : "AI 어시스턴트"}
                  </h3>
                </div>
                <div className="flex space-x-2">
                  {/* 다운로드 버튼 + 툴팁 */}
                  <div className="relative group">
                    <button
<<<<<<< HEAD
                      className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100 rounded"
=======
                      className="p-2 text-gray-500 hover:text-gray-700 rounded"
>>>>>>> hotfix/urgent-bug
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
<<<<<<< HEAD
                        -top-6
                        left-1/2
=======
                        -top-5
                        left-1/2
                        transform
>>>>>>> hotfix/urgent-bug
                        -translate-x-1/2
                      "
                    >
                      다운로드
                    </div>
                  </div>
                </div>
              </div>

<<<<<<< HEAD
              {/* 메시지 목록 */}
              <div
                id="chatContainer"
                className="flex-1 p-6 overflow-y-auto bg-white dark:bg-gray-800"
              >
                {!activeConversation ? (
                  <div className="text-gray-500 dark:text-gray-400">
=======
              {/* 메시지 목록 (스크롤) */}
              <div id="chatContainer" className="flex-1 p-6 overflow-y-auto">
                {!activeConversation ? (
                  <div className="text-gray-500">
>>>>>>> hotfix/urgent-bug
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
                              <div className="h-8 w-8 rounded-full bg-custom flex items-center justify-center text-white">
                                <i className="fas fa-robot"></i>
                              </div>
                            </div>
                          )}
                          <div
                            className={`${
                              isUser
                                ? "bg-custom text-white"
                                : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 ml-3"
                            } rounded-lg p-4 max-w-3xl ${
                              isUser ? "mr-3" : ""
                            }`}
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
              <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
                <div className="flex items-center">
                  <textarea
                    className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg resize-none px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-custom"
                    placeholder={
                      activeConversation
<<<<<<< HEAD
                        ? "메시지를 입력해주세요. (Enter로 전송)"
=======
                        ? "메시지를 입력해주세요. "
>>>>>>> hotfix/urgent-bug
                        : "대화를 먼저 선택해주세요."
                    }
                    rows={2}
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
                    className="rounded-button ml-4 bg-custom text-white px-6 py-2 hover:bg-custom/90 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
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

      {/* 개인정보법 안내 오버레이 */}
      {privacyOpen && (
        <PrivacyOverlay open={privacyOpen} onClose={handleClosePrivacy} />
      )}
    </div>
  );
}

export default ChatbotPage;