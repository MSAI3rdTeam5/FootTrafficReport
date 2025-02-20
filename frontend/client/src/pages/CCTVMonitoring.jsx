import { useEffect, useState } from "react";
import Plyr from "plyr";
import "plyr/dist/plyr.css";

const CCTVMonitoring = ({ selectedCamera, onClose }) => {
  const [currentTime, setCurrentTime] = useState("");
  const [logs, setLogs] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

    const fetchLogs = async () => {
      try {
        const response = await fetch("/api/cctv_data");
        const data = await response.json();
        setLogs((prevLogs) => [...data, ...prevLogs].slice(0, 50));
      } catch (error) {
        console.error("로그 데이터 가져오기 실패:", error);
      }
    };

    fetchLogs(); // 초기 로드
    const logInterval = setInterval(fetchLogs, 5000); // 5초마다 업데이트

    return () => {
      clearInterval(interval);
      clearInterval(logInterval);
    };
  }, []);

  const getLogMessage = (log) => {
    return `카메라 #${log.cctv_id}에서 ID_${log.person_label}, ${log.gender}, ${log.age}의 사람이 감지되었습니다.`;
  };

  const handleImageClick = (image_url) => {
    setSelectedImage(image_url);
    setIsModalOpen(true);
  };

  const ImageModal = ({ image_url, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-4 rounded-lg max-w-3xl max-h-3xl">
        <img
          src={image_url}
          alt="확대된 이미지"
          className="max-w-full max-h-full"
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
          {logs.map((log, index) => (
            <div key={index} className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  {new Date(log.detected_time).toLocaleTimeString()}
                </span>
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                  감지
                </span>
              </div>
              <p className="mt-1 text-sm">{getLogMessage(log)}</p>
              {log.image_url && (
                <button
                  onClick={() => handleImageClick(log.image_url)}
                  className="mt-2 text-blue-600 hover:underline"
                >
                  감지된 이미지 보기
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {isModalOpen && (
        <ImageModal
          image_url={selectedImage}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};

export default CCTVMonitoring;
