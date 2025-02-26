<<<<<<< HEAD
// /home/azureuser/FootTrafficReport/frontend/client/src/pages/Monitor.jsx

import React, { useState, useEffect, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import PrivacyOverlay from "./PrivacyOverlay";
<<<<<<< HEAD
import ResponsiveNav from "../components/ResponsiveNav";
import { getMemberProfile } from "../utils/api";
=======
import CCTVMonitoring from "./CCTVMonitoring";
>>>>>>> hotfix/urgent-bug

// Socket.io + mediasoup-client
import { io } from "socket.io-client";
import { Device } from "mediasoup-client";

// (NEW) AppContext import
import { AppContext } from "../context/AppContext";

function Monitor() {
  const navigate = useNavigate();

  // ------------------------------------------------------------
  // (NEW) Context에서 가져오기
  // ------------------------------------------------------------
  const {
    localStream,
    setLocalStream,
    mosaicImageUrl,
    setMosaicImageUrl,
    canvasRef,
    isProcessingRef,
  } = useContext(AppContext);

  // ------------------------------------------------------------
  // (NEW) "shouldDisconnect" 감지 → 자동 웹캠 종료
  // ------------------------------------------------------------

  // === (나머지 로컬 state / ref) ===
  const [qrVisible, setQrVisible] = useState(false);
  const openQRModal = () => setQrVisible(true);
  const closeQRModal = () => setQrVisible(false);

=======
import React, { useState, useEffect, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import PrivacyOverlay from "./PrivacyOverlay";
import ResponsiveNav from "../components/ResponsiveNav";

// (NEW) AppContext
import { AppContext } from "../context/AppContext";

function Monitor() {
  // ------------------------------------------------------------
  // (1) Context에서 가져오기
  // ------------------------------------------------------------
  const {
    setLocalStream,
    canvasRef,
    setCctvId
  } = useContext(AppContext);


  // === 로컬 state ===
>>>>>>> hotfix
  const [deviceModalOpen, setDeviceModalOpen] = useState(false);
  const [deviceType, setDeviceType] = useState(null);
  const [deviceName, setDeviceName] = useState("");
  const [deviceIP, setDeviceIP] = useState("");
  const [devicePort, setDevicePort] = useState("");

  const [privacyOpen, setPrivacyOpen] = useState(false);
<<<<<<< HEAD
    // (2) Nav에서 이 함수를 호출 -> 오버레이 열림
  const handleOpenPrivacy = () => setPrivacyOpen(true);
    // (3) 오버레이 닫기
=======
  const handleOpenPrivacy = () => setPrivacyOpen(true);
>>>>>>> hotfix
  const handleClosePrivacy = () => setPrivacyOpen(false);

  const [cameraList, setCameraList] = useState([]);

<<<<<<< HEAD
<<<<<<< HEAD
  // SFU 관련
=======
  // === 페이지 탭 강조 로직 ===
  const isMonitorActive = location.pathname === "/monitor";
  const isDashboardActive = location.pathname === "/dashboard";
  const isAiInsightActive = location.pathname === "/ai-insight";
  const isChatbotActive = location.pathname === "/chatbot";
  const isGuideActive = location.pathname === "/guide";

  // === 장치등록 모달 함수 ===
  const openDeviceModal = (type) => {
    setDeviceType(type);
    setDeviceModalOpen(true);
  };
  const closeDeviceModal = () => {
    setDeviceModalOpen(false);
    setDeviceType(null);
    setDeviceName("");
    setDeviceIP("");
    setDevicePort("");
  };

  const handleSubmitDevice = async (e) => {
    e.preventDefault();
    console.log("[장치 등록]", {
      deviceType,
      deviceName,
      deviceIP,
      devicePort,
      deviceUser,
      devicePass,
    });

    // 예: cameraId = deviceName, rtspUrl = "rtsp://IP:Port"
    // 실제로는 deviceUser/devicePass를 rtsp URL에 포함하거나,
    // 다른 방식으로 전달할 수도 있음
    const cameraId = deviceName || `cam-${Date.now()}`;
    const rtspUrl = `rtsp://${deviceIP || "192.168.0.10"}:${
      devicePort || "554"
    }`;

    try {
      const res = await fetch("/api/cameras", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cameraId, rtspUrl }),
      });
      const data = await res.json();
      if (data.success) {
        setCameraList((prev) => [...prev, { cameraId, hlsUrl: data.hlsUrl }]);
      } else {
        alert(data.error || "카메라 등록 실패");
      }
    } catch (err) {
      console.error("Failed to register camera:", err);
    }
    closeDeviceModal();
  };

  // -----------------------------------------------------
  // SFU & mediasoup 관련: socket과 device를 useRef로 관리
  // -----------------------------------------------------
>>>>>>> hotfix/urgent-bug
  const socketRef = useRef(null);
  const deviceRef = useRef(null);
  const [sendTransport, setSendTransport] = useState(null);

  // remoteStream (옵션), localVideo, remoteVideo
  const [remoteStream, setRemoteStream] = useState(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // ------------------------------------------------------------
  // 로그인된 유저 표시
  // ------------------------------------------------------------
//   const [profile, setProfile] = useState(null);
//   const [loading, setLoading] = useState(true);

//  useEffect(() => {
//     getMemberProfile()
//       .then((data) => {
//         setProfile(data);
//       })
//       .catch((err) => {
//         console.error("Failed to get profile:", err);
//         setProfile(null); // 또는 그대로 null
//       })
//       .finally(() => {
//         setLoading(false);
//       });
//   }, []);

<<<<<<< HEAD
//   if (!profile) return <div>Loading...</div>;
  // {profile.id} or {profile.email} or {profile.name} or {profile.subscription_plan} => 로그인 사용자 정보 변수

  // ------------------------------------------------------------
  // "웹캠 연결" 버튼 => 웹캠 목록 모달 열기
  // ------------------------------------------------------------
  const handleOpenWebcamSelect = async () => {
    try {
      // 임시로 getUserMedia 권한 확인
      const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
      tempStream.getTracks().forEach((t) => t.stop());

      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter((d) => d.kind === "videoinput");
      if (videoInputs.length > 0) {
        setSelectedDeviceId(videoInputs[0].deviceId);
      } else {
        alert("사용 가능한 웹캠이 없습니다.");
=======
  // CV 서비스 API를 주기적으로 호출하여 감지 결과 업데이트 (예시: 1초마다)
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        // 실제 사용 시 적절한 cctv_url, cctv_id를 전달해야 합니다.
        const result = await callPeopleDetection("dummy_url", "dummy_id");
        // result.detectionBoxes가 얼굴 영역 정보라고 가정 (예: [{ x, y, width, height }, ...])
        setDetectionBoxes(result.detectionBoxes || []);
      } catch (error) {
        console.error("Error in detection polling:", error);
>>>>>>> hotfix/urgent-bug
      }
      setVideoDevices(videoInputs);
      setWebcamModalOpen(true);
    } catch (err) {
      console.error("handleOpenWebcamSelect error:", err);
      alert("카메라 권한이 필요합니다.");
    }
  };

  // (카메라 선택 모달 관련)
=======
  // 웹캠 선택 모달
>>>>>>> hotfix
  const [webcamModalOpen, setWebcamModalOpen] = useState(false);
  const [videoDevices, setVideoDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");

<<<<<<< HEAD
<<<<<<< HEAD
  const handleConfirmWebcamSelection = async () => {
=======
  // (A) "웹캠 연결" 버튼 클릭 시 – 먼저 getUserMedia({video: true})로 권한 팝업 띄우고 장치 목록 확보
=======
  // 로그인한 사용자 정보
  const [currentUser, setCurrentUser] = useState(null);

  // 삭제 관련 state 추가
  const [deletingCamera, setDeletingCamera] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);  // 모달 이름 변경

  // 페이지 로드 시 사용자 정보와 CCTV 목록 가져오기
  useEffect(() => {
    const fetchUserAndCameras = async () => {
      try {
        // 1. 현재 로그인한 사용자 정보 가져오기
        const userResponse = await fetch('/api/members/me', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          }
        });
        
        if (!userResponse.ok) {
          throw new Error('사용자 정보를 가져올 수 없습니다.');
        }
        
        const userData = await userResponse.json();
        setCurrentUser(userData);

        // 2. 사용자의 CCTV 목록 가져오기
        const cctvResponse = await fetch(`/api/cctvs/${userData.id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          }
        });

        if (!cctvResponse.ok) {
          throw new Error('CCTV 목록을 가져올 수 없습니다.');
        }

        const cctvData = await cctvResponse.json();
        // CCTV 목록을 cameraList 형식에 맞게 변환
        const formattedCameraList = cctvData.map(cctv => ({
          cameraId: cctv.id,
          name: cctv.cctv_name,
          type: cctv.api_url ? "cctv" : "webcam",
          deviceId: cctv.api_url,
          status: "connected"
        }));
        
        setCameraList(formattedCameraList);

      } catch (error) {
        console.error("데이터 로딩 실패:", error);
        alert("데이터를 불러오는데 실패했습니다.");
      }
    };

    fetchUserAndCameras();
  }, []);

  // ------------------------------------------------------------
  // "웹캠 연결" 버튼 => 웹캠 목록 모달 열기
  // ------------------------------------------------------------
>>>>>>> hotfix
  const handleOpenWebcamSelect = async () => {
    try {
<<<<<<< HEAD
      const tempStream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      console.log("[DBG] 임시 스트림 획득:", tempStream.getTracks());
=======
      const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
>>>>>>> hotfix
      tempStream.getTracks().forEach((t) => t.stop());

      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter((d) => d.kind === "videoinput");
      if (videoInputs.length === 0) {
        alert("사용 가능한 웹캠이 없습니다.");
        return;
      }
      setSelectedDeviceId(videoInputs[0].deviceId);
      setVideoDevices(videoInputs);
      setWebcamModalOpen(true);
    } catch (err) {
<<<<<<< HEAD
      console.error("[ERR] handleOpenWebcamSelect => getUserMedia error:", err);
      alert(
        "카메라 권한이 거부되었거나 접근할 수 없습니다.\n브라우저/OS 설정에서 카메라 허용을 확인해 주세요."
      );
=======
      console.error("handleOpenWebcamSelect error:", err);
      alert("카메라 권한이 필요합니다.");
>>>>>>> hotfix
    }
  };

  // ------------------------------------------------------------
  // "웹캠 선택" 모달 => "확인"
  // ------------------------------------------------------------
  const handleConfirmWebcamSelection = async () => {
<<<<<<< HEAD
    console.log(
      "[DBG] handleConfirmWebcamSelection. selectedDeviceId=",
      selectedDeviceId
    );
>>>>>>> hotfix/urgent-bug
    if (!selectedDeviceId) {
=======
    if (!selectedDeviceId || !currentUser) {
>>>>>>> hotfix
      alert("카메라를 선택하세요!");
      return;
    }
    setWebcamModalOpen(false);
<<<<<<< HEAD
<<<<<<< HEAD

    // (1) 로컬 스트림 획득
    let rawStream;
    try {
      rawStream = await navigator.mediaDevices.getUserMedia({
        video: {
=======

    try {
      // 1. 로컬 스트림 획득
      const rawStream = await navigator.mediaDevices.getUserMedia({
        video: { 
>>>>>>> hotfix
          deviceId: { exact: selectedDeviceId },
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 30 },
        },
        audio: false,
      });
<<<<<<< HEAD
      setLocalStream(rawStream);

      // 로컬 프리뷰
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = rawStream;
        await localVideoRef.current.play().catch((err) => {
          console.warn("localVideo play error:", err);
        });
      }
      console.log("[DBG] local webcam opened =>", rawStream.getTracks());
    } catch (err) {
      console.error("getUserMedia 실패:", err);
      alert("카메라 열기에 실패했습니다: " + err.message);
      return;
    }

    // (2) SFU 연결 + produce
    try {
      if (!socketRef.current || !deviceRef.current) {
        console.log("[DBG] SFU 미연결 => handleConnectSFU()");
        await handleConnectSFU();
      }
      console.log("[DBG] SFU 연결 상태 => produceVideoTrack");
      await produceVideoTrack(rawStream);
    } catch (err) {
      console.error("SFU produce error:", err);
=======
    if (!socketRef.current || !deviceRef.current) {
      console.log(
        "[DBG] SFU 미연결 또는 device 미로드 => handleConnectSFUAndProduce 호출"
      );
      await handleConnectSFUAndProduce(selectedDeviceId);
    } else {
      console.log("[DBG] SFU 이미 연결됨 => 바로 produce 실행");
      await handleStartWebcamWithDevice(selectedDeviceId);
>>>>>>> hotfix/urgent-bug
    }
  };

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
        resolve(res.rtpCapabilities);
      });
    });

    const dev = new Device();
    await dev.load({ routerRtpCapabilities: routerCaps });
    deviceRef.current = dev;
<<<<<<< HEAD
    console.log("Mediasoup Device loaded => canProduceVideo =", dev.canProduce("video"));
=======
    console.log(
      "Mediasoup Device loaded. canProduceVideo =",
      dev.canProduce("video")
    );
    console.log("[DBG] handleConnectSFU 완료");
    await handleStartWebcamWithDevice(deviceId);
>>>>>>> hotfix/urgent-bug
  }

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

<<<<<<< HEAD
      transport.on("connect", ({ dtlsParameters }, callback, errback) => {
        sock.emit("connectTransport", { transportId: transport.id, dtlsParameters }, (res) => {
          if (!res.success) errback(res.error);
          else callback();
        });
=======
    // 주기적으로 캔버스에 원본 영상을 그리면서, detectionBoxes 영역에만 모자이크 처리 적용
    const pixelation = 16; // 값이 클수록 모자이크 효과 강함
    const videoElem = document.createElement("video");
    videoElem.srcObject = rawStream;
    videoElem
      .play()
      .catch((err) => console.warn("videoElem play() error:", err));

    processingIntervalRef.current = setInterval(() => {
      // 전체 원본 영상 그리기
      ctx.drawImage(videoElem, 0, 0, width, height);
      // detectionBoxesRef.current에 있는 각 얼굴 영역에 대해 모자이크 처리
      detectionBoxesRef.current.forEach((box) => {
        // box: { x, y, width, height } – 이 값은 영상의 픽셀 단위로 가정
        const { x, y, width: w, height: h } = box;
        // 임시 캔버스에 해당 영역을 축소 후 다시 확대하여 픽셀화 효과 적용
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = w / pixelation;
        tempCanvas.height = h / pixelation;
        const tempCtx = tempCanvas.getContext("2d");
        tempCtx.drawImage(
          canvas,
          x,
          y,
          w,
          h,
          0,
          0,
          tempCanvas.width,
          tempCanvas.height
        );
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(
          tempCanvas,
          0,
          0,
          tempCanvas.width,
          tempCanvas.height,
          x,
          y,
          w,
          h
        );
>>>>>>> hotfix/urgent-bug
      });

<<<<<<< HEAD
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
=======
    // (3) 생성된 캔버스 스트림 (모자이크 처리된 영상) 저장
    const mosaicStream = canvas.captureStream(30);
    setProcessedStream(mosaicStream);

    // (4) 로컬 미리보기에 processedStream 표시
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = mosaicStream;
      localVideoRef.current
        .play()
        .catch((err) => console.warn("localVideo play() error:", err));
    }

    // (5) SFU 전송: 모자이크 처리된 스트림 사용
    const transportParams = await createTransport(sock, "send");
    const transport = dev.createSendTransport(transportParams);
    transport.on("connect", ({ dtlsParameters }, callback, errback) => {
      sock.emit(
        "connectTransport",
        { transportId: transport.id, dtlsParameters },
        (res) => {
          if (!res.success) {
            errback(res.error);
          } else {
            callback();
          }
        }
      );
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
          if (!res.success) {
            errback(res.error);
          } else {
            callback({ id: res.producerId });
>>>>>>> hotfix/urgent-bug
          }
        );
      });

      setSendTransport(transport);
    }

    try {
<<<<<<< HEAD
      await transport.produce({ track: rawStream.getVideoTracks()[0] });
      console.log("[DBG] Producer(원본) 생성 완료");
=======
      const producer = await transport.produce({
        track: mosaicStream.getVideoTracks()[0],
      });
      console.log("Producer 생성됨, id =", producer.id);
>>>>>>> hotfix/urgent-bug
    } catch (err) {
      console.error("produce error:", err);
    }
  }

  function createTransport(sock, direction) {
    return new Promise((resolve, reject) => {
      sock.emit("createTransport", { direction }, (res) => {
        if (!res.success) reject(new Error(res.error));
        else resolve(res.transportParams);
      });
    });
  }

  // ------------------------------------------------------------
  // 웹캠 연결 해제
  // ------------------------------------------------------------
  const handleWebcamDisconnect = () => {
    if (localStream) {
      localStream.getTracks().forEach((t) => t.stop());
    }
    setLocalStream(null);
<<<<<<< HEAD

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

=======
    setProcessedStream(null);
    setRemoteStream(null);
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    if (processingIntervalRef.current)
      clearInterval(processingIntervalRef.current);
>>>>>>> hotfix/urgent-bug
    if (sendTransport) {
      sendTransport.close();
      setSendTransport(null);
    }
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    deviceRef.current = null;
=======
      
      // 2. 선택된 장치 정보 가져오기
      const selectedDevice = videoDevices.find(d => d.deviceId === selectedDeviceId);
      const cameraName = selectedDevice?.label || "웹캠";

      // 3. CCTV 정보를 백엔드에 저장
      const cctvResponse = await fetch('/api/cctvs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          member_id: currentUser.id,
          cctv_name: cameraName,
          location: "webcam",  // 웹캠의 경우 location을 'webcam'으로 설정
        })
      });

      if (!cctvResponse.ok) {
        throw new Error('CCTV 정보 저장 실패');
      }

      const cctvData = await cctvResponse.json();
      
      // 4. 전역 context에 localStream 세팅
      setLocalStream(rawStream);
      setCctvId(cctvData.id);

      // 5. cameraList에 새로운 웹캠 추가
      setCameraList(prev => [...prev, {
        cameraId: cctvData.id,
        name: cameraName,
        type: "webcam",
        deviceId: selectedDeviceId,
        status: "connected"
      }]);

    } catch (err) {
      console.error("카메라 설정 실패:", err);
      alert("카메라 설정에 실패했습니다: " + err.message);
    }
  };

  // 비밀번호 확인 및 카메라 삭제 처리
  const handleDeleteCamera = async () => {
    try {
      const deleteResponse = await fetch(`/api/cctvs/${deletingCamera.cameraId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (!deleteResponse.ok) {
        throw new Error('카메라 삭제 실패');
      }

      // 3. 목록에서 제거
      setCameraList(prev => prev.filter(cam => cam.cameraId !== deletingCamera.cameraId));
      
      // 4. 모달 닫기 & 상태 초기화
      setShowDeleteModal(false);
      setDeletingCamera(null);

    } catch (error) {
      console.error("카메라 삭제 실패:", error);
      alert("카메라 삭제에 실패했습니다.");
    }
  };

  const handleDeleteClick = (camera) => {
    setDeletingCamera(camera);
    setShowDeleteModal(true);
>>>>>>> hotfix
  };

  // ------------------------------------------------------------
  // 2FPS 모자이크 로직
  // ------------------------------------------------------------
  useEffect(() => {
    if (!localStream) {
      setMosaicImageUrl(null);
      return;
    }
    const intervalId = setInterval(() => {
      if (!localVideoRef.current) return;
      if (isProcessingRef.current) return;

      isProcessingRef.current = true;
      const ctx = canvasRef.current.getContext("2d");
      ctx.drawImage(localVideoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);

      canvasRef.current.toBlob(async (blob) => {
        if (!blob) {
          isProcessingRef.current = false;
          return;
        }
        try {
          const formData = new FormData();
          formData.append("file", blob, "frame.png");
          const res = await fetch("/yolo_mosaic", { method: "POST", body: formData });
          if (!res.ok) throw new Error(`/yolo_mosaic error: ${res.status}`);

          const resultBlob = await res.blob();
          const imgUrl = URL.createObjectURL(resultBlob);
          setMosaicImageUrl(imgUrl);
        } catch (err) {
          console.error("auto-mosaic error:", err);
        } finally {
          isProcessingRef.current = false;
        }
      }, "image/png");
    }, 100);

    return () => clearInterval(intervalId);
  }, [localStream, setMosaicImageUrl, isProcessingRef]);

  // ------------------------------------------------------------
  // localStream 연결 후 일정 시간 후 /cctv-monitoring으로 전환
  // ------------------------------------------------------------
  useEffect(() => {
    if (localStream) {
      const timer = setTimeout(() => {
        navigate("/cctv-monitoring");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [localStream, navigate]);

  return (
<<<<<<< HEAD
    <div className="min-h-screen bg-gray-50 font-sans">
<<<<<<< HEAD
      {/* 공통 네비 바 */}
      <ResponsiveNav onOpenPrivacy={handleOpenPrivacy} />
=======
      {/* 상단 Nav */}
      <nav className="bg-white shadow">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-8">
              <span className="text-xl font-bold text-black">I See U</span>
              <div className="flex space-x-3">
                <Link
                  to="/monitor"
                  className={`inline-flex items-center px-1 pt-1 nav-link ${
                    isMonitorActive
                      ? "bg-black text-white font-medium"
                      : "text-gray-500 hover:text-black"
                  }`}
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: "0.375rem",
                    transition: "all 0.3s ease",
                    backgroundColor: isMonitorActive ? "#000" : "#f3f4f6",
                    color: isMonitorActive ? "#fff" : "#000",
                  }}
                >
                  내 모니터링
                </Link>
                <Link
                  to="/dashboard"
                  className={`inline-flex items-center px-1 pt-1 nav-link ${
                    isDashboardActive
                      ? "bg-black text-white font-medium"
                      : "text-gray-500 hover:text-black"
                  }`}
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: "0.375rem",
                    transition: "all 0.3s ease",
                    backgroundColor: isDashboardActive ? "#000" : "#f3f4f6",
                    color: isDashboardActive ? "#fff" : "#000",
                  }}
                >
                  통계 분석
                </Link>
                <Link
                  to="/ai-insight"
                  className={`inline-flex items-center px-1 pt-1 nav-link ${
                    isAiInsightActive
                      ? "bg-black text-white font-medium"
                      : "text-gray-500 hover:text-black"
                  }`}
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: "0.375rem",
                    transition: "all 0.3s ease",
                    backgroundColor: isAiInsightActive ? "#000" : "#f3f4f6",
                    color: isAiInsightActive ? "#fff" : "#000",
                  }}
                >
                  AI 인사이트
                </Link>

                {/* 챗봇 */}
                <Link
                  to="/chatbot"
                  className={`inline-flex items-center px-1 pt-1 nav-link ${
                    isChatbotActive
                      ? "bg-black text-white font-medium"
                      : "text-gray-500 hover:text-black"
                  }`}
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: "0.375rem",
                    transition: "all 0.3s ease",
                    backgroundColor: isChatbotActive ? "#000000" : "#f3f4f6",
                    color: isChatbotActive ? "#ffffff" : "#000000",
                  }}
                >
                  챗봇
                </Link>

                {/* 사용 방법 */}

                <Link
                  to="/guide"
                  className={`inline-flex items-center px-1 pt-1 nav-link ${
                    isGuideActive
                      ? "bg-black text-white font-medium"
                      : "text-gray-500 hover:text-black"
                  }`}
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: "0.375rem",
                    transition: "all 0.3s ease",
                    backgroundColor: isGuideActive ? "#000" : "#f3f4f6",
                    color: isGuideActive ? "#fff" : "#000",
                  }}
                >
                  사용 방법
                </Link>
                <button
                  type="button"
                  onClick={openPrivacy}
                  className="inline-flex items-center px-1 pt-1 text-gray-500 hover:text-black nav-link"
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: "0.375rem",
                    transition: "all 0.3s ease",
                    backgroundColor: "#f3f4f6",
                    color: "#000",
                  }}
                >
                  개인정보법 안내
                </button>
              </div>
            </div>
            <div className="flex items-center">
              <button className="p-2 rounded-full hover:bg-gray-100 relative">
                <i className="fas fa-bell text-gray-600"></i>
                <span className="absolute top-1 right-1 bg-red-500 rounded-full w-2 h-2" />
              </button>
              <button className="ml-3 p-2 rounded-full hover:bg-gray-100">
                <i className="fas fa-cog text-gray-600"></i>
              </button>
              <div className="ml-4 flex items-center">
                <img
                  className="h-8 w-8 rounded-full"
                  src="/기본프로필.png"
                  alt="사용자 프로필"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">
                  {displayName}
                </span>
              </div>
            </div>
          </div>
        </div>
      </nav>
>>>>>>> hotfix/urgent-bug

      {/* 메인 컨텐츠 */}
      <div className="max-w-8xl pt-20 mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">CCTV 모니터링</h1>
          <button
<<<<<<< HEAD
            onClick={() => setDeviceModalOpen(true)}
=======
            onClick={() => openDeviceModal("CCTV")}
>>>>>>> hotfix/urgent-bug
=======
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen flex flex-col">
      {/* 네비게이션 */}
      <ResponsiveNav onOpenPrivacy={handleOpenPrivacy} />

      {/* 메인 컨텐츠 */}
      <div className="flex-1 pt-20 max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            CCTV 모니터링
          </h1>
          <button
            onClick={() => {
              setDeviceType("CCTV");
              setDeviceModalOpen(true);
            }}
>>>>>>> hotfix
            className="rounded-button bg-black text-white px-4 py-2 flex items-center"
          >
            <i className="fas fa-plus mr-2"></i> 새 장치 연결
          </button>
        </div>
<<<<<<< HEAD
        <div className="mb-4 text-gray-600">
          <span className="font-medium">환영합니다 관리자님!</span>
        </div>

        {/* (1) 장치 연결 버튼들 */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <div
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col items-center justify-center min-h-[200px] cursor-pointer hover:border-custom"
            onClick={() => setDeviceModalOpen(true)}
=======

        <div className="mb-4 text-gray-600 dark:text-gray-400">
          <span className="font-medium">환영합니다 관리자님!</span>
        </div>
        {/* 장치 연결 버튼들 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          <div
            className="bg-white dark:bg-gray-800 dark:text-gray-200 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center min-h-[160px] cursor-pointer hover:border-custom transition"
            onClick={() => {
              setDeviceType("CCTV");
              setDeviceModalOpen(true);
            }}
>>>>>>> hotfix
          >
            <i className="fas fa-video text-4xl text-custom mb-4"></i>
            <span className="text-gray-700 dark:text-gray-300">CCTV 연결</span>
          </div>
          <div
            className="bg-white dark:bg-gray-800 dark:text-gray-200 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center min-h-[160px] cursor-pointer hover:border-custom transition"
            onClick={handleOpenWebcamSelect}
          >
<<<<<<< HEAD
            <i className="fas fa-webcam text-4xl text-custom mb-4"></i>
            <span className="text-gray-700">웹캠 연결</span>
          </div>
          <div
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col items-center justify-center min-h-[200px] cursor-pointer hover:border-custom"
            onClick={openQRModal}
          >
            <i className="fas fa-mobile-alt text-4xl text-custom mb-4"></i>
            <span className="text-gray-700">스마트폰 연결</span>
          </div>
          <div
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col items-center justify-center min-h-[200px] cursor-pointer hover:border-custom"
            onClick={() => setDeviceType("Blackbox")}
          >
            <i className="fas fa-car text-4xl text-custom mb-4"></i>
            <span className="text-gray-700">블랙박스 연결</span>
          </div>
        </div>

        {/* (2) 원본 미리보기 (WebRTC) */}
        {(localStream || remoteStream) && (
          <div className="bg-white p-4 rounded-lg border mb-6">
<<<<<<< HEAD
            <h2 className="text-lg font-semibold mb-2">웹캠 실시간 미리보기 (원본)</h2>
=======
            <h2 className="text-lg font-semibold mb-2">
              웹캠 실시간 미리보기 (모자이크 처리됨)
            </h2>
>>>>>>> hotfix/urgent-bug
            <div className="flex space-x-4">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                style={{ width: "320px", background: "#000" }}
              />
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                style={{ width: "320px", background: "#333" }}
              />
            </div>
            <button
              onClick={handleWebcamDisconnect}
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded"
            >
              웹캠 연결 종료
            </button>

            {/* 모자이크 결과 (2FPS) */}
            {mosaicImageUrl && (
              <div className="mt-6">
                <h3 className="font-semibold mb-2">모자이크 결과 (2FPS)</h3>
                <img
                  src={mosaicImageUrl}
                  alt="모자이크 결과"
                  style={{ width: "320px", border: "1px solid #ccc" }}
                />
              </div>
            )}
          </div>
        )}

        {/* Canvas for mosaic */}
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          style={{ display: "none" }}
        />

        <ConnectedDevices cameraList={cameraList} />
      </div>

      {/* CCTVMonitoring 컴포넌트를 조건부로 렌더링 */}
      {overlayVisible && selectedCamera && (
        <CCTVMonitoring
          selectedCamera={selectedCamera}
          onClose={closeOverlay}
          onSwitchDevice={handleSwitchDevice}
        />
      )}

      <footer className="bg-white border-t border-gray-200 mt-8">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="text-center text-sm text-gray-500">
<<<<<<< HEAD
            © 2024 I See U. All rights reserved.
=======
            © 2025 I See U. All rights reserved.
>>>>>>> hotfix/urgent-bug
          </div>
        </div>
      </footer>

      {/* QR 모달 */}
      {qrVisible && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded">
            <h3 className="text-lg font-semibold mb-2">스마트폰 연결</h3>
            <p>이 QR 코드를 스캔하세요.</p>
            <button onClick={closeQRModal}>닫기</button>
=======
            <i className="fas fa-camera text-4xl text-custom mb-4"></i>
            <span className="text-gray-700 dark:text-gray-300">웹캠 연결</span>
          </div>
        </div>

        {/* Canvas for mosaic (숨김) */}
        <canvas ref={canvasRef} width={640} height={480} style={{ display: "none" }} />

        {/* 연결된 장치 목록 */}
        <ConnectedDevices 
          cameraList={cameraList} 
          onDeleteClick={handleDeleteClick}
        />
      </div>

      {/* 푸터 영역 */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="text-center text-base text-gray-500 dark:text-gray-400">
            © 2025 I See U. All rights reserved.
>>>>>>> hotfix
          </div>
        </div>
      </footer>

      {/* 장치등록 모달 */}
      {deviceModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
<<<<<<< HEAD
          <div className="bg-white w-full max-w-md p-6 rounded-lg relative">
            <button
<<<<<<< HEAD
              onClick={() => setDeviceModalOpen(false)}
=======
              onClick={closeDeviceModal}
>>>>>>> hotfix/urgent-bug
=======
          <div className="bg-white dark:bg-gray-800 dark:text-gray-200 w-full max-w-md p-6 rounded-lg relative border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setDeviceModalOpen(false)}
>>>>>>> hotfix
              className="absolute top-4 right-4 text-gray-400 hover:text-custom"
            >
              <i className="fas fa-times text-xl"></i>
            </button>
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
              {deviceType === "CCTV" ? "CCTV 연결 정보" : "블랙박스 연결 정보"}
            </h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
<<<<<<< HEAD
                // handleSubmitDevice() 등은 필요 시 구현
              }}
            >
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
=======
                // handleSubmitDevice()
              }}
            >
              <div className="mb-4">
                <label className="block text-base font-medium text-gray-700 dark:text-gray-300">
>>>>>>> hotfix
                  장치 이름
                </label>
                <input
                  type="text"
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md shadow-sm"
                  placeholder="예: 복도1 카메라"
                />
              </div>
              <div className="mb-4">
<<<<<<< HEAD
                <label className="block text-sm font-medium text-gray-700">
=======
                <label className="block text-base font-medium text-gray-700 dark:text-gray-300">
>>>>>>> hotfix
                  IP
                </label>
                <input
                  type="text"
                  value={deviceIP}
                  onChange={(e) => setDeviceIP(e.target.value)}
                  className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md shadow-sm"
                  placeholder="예: 192.168.0.10"
                />
              </div>
              <div className="mb-4">
<<<<<<< HEAD
                <label className="block text-sm font-medium text-gray-700">
=======
                <label className="block text-base font-medium text-gray-700 dark:text-gray-300">
>>>>>>> hotfix
                  Port
                </label>
                <input
                  type="text"
                  value={devicePort}
                  onChange={(e) => setDevicePort(e.target.value)}
                  className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md shadow-sm"
                  placeholder="예: 554"
                />
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  type="button"
<<<<<<< HEAD
<<<<<<< HEAD
                  onClick={() => setDeviceModalOpen(false)}
=======
                  onClick={closeDeviceModal}
>>>>>>> hotfix/urgent-bug
                  className="border border-gray-300 px-4 py-2 rounded"
=======
                  onClick={() => setDeviceModalOpen(false)}
                  className="border border-gray-300 dark:border-gray-600 px-4 py-2 rounded text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
>>>>>>> hotfix
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="bg-black text-white px-4 py-2 rounded"
                >
                  등록
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* "웹캠 선택" 모달 */}
      {webcamModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
<<<<<<< HEAD
          <div className="bg-white w-full max-w-md p-6 rounded-lg relative">
=======
          <div className="bg-white dark:bg-gray-800 dark:text-gray-200 w-full max-w-md p-6 rounded-lg relative border border-gray-200 dark:border-gray-700">
>>>>>>> hotfix
            <button
              onClick={() => setWebcamModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-custom"
            >
              <i className="fas fa-times text-xl"></i>
            </button>
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
              웹캠 선택
            </h2>
            {videoDevices.length === 0 ? (
              <p className="text-red-500">사용 가능한 카메라가 없습니다.</p>
            ) : (
              <>
                <p className="text-base text-gray-600 dark:text-gray-300 mb-4">
                  사용할 카메라 장치를 선택하세요
                </p>
                <select
                  className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md px-3 py-2 text-base mb-4"
                  value={selectedDeviceId}
                  onChange={(e) => setSelectedDeviceId(e.target.value)}
                >
                  {videoDevices.map((dev) => (
                    <option key={dev.deviceId} value={dev.deviceId}>
                      {dev.label || `Camera (${dev.deviceId})`}
                    </option>
                  ))}
                </select>
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => setWebcamModalOpen(false)}
                    className="rounded-button border border-gray-300 dark:border-gray-600 px-4 py-2 text-base text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleConfirmWebcamSelection}
                    className="rounded-button bg-black text-white px-4 py-2 text-base hover:bg-black/90"
                  >
                    확인
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 개인정보법 안내 오버레이 */}
<<<<<<< HEAD
<<<<<<< HEAD
      {privacyOpen && <PrivacyOverlay open={privacyOpen} onClose={handleClosePrivacy} />}
=======
      {privacyOpen && (
        <PrivacyOverlay open={privacyOpen} onClose={closePrivacy} />
      )}
>>>>>>> hotfix/urgent-bug
=======
      {privacyOpen && (
        <PrivacyOverlay open={privacyOpen} onClose={handleClosePrivacy} />
      )}

      {/* 비밀번호 확인 모달 */}
      {showDeleteModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white dark:bg-gray-800 dark:text-gray-200 w-full max-w-md p-6 rounded-lg relative border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
              카메라 삭제 확인
            </h2>
            <div className="mb-6">
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                "{deletingCamera?.name}" 카메라를 정말 삭제하시겠습니까?
              </p>
              <p className="text-red-500 text-base">
                삭제된 데이터는 다시 복원할 수 없습니다.
              </p>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingCamera(null);
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                취소
              </button>
              <button
                onClick={handleDeleteCamera}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
>>>>>>> hotfix
    </div>
  );
}

<<<<<<< HEAD
// 연결된 장치 목록 (예시)
function ConnectedDevices({ cameraList }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-6">
      <div className="p-6">
<<<<<<< HEAD
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-200 mb-4">연결된 장치</h2>
=======
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          연결된 장치{" "}
          <span className="text-sm text-gray-500">
            (총 {cameraList.length}대)
          </span>
        </h2>
>>>>>>> hotfix/urgent-bug
        {cameraList.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">아직 등록된 카메라가 없습니다.</p>
=======
// 연결된 장치 목록 (수정)
function ConnectedDevices({ cameraList, onDeleteClick }) {
  const navigate = useNavigate();
  const { setLocalStream, setCctvId } = useContext(AppContext);

  const handleCameraClick = async (camera) => {
    if (camera.type === "webcam") {
      try {
        // 선택된 웹캠으로 스트림 다시 얻기
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            deviceId: { exact: camera.deviceId },
            width: { ideal: 640 },
            height: { ideal: 480 },
            frameRate: { ideal: 30 },
          },
          audio: false,
        });
        
        setLocalStream(stream);
        setCctvId(camera.cameraId);
        navigate("/cctv-monitoring");
      } catch (err) {
        console.error("카메라 연결 실패:", err);
        alert("카메라 연결에 실패했습니다.");
      }
    } 
    // } else if (camera.type === "cctv") {
    //   connectIpCamera(camera);
    // }
  };
  
  const handleDeleteClick = (e, camera) => {
    e.stopPropagation(); // 카메라 클릭 이벤트 전파 방지
    onDeleteClick(camera);  // 부모의 핸들러 호출
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-6">
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-200 mb-4">
          연결된 장치
        </h2>
        {cameraList.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">
            아직 등록된 카메라가 없습니다.
          </p>
>>>>>>> hotfix
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {cameraList.map((cam) => (
<<<<<<< HEAD
              <li key={cam.cameraId} className="p-2 bg-gray-50 dark:bg-gray-700 rounded">
                <div className="flex justify-between items-center">
<<<<<<< HEAD
                  <span className="font-medium text-gray-700 dark:text-gray-200">{cam.cameraId}</span>
                  <span className="text-xs text-gray-400 dark:text-gray-300">{cam.hlsUrl}</span>
=======
                  <span className="font-medium text-gray-700">
                    {cam.cameraId}
                  </span>
                  <span className="text-xs text-gray-400">{cam.hlsUrl}</span>
>>>>>>> hotfix/urgent-bug
                </div>

                {/* 정보 오버레이 */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-white font-medium">{cam.name}</h3>
                      <p className="text-gray-300 text-sm">상태: 정상</p>
                    </div>
                    <div className="flex space-x-2">
                      {/* 확장 버튼 */}
                      <button className="rounded-full bg-white/20 hover:bg-white/30 p-2">
                        <i className="fas fa-expand text-white"></i>
                      </button>
                      {/* 설정 버튼 */}
                      <button className="rounded-full bg-white/20 hover:bg-white/30 p-2">
                        <i className="fas fa-cog text-white"></i>
                      </button>
                      {/* 녹화 버튼 */}
                      <button className="rounded-full bg-red-500 hover:bg-red-600 p-2">
                        <i className="fas fa-circle text-white"></i>
                      </button>
                    </div>
=======
              <li
                key={cam.cameraId}
                className="p-4 bg-gray-50 dark:bg-gray-700 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors relative group"
                onClick={() => handleCameraClick(cam)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-200">
                      {cam.name}
                    </span>
                    <span className="ml-2 text-xs text-gray-400">
                      (ID: {cam.cameraId})
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      cam.status === "connected" 
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                    }`}>
                      {cam.status}
                    </span>
                    <button
                      onClick={(e) => handleDeleteClick(e, cam)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700"
                    >
                      <i className="fas fa-times"></i>
                    </button>
>>>>>>> hotfix
                  </div>
                </div>
              </li>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Monitor;
