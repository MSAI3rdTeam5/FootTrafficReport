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

// Socket.io + mediasoup-client
import { io } from "socket.io-client";
import { Device } from "mediasoup-client";

// function CCTVMonitoring({ selectedCamera, onSwitchDevice }) {
function CCTVMonitoring() {

  const navigate = useNavigate();

  // 전역 Context에서 localStream, mosaicImageUrl 가져옴(2FPS)
  const {
      localStream,
      setLocalStream,
      mosaicImageUrl,
      cctvId
  } = useContext(AppContext);

  // 압영상 데이터 관련
  const [camData, setCamData] = useState(null);

  // SFU 관련
  const socketRef = useRef(null);
  const deviceRef = useRef(null);
  const [sendTransport, setSendTransport] = useState(null);

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

  // 비디오 태그 레퍼런스
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // ------------------------------------------------------------
  // (A) 시계 / 로그 주기적 fetch
  // ------------------------------------------------------------
  const fetchLogs = useCallback(async () => {
    try {
      const response = await fetch(`/api/cctv_data/${cctvId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch logs for cctvId=${cctvId}`);
      }
      const data = await response.json();
      console.log("Fetched logs:", data);

      setLogs((prevLogs) => {
        const newLogs = [...data, ...prevLogs];
        // 중복 제거
        const uniqueLogs = newLogs.filter(
          (log, index, self) =>
            index === self.findIndex((t) => t.cctv_id === log.cctv_id && t.person_label === log.person_label)
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
  }, [cctvId]);


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

  useEffect(() => {
    if (!localStream) return;
    (async () => {
      await handleConnectSFU();
      await produceVideoTrack(localStream);
    })();
  }, [localStream]);


  // mosaic 탭 → mosaicImageUrl 표시 (이미 AppContext에서 계속 업데이트)
  // logs → 5초간격 polling

  // ------------------------------------------------------------
  // (C) 탭 전환 시 realtime 탭 돌아오면 video.play()
  // ------------------------------------------------------------
  useEffect(() => {
    if (activeTab === "realtime" && cctvVideoRef.current) {
      cctvVideoRef.current.srcObject = localStream;
      cctvVideoRef.current
        .play()
        .catch((err) => console.warn("re-play error:", err));
    }
  }, [activeTab, localStream]);

  // ------------------------------------------------------------
  // SFU 연결
  // ------------------------------------------------------------
  async function handleConnectSFU() {
    const s = io("https://msteam5iseeu.ddns.net", {
      path: "/socket.io",
      transports: ["websocket", "polling"],
    });
    socketRef.current = s;

    await new Promise((resolve, reject) => {
      s.on("connect", () => {
        console.log("[SFU] socket connected:", s.id);
        resolve();
      });
      s.on("connect_error", (err) => {
        console.error("[SFU] socket connect error:", err);
        reject(err);
      });
    });

    const routerCaps = await new Promise((resolve, reject) => {
      s.emit("getRouterRtpCapabilities", {}, (res) => {
        if (!res.success) return reject(new Error(res.error));
        else resolve(res.rtpCapabilities);
      });
    });

    const dev = new Device();
    await dev.load({ routerRtpCapabilities: routerCaps });
    deviceRef.current = dev;
    console.log("Mediasoup Device loaded => canProduceVideo =", dev.canProduce("video"));
  }

  // Produce
  async function produceVideoTrack(rawStream) {
    if (!deviceRef.current || !socketRef.current) {
      console.warn("[WARN] SFU device/socket not ready.");
      return;
    }
    const dev = deviceRef.current;
    const sock = socketRef.current;

    let transport = sendTransport;
    if (!transport) {
      const transportParams = await createTransport(sock, "send");
      transport = dev.createSendTransport(transportParams);

      transport.on("connect", ({ dtlsParameters }, callback, errback) => {
        sock.emit("connectTransport", { transportId: transport.id, dtlsParameters }, (res) => {
          if (!res.success) errback(res.error);
          else callback();
        });
      });

      transport.on("produce", (produceParams, callback, errback) => {
        sock.emit(
          "produce",
          {
            transportId: transport.id,
            kind: produceParams.kind,
            rtpParameters: produceParams.rtpParameters,
          },
          (res) => {
            if (!res.success) errback(res.error);
            else callback({ id: res.producerId });
          }
        );
      });

      setSendTransport(transport);
    }

    try {
      await transport.produce({ track: rawStream.getVideoTracks()[0] });
      console.log("[DBG] Producer(원본) 생성 완료");
    } catch (err) {
      console.error("produce error:", err);
    }
  }

  // createTransport
  function createTransport(sock, direction) {
    return new Promise((resolve, reject) => {
      sock.emit("createTransport", { direction }, (res) => {
        if (!res.success) reject(new Error(res.error));
        else resolve(res.transportParams);
      });
    });
  }



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


  // ------------------------------------------------------------
  // (G) 녹화 로직
  // ------------------------------------------------------------
  const handleRecordToggle = () => {
    if (isRecording) stopRecording();
    else startRecording();
    setIsRecording(!isRecording);
  };

  // (A) "원본 영상"을 직접 captureStream()
  const startRecording = () => {
    const videoElem = cctvVideoRef.current;
    if (!videoElem) return;

    // videoElem이 재생 중인지( videoWidth>0 ) 확인
    // 만약 아직 0x0 이면, loadedmetadata 이벤트 후 시도.
    if (videoElem.videoWidth < 1 || videoElem.videoHeight < 1) {
      console.warn("Video not ready for captureStream");
      return;
    }

    // 1) captureStream(30) => 초당 30fps 캡처(선택적)
    const stream = videoElem.captureStream(30);    

    // 2) MediaRecorder
    const recorder = new MediaRecorder(stream, {
      mimeType: "video/webm;codecs=vp9,opus",
    });

    // 녹화조각 수집
    const chunks = [];
    recorder.ondataavailable = (evt) => {
      if (evt.data && evt.data.size > 0) {
        chunks.push(evt.data);
      }
    };

    // 녹화 끝났을 때 => Blob 다운로드
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = "recording.webm";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      // reset or keep chunks if needed
    };

    // 상태 업데이트
    setRecordedChunks(chunks);
    setMediaRecorder(recorder);

    // 3) start
    recorder.start();
    console.log("Recording started");
  };

  // (B) 녹화 중지
  const stopRecording = () => {
    if (!mediaRecorder) return;
    mediaRecorder.stop();
    console.log("Recording stopped");
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
  // const switchDeviceFn = (direction) => {
  //   let newIndex;
  //   if (direction === "next") {
  //     newIndex = (currentDeviceIndex + 1) % devices.length;
  //   } else {
  //     newIndex = (currentDeviceIndex - 1 + devices.length) % devices.length;
  //   }
  //   setCurrentDeviceIndex(newIndex);

  //   if (onSwitchDevice) {
  //     onSwitchDevice(newIndex);
  //   }
  // };

    // // ------------------------------------------------------------
  // // 웹캠 연결 해제
  // // ------------------------------------------------------------
  const handleWebcamDisconnect = () => {
    if (localStream) {
      localStream.getTracks().forEach((t) => t.stop());
      setLocalStream(null);
    }

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    if (sendTransport) {
      sendTransport.close();
      setSendTransport(null);
    }
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    deviceRef.current = null;

    navigate("/monitor");
  };


  return (
    // 최상위: 반응형 레이아웃
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col">
      {/* 상단 헤더 or NavBar가 따로 있다면 제거/조정 */}
      <header className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            CCTV {cctvId}
          </h2>
          <span className="bg-green-500 px-2 py-1 rounded-full text-white text-sm">
            라이브
          </span>
        </div>
        <div className="flex items-center space-x-4 text-gray-800 dark:text-gray-200">
          <span className="text-md">{currentTime}</span>
          <button
            onClick={handleWebcamDisconnect}
            className="rounded bg-black text-white px-4 py-2"
          >
            <i className="fas fa-times mr-2"></i>닫기
          </button>
        </div>
      </header>

      {/* 메인: md 이상에서 (왼쪽 영상 + 오른쪽 로그), 모바일에서는 수직 스택 */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* 왼쪽: 영상 영역 */}
        <div className="flex-1 p-4 flex flex-col">
          {/* 탭 버튼 */}
          <div className="flex space-x-2 mb-4">
            <button
              onClick={() => setActiveTab("realtime")}
              className={`px-4 py-2 rounded ${
                activeTab === "realtime"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-300 dark:bg-gray-700 text-black dark:text-gray-200"
              }`}
            >
              원본 영상
            </button>
            <button
              onClick={() => setActiveTab("mosaic")}
              className={`px-4 py-2 rounded ${
                activeTab === "mosaic"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-300 dark:bg-gray-700 text-black dark:text-gray-200"
              }`}
            >
              모자이크 영상
            </button>
          </div>

          {/* 영상 컨테이너 */}
          <div className="flex-1 bg-black rounded-lg overflow-hidden relative">
            {/* 원본 탭 */}
            {activeTab === "realtime" && (
              <>
                <video
                  ref={cctvVideoRef}
                  autoPlay
                  playsInline
                  muted
                  // 자식 내부에서는 오버레이
                  className="w-full h-full object-contain bg-black"
                />
                {/* 녹화/스냅샷 오버레이 */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 flex justify-between items-center text-white">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleRecordToggle}
                      className={`px-4 py-2 rounded ${
                        isRecording ? "bg-blue-600" : "bg-red-600"
                      } hover:bg-opacity-80 transition`}
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
                      className="px-4 py-2 rounded bg-green-600 hover:bg-green-700 transition"
                    >
                      <i className="fas fa-camera mr-2"></i>스냅샷
                    </button>
                  </div>
                  <div className="flex items-center">
                    <select className="rounded bg-gray-700 text-sm px-3 py-1 border-none">
                      <option>HD (720p)</option>
                      <option>FHD (1080p)</option>
                      <option>4K (2160p)</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* 모자이크 탭 */}
            {activeTab === "mosaic" && (
              <div className="w-full h-full flex items-center justify-center bg-black">
                {mosaicImageUrl ? (
                  <img
                    src={mosaicImageUrl}
                    alt="모자이크 화면"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <p className="text-gray-300">모자이크 영상이 없습니다.</p>
                )}
              </div>
            )}
          </div>

          {/* (하단) 이전/다음 카메라 버튼 */}
          {/* <div className="mt-4 flex justify-end space-x-2">
            <button className="rounded bg-gray-600 hover:bg-gray-700 text-white px-4 py-2">
              이전 카메라
            </button>
            <button className="rounded bg-gray-600 hover:bg-gray-700 text-white px-4 py-2">
              다음 카메라
            </button>
          </div> */}
        </div>

        {/* 오른쪽: 로그 패널 (md:w-96 => 데스크톱에서 폭 24rem, 모바일에서 w-full) */}
        <div className="w-full md:w-96 bg-white dark:bg-gray-800 dark:text-gray-200 p-6 shadow-lg border-t md:border-t-0 md:border-l border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
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
                  // fetchLogs();
                }}
              >
                <i className="fas fa-sync-alt"></i>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3">
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
                  {log.person_label
                    ? getLogMessage(log)
                    : "Unknown event"}
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

export default CCTVMonitoring;