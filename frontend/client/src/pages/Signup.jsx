import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "", name: "" });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };


  // 폼 제출 -> 회원가입 로직
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // 1) 기존 회원 목록 가져와서 이메일 중복 검사
      //    Python 백엔드의 GET /api/members 로 전체 목록
      const getResponse = await fetch("/api/members", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (!getResponse.ok) {
        alert("회원 정보를 불러오지 못했습니다.");
        return;
      }
      
      const members = await getResponse.json();
      const emailExists = members.some(
        (member) => member.email === formData.email
      );
      if (emailExists) {
        alert("이미 존재하는 이메일입니다.");
        return;
      }
      
      // 2) 이메일 중복이 없으면 회원 생성 요청 (POST /api/members)
      const response = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData), // { email, password, name }
      });

      if (!response.ok) {
        alert("회원가입 실패");
        return;
      }

      // 3) 회원가입 성공
      const data = await response.json();
      console.log("Signup success response:", data);
      alert("회원가입 성공!");

      // 회원가입 후 로그인 페이지로 이동
      navigate("/");
    } catch (error) {
      console.error(error);
      alert("오류 발생");
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-black dark:text-white mb-2">회원가입</h1>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-8">계정을 생성하세요</p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"
                >
                  이름
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  onChange={handleChange}
                  value={formData.name}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md placeholder-gray-400 focus:outline-none focus:ring-black focus:border-black text-sm dark:bg-gray-700 dark:text-gray-200"
                  placeholder="이름을 입력하세요"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"
                >
                  이메일
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  onChange={handleChange}
                  value={formData.email}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md placeholder-gray-400 focus:outline-none focus:ring-black focus:border-black text-sm dark:bg-gray-700 dark:text-gray-200"
                  placeholder="이메일 주소를 입력하세요"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"
                >
                  비밀번호
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  onChange={handleChange}
                  value={formData.password}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md placeholder-gray-400 focus:outline-none focus:ring-black focus:border-black text-sm dark:bg-gray-700 dark:text-gray-200"
                  placeholder="비밀번호를 입력하세요"
                />
              </div>

              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 text-sm font-medium rounded-md text-white bg-black hover:bg-gray-800 focus:outline-none"
              >
                회원가입
              </button>
            </form>
          </div>
        </div>
      </div>

      <footer className="py-4 text-center text-gray-500 dark:text-gray-400 text-sm">
        <p>&copy; 2024 I See U. All rights reserved.</p>
        <p className="mt-1">Version 1.0.0</p>
      </footer>
    </div>
  );
}

export default Signup;