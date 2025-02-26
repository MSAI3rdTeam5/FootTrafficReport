import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import Plyr from "plyr";
import "plyr/dist/plyr.css";

const CCTVMonitoring = ({ selectedCamera, onClose }) => {
  const [currentTime, setCurrentTime] = useState("");
  const [logs, setLogs] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const videoRef = useRef(null);
  const playerRef = useRef(null);

  const fetchLogs = useCallback(async () => {
    try {
      const response = await fetch("/api/cctv_data");
      const data = await response.json();
      console.log("Fetched logs:", data);
      setLogs(data);
    } catch (error) {
      console.error("로그 데이터 가져오기 실패:", error);
    }
  }, []);

  useEffect(() => {
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
  }, [fetchLogs]);

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
    const stream = videoRef.current.captureStream();
    const recorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9,opus'
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
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    
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

    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = 'snapshot.png';
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
        {/* ... (헤더 부분은 변경 없음) ... */}

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
                    isRecording ? "bg-red-600" : "bg-blue-600"
                  } hover:bg-opacity-80 px-4 py-2`}
                >
                  <i className={`fas ${isRecording ? "fa-stop" : "fa-circle"} mr-2`}></i>
                  {isRecording ? "녹화 끝" : "녹화 시작"}
                </button>
                <button
                  onClick={takeSnapshot}
                  className="rounded bg-green-600 hover:bg-green-700 px-4 py-2"
                >
                  <i className="fas fa-camera mr-2"></i>스냅샷
                </button>
              </div>
              {/* ... (화질 선택 부분은 변경 없음) ... */}
            </div>
          </div>
        </div>

        {/* ... (나머지 UI 부분은 변경 없음) ... */}
      </div>

      {/* ... (로그 표시 부분은 변경 없음) ... */}

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
