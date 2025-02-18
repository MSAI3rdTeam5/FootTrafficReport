import { useEffect, useState } from "react";
import Plyr from "plyr";
import "plyr/dist/plyr.css";

const CCTVMonitoring = ({ selectedCamera, onClose }) => {
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const player = new Plyr("#player", {
      controls: ["play", "progress", "current-time", "volume", "settings"],
    });

    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString("ko-KR"));
    };

    const interval = setInterval(updateTime, 1000);
    updateTime();

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 flex bg-gray-100 font-sans">
      <div className="flex-1 p-6 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-bold">{selectedCamera.name}</h2>
            <span className="bg-green-500 px-2 py-1 rounded-full text-white text-sm">
              라이브
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-lg">{currentTime}</span>
            <button
              onClick={onClose}
              className="rounded bg-custom text-white px-4 py-2"
            >
              <i className="fas fa-times mr-2"></i>닫기
            </button>
          </div>
        </div>

        <div className="flex-1 bg-black rounded-lg overflow-hidden relative">
          <video id="player" playsInline controls>
            <source src={selectedCamera.videoSrc} type="video/mp4" />
          </video>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center space-x-4">
                <button className="rounded bg-red-600 hover:bg-red-700 px-4 py-2">
                  <i className="fas fa-circle mr-2"></i>녹화 시작
                </button>
                <button className="rounded bg-blue-600 hover:bg-blue-700 px-4 py-2">
                  <i className="fas fa-camera mr-2"></i>스냅샷
                </button>
              </div>
              <div className="flex items-center space-x-4">
                <select className="rounded bg-gray-800 text-white px-4 py-2 border-none">
                  <option>HD (720p)</option>
                  <option>FHD (1080p)</option>
                  <option>4K (2160p)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 space-x-4">
          <div className="flex space-x-2">
            <button className="rounded bg-custom text-white px-4 py-2">
              <i className="fas fa-th mr-2"></i>화면 분할
            </button>
            <button className="rounded bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2">
              <i className="fas fa-exclamation-triangle mr-2"></i>긴급 상황
            </button>
          </div>
          <div className="flex space-x-2">
            <button className="rounded bg-gray-600 hover:bg-gray-700 text-white px-4 py-2">
              <i className="fas fa-chevron-left mr-2"></i>이전 카메라
            </button>
            <button className="rounded bg-gray-600 hover:bg-gray-700 text-white px-4 py-2">
              다음 카메라<i className="fas fa-chevron-right ml-2"></i>
            </button>
          </div>
        </div>
      </div>

      <div className="w-96 bg-white p-6 shadow-lg overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">실시간 로그</h3>
          <div className="flex items-center space-x-2">
            <select className="rounded bg-gray-100 px-3 py-1 text-sm border-none">
              <option>모든 이벤트</option>
              <option>움직임 감지</option>
              <option>알림</option>
            </select>
            <button className="rounded bg-custom text-white px-3 py-1 text-sm">
              <i className="fas fa-sync-alt"></i>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3">
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">14:32:15</span>
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                움직임 감지
              </span>
            </div>
            <p className="mt-1 text-sm">
              북쪽 출입구에서 움직임이 감지되었습니다.
            </p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">14:30:22</span>
              <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                알림
              </span>
            </div>
            <p className="mt-1 text-sm">시스템 점검이 완료되었습니다.</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">14:28:05</span>
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                정상
              </span>
            </div>
            <p className="mt-1 text-sm">카메라 1 스트리밍이 시작되었습니다.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CCTVMonitoring;
