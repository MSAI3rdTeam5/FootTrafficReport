// /home/azureuser/FootTrafficReport/frontend/client/src/pages/CCTVMonitoring.jsx

import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
  useContext,
} from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";

function CCTVMonitoring({ selectedCamera, onSwitchDevice }) {
  const navigate = useNavigate();

  // 전역 Context에서 localStream, mosaicImageUrl 가져옴(2FPS)
  const { localStream, mosaicImageUrl } = useContext(AppContext);

  // 탭 상태: "realtime" / "mosaic"
  const [activeTab, setActiveTab] = useState("realtime");

  // 시계 표시
  const [currentTime, setCurrentTime] = useState("");

  // 로그
  const [logs, setLogs] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 녹화 관련
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordedChunks, setRecordedChunks] = useState([]);

  // WebRTC 영상 표시용 ref
  const cctvVideoRef = useRef(null);

  // 예시 카메라 목록
  const [devices] = useState(["cam1", "cam2"]);
  const [currentDeviceIndex, setCurrentDeviceIndex] = useState(0);
  const currentDevice = devices[currentDeviceIndex];

  // ------------------------------------------------------------
  // (A) 시계 / 로그 주기적 fetch
  // ------------------------------------------------------------
  const fetchLogs = useCallback(async () => {
    try {
      const response = await fetch("/api/cctv_data");
      if (!response.ok) throw new Error("Failed to fetch logs");
      const data = await response.json();
      console.log("Fetched logs:", data);

      setLogs((prevLogs) => {
        const newLogs = [...data, ...prevLogs];
        // 중복 제거
        const uniqueLogs = newLogs.filter(
          (log, index, self) =>
            index === self.findIndex((t) => t.id === log.id)
        );
        // 감지 시각 내림차순
        uniqueLogs.sort(
          (a, b) => new Date(b.detected_time) - new Date(a.detected_time)
        );
        return uniqueLogs.slice(0, 50);
      });
    } catch (error) {
      console.error("로그 데이터 가져오기 실패:", error);
    }
  }, []);

  useEffect(() => {
    // 시계
    const updateTime = () => {
      const now = new Date();
      // 12시간제 표기, 한국어, 오후/오전 등
      setCurrentTime(
        now.toLocaleTimeString("ko-KR", { hour12: true })
      );
    };
    updateTime();
    const timeInterval = setInterval(updateTime, 1000);

    // 로그 fetch 5초마다
    fetchLogs();
    const logInterval = setInterval(() => fetchLogs(), 5000);

    return () => {
      clearInterval(timeInterval);
      clearInterval(logInterval);
    };
  }, [fetchLogs]);

  // ------------------------------------------------------------
  // (B) WebRTC 스트림 연결
  // ------------------------------------------------------------
  useEffect(() => {
    if (!localStream) {
      console.warn("[CCTVMonitoring] No localStream => /monitor");
      navigate("/monitor");
      return;
    }
    if (cctvVideoRef.current) {
      cctvVideoRef.current.srcObject = localStream;
      cctvVideoRef.current
        .play()
        .catch((err) => console.warn("cctvVideo play error:", err));
    }
  }, [localStream, navigate]);

  // ------------------------------------------------------------
  // (C) 탭 전환 시 realtime 탭 돌아오면 video.play()
  // ------------------------------------------------------------
  useEffect(() => {
    if (activeTab === "realtime" && cctvVideoRef.current) {
      cctvVideoRef.current
        .play()
        .catch((err) => console.warn("re-play error:", err));
    }
  }, [activeTab]);

  // ------------------------------------------------------------
  // (D) 로그 메세지 변환
  // ------------------------------------------------------------
  const getLogMessage = useCallback((log) => {
    // 예: "카메라 #2에서 ID_40, male, adult 감지됨."
    return `카메라 #${log.cctv_id}에서 ID_${log.person_label}, ${log.gender}, ${log.age} 감지됨.`;
  }, []);

  // ------------------------------------------------------------
  // (E) 이미지 모달 열기
  // ------------------------------------------------------------
  const handleImageClick = useCallback((image_url) => {
    setSelectedImage(image_url);
    setIsModalOpen(true);
  }, []);

  // ------------------------------------------------------------
  // (F) 로그 새로고침
  // ------------------------------------------------------------
  const handleRefresh = useCallback(() => {
    setLogs([]);
    fetchLogs();
  }, [fetchLogs]);

  // ------------------------------------------------------------
  // (G) 녹화 로직
  // ------------------------------------------------------------
  const handleRecordToggle = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
    setIsRecording(!isRecording);
  };

  const startRecording = () => {
    const video = cctvVideoRef.current;
    if (!video) return;

    // <canvas> 캡처
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");

    const drawFrame = () => {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      requestAnimationFrame(drawFrame);
    };
    drawFrame();

    const stream = canvas.captureStream();
    const recorder = new MediaRecorder(stream, {
      mimeType: "video/webm;codecs=vp9,opus",
    });
    setMediaRecorder(recorder);

    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        setRecordedChunks((prev) => [...prev, event.data]);
      }
    };
    recorder.start();
  };

  const stopRecording = () => {
    if (!mediaRecorder) return;
    mediaRecorder.stop();
    setTimeout(() => {
      const blob = new Blob(recordedChunks, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      document.body.appendChild(a);
      a.style = "display: none";
      a.href = url;
      a.download = "recording.webm";
      a.click();
      window.URL.revokeObjectURL(url);
    }, 100);
  };

  // ------------------------------------------------------------
  // (H) 스냅샷
  // ------------------------------------------------------------
  const takeSnapshot = () => {
    const video = cctvVideoRef.current;
    if (!video) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataURL = canvas.toDataURL("image/png");

    // flash effect
    const flash = document.createElement("div");
    flash.style.position = "fixed";
    flash.style.top = "0";
    flash.style.left = "0";
    flash.style.width = "100%";
    flash.style.height = "100%";
    flash.style.backgroundColor = "white";
    flash.style.opacity = "0";
    flash.style.transition = "opacity 0.1s ease-out";
    document.body.appendChild(flash);

    setTimeout(() => {
      flash.style.opacity = "1";
      setTimeout(() => {
        flash.style.opacity = "0";
        setTimeout(() => {
          document.body.removeChild(flash);
        }, 100);
      }, 50);
    }, 0);

    // download
    const link = document.createElement("a");
    link.href = dataURL;
    link.download = "snapshot.png";
    link.click();
  };

  // ------------------------------------------------------------
  // (I) 카메라 전환 (예시)
  // ------------------------------------------------------------
  const switchDeviceFn = (direction) => {
    let newIndex;
    if (direction === "next") {
      newIndex = (currentDeviceIndex + 1) % devices.length;
    } else {
      newIndex = (currentDeviceIndex - 1 + devices.length) % devices.length;
    }
    setCurrentDeviceIndex(newIndex);

    if (onSwitchDevice) {
      onSwitchDevice(newIndex);
    }
  };

  // ------------------------------------------------------------
  // (J) 이미지 모달
  // ------------------------------------------------------------
  const ImageModal = useMemo(() => {
    return ({ image_url, onClose }) => (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-4 rounded-lg max-w-3xl max-h-3xl">
          <img
            src={image_url}
            alt="감지 이미지"
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
  }, []);

  return (
    <div className="fixed inset-0 flex bg-gray-100 font-sans">
      {/* 왼쪽 화면 */}
      <div className="flex-1 p-6 flex flex-col">
        {/* 상단 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-bold">
              {selectedCamera?.name || "CCTV"}
            </h2>
            <span className="bg-green-500 px-2 py-1 rounded-full text-white text-sm">
              라이브
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-lg">{currentTime}</span>
            {/* 닫기 => Monitor로 이동 */}
            <button
              onClick={() => navigate("/monitor")}
              className="rounded bg-custom text-white px-4 py-2"
            >
              <i className="fas fa-times mr-2"></i>닫기
            </button>
          </div>
        </div>

        {/* 탭 버튼 */}
        <div className="flex space-x-2 mb-4">
          <button
            onClick={() => setActiveTab("realtime")}
            className={`px-4 py-2 rounded ${
              activeTab === "realtime" ? "bg-blue-600 text-white" : "bg-gray-300"
            }`}
          >
            원본 영상
          </button>
          <button
            onClick={() => setActiveTab("mosaic")}
            className={`px-4 py-2 rounded ${
              activeTab === "mosaic" ? "bg-blue-600 text-white" : "bg-gray-300"
            }`}
          >
            모자이크 영상
          </button>
        </div>

        {/* 메인 영상 영역 */}
        <div className="flex-1 bg-black rounded-lg overflow-hidden relative">
          {/* (1) 원본(WebRTC) 탭 */}
          {activeTab === "realtime" && (
            <>
              <video
                ref={cctvVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-contain bg-black"
              />
              {/* 녹화/스냅샷 오버레이 */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={handleRecordToggle}
                      className={`rounded ${
                        isRecording ? "bg-blue-600" : "bg-red-600"
                      } hover:bg-opacity-80 px-4 py-2`}
                    >
                      <i
                        className={`fas ${
                          isRecording ? "fa-stop" : "fa-circle"
                        } mr-2`}
                      ></i>
                      {isRecording ? "녹화 끝" : "녹화 시작"}
                    </button>
                    <button
                      onClick={takeSnapshot}
                      className="rounded bg-green-600 hover:bg-green-700 px-4 py-2"
                    >
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
            </>
          )}

          {/* (2) 모자이크 탭 */}
          {activeTab === "mosaic" && (
            <div className="w-full h-full flex items-center justify-center bg-black">
              {mosaicImageUrl ? (
                <img
                  src={mosaicImageUrl}
                  alt="모자이크 화면"
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <p className="text-gray-300">모자이크 영상이 없습니다.</p>
              )}
            </div>
          )}
        </div>

        {/* 하단 버튼들 */}
        <div className="flex items-center justify-end mt-4 space-x-2">
          {/* (불필요) "화면 분할", "긴급 상황" 제거, 남은 건 이전/다음 카메라 */}
          <button
            onClick={() => switchDeviceFn("prev")}
            className="rounded bg-gray-600 hover:bg-gray-700 text-white px-4 py-2"
          >
            <i className="fas fa-chevron-left mr-2"></i>이전 카메라
          </button>
          <button
            onClick={() => switchDeviceFn("next")}
            className="rounded bg-gray-600 hover:bg-gray-700 text-white px-4 py-2"
          >
            다음 카메라
            <i className="fas fa-chevron-right ml-2"></i>
          </button>
        </div>
      </div>

      {/* 오른쪽 로그 패널 */}
      <div className="w-96 bg-white p-6 shadow-lg overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">실시간 로그</h3>
          <div className="flex items-center space-x-2">
            <select className="rounded bg-gray-100 px-3 py-1 text-sm border-none">
              <option>모든 이벤트</option>
              <option>움직임 감지</option>
              <option>알림</option>
            </select>
            <button
              className="rounded bg-custom text-white px-3 py-1 text-sm"
              onClick={handleRefresh}
            >
              <i className="fas fa-sync-alt"></i>
            </button>
          </div>
        </div>

        {/* 로그 목록 */}
        <div className="flex-1 overflow-y-auto space-y-3">
          {logs.map((log, index) => (
            <div key={index} className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center justify-between">
                {/* 감지 시각 (예: 오후 11:36:03) */}
                <span className="text-sm text-gray-500">
                  {new Date(log.detected_time).toLocaleTimeString("ko-KR", {
                    hour12: true,
                  })}
                </span>
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                  감지
                </span>
              </div>

              {/* "카메라 #2에서 ID_40, male, adult 감지됨." */}
              <p className="mt-1 text-sm">{log.person_label ? getLogMessage(log) : "Unknown event"}</p>

              {/* 감지된 이미지가 있으면 보기 버튼 */}
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

export default CCTVMonitoring;
