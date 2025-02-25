import React from "react";
import { useNavigate } from "react-router-dom";

function SettingsPanel({ profile }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    // 로그아웃 로직 추가 가능 (예: localStorage 클리어, 세션 삭제 등)
    localStorage.clear(); // 저장된 사용자 데이터 삭제
    navigate('/'); // 로그인 페이지로 리다이렉션
  };

  return (
    <div className="fixed top-16 right-0 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 z-50">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">설정</h3>
      </div>

      <div className="p-4">
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-500 dark:text-gray-400">이메일</label>
            <p className="text-gray-900 dark:text-white">{profile?.email || "이메일 없음"}</p>
          </div>
          
          <div>
            <label className="text-sm text-gray-500 dark:text-gray-400">구독 플랜</label>
            <p className="text-gray-900 dark:text-white">
              {profile?.subscription_plan || "구독 정보 없음"}
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <button 
          onClick={handleLogout}
          className="w-full px-4 py-2 text-sm text-white bg-red-500 rounded-md hover:bg-red-600 transition-colors"
        >
          로그아웃
        </button>
      </div>
    </div>
  );
}

export default SettingsPanel;
