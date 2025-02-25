// /home/azureuser/FootTrafficReport/frontend/client/src/App.jsx

import React from "react";
import { Routes, Route } from "react-router-dom";
import { AppProvider } from "./context/AppContext";

// 페이지들
import Login from "./pages/Login";
import Monitor from "./pages/Monitor";
import Dashboard from "./pages/Dashboard";
import Guide from "./pages/Guide";
import AiInsight from "./pages/AiInsight";
import LiveStreamPlayer from "./pages/LiveStreamPlayer";
import Chatbot from "./pages/Chatbot";
import GuidePage from "./pages/Chatbot_guide";
import CCTVMonitoring from "./pages/CCTVMonitoring";
import Signup from "./pages/Signup";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <AppProvider>
      <Routes>
        {/* "/" - 로그인 화면 */}
        <Route path="/" element={<Login />} />

        {/* "/signup" - 회원가입 */}
        <Route path="/signup" element={<Signup />} />

        {/* 모니터 */}
        <Route path="/monitor" element={<ProtectedRoute><Monitor /></ProtectedRoute>} />

        {/* AI 인사이트 */}
        <Route path="/ai-insight" element={<ProtectedRoute><AiInsight /></ProtectedRoute>} />

        {/* 챗봇/가이드 */}
        <Route path="/chatbotpage" element={<ProtectedRoute><Chatbot /></ProtectedRoute>} />
        <Route path="/chatbot" element={<ProtectedRoute><GuidePage /></ProtectedRoute>} />

        {/* 통계 */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

        {/* 사용 방법 */}
        <Route path="/guide" element={<ProtectedRoute><Guide /></ProtectedRoute>} />

        {/* LiveStreamPlayer */}
        <Route path="/live" element={<ProtectedRoute><LiveStreamPlayer /></ProtectedRoute>} />

        {/* (NEW) CCTVMonitoring - props 없이 */}
        <Route
          path="/cctv-monitoring"
          element={
            <ProtectedRoute>
              <CCTVMonitoring />
            </ProtectedRoute>
          }
        />
      </Routes>
    </AppProvider>
  );
}

export default App;
