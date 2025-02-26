import React, { useState, useEffect, useCallback, useMemo, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from "../context/AppContext";  // AppContext import 추가

function NoMonitoring() {
  const navigate = useNavigate();
  const { cctvId } = useContext(AppContext);  // cctvId 가져오기

  // 컴포넌트 마운트 시 cctvId 체크
  useEffect(() => {
    if (!cctvId) {
      console.warn("No cctvId found, redirecting to monitor");
      navigate("/monitor");
    }
  }, [cctvId, navigate]);

  // 상태 관리
  const [currentTime, setCurrentTime] = useState("");
  const [logs, setLogs] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 탭 상태: "realtime" / "mosaic"
  const [activeTab, setActiveTab] = useState("realtime");

  // ------------------------------------------------------------
  // (A) 시계 / 로그 주기적 fetch
  // ------------------------------------------------------------
  const fetchLogs = useCallback(async () => {
    if (!cctvId) {  // cctvId가 없으면 monitor로 리다이렉트
      navigate("/monitor");
      return;
    }

    try {
      const response = await fetch(`/api/cctv_data/${cctvId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch logs');
      }
      const data = await response.json();

      setLogs((prevLogs) => {
        const newLogs = [...data, ...prevLogs];
        const uniqueLogs = newLogs.filter(
          (log, index, self) =>
            index === self.findIndex((t) => t.cctv_id === log.cctv_id && t.person_label === log.person_label)
        );
        uniqueLogs.sort(
          (a, b) => new Date(b.detected_time) - new Date(a.detected_time)
        );
        return uniqueLogs.slice(0, 50);
      });
    } catch (error) {
      console.error("로그 데이터 가져오기 실패:", error);
    }
  }, [cctvId, navigate]);

  useEffect(() => {
    // 시계
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString("ko-KR", { hour12: true }));
    };
    updateClock();
    const clockTimer = setInterval(updateClock, 1000);

    // logs 5초마다
    fetchLogs();
    const logTimer = setInterval(fetchLogs, 5000);

    return () => {
      clearInterval(clockTimer);
      clearInterval(logTimer);
    };
  }, [fetchLogs]);

  // ------------------------------------------------------------
  // (B) 로그 메세지 변환
  // ------------------------------------------------------------
  const getLogMessage = useCallback((log) => {
    return `카메라 #${log.cctv_id}에서 ID_${log.person_label}, ${log.gender}, ${log.age} 감지됨.`;
  }, []);

  // ------------------------------------------------------------
  // (C) 이미지 모달
  // ------------------------------------------------------------
  const handleImageClick = useCallback((image_url) => {
    setSelectedImage(image_url);
    setIsModalOpen(true);
  }, []);

  const ImageModal = useMemo(() => {
    return ({ image_url, onClose }) => (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 dark:text-gray-200 p-4 rounded-lg max-w-3xl max-h-3xl border border-gray-200 dark:border-gray-700">
          <img
            src={image_url}
            alt="감지 이미지"
            className="max-w-full max-h-full object-contain"
          />
          <button
            onClick={onClose}
            className="mt-4 bg-red-500 text-white px-4 py-2 rounded"
          >
            닫기
          </button>
        </div>
      </div>
    );
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col">
      {/* 헤더 */}
      <header className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            모니터링
          </h2>
          <span className="bg-yellow-500 px-2 py-1 rounded-full text-white text-sm">
            연결 대기중
          </span>
        </div>
        <div className="flex items-center space-x-4 text-gray-800 dark:text-gray-200">
          <span className="text-md">{currentTime}</span>
          <button
            onClick={() => navigate("/monitor")}
            className="rounded bg-black text-white px-4 py-2"
          >
            <i className="fas fa-times mr-2"></i>닫기
          </button>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden"> {/* overflow-hidden 추가 */}
        {/* 왼쪽: 알림 영역 */}
        <div className="flex-1 p-4 flex flex-col overflow-auto"> {/* overflow-auto 추가 */}
          <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg p-8 flex flex-col items-center justify-center">
            <i className="fas fa-video-slash text-6xl text-gray-400 mb-4"></i>
            <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-2">
              연결된 카메라가 없습니다
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-center mb-4">
              카메라를 연결하면 실시간 영상을 확인할 수 있습니다
            </p>
            <button
              onClick={() => navigate("/monitor")}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              카메라 연결하기
            </button>
          </div>
        </div>

        {/* 오른쪽: 로그 패널 */}
        <div className="w-full md:w-96 bg-white dark:bg-gray-800 dark:text-gray-200 p-6 shadow-lg border-t md:border-t-0 md:border-l border-gray-200 dark:border-gray-700 flex flex-col h-[calc(100vh-4rem)]"> {/* 높이 설정 추가 */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              실시간 로그
            </h3>
            <div className="flex items-center space-x-2">
              <select className="rounded bg-gray-100 dark:bg-gray-700 dark:text-gray-200 px-3 py-1 text-sm border-none">
                <option>모든 이벤트</option>
                <option>움직임 감지</option>
                <option>알림</option>
              </select>
              <button
                className="rounded bg-black text-white px-3 py-1 text-sm"
                onClick={() => {
                  setLogs([]);
                  fetchLogs();
                }}
              >
                <i className="fas fa-sync-alt"></i>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800">
            {logs.map((log) => (
              <div
                key={log.id}
                className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-300">
                    {new Date(log.detected_time).toLocaleTimeString("ko-KR", {
                      hour12: true,
                    })}
                  </span>
                  <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 text-xs px-2 py-1 rounded-full">
                    감지
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-700 dark:text-gray-200">
                  {log.person_label ? getLogMessage(log) : "Unknown event"}
                </p>
                {log.image_url && (
                  <button
                    onClick={() => handleImageClick(log.image_url)}
                    className="mt-2 text-blue-600 dark:text-blue-300 hover:underline"
                  >
                    감지된 이미지 보기
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 이미지 모달 */}
      {isModalOpen && (
        <ImageModal
          image_url={selectedImage}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}

export default NoMonitoring;
