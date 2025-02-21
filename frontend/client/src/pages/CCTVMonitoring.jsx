import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import Plyr from "plyr";
import "plyr/dist/plyr.css";

const CCTVMonitoring = ({ selectedCamera, onClose, onSwitchDevice }) => {
  const [currentTime, setCurrentTime] = useState("");
  const [logs, setLogs] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const videoRef = useRef(null);
  const playerRef = useRef(null);

  // 연결된 장치 목록 및 현재 선택된 장치 인덱스
  const [devices] = useState(["cam1", "cam2"]); // 연결된 장치 목록
  const [currentDeviceIndex, setCurrentDeviceIndex] = useState(0);

  // 현재 선택된 장치
  const currentDevice = devices[currentDeviceIndex];

  const fetchLogs = useCallback(async () => {
    try {
      const response = await fetch("/api/cctv_data");
      const data = await response.json();
      console.log("Fetched logs:", data);
      setLogs((prevLogs) => {
        const newLogs = [...data, ...prevLogs];
        // 중복 로그 제거
        const uniqueLogs = newLogs.filter(
          (log, index, self) => index === self.findIndex((t) => t.id === log.id)
        );
        // 로그를 내림차순으로 정렬
        uniqueLogs.sort(
          (a, b) => new Date(b.detected_time) - new Date(a.detected_time)
        );
        return uniqueLogs.slice(0, 50); // 최신 50개 로그만 유지
      });
    } catch (error) {
      console.error("로그 데이터 가져오기 실패:", error);
    }
  }, []);

  const switchDevice = (direction) => {
    let newIndex;
    if (direction === "next") {
      newIndex = (currentDeviceIndex + 1) % devices.length;
    } else if (direction === "prev") {
      newIndex = (currentDeviceIndex - 1 + devices.length) % devices.length;
    }
    setCurrentDeviceIndex(newIndex);
    onSwitchDevice(newIndex);
  };

  useEffect(() => {
    if (playerRef.current) {
      playerRef.current.destroy();
    }

    playerRef.current = new Plyr("#player", {
      controls: ["play", "progress", "current-time", "volume", "settings"],
    });

    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString("ko-KR"));
    };

    const timeInterval = setInterval(updateTime, 1000);
    updateTime();

    fetchLogs();
    const logInterval = setInterval(() => fetchLogs(), 5000);

    return () => {
      clearInterval(timeInterval);
      clearInterval(logInterval);
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, [fetchLogs, selectedCamera]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.src = selectedCamera.videoSrc;
      videoRef.current.load();
      if (playerRef.current) {
        playerRef.current.source = {
          type: "video",
          sources: [
            {
              src: selectedCamera.videoSrc,
              type: "video/mp4",
            },
          ],
        };
      }
    }
  }, [selectedCamera]);

  const getLogMessage = useCallback((log) => {
    return `카메라 #${log.cctv_id}에서 ID_${log.person_label}, ${log.gender}, ${log.age}의 사람이 감지되었습니다.`;
  }, []);

  const handleImageClick = useCallback((image_url) => {
    setSelectedImage(image_url);
    setIsModalOpen(true);
  }, []);

  const handleRefresh = useCallback(() => {
    setLogs([]);
    fetchLogs();
  }, [fetchLogs]);

  const handleRecordToggle = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
    setIsRecording(!isRecording);
  };

  const startRecording = () => {
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");

    const drawFrame = () => {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
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

  const takeSnapshot = () => {
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");

    // 비디오 요소의 현재 프레임을 캔버스에 그립니다.
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // 캔버스의 내용을 이미지 데이터 URL로 변환합니다.
    const dataURL = canvas.toDataURL("image/png");

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

    const link = document.createElement("a");
    link.href = dataURL;
    link.download = "snapshot.png";
    link.click();
  };

  const ImageModal = useMemo(() => {
    return ({ image_url, onClose }) => (
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
          <video id="player" ref={videoRef} playsInline controls>
            <source src={selectedCamera.videoSrc} type="video/mp4" />
          </video>
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
            <button
              onClick={() => switchDevice("prev")}
              className="rounded bg-gray-600 hover:bg-gray-700 text-white px-4 py-2"
            >
              <i className="fas fa-chevron-left mr-2"></i>이전 카메라
            </button>
            <button
              onClick={() => switchDevice("next")}
              className="rounded bg-gray-600 hover:bg-gray-700 text-white px-4 py-2"
            >
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
            <button
              className="rounded bg-custom text-white px-3 py-1 text-sm"
              onClick={handleRefresh}
            >
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
