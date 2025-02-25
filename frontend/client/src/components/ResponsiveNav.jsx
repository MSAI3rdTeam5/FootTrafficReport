import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { getMemberProfile } from "../utils/api";
import NotificationPanel from "./Notification";

function ResponsiveNav({ onOpenPrivacy }) {

  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  //알림 패널 표시 여부
  const [showNotifications, setShowNotifications] = useState(false);

  const handleNotificationToggle = () => {
    setShowNotifications((prev) => !prev);
  };



  // 주석 해제하고 실제 프로필 정보 사용
  useEffect(() => {
    getMemberProfile()
      .then((data) => {
        setProfile(data);
      })
      .catch((err) => {
        console.error("Failed to get profile:", err);
        // 프로필 없을 때 profile를 null로 남겨두면 => 로그인 안 된 상태
      })
      .finally(() => {
        setLoadingProfile(false);
      });
  }, []);
  // NAV 바에 if (!profile) return <div>Loading...</div> 있으면 안됌!!
  // {profile.id} or {profile.email} or {profile.name} or {profile.subscription_plan} => 로그인 사용자 정보 변수
  
  // (1) 모바일 메뉴 열림/닫힘 상태
  const [menuOpen, setMenuOpen] = useState(false);

  // (2) 다크 모드 상태
  const [isDarkMode, setIsDarkMode] = useState(false);

  // (3) 라우팅 정보(현재 경로) 확인하여 Nav 탭 활성화할 때 사용 (선택 사항)
  const location = useLocation();

  const [privacyOpen, setPrivacyOpen] = useState(false);

  // 페이지 이동 시 모바일 메뉴 자동 닫기
  useEffect(() => {
    setMenuOpen(false);
    const storedMode = localStorage.getItem("darkMode") === "true";
    setIsDarkMode(storedMode);
    if (storedMode) {
      document.documentElement.classList.add("dark");
    }
  }, [location.pathname]);

  // (4) 다크 모드 토글 함수
  const toggleDarkMode = () => {
    // 내부 상태
    setIsDarkMode((prev) => {
        const newVal = !prev;
        if (newVal) document.documentElement.classList.add("dark");
        else document.documentElement.classList.remove("dark");
        localStorage.setItem("darkMode", newVal);
        return newVal;
      });
  };

  return (
    // Nav 배경: 다크 모드 시 "dark:bg-gray-800"
    <nav className="bg-white dark:bg-gray-800 shadow fixed w-full top-0 left-0 z-50">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between h-16 items-center">
        {/* Left: 로고/타이틀 */}
        <div className="flex items-center space-x-8">
          <Link 
              to="/monitor" 
              className="text-xl font-bold text-black dark:text-white"
            >
              I See U
            </Link>
          {/* Desktop Tabs (md 이상) */}
          <div className="hidden md:flex space-x-3">
            <NavLinkItem to="/monitor" label="내 모니터링" currentPath={location.pathname} />
            <NavLinkItem to="/dashboard" label="통계 분석" currentPath={location.pathname} />
            <NavLinkItem to="/ai-insight" label="AI 인사이트" currentPath={location.pathname} />
            <NavLinkItem to="/chatbot" label="챗봇" currentPath={location.pathname} />
            <NavLinkItem to="/guide" label="사용 방법" currentPath={location.pathname} />
            {/* 개인정보법 안내는 버튼 형태 */}
            <button 
                onClick={onOpenPrivacy} 
                className="nav-link px-3 py-2 dark:text-white"
            >
                개인정보법 안내
            </button>
          </div>
        </div>

        {/* Right section: 다크 모드 버튼 + 알림/설정/프로필 (md 이상에서 보임) */}
        <div className="hidden md:flex items-center space-x-4">
          {/* 다크 모드 토글 버튼 */}
          <button
            onClick={toggleDarkMode}
            className="px-3 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 dark:text-white"
          >
            {isDarkMode ? "Light Mode" : "Dark Mode"}
          </button>

          {/* 알림, 설정, 프로필 아이콘 (예시) */}
          <button
            onClick={handleNotificationToggle}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 relative"
          >
            <i className="fas fa-bell text-gray-600 dark:text-gray-200"></i>
          </button>
          <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
            <i className="fas fa-cog text-gray-600 dark:text-gray-200"></i>
          </button>
          <div className="ml-2 flex items-center">
            <img
              className="h-8 w-8 rounded-full"
              src="/기본프로필.png"
              alt="사용자 프로필"
            />
            <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-200">
              {profile?.name || "사용자"}
            </span>
          </div>
        </div>

        {/* 햄버거 버튼 (모바일) */}
        <div className="md:hidden flex items-center">
          {/* 다크 모드 버튼을 모바일에서도 보여주려면 여기에 배치할 수도 있음 */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 mr-2"
          >
            <i className={`fas ${isDarkMode ? "fa-sun" : "fa-moon"} text-gray-600 dark:text-gray-200`} />
          </button>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <i className="fas fa-bars text-gray-600 dark:text-gray-200"></i>
          </button>
        </div>
      </div>

       

      {/* Mobile Menu (md 미만) */}
      {menuOpen && (
        <div className="md:hidden bg-white dark:bg-gray-800 px-4 py-2 shadow">
          <NavLinkItem to="/monitor" label="내 모니터링" currentPath={location.pathname} mobile />
          <NavLinkItem to="/dashboard" label="통계 분석" currentPath={location.pathname} mobile />
          <NavLinkItem to="/ai-insight" label="AI 인사이트" currentPath={location.pathname} mobile />
          <NavLinkItem to="/chatbot" label="챗봇" currentPath={location.pathname} mobile />
          <NavLinkItem to="/guide" label="사용 방법" currentPath={location.pathname} mobile />
          <button 
            onClick={onOpenPrivacy}
            className="block w-full text-left py-2 border-b dark:border-gray-700 dark:text-white"
            >
            개인정보법 안내
          </button>

          {/* 모바일 하단에 알림/설정/프로필 아이콘도 표시할 수 있음 */}
          <div className="mt-3 border-t pt-2 flex items-center space-x-3 dark:border-gray-700">
            <button
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 relative"
            onClick={handleNotificationToggle}
          >
            <i className="fas fa-bell text-gray-600 dark:text-gray-200"></i>
          </button>
            <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
              <i className="fas fa-cog text-gray-600 dark:text-gray-200"></i>
            </button>
            <div className="flex items-center">
              <img
                className="h-8 w-8 rounded-full"
                src="/기본프로필.png"
                alt="사용자 프로필"
              />
              <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-200">
              {profile?.name || "사용자"}
              </span>
            </div>
          </div>
        </div>
      )}
        {showNotifications && <NotificationPanel />}

    </nav>
  );
}

export default ResponsiveNav;


/**
 * 보조 컴포넌트: NavLinkItem
 * Nav 탭에서 현재 경로(location.pathname)와 비교하여
 * 활성화된 탭(현재 페이지)인지 여부를 구분하기 위한 컴포넌트 예시.
 */
function NavLinkItem({ to, label, currentPath, mobile }) {
  const isActive = currentPath === to;
  return (
    <Link
      to={to}
      className={`${
        mobile ? "block w-full py-2 border-b" : "px-3 py-2"
      } ${
        isActive
          ? "bg-black text-white dark:bg-gray-700"
          : "text-gray-600 dark:text-gray-300"
      } hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors`}
      style={{ borderBottomColor: "rgba(229, 231, 235, 1)" }}
    >
      {label}
    </Link>
  );
}
