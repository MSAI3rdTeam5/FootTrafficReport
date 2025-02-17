import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Settings, User } from "lucide-react";

export default function LogoutDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    // 인증 토큰(예: authToken)이 저장되어 있다면 제거
    localStorage.removeItem("authToken");
    // 필요에 따라 다른 인증 관련 데이터를 삭제할 수도 있습니다.

    // 로그인 페이지로 리다이렉트
    navigate("/login");
  };

  return (
    <div className="relative inline-block text-left">
      <button
        className="p-2 rounded-full hover:bg-gray-100"
        onClick={() => setIsOpen(!isOpen)}
      >
        <i className="fas fa-user text-gray-600"></i>
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-lg p-2 z-50">
          <button className="flex items-center w-full px-4 py-2 text-gray-700 hover:bg-gray-100">
            <User className="w-4 h-4 mr-2" /> 내 프로필
          </button>
          <button className="flex items-center w-full px-4 py-2 text-gray-700 hover:bg-gray-100">
            <Settings className="w-4 h-4 mr-2" /> 설정
          </button>
          <hr className="my-1" />
          <button
            className="flex items-center w-full px-4 py-2 text-red-600 hover:bg-gray-100"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" /> 로그아웃
          </button>
        </div>
      )}
    </div>
  );
}
