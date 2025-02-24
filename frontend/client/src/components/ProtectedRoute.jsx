// client/src/components/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import {getAccessToken} from "../utils/auth";

function ProtectedRoute({ children }) {
  // localStorage 등에 저장된 토큰(또는 세션) 체크
  const token = getAccessToken();
  if (!token) {
    // 토큰이 없으면 로그인 페이지로 리다이렉트
    return <Navigate to="/" replace />;
  }
  return children; // 정상 접근 -> 원래 컴포넌트 렌더
}

export default ProtectedRoute;