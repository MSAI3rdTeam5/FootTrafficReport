// /home/azureuser/FootTrafficReport/frontend/client/src/App.jsx

import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// 전역 Context (AppContext) import
import { AppProvider } from "./context/AppContext";

// 기존 페이지들 import
import Login from "./pages/Login";
import Monitor from "./pages/Monitor";
import Dashboard from "./pages/Dashboard";
import Guide from "./pages/Guide";
import AiInsight from "./pages/AiInsight";
import LiveStreamPlayer from "./pages/LiveStreamPlayer";
// import Chatbot from "./pages/Chatbot";
// import GuidePage from "./pages/Chatbot_guide";

// 새로 추가한 CCTVMonitoring
import CCTVMonitoring from "./pages/CCTVMonitoring";
import Signup from "./pages/Signup";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    // (1) 전역 상태 관리를 위해 <AppProvider>로 전체 라우트를 감싼다.
    <AppProvider>
      <Routes>
        {/* "/" - 로그인 화면 */}
        <Route path="/" element={<Login />} />

        {/* "/signup" - 회원가입 화면 */}
        <Route path="/signup" element={<Signup />} />

        {/* "/monitor" - 내 모니터링 화면 */}
        <Route path="/monitor" element={<ProtectedRoute><Monitor /></ProtectedRoute>} />

        {/* "/ai-insight" - AI 인사이트 화면 */}
        <Route path="/ai-insight" element={<ProtectedRoute><AiInsight /></ProtectedRoute>} />

        {/* "/chatbotpage" - 챗봇 가이드(메인) 페이지 */}
        {/* <Route path="/chatbot" element={<ProtectedRoute><GuidePage /></ProtectedRoute>} /> */}

        {/* "/chatbot" - 챗봇 화면 */}
        {/* <Route path="/chatbotpage" element={<ProtectedRoute><Chatbot /></ProtectedRoute>} /> */}

        {/* "/dashboard" - 통계 분석 화면 */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

        {/* "/guide" - 사용 방법 화면 */}
        <Route path="/guide" element={<ProtectedRoute><Guide /></ProtectedRoute>} />

        {/* 새로 추가한 LiveStreamPlayer 라우트 */}
        <Route path="/live" element={<ProtectedRoute><LiveStreamPlayer /></ProtectedRoute>} />

        {/* (NEW) "/cctv-monitoring" - CCTV 모니터링 화면 */}
        <Route
          path="/cctv-monitoring"
          element={
            <ProtectedRoute>
              <CCTVMonitoring
                selectedCamera={{ name: "임시 카메라", videoSrc: "/videos/05_seoul.mp4" }}
                onClose={() => console.log("Close!")}
                onSwitchDevice={(idx) => console.log("Switch device:", idx)}
              />
            </ProtectedRoute>
          }
        />
      </Routes>
    </AppProvider>
  );
}

export default App;
