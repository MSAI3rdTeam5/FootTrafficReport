import React from "react";
import { Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Signup from "./pages/Signup"; // 추가: Signup 페이지 import
import Monitor from "./pages/Monitor";
import Dashboard from "./pages/Dashboard";
import Guide from "./pages/Guide";
import AiInsight from "./pages/AiInsight";
import LiveStreamPlayer from "./pages/LiveStreamPlayer";
import Chatbot from "./pages/Chatbot";
import GuidePage from "./pages/Chatbot_guide";

function App() {
  return (
    <Routes>
      {/* "/" - 로그인 화면 */}
      <Route path="/" element={<Login />} />

      {/* "/login" - 로그인 화면 명시적 경로 추가 */}
      <Route path="/login" element={<Login />} />

      {/* "/signup" - 회원가입 화면 */}
      <Route path="/signup" element={<Signup />} />

      {/* "/monitor" - 내 모니터링 화면 */}
      <Route path="/monitor" element={<Monitor />} />

      {/* "/ai-insight" - AI 인사이트 화면 */}
      <Route path="/ai-insight" element={<AiInsight />} />

      {/* "/chatbotpage" - 챗봇 가이드(메인) 페이지 */}
      <Route path="/chatbot" element={<GuidePage />} />

      {/* "/chatbot" - 챗봇 화면 */}
      <Route path="/chatbotpage" element={<Chatbot />} />

      {/* "/dashboard" - 통계 분석 화면 */}
      <Route path="/dashboard" element={<Dashboard />} />

      {/* "/guide" - 사용 방법 화면 */}
      <Route path="/guide" element={<Guide />} />

      {/* 새로 추가한 LiveStreamPlayer 라우트 */}
      <Route path="/live" element={<LiveStreamPlayer />} />
    </Routes>
  );
}

export default App;
