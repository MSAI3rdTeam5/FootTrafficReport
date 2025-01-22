import React from "react";
import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

function App() {
  return (
    <Routes>
      {/* "/" 경로 → 로그인 화면 */}
      <Route path="/" element={<Login />} />

      {/* "/dashboard" 경로 → 새 대시보드 화면 */}
      <Route path="/dashboard" element={<Dashboard />} />
    </Routes>
  );
}

export default App;
