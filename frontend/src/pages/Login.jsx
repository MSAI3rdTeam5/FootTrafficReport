import React from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();

  // 폼 submit 시 호출 (예: 로그인 로직)
  const handleSubmit = (event) => {
    event.preventDefault();
    // TODO: 아이디/비번 검증 로직 등

    // 로그인 성공 시, 대시보드로 이동
    navigate("/dashboard");
  };

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      {/* 중앙 영역 */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* 상단 로고/타이틀 영역 */}
          <div className="text-center">
            <h1 className="text-4xl font-bold text-custom mb-2">I See U</h1>
            <p className="text-gray-600 text-sm mb-8">CCTV 영상 분석 솔루션</p>
          </div>

          {/* 로그인 폼 영역 */}
          <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  아이디
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i className="fas fa-user text-gray-400"></i>
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 !rounded-button placeholder-gray-400 focus:outline-none focus:ring-custom focus:border-custom text-sm"
                    placeholder="이메일 주소를 입력하세요"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  비밀번호
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i className="fas fa-lock text-gray-400"></i>
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 !rounded-button placeholder-gray-400 focus:outline-none focus:ring-custom focus:border-custom text-sm"
                    placeholder="비밀번호를 입력하세요"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-custom focus:ring-custom border-gray-300 !rounded"
                  />
                  <label
                    htmlFor="remember-me"
                    className="ml-2 block text-sm text-gray-700"
                  >
                    아이디 저장
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="auto-login"
                    name="auto-login"
                    type="checkbox"
                    className="h-4 w-4 text-custom focus:ring-custom border-gray-300 !rounded"
                  />
                  <label
                    htmlFor="auto-login"
                    className="ml-2 block text-sm text-gray-700"
                  >
                    자동 로그인
                  </label>
                </div>
              </div>

              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium !rounded-button text-white bg-custom hover:bg-custom/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-custom"
              >
                로그인
              </button>
            </form>

            <div className="mt-6 flex items-center justify-between">
              <a href="#" className="text-sm text-custom hover:text-custom/90">
                회원가입
              </a>
              <a href="#" className="text-sm text-custom hover:text-custom/90">
                비밀번호 찾기
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* 푸터 영역 */}
      <footer className="py-4 text-center text-gray-500 text-sm">
        <p>&copy; 2024 I See U. All rights reserved.</p>
        <p className="mt-1">Version 1.0.0</p>
      </footer>
    </div>
  );
}

export default Login;
