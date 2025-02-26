import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { loginUser } from "../utils/auth";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginStage, setLoginStage] = useState("idle"); // "idle" | "loading" | "success"

  const navigate = useNavigate();

  // 일반 로그인 폼 제출
  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoginStage("loading");
    try {
      await loginUser(email, password);
      // 로그인 성공
      setLoginStage("success");
      setTimeout(() => {
        navigate("/monitor");
      }, 1200);
    } catch (error) {
      alert("로그인에 실패했습니다. 아이디/비밀번호를 다시 확인해주세요.");
      setLoginStage("idle");
    }
  };

  // Google 로그인 성공
  const handleGoogleSuccess = async (credentialResponse) => {
    setLoginStage("loading");
    try {
      const response = await fetch("https://msteam5iseeu.ddns.net/api/google-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ credential: credentialResponse.credential }),
      });
      if (!response.ok) throw new Error("Login failed");
      const data = await response.json();

      localStorage.setItem("access_token", data.access_token);

      setLoginStage("success");
      setTimeout(() => {
        navigate("/monitor");
      }, 1200);

    } catch (error) {
      console.error("Google Login Error:", error);
      alert("Google Login failed.");
      setLoginStage("idle");
    }
  };

  // 버튼 텍스트
  let buttonText = "로그인";
  if (loginStage === "loading") {
    buttonText = "확인 중...";
  }

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden bg-transparent dark:bg-transparent">
      {/* (1) 파도 배경 */}
      <div className="wave-bg"></div>

      {/* (2) 메인 콘텐츠 영역 */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 relative z-10 fade-in-up">
        {/* (3) 로그인 카드 */}
        <div
          className={`
            max-w-md w-full space-y-8
            bg-white dark:bg-gray-800 dark:text-gray-200
            p-8 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700
            transition-colors
            ${loginStage === "success" ? "animate-successModal" : ""}
          `}
        >
          {/* 상단 로고 / 타이틀 */}
          <div className="text-center">
            <h1 className="text-4xl font-bold text-custom mb-2">I See U</h1>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-8">
              CCTV 영상 분석 솔루션
            </p>
          </div>

          {/* (4) 로그인 폼 */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* 아이디 입력 */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                아이디
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="fas fa-user text-gray-400 dark:text-gray-500"></i>
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loginStage === "loading" || loginStage === "success"}
                  className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600
                             rounded-button placeholder-gray-400 dark:bg-gray-700 dark:text-gray-200
                             focus:outline-none focus:ring-custom focus:border-custom text-sm"
                  placeholder="이메일 주소를 입력하세요"
                />
              </div>
            </div>

            {/* 비밀번호 입력 */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                비밀번호
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="fas fa-lock text-gray-400 dark:text-gray-500"></i>
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loginStage === "loading" || loginStage === "success"}
                  className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600
                             rounded-button placeholder-gray-400 dark:bg-gray-700 dark:text-gray-200
                             focus:outline-none focus:ring-custom focus:border-custom text-sm"
                  placeholder="비밀번호를 입력하세요"
                />
              </div>
            </div>

            {/* (5) 카메라 프레임 버튼 */}
            <button
              type="submit"
              disabled={loginStage === "loading" || loginStage === "success"}
              className={`
                btn-camera-shutter
                ripple
                camera-shutter
                relative
                ${loginStage === "loading" || loginStage === "success" ? "cursor-not-allowed opacity-70" : ""}
              `}
            >
              {/* (A) 4개 라인 (사각형 테두리) */}
              <div className="line line-top"></div>
              <div className="line line-right"></div>
              <div className="line line-bottom"></div>
              <div className="line line-left"></div>

              {/* (B) 버튼 문구 2개 ("로그인" / "I See U") */}
              <span className="button-text">
                <span className="login-label">{buttonText}</span>
                <span className="isee-label">I See U</span>
              </span>
            </button>
          </form>

          {/* 회원가입 / 비번 찾기 */}
          <div className="mt-6 flex items-center justify-between">
            <Link
              to="/signup"
              className="text-sm text-custom hover:text-custom/90 link-hover"
            >
              회원가입
            </Link>
            <a href="#" className="text-sm text-custom hover:text-custom/90 link-hover">
              비밀번호 찾기
            </a>
          </div>

          {/* 소셜 로그인 */}
          <div className="mt-6 border-t border-gray-200 dark:border-gray-600 pt-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              또는 소셜 계정으로 로그인
            </p>
            <div className="flex flex-col items-center space-y-2">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => {
                  console.error("Google Login Error");
                  alert("Google Login failed.");
                }}
              />
            </div>
          </div>

          {/* (6) 로그인 성공 메시지 */}
          {loginStage === "success" && (
            <div className="text-center mt-6 text-green-600 text-xl font-semibold">
              <i className="fas fa-check-circle mr-2"></i>
              로그인 성공!
            </div>
          )}
        </div>
      </div>

      {/* (7) 푸터 */}
      <footer className="py-4 text-center text-gray-500 dark:text-gray-400 text-sm">
        <p>&copy; 2025 I See U. All rights reserved.</p>
        <p className="mt-1">Version 1.0.0</p>
      </footer>
    </div>
  );
}

export default Login;
