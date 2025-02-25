import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// 상대 시간 문자열을 계산하는 함수
function getRelativeTime(timestamp) {
    const now = Date.now();
    const diff = now - new Date(timestamp).getTime();
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;
  
    if (diff < minute) {
      return "방금";
    } else if (diff < hour) {
      const minutes = Math.floor(diff / minute);
      return `${minutes}분 전`;
    } else if (diff < day) {
      const hours = Math.floor(diff / hour);
      return `${hours}시간 전`;
    } else {
      const days = Math.floor(diff / day);
      return `${days}일 전`;
    }
  }

function NotificationPanel() {
    const navigate = useNavigate();

    // 현재 시간을 state에 저장하여, 매 분마다 업데이트
    const [currentTime, setCurrentTime] = useState(Date.now());

    useEffect(() => {
        const interval = setInterval(() => {
        setCurrentTime(Date.now());
        }, 60000);

        return () => clearInterval(interval);
    }, []);


    const [notifications, setNotifications] = useState([
        {
          id: 1,
          text: "사용방법 숙지해주세요 ~ ",
          createdAt: new Date().toISOString(),
          target: "/guide",
          unread: true, // 처음엔 'unread = true'
        },
        // 필요하다면 다른 알림도 추가
      ]);
    
    // 알림 항목 클릭 시
    const handleNotificationClick = (clickedNotification) => {
        // 1) 페이지 이동
        if (clickedNotification.target) {
        navigate(clickedNotification.target);
        }

        // 2) 알림 상태 업데이트 (unread → false)
        setNotifications((prev) =>
        prev.map((n) =>
            n.id === clickedNotification.id ? { ...n, unread: false } : n
        )
        );
    };

  return (
    <div className="fixed top-16 right-0 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lm font-medium">알림</h3>
        <button className="text-xs text-gray-600 hover:text-custom !rounded-button">
          전체 읽음 표시
        </button>
      </div>

      {/* 알림 목록 */}
      {/* 알림 목록 */}
      <div className="max-h-96 overflow-y-auto">
        {notifications.map((notification) => {
          // unread가 false이면 이미 읽은 상태이므로 배경을 회색으로
          // 예: bg-gray-200, 또는 원하는 색상
          const itemBg = notification.unread ? "bg-white" : "bg-gray-200";

          return (
            <div
              key={notification.id}
              // 배경색 + hover 효과
              className={`p-4 border-b border-gray-100 flex items-start space-x-3 cursor-pointer hover:bg-gray-50 ${itemBg}`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div
                className={`w-2 h-2 rounded-full mt-2 ${
                  notification.unread ? "bg-blue-500" : "bg-gray-300"
                }`}
              ></div>
              <div className="flex-1">
                <p className="text-gray-800">{notification.text}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {getRelativeTime(notification.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* 하단 영역 */}
      <div className="p-4 text-center">
        <a
          href="#"
          className="text-custom hover:text-custom-dark text-sm font-medium"
        >
          모든 알림 보기
        </a>
      </div>
    </div>
  );
}

export default NotificationPanel;