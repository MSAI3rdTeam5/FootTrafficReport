import React from "react";
import { useNavigate } from "react-router-dom";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";

function Login() {
  const navigate = useNavigate();

  // 로그인 폼(submit) 처리
  const handleSubmit = (event) => {
    event.preventDefault();
    // 실제 아이디/비번 검증 후 로그인 성공 시 호출:
    navigate("/monitor");
  };

  return (
    <GoogleOAuthProvider clientId="1034286793822-pmcb66u5e0beuagnnbiqhk503p3shkun.apps.googleusercontent.com">
      <div className="bg-gray-50 min-h-screen flex flex-col">
        {/* 중앙 영역 */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            {/* 상단 로고/타이틀 영역 */}
            <div className="text-center">
              <h1 className="text-4xl font-bold text-custom mb-2">I See U</h1>
              <p className="text-gray-600 text-sm mb-8">
                CCTV 영상 분석 솔루션
              </p>
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
                      className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-button placeholder-gray-400 focus:outline-none focus:ring-custom focus:border-custom text-sm"
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
                      className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-button placeholder-gray-400 focus:outline-none focus:ring-custom focus:border-custom text-sm"
                      placeholder="비밀번호를 입력하세요"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 text-sm font-medium rounded-button text-white bg-custom hover:bg-custom/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-custom"
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

              {/* 소셜 로그인 섹션 */}
              <div className="mt-6 border-t pt-4">
                <p className="text-xs text-gray-500 mb-3">
                  또는 소셜 계정으로 로그인
                </p>
                <div className="flex flex-col items-center space-y-2">
                  {/* 구글 로그인 버튼 */}
                  <GoogleLogin
                    useOneTap={false}
                    onSuccess={async (credentialResponse) => {
                      // 로그인 성공 여부 확인을 위한 구글 로그인 응답 처리
                      try {
                        const response = await fetch(
                          "https://msteam5iseeu.ddns.net/api/google-login",
                          {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json",
                            },
                            credentials: "include",
                            redirect: "manual", // 자동 리다이랙트 방지
                            body: JSON.stringify({
                              credential: credentialResponse.credential,
                              clientId:
                                "649549151225-agj4cnqnvrbn4r00581oliujgi58kqcb.apps.googleusercontent.com",
                            }),
                          }
                        );

                        if (!response.ok)
                          throw new Error(
                            `HTTP error! status: ${response.status}`
                          );

                        const data = await response.json();
                        console.log("Received data from server:", data); // 콘솔 로그 추가

                        if (data.success) {
                          // 로그인 성공 시 /monitor로 이동
                          navigate("/monitor");
                        }
                      } catch (error) {
                        console.error("Login process error:", error);
                      }
                    }}
                    onError={(error) => {
                      console.error("Google Login Error:", error);
                    }}
                  />

                  {/* 2) 페이스북 로그인 버튼 */}
                  <a
                    href="/auth/facebook"
                    className="relative inline-block w-[240px] h-[30px] hover:opacity-90"
                  >
                    <img
                      src="/facebook.png"
                      alt="Facebook 로그인"
                      className="absolute inset-0 w-full h-full object-contain"
                    />
                  </a>

                  {/* 3) 카카오 로그인 버튼 */}
                  <a
                    href="/auth/kakao"
                    className="relative inline-block w-[240px] h-[30px] hover:opacity-90"
                  >
                    <img
                      src="/kakao.png"
                      alt="Kakao 로그인"
                      className="absolute inset-0 w-full h-full object-contain"
                    />
                  </a>

                  {/* 4) 네이버 로그인 버튼 */}
                  <a
                    href="/auth/naver"
                    className="relative inline-block w-[240px] h-[30px] hover:opacity-90"
                  >
                    <img
                      src="/naver.png"
                      alt="Naver 로그인"
                      className="absolute inset-0 w-full h-full object-contain"
                    />
                  </a>
                </div>
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
    </GoogleOAuthProvider>
  );
}

export default Login;
