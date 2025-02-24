// /home/azureuser/FootTrafficReport/frontend/client/src/pages/CCTVMonitoring.jsx

import React, {
    useEffect,
    useState,
    useCallback,
    useMemo,
    useRef
  } from "react";
  import Plyr from "plyr";
  import "plyr/dist/plyr.css";
  
  // Socket.io + mediasoup-client
  import { io } from "socket.io-client";
  import { Device } from "mediasoup-client";
  
  function CCTVMonitoring({ onClose, onSwitchDevice }) {

    // ----------------------------
    // (1) 탭 상태 (원본 or 모자이크)
    // ----------------------------
    const [selectedTab, setSelectedTab] = useState("original");
  
    // ----------------------------
    // (2) 웹캠 선택 모달
    // ----------------------------
    const [webcamModalOpen, setWebcamModalOpen] = useState(false);
    const [videoDevices, setVideoDevices] = useState([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState("");
  
    // ----------------------------
    // (3) localStream, SFU socket/transport
    // ----------------------------
    const [localStream, setLocalStream] = useState(null);
    const socketRef = useRef(null);
    const deviceRef = useRef(null);
    const [sendTransport, setSendTransport] = useState(null);
  
    // ----------------------------
    // (4) 모자이크
    // ----------------------------
    const [mosaicUrl, setMosaicUrl] = useState(null);
    const canvasRef = useRef(null); // 모자이크 2FPS 캡처용
  
    // ----------------------------
    // (5) 녹화 관련
    // ----------------------------
    const [isRecording, setIsRecording] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const [recordedChunks, setRecordedChunks] = useState([]);
  
    // ----------------------------
    // (6) 로그/시간/모달
    // ----------------------------
    const [currentTime, setCurrentTime] = useState("");
    const [logs, setLogs] = useState([]);
    const [selectedImage, setSelectedImage] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
  
    // ----------------------------
    // (7) 원본 영상(Plyr)
    // ----------------------------
    const videoRef = useRef(null);
    const playerRef = useRef(null);
  
    // (가상) “장치 목록” 예시
    const [devices] = useState(["cam1", "cam2"]);
    const [currentDeviceIndex, setCurrentDeviceIndex] = useState(0);
    const currentDevice = devices[currentDeviceIndex];
  
    // ----------------------------------------------------
    // A) 현재 시각
    // ----------------------------------------------------
    useEffect(() => {
      const updateTime = () => {
        setCurrentTime(new Date().toLocaleTimeString("ko-KR"));
      };
      updateTime();
      const intv = setInterval(updateTime, 1000);
      return () => clearInterval(intv);
    }, []);
  
    // ----------------------------------------------------
    // B) “카메라 선택” 모달 열기
    // ----------------------------------------------------
    const openWebcamModal = async () => {
      try {
        // 간단한 권한 체크
        const tmp = await navigator.mediaDevices.getUserMedia({ video: true });
        tmp.getTracks().forEach((t) => t.stop());
  
        const devs = await navigator.mediaDevices.enumerateDevices();
        const cams = devs.filter((d) => d.kind === "videoinput");
        setVideoDevices(cams);
        if (cams.length > 0) {
          setSelectedDeviceId(cams[0].deviceId);
        }
        setWebcamModalOpen(true);
      } catch (err) {
        console.error("openWebcamModal error:", err);
        alert("카메라 권한이 필요합니다.");
      }
    };
  
    // ----------------------------------------------------
    // C) 카메라 선택 => getUserMedia + SFU connect + produce
    // ----------------------------------------------------
    const handleConfirmWebcamSelection = async () => {
      if (!selectedDeviceId) {
        alert("카메라를 선택하세요.");
        return;
      }
      setWebcamModalOpen(false);
  
      // 1) getUserMedia
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            deviceId: { exact: selectedDeviceId },
            width: { ideal: 640 },
            height: { ideal: 480 },
            frameRate: { ideal: 30 }
          },
          audio: false
        });
        setLocalStream(stream);
        console.log("[DBG] localStream =>", stream.getTracks());
  
        // 2) SFU connect (if not connected)
        if (!socketRef.current || !deviceRef.current) {
          await handleConnectSFU();
        }
        // 3) produce
        await produceVideoTrack(stream);
        console.log("SFU produce 완료 => 원본 영상 재생 준비");
      } catch (err) {
        alert("카메라 열기/연결 실패: " + err);
      }
    };
  
    // ----------------------------------------------------
    // D) SFU 연결
    // ----------------------------------------------------
    async function handleConnectSFU() {
      const s = io("https://msteam5iseeu.ddns.net", {
        path: "/socket.io",
        transports: ["websocket", "polling"]
      });
      socketRef.current = s;
  
      await new Promise((resolve, reject) => {
        s.on("connect", () => {
          console.log("[SFU] connected:", s.id);
          resolve();
        });
        s.on("connect_error", (err) => {
          console.error("[SFU] connect_error:", err);
          reject(err);
        });
      });
  
      const routerCaps = await new Promise((resolve, reject) => {
        s.emit("getRouterRtpCapabilities", {}, (res) => {
          if (!res.success) return reject(new Error(res.error));
          resolve(res.rtpCapabilities);
        });
      });
  
      const dev = new Device();
      await dev.load({ routerRtpCapabilities: routerCaps });
      deviceRef.current = dev;
      console.log("Device loaded => canProduceVideo?", dev.canProduce("video"));
    }
  
    // ----------------------------------------------------
    // E) produceVideoTrack
    // ----------------------------------------------------
    async function produceVideoTrack(stream) {
      if (!deviceRef.current || !socketRef.current) {
        console.warn("SFU not ready");
        return;
      }
      const dev = deviceRef.current;
      const sock = socketRef.current;
      let transport = sendTransport;
  
      if (!transport) {
        const transportParams = await new Promise((resolve, reject) => {
          sock.emit("createTransport", { direction: "send" }, (res) => {
            if (!res.success) reject(new Error(res.error));
            else resolve(res.transportParams);
          });
        });
        transport = dev.createSendTransport(transportParams);
  
        transport.on("connect", ({ dtlsParameters }, callback, errback) => {
          sock.emit("connectTransport", { transportId: transport.id, dtlsParameters }, (rsp) => {
            if (!rsp.success) errback(rsp.error);
            else callback();
          });
        });
  
        transport.on("produce", (params, callback, errback) => {
          sock.emit(
            "produce",
            {
              transportId: transport.id,
              kind: params.kind,
              rtpParameters: params.rtpParameters
            },
            (res) => {
              if (!res.success) errback(res.error);
              else callback({ id: res.producerId });
            }
          );
        });
  
        setSendTransport(transport);
      }
  
      await transport.produce({ track: stream.getVideoTracks()[0] });
      console.log("produce success");
    }
  
    // ----------------------------------------------------
    // F) 원본 영상: localStream => Plyr
    // ----------------------------------------------------
    useEffect(() => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
      if (!videoRef.current) return;
  
      const p = new Plyr(videoRef.current, {
        controls: ["play", "progress", "current-time", "volume", "settings"]
      });
      playerRef.current = p;
  
      if (localStream) {
        videoRef.current.srcObject = localStream;
        videoRef.current.play().catch((err) => {
          console.warn("video play err:", err);
        });
      }
  
      return () => {
        if (playerRef.current) {
          playerRef.current.destroy();
        }
      };
    }, [localStream]);
  
    // ----------------------------------------------------
    // G) 모자이크 탭: 2FPS
    // ----------------------------------------------------
    useEffect(() => {
      if (selectedTab !== "mosaic") return;
      const intv = setInterval(() => {
        captureAndSendFrame();
      }, 500);
      return () => clearInterval(intv);
    }, [selectedTab, captureAndSendFrame]);
  
    const captureAndSendFrame = useCallback(async () => {
      try {
        if (!videoRef.current) return;
        const video = videoRef.current;
        if (!canvasRef.current) return;
        const cv = canvasRef.current;
  
        cv.width = video.videoWidth || 640;
        cv.height = video.videoHeight || 480;
        const ctx = cv.getContext("2d");
        ctx.drawImage(video, 0, 0, cv.width, cv.height);
  
        const blob = await new Promise((resolve) => cv.toBlob(resolve, "image/png"));
        if (!blob) return;
  
        const fd = new FormData();
        fd.append("file", blob, "frame.png");
        fd.append("cctv_id", currentDevice);
  
        const res = await fetch("/yolo_mosaic", { method: "POST", body: fd });
        if (!res.ok) throw new Error("mosaic error:" + res.status);
        const resultBlob = await res.blob();
        const newUrl = URL.createObjectURL(resultBlob);
        if (mosaicUrl) URL.revokeObjectURL(mosaicUrl);
        setMosaicUrl(newUrl);
      } catch (err) {
        console.error("captureAndSendFrame:", err);
      }
    }, [mosaicUrl, currentDevice]);
  
    // ----------------------------------------------------
    // H) 로그
    // ----------------------------------------------------
    const fetchLogs = useCallback(async () => {
      try {
        const r = await fetch("/api/cctv_data");
        if (!r.ok) throw new Error("logs fetch fail");
        const data = await r.json();
        setLogs(data);
      } catch (err) {
        console.error(err);
      }
    }, []);
  
    useEffect(() => {
      fetchLogs();
      const intv = setInterval(fetchLogs, 5000);
      return () => clearInterval(intv);
    }, [fetchLogs]);
  
    const getLogMessage = useCallback((log) => {
      return `카메라 #${log.cctv_id}에서 ID_${log.person_label}, ${log.gender}, ${log.age} 감지.`;
    }, []);
  
    const handleRefresh = useCallback(() => {
      setLogs([]);
      fetchLogs();
    }, [fetchLogs]);
  
    // ----------------------------------------------------
    // I) 녹화/스냅샷
    // ----------------------------------------------------
    const handleRecordToggle = () => {
      if (isRecording) stopRecording();
      else startRecording();
      setIsRecording(!isRecording);
    };
  
    const startRecording = () => {
      if (!videoRef.current) return;
      const video = videoRef.current;
  
      const cv = document.createElement("canvas");
      cv.width = video.videoWidth;
      cv.height = video.videoHeight;
      const ctx = cv.getContext("2d");
  
      const drawFrame = () => {
        ctx.drawImage(video, 0, 0, cv.width, cv.height);
        requestAnimationFrame(drawFrame);
      };
      drawFrame();
  
      const stream = cv.captureStream();
      const mr = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp9,opus" });
      setMediaRecorder(mr);
  
      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          setRecordedChunks((prev) => [...prev, e.data]);
        }
      };
      mr.start();
    };
  
    const stopRecording = () => {
      if (!mediaRecorder) return;
      mediaRecorder.stop();
      setTimeout(() => {
        const blob = new Blob(recordedChunks, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        document.body.appendChild(a);
        a.style = "display:none";
        a.href = url;
        a.download = "recording.webm";
        a.click();
        URL.revokeObjectURL(url);
      }, 100);
    };
  
    const takeSnapshot = () => {
      if (!videoRef.current) return;
      const video = videoRef.current;
      const cv = document.createElement("canvas");
      cv.width = video.videoWidth;
      cv.height = video.videoHeight;
      const ctx = cv.getContext("2d");
      ctx.drawImage(video, 0, 0, cv.width, cv.height);
  
      const dataURL = cv.toDataURL("image/png");
      // flash effect
      const flash = document.createElement("div");
      flash.style = "position:fixed;top:0;left:0;width:100%;height:100%;background:white;opacity:0;transition:opacity 0.1s";
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
  
    // ----------------------------------------------------
    // J) 이미지 확대 모달
    // ----------------------------------------------------
    const handleImageClick = useCallback((img) => {
      setSelectedImage(img);
      setIsModalOpen(true);
    }, []);
    const ImageModal = useMemo(() => {
      return ({ image_url, onClose }) => (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded">
            <img src={image_url} alt="확대" className="max-w-full max-h-full" />
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
  
    // ----------------------------------------------------
    // K) 종료 로직
    // ----------------------------------------------------
    const handleCloseAll = () => {
      // localStream stop
      if (localStream) {
        localStream.getTracks().forEach(t => t.stop());
      }
      setLocalStream(null);
  
      // sendTransport
      if (sendTransport) {
        sendTransport.close();
        setSendTransport(null);
      }
  
      // socket
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      deviceRef.current = null;
  
      // Monitor로 복귀
      onClose && onClose();
    };
  
    // ----------------------------------------------------
    // L) 장치 스위치 (optional)
    // ----------------------------------------------------
    const handleSwitchDeviceInternal = (direction) => {
      let newIndex = currentDeviceIndex;
      if (direction === "next") {
        newIndex = (currentDeviceIndex + 1) % devices.length;
      } else if (direction === "prev") {
        newIndex = (currentDeviceIndex - 1 + devices.length) % devices.length;
      }
      setCurrentDeviceIndex(newIndex);
      // 외부에서 prop으로 전달된 onSwitchDevice가 있으면 호출
      if (onSwitchDevice) onSwitchDevice(newIndex);
    };
  
    return (
      <div className="fixed inset-0 flex bg-gray-100 font-sans">
        {/* Left: video controls */}
        <div className="flex-1 p-6 flex flex-col">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <h2 className="text-xl font-bold">웹캠 모니터링</h2>
              <span className="bg-green-500 px-2 py-1 rounded-full text-white text-sm">
                라이브
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-lg">{currentTime}</span>
              <button onClick={handleCloseAll} className="rounded bg-custom text-white px-4 py-2">
                <i className="fas fa-times mr-2"></i>닫기
              </button>
            </div>
          </div>
  
          {/* (1) 카메라 선택 (if no localStream) */}
          {!localStream && (
            <div className="mb-4">
              <button
                onClick={openWebcamModal}
                className="bg-blue-600 text-white px-4 py-2 rounded"
              >
                카메라 선택 & SFU 연결
              </button>
            </div>
          )}
  
          {/* (2) 탭 전환 */}
          <div className="mb-3">
            <button
              onClick={() => setSelectedTab("original")}
              className={`px-4 py-2 border rounded-l ${
                selectedTab === "original" ? "bg-blue-600 text-white" : "bg-white"
              }`}
            >
              원본 영상
            </button>
            <button
              onClick={() => setSelectedTab("mosaic")}
              className={`px-4 py-2 border border-l-0 rounded-r ${
                selectedTab === "mosaic" ? "bg-blue-600 text-white" : "bg-white"
              }`}
            >
              모자이크 영상
            </button>
          </div>
  
          {/* (3) 원본 or 모자이크 */}
          {selectedTab === "original" && (
            <div className="flex-1 bg-black rounded-lg overflow-hidden relative">
              <video
                id="player"
                ref={videoRef}
                playsInline
                controls
                style={{ width: "100%", height: "100%" }}
              />
              {/* Rec/Snapshot */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-white flex justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handleRecordToggle}
                    className={`rounded ${
                      isRecording ? "bg-blue-600" : "bg-red-600"
                    } px-4 py-2`}
                  >
                    {isRecording ? "녹화 끝" : "녹화 시작"}
                  </button>
                  <button
                    onClick={takeSnapshot}
                    className="rounded bg-green-600 px-4 py-2"
                  >
                    스냅샷
                  </button>
                </div>
              </div>
            </div>
          )}
          {selectedTab === "mosaic" && (
            <div className="flex-1 bg-black rounded-lg overflow-hidden relative flex items-center justify-center">
              {mosaicUrl ? (
                <img
                  src={mosaicUrl}
                  alt="모자이크"
                  className="object-contain max-h-full max-w-full"
                />
              ) : (
                <p className="text-white">모자이크 영상을 불러오는 중...</p>
              )}
            </div>
          )}
  
          {/* Bottom Buttons */}
          <div className="flex items-center justify-between mt-4 space-x-4">
            <div className="flex space-x-2">
              <button className="rounded bg-custom text-white px-4 py-2">
                화면 분할
              </button>
              <button className="rounded bg-yellow-600 text-white px-4 py-2">
                긴급 상황
              </button>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handleSwitchDeviceInternal("prev")}
                className="rounded bg-gray-600 text-white px-4 py-2"
              >
                이전 카메라
              </button>
              <button
                onClick={() => handleSwitchDeviceInternal("next")}
                className="rounded bg-gray-600 text-white px-4 py-2"
              >
                다음 카메라
              </button>
            </div>
          </div>
        </div>
  
        {/* Right: 로그 패널 */}
        <div className="w-96 bg-white p-6 shadow-lg flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">실시간 로그</h3>
            <div className="flex space-x-2">
              <select className="rounded bg-gray-100 px-3 py-1 text-sm border-none">
                <option>모든 이벤트</option>
                <option>움직임 감지</option>
                <option>알림</option>
              </select>
              <button
                onClick={handleRefresh}
                className="rounded bg-custom text-white px-3 py-1 text-sm"
              >
                <i className="fas fa-sync-alt"></i>
              </button>
            </div>
          </div>
  
          <div className="flex-1 overflow-y-auto space-y-3">
            {logs.map((log, idx) => (
              <div key={idx} className="bg-gray-50 p-3 rounded">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    {new Date(log.detected_time).toLocaleTimeString()}
                  </span>
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                    감지
                  </span>
                </div>
                <p className="mt-1 text-sm">
                  {`${log.cctv_id}: ID_${log.person_label}, ${log.gender}, ${log.age}`}
                </p>
                {log.image_url && (
                  <button
                    className="mt-2 text-blue-600 hover:underline"
                    onClick={() => handleImageClick(log.image_url)}
                  >
                    감지된 이미지 보기
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
  
        {/* 이미지 확대 모달 */}
        {isModalOpen && selectedImage && (
          <ImageModal
            image_url={selectedImage}
            onClose={() => setIsModalOpen(false)}
          />
        )}
  
        {/* 모자이크 캡처용 canvas (숨김) */}
        <canvas ref={canvasRef} style={{ display: "none" }} />
  
        {/* 웹캠 선택 모달 */}
        {webcamModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded">
              <h2 className="text-xl font-bold mb-2">웹캠 선택</h2>
              {videoDevices.length === 0 ? (
                <p className="text-red-500">사용 가능한 카메라가 없습니다.</p>
              ) : (
                <>
                  <select
                    className="border rounded px-3 py-2 mb-4"
                    value={selectedDeviceId}
                    onChange={(e) => setSelectedDeviceId(e.target.value)}
                  >
                    {videoDevices.map((dev) => (
                      <option key={dev.deviceId} value={dev.deviceId}>
                        {dev.label || dev.deviceId}
                      </option>
                    ))}
                  </select>
                  <div className="flex justify-end">
                    <button
                      onClick={() => setWebcamModalOpen(false)}
                      className="mr-2 border rounded px-4 py-2"
                    >
                      취소
                    </button>
                    <button
                      onClick={handleConfirmWebcamSelection}
                      className="bg-black text-white rounded px-4 py-2"
                    >
                      확인
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
  
  export default CCTVMonitoring;
  