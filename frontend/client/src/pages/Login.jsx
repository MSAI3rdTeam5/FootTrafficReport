import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { loginUser } from "../utils/auth";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  // 일반 로그인 폼 제출
  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await loginUser(email, password);
      navigate("/monitor");
    } catch (error) {
<<<<<<< HEAD
      alert("Login failed.");
=======
      alert("로그인에 실패했습니다. 아이디/비밀번호를 다시 확인해주세요.");
>>>>>>> hotfix
    }
  };

  // Google One-Tap 로그인 성공 시
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      // Google One-Tap을 통해 발급받은 credential을 Node (또는 Python) /api/google-login에 POST 요청
      const response = await fetch("https://msteam5iseeu.ddns.net/api/google-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ credential: credentialResponse.credential }),
      });
      if (!response.ok) throw new Error("Login failed");
      const data = await response.json();
      // 성공하면 토큰을 Node 측에서 세션으로 처리하거나, 백엔드가 JWT를 반환할 수 있음
      // 여기서는 예시로 JWT가 반환된다고 가정:
      localStorage.setItem("access_token", data.access_token);
      navigate("/monitor");
    } catch (error) {
      console.error("Google Login Error:", error);
      alert("Google Login failed.");
    }
  };


  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen flex flex-col">
      {/* 중앙 영역 */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* 상단 로고/타이틀 영역 */}
          <div className="text-center">
            <h1 className="text-4xl font-bold text-custom mb-2">I See U</h1>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-8">
              CCTV 영상 분석 솔루션
            </p>
          </div>

          {/* 로그인 폼 영역 */}
          <div className="bg-white dark:bg-gray-800 dark:text-gray-200 p-8 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 transition-colors">
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
                    className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-button placeholder-gray-400 dark:bg-gray-700 dark:text-gray-200 focus:outline-none focus:ring-custom focus:border-custom text-sm"
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
                    className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-button placeholder-gray-400 dark:bg-gray-700 dark:text-gray-200 focus:outline-none focus:ring-custom focus:border-custom text-sm"
                    placeholder="비밀번호를 입력하세요"
                  />
                </div>
              </div>

              {/* 로그인 버튼 */}
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 text-sm font-medium rounded-button text-white bg-custom hover:bg-custom/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-custom"
              >
                로그인
              </button>
            </form>

            <div className="mt-6 flex items-center justify-between">
              <Link
                to="/signup"
                className="text-sm text-custom hover:text-custom/90"
              >
                회원가입
              </Link>
              <a href="#" className="text-sm text-custom hover:text-custom/90">
                비밀번호 찾기
              </a>
            </div>

            {/* 소셜 로그인 섹션 */}
            <div className="mt-6 border-t border-gray-200 dark:border-gray-600 pt-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                또는 소셜 계정으로 로그인
              </p>
              <div className="flex flex-col items-center space-y-2">
                {/* 1) 구글 로그인 버튼 (@react-oauth/google) */}
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => console.error("Google Login Error")}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 푸터 영역 */}
      <footer className="py-4 text-center text-gray-500 dark:text-gray-400 text-sm">
<<<<<<< HEAD
        <p>&copy; 2024 I See U. All rights reserved.</p>
=======
        <p>&copy; 2025 I See U. All rights reserved.</p>
>>>>>>> hotfix
        <p className="mt-1">Version 1.0.0</p>
      </footer>
    </div>
  );
}

export default Login;
