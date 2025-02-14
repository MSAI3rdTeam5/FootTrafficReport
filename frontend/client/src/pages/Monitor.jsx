import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import PrivacyOverlay from "./PrivacyOverlay";

function Monitor() {
  const location = useLocation();

  // ====== QR 모달 ======
  const [qrVisible, setQrVisible] = useState(false);
  const [qrTimestamp, setQrTimestamp] = useState(Date.now());
  const openQRModal = () => setQrVisible(true);
  const closeQRModal = () => setQrVisible(false);
  const refreshQR = () => setQrTimestamp(Date.now());

  // ====== 장치 등록 모달 ======
  const [deviceModalOpen, setDeviceModalOpen] = useState(false);
  const [deviceType, setDeviceType] = useState(null);
  const [deviceName, setDeviceName] = useState("");
  const [deviceIP, setDeviceIP] = useState("");
  const [devicePort, setDevicePort] = useState("");
  const [deviceUser, setDeviceUser] = useState("");
  const [devicePass, setDevicePass] = useState("");

  // ====== 개인정보법 안내 오버레이 ======
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const openPrivacy = () => setPrivacyOpen(true);
  const closePrivacy = () => setPrivacyOpen(false);

  // ====== 로그인된 유저 displayName ======
  const [displayName, setDisplayName] = useState("김관리자");
  useEffect(() => {
    fetch("/api/user", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.displayName) setDisplayName(data.displayName);
      })
      .catch(console.error);
  }, []);

  // ====== 등록된 카메라 목록 ======
  const [cameraList, setCameraList] = useState([]);

  // 탭 강조 로직
  const isMonitorActive = location.pathname === "/monitor";
  const isDashboardActive = location.pathname === "/dashboard";
  const isAiInsightActive = location.pathname === "/ai-insight";
  const isGuideActive = location.pathname === "/guide";

  // 장치등록 모달 열기/닫기
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
    setDeviceUser("");
    setDevicePass("");
  };

  const handleSubmitDevice = async (e) => {
    e.preventDefault();
    const cameraId = deviceName || `cam-${Date.now()}`;
    const rtspUrl = `rtsp://${deviceIP || "192.168.0.10"}:${devicePort || "554"}`;
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

  // ============ WebRTC (Janus) & VideoRoom ============
  const [janus, setJanus] = useState(null);
  const [publisherHandle, setPublisherHandle] = useState(null);
  const [subscriberHandle, setSubscriberHandle] = useState(null);
  const [myPublisherId, setMyPublisherId] = useState(null);

  const [localStream, setLocalStream] = useState(null);   // 내 웹캠
  const [remoteStream, setRemoteStream] = useState(null); // 내가 subscribe할 피드

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // (A) “웹캠 선택” 모달 상태
  const [webcamModalOpen, setWebcamModalOpen] = useState(false);
  const [videoDevices, setVideoDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");

  // (B) “웹캠 연결” 버튼 클릭 시: 장치 목록 나열 후 모달 표시
  const handleOpenWebcamSelect = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter((d) => d.kind === "videoinput");
      setVideoDevices(videoInputs);
      if (videoInputs.length > 0) {
        setSelectedDeviceId(videoInputs[0].deviceId);
      } else {
        alert("사용 가능한 웹캠(비디오 장치)이 없습니다.");
      }
      setWebcamModalOpen(true);
    } catch (err) {
      console.error("enumerateDevices() error:", err);
      alert("장치 목록을 가져오지 못했습니다.");
    }
  };

  // (C) 선택된 카메라로 웹캠 연결
  const handleConfirmWebcamSelection = () => {
    if (!selectedDeviceId) {
      alert("카메라를 선택하세요!");
      return;
    }
    setWebcamModalOpen(false);
    handleWebcamConnect(selectedDeviceId);
  };

  // (D) Janus init + attach (VideoRoom)
  const handleWebcamConnect = (deviceId) => {
    if (!window.Janus) {
      alert("Janus.js not loaded");
      return;
    }
    window.Janus.init({
      debug: "all",
      callback: () => createJanusSession(deviceId),
    });
  };

  const createJanusSession = (deviceId) => {
    const serverUrl = "wss://msteam5iseeu.ddns.net/janus-ws/";
    const j = new window.Janus({
      server: serverUrl,
      success: () => {
        setJanus(j);
        attachPublisherHandle(j, deviceId);
      },
      error: (err) => {
        console.error("[Janus] init error:", err);
      },
    });
  };

  // (E) VideoRoom Publisher
  const attachPublisherHandle = (janusInstance, deviceId) => {
    let localPubHandle = null;

    janusInstance.attach({
      plugin: "janus.plugin.videoroom",
      success: (pluginHandle) => {
        localPubHandle = pluginHandle;
        setPublisherHandle(pluginHandle);
        console.log("[Publisher] handle created:", pluginHandle.getId());

        // 1) "create" 요청 (room=9876)
        const createReq = {
          request: "create",
          room: 9876,
          publishers: 1,
          videocodec: "vp8",
          bitrate: 512000,
        };
        pluginHandle.send({
          message: createReq,
          success: (result) => {
            console.log("[Publisher] create() result [sync]:", result);
            if (result.error_code === 427) {
              // 이미 존재하는 방
              console.warn("[Publisher] Room 9876 already exists -> let's just join!");
              joinPublisher(localPubHandle, 9876);
            } else if (result.videoroom === "created") {
              // 새 방
              console.log("[Publisher] Room newly created => join it!");
              const newRoomId = result.room;
              joinPublisher(localPubHandle, newRoomId);
            }
          },
          error: (err) => {
            console.error("[Publisher] create() error [sync]:", err);
          },
        });
      },
      error: (err) => {
        console.error("[Publisher] attach error:", err);
      },
      onmessage: (msg, jsep) => {
        console.log("[Publisher] onmessage:", msg, jsep);
        const event = msg.videoroom;

        if (event === "joined") {
          // join 성공
          const myId = msg.id;
          console.log("[Publisher] joined room, myId =", myId);
          setMyPublisherId(myId);
          publishOwnFeed(localPubHandle);

        } else if (event === "event") {
          // 그 외 다른 event
          console.log("[Publisher] other event:", msg);
        }

        if (jsep) {
          localPubHandle.handleRemoteJsep({ jsep });
        }
      },
      onlocaltrack: (track, on) => {
        console.log("[Publisher] onlocaltrack:", track, on);
        if (!on) return;
        const stream = new MediaStream([track]);
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      },
      onremotetrack: (track, mid, on) => {
        console.log("[Publisher] onremotetrack:", track, mid, on);
      },
      oncleanup: () => {
        console.log("[Publisher] oncleanup");
        setLocalStream(null);
      },
    });
  };

  const joinPublisher = (pluginHandle, roomId) => {
    console.log(">>> joinPublisher() called with roomId =", roomId);

    const joinReq = {
      request: "join",
      room: roomId,
      ptype: "publisher",
      display: "MyPrivateWebcam",
    };
    pluginHandle.send({
      message: joinReq,
      success: (resp) => {
        console.log(">>> joinPublisher success (sync ack):", resp);
      },
      error: (err) => {
        console.error(">>> joinPublisher error (sync ack):", err);
      },
    });
  };

  // **★ tracks + data: false 로 데이터 채널 비활성 ★**
  const publishOwnFeed = (pluginHandle) => {
    // audio + video track, no data track
    const audioTrack = {
      type: "audio",
      capture: true,
      recv: true,
    };
    const videoTrack = {
      type: "video",
      capture: {
        deviceId: { exact: selectedDeviceId },
      },
      recv: true,
    };

    pluginHandle.createOffer({
      tracks: [ audioTrack, videoTrack ],
      data: false,  // 데이터 채널 비활성
      success: (jsep) => {
        console.log("[Publisher] createOffer success, jsep=", jsep);
        const publishReq = {
          request: "publish",
          audio: true,
          video: true,
          data: false,   // 데이터 채널 쓰지 않음
        };
        pluginHandle.send({ message: publishReq, jsep });
        // 발행 완료 후 -> Subscriber
        attachSubscriberHandle(janus);
      },
      error: (err) => {
        console.error("[Publisher] createOffer error:", err);
      },
    });
  };

  // (F) VideoRoom Subscriber
  const attachSubscriberHandle = (janusInstance) => {
    let localSubHandle = null;
    janusInstance.attach({
      plugin: "janus.plugin.videoroom",
      success: (pluginHandle) => {
        localSubHandle = pluginHandle;
        setSubscriberHandle(pluginHandle);
        console.log("[Subscriber] handle created:", pluginHandle.getId());
      },
      error: (err) => {
        console.error("[Subscriber] attach error:", err);
      },
      onmessage: (msg, jsep) => {
        console.log("[Subscriber] onmessage:", msg, jsep);
        const event = msg.videoroom;

        if (event === "attached") {
          // feed attach -> createAnswer
          pluginHandle.createAnswer({
            jsep,
            media: { audio: true, video: true, data: false },
            success: (ansJsep) => {
              console.log("[Subscriber] createAnswer success!", ansJsep);
              const body = { request: "start", room: 9876 };
              pluginHandle.send({ message: body, jsep: ansJsep });
            },
            error: (error) => {
              console.error("[Subscriber] createAnswer error:", error);
            },
          });
        } else if (jsep) {
          pluginHandle.handleRemoteJsep({ jsep });
        }
      },
      onremotetrack: (track, mid, on) => {
        console.log("[Subscriber] onremotetrack:", track, on);
        if (!on) return;
        const stream = new MediaStream([track]);
        setRemoteStream(stream);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
        }
      },
      oncleanup: () => {
        console.log("[Subscriber] oncleanup");
        setRemoteStream(null);
      },
    });

    setTimeout(() => {
      if (!myPublisherId) {
        console.warn("[Subscriber] No publisher ID known yet?");
        return;
      }
      console.log("[Subscriber] Subscribing to feed ID=", myPublisherId);
      localSubHandle.send({
        message: {
          request: "join",
          room: 9876,
          ptype: "subscriber",
          feed: myPublisherId,
        },
      });
    }, 1000);
  };

  // 연결 해제
  const handleWebcamDisconnect = () => {
    if (subscriberHandle) {
      subscriberHandle.hangup();
      subscriberHandle.detach();
      setSubscriberHandle(null);
    }
    if (publisherHandle) {
      publisherHandle.hangup();
      publisherHandle.detach();
      setPublisherHandle(null);
    }
    if (janus) {
      janus.destroy();
      setJanus(null);
    }
    setMyPublisherId(null);
    setLocalStream(null);
    setRemoteStream(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* 상단 Nav */}
      <nav className="bg-white shadow">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* 왼쪽 탭 */}
            <div className="flex items-center space-x-8">
              <span className="text-xl font-bold text-black">I See U</span>
              <div className="flex space-x-3">
                <Link
                  to="/monitor"
                  className={
                    "inline-flex items-center px-1 pt-1 nav-link " +
                    (isMonitorActive
                      ? "bg-black text-white font-medium"
                      : "text-gray-500 hover:text-black")
                  }
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: "0.375rem",
                    transition: "all 0.3s ease",
                    backgroundColor: isMonitorActive ? "#000000" : "#f3f4f6",
                    color: isMonitorActive ? "#ffffff" : "#000000",
                  }}
                >
                  내 모니터링
                </Link>

                <Link
                  to="/dashboard"
                  className={
                    "inline-flex items-center px-1 pt-1 nav-link " +
                    (isDashboardActive
                      ? "bg-black text-white font-medium"
                      : "text-gray-500 hover:text-black")
                  }
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: "0.375rem",
                    transition: "all 0.3s ease",
                    backgroundColor: isDashboardActive ? "#000000" : "#f3f4f6",
                    color: isDashboardActive ? "#ffffff" : "#000000",
                  }}
                >
                  통계 분석
                </Link>

                <Link
                  to="/ai-insight"
                  className={
                    "inline-flex items-center px-1 pt-1 nav-link " +
                    (isAiInsightActive
                      ? "bg-black text-white font-medium"
                      : "text-gray-500 hover:text-black")
                  }
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: "0.375rem",
                    transition: "all 0.3s ease",
                    backgroundColor: isAiInsightActive ? "#000000" : "#f3f4f6",
                    color: isAiInsightActive ? "#ffffff" : "#000000",
                  }}
                >
                  AI 인사이트
                </Link>

                <Link
                  to="/guide"
                  className={
                    "inline-flex items-center px-1 pt-1 nav-link " +
                    (isGuideActive
                      ? "bg-black text-white font-medium"
                      : "text-gray-500 hover:text-black")
                  }
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: "0.375rem",
                    transition: "all 0.3s ease",
                    backgroundColor: isGuideActive ? "#000000" : "#f3f4f6",
                    color: isGuideActive ? "#ffffff" : "#000000",
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
                    color: "#000000",
                  }}
                >
                  개인정보법 안내
                </button>
              </div>
            </div>

            {/* 오른쪽 */}
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

      {/* 메인 컨텐츠 */}
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">CCTV 모니터링</h1>
          <button
            onClick={() => openDeviceModal("CCTV")}
            className="rounded-button bg-black text-white px-4 py-2 flex items-center"
          >
            <i className="fas fa-plus mr-2"></i>
            새 장치 연결
          </button>
        </div>

        <div className="mb-4 text-gray-600">
          <span className="font-medium">환영합니다 {displayName}님!</span>
        </div>

        {/* 연결 방식 4개 박스 */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <div
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col items-center justify-center min-h-[200px] cursor-pointer hover:border-custom"
            onClick={() => openDeviceModal("CCTV")}
          >
            <i className="fas fa-video text-4xl text-custom mb-4"></i>
            <span className="text-gray-700">CCTV 연결</span>
          </div>

          {/* 웹캠 연결 (선택 모달) */}
          <div
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col items-center justify-center min-h-[200px] cursor-pointer hover:border-custom"
            onClick={handleOpenWebcamSelect}
          >
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
            onClick={() => openDeviceModal("Blackbox")}
          >
            <i className="fas fa-car text-4xl text-custom mb-4"></i>
            <span className="text-gray-700">블랙박스 연결</span>
          </div>
        </div>

        {/* 웹캠 영상 미리보기 */}
        {(localStream || remoteStream) && (
          <div className="bg-white p-4 rounded-lg border mb-6">
            <h2 className="text-lg font-semibold mb-2">웹캠 실시간 미리보기</h2>
            <div className="flex space-x-4">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                style={{ width: "320px", background: "#000" }}
              />
              <video
                ref={remoteVideoRef}
                autoPlay
                style={{ width: "320px", background: "#333" }}
              />
            </div>
            <button
              onClick={handleWebcamDisconnect}
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded"
            >
              웹캠 연결 종료
            </button>
          </div>
        )}

        <ConnectedDevices cameraList={cameraList} />
      </div>

      <footer className="bg-white border-t border-gray-200 mt-8">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="text-center text-sm text-gray-500">
            © 2024 I See U. All rights reserved.
          </div>
        </div>
      </footer>

      {/* QR 모달 */}
      {qrVisible && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded">
            <h3 className="text-lg font-semibold mb-2">스마트폰 연결</h3>
            <p>이 QR 코드를 스캔하세요</p>
            <button onClick={closeQRModal}>닫기</button>
          </div>
        </div>
      )}

      {/* 장치등록 모달 */}
      {deviceModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white w-full max-w-md p-6 rounded-lg relative">
            <button
              onClick={closeDeviceModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-custom"
            >
              <i className="fas fa-times text-xl"></i>
            </button>

            <h2 className="text-xl font-bold mb-4">
              {deviceType === "CCTV" ? "CCTV 연결 정보" : "블랙박스 연결 정보"}
            </h2>
            <form onSubmit={handleSubmitDevice}>
              {/* 폼 필드들 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  장치 이름
                </label>
                <input
                  type="text"
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                  placeholder="예: 복도1 카메라"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  IP
                </label>
                <input
                  type="text"
                  value={deviceIP}
                  onChange={(e) => setDeviceIP(e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                  placeholder="예: 192.168.0.10"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Port
                </label>
                <input
                  type="text"
                  value={devicePort}
                  onChange={(e) => setDevicePort(e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                  placeholder="예: 554"
                />
              </div>

              {/* etc. 계정, 비번 등 */}

              <div className="flex justify-end space-x-2 mt-6">
                <button
                  type="button"
                  onClick={closeDeviceModal}
                  className="border border-gray-300 px-4 py-2 rounded"
                >
                  취소
                </button>
                <button type="submit" className="bg-black text-white px-4 py-2 rounded">
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
          <div className="bg-white w-full max-w-md p-6 rounded-lg relative">
            <button
              onClick={() => setWebcamModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-custom"
            >
              <i className="fas fa-times text-xl"></i>
            </button>

            <h2 className="text-xl font-bold mb-4">웹캠 선택</h2>

            {videoDevices.length === 0 ? (
              <p className="text-red-500">사용 가능한 카메라가 없습니다.</p>
            ) : (
              <>
                <p className="text-sm text-gray-600 mb-4">
                  사용할 카메라 장치를 선택하세요
                  <br />
                  (가상 카메라를 선택 시 검정 화면이 표시될 수 있습니다)
                </p>
                <select
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mb-4"
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
                    className="rounded-button border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleConfirmWebcamSelection}
                    className="rounded-button bg-black text-white px-4 py-2 text-sm hover:bg-black/90"
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
      {privacyOpen && <PrivacyOverlay open={privacyOpen} onClose={closePrivacy} />}
    </div>
  );
}

/** 연결된 장치 목록 */
function ConnectedDevices({ cameraList }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">연결된 장치</h2>
        {cameraList.length === 0 ? (
          <p className="text-gray-500">아직 등록된 카메라가 없습니다.</p>
        ) : (
          <ul className="space-y-3">
            {cameraList.map((cam) => (
              <li key={cam.cameraId} className="p-2 bg-gray-50 rounded">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700">{cam.cameraId}</span>
                  <span className="text-xs text-gray-400">{cam.hlsUrl}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default Monitor;
