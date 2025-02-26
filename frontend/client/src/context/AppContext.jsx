// /home/azureuser/FootTrafficReport/frontend/client/src/context/AppContext.jsx

<<<<<<< HEAD
import React, { createContext, useState, useRef, useEffect } from 'react';
=======
import React, { createContext, useState, useRef, useEffect } from "react";
import { callPeopleDetection } from "../utils/api";
>>>>>>> hotfix

export const AppContext = createContext(null);

export function AppProvider({ children }) {
<<<<<<< HEAD
  const [localStream, setLocalStream] = useState(null);
  const [mosaicImageUrl, setMosaicImageUrl] = useState(null);

  // 2FPS 모자이크 관련 refs
  const hiddenVideoRef = useRef(null);       // 숨겨진 <video> (DOM에 append)
  const offscreenCanvasRef = useRef(null);   // 오프스크린 <canvas>
  const isProcessingRef = useRef(false);
  const intervalRef = useRef(null);

  // ------------------------------------------------------------
  // (1) localStream이 바뀔 때마다 숨겨진 <video>에 연결
  // ------------------------------------------------------------
  useEffect(() => {
    // (A) 처음에 hiddenVideoRef.current가 없으면, DOM에 <video> 요소를 1회 생성
    if (!hiddenVideoRef.current) {
      const videoEl = document.createElement('video');
      videoEl.style.display = 'none';         // 화면에 안보이게
      videoEl.playsInline = true;
      videoEl.muted = true;
      videoEl.autoplay = true;
      document.body.appendChild(videoEl);     // body에 삽입(또는 document.createElement('div')등)
      hiddenVideoRef.current = videoEl;
    }

    // (B) localStream이 존재하면 video.srcObject = localStream
    if (localStream) {
      hiddenVideoRef.current.srcObject = localStream;
      hiddenVideoRef.current
        .play()
        .catch(err => console.warn("[AppContext] hiddenVideo play error:", err));
    } else {
      // localStream이 null이면 <video> srcObject 해제
=======
  // 1) 전역 상태
  const [localStream, setLocalStream] = useState(null);
  const [mosaicImageUrl, setMosaicImageUrl] = useState(null);

  // 2) int형 cctvId (Monitor.jsx 등에서 setCctvId(2) 가능)
  const [cctvId, setCctvId] = useState(0);

  // 숨겨진 <video> / 오프스크린 <canvas>
  const hiddenVideoRef = useRef(null);
  const canvasRef = useRef(null);
  const isProcessingRef = useRef(false);
  const intervalRef = useRef(null);


  // ------------------------------------------------------------
  // (A) localStream 변경 시, 숨겨진 video 생성 + 연결
  // ------------------------------------------------------------
  useEffect(() => {
    if (!hiddenVideoRef.current) {
      const videoEl = document.createElement("video");
      videoEl.style.display = "none";
      videoEl.playsInline = true;
      videoEl.muted = true;
      videoEl.autoplay = true;
      document.body.appendChild(videoEl);
      hiddenVideoRef.current = videoEl;
    }

    if (localStream) {
      hiddenVideoRef.current.srcObject = localStream;
      hiddenVideoRef.current.play().catch((err) =>
        console.warn("[AppContext] hiddenVideo play err:", err)
      );
    } else {
>>>>>>> hotfix
      if (hiddenVideoRef.current) {
        hiddenVideoRef.current.srcObject = null;
      }
    }
  }, [localStream]);

  // ------------------------------------------------------------
<<<<<<< HEAD
  // (2) offscreenCanvas 생성 (필요하면 1회만)
  // ------------------------------------------------------------
  useEffect(() => {
    if (!offscreenCanvasRef.current) {
      offscreenCanvasRef.current = document.createElement('canvas');
      // offscreenCanvasRef.current.width = 640;  // 필요 시 고정 크기 지정 가능
      // offscreenCanvasRef.current.height = 480;
=======
  // (B) canvasRef 준비 (없으면 생성)
  // ------------------------------------------------------------
  useEffect(() => {
    if (!canvasRef.current) {
      canvasRef.current = document.createElement("canvas");
>>>>>>> hotfix
    }
  }, []);

  // ------------------------------------------------------------
<<<<<<< HEAD
  // (3) localStream이 있으면 500ms(2FPS)로 모자이크 캡처
  // ------------------------------------------------------------
  useEffect(() => {
    if (!localStream) {
      // localStream이 없으면 모자이크 중단
=======
  // (C) localStream 있으면 500ms 간격(약 2FPS)으로 모자이크 캡처
  // ------------------------------------------------------------
  useEffect(() => {
    if (!localStream) {
      // 스트림이 없다면 모자이크 중단
>>>>>>> hotfix
      setMosaicImageUrl(null);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

<<<<<<< HEAD
    // localStream이 있으면 500ms마다 doMosaicCapture()
    intervalRef.current = setInterval(() => {
      if (!isProcessingRef.current) {
        doMosaicCapture();
      }
    }, 500);

=======
    // 스트림이 생겼을 때 500ms 주기로 doMosaicCapture
    intervalRef.current = setInterval(() => {
      if (!hiddenVideoRef.current || !canvasRef.current) return;
      if (isProcessingRef.current) return;

      doAutoMosaicCapture();
    }, 500);

    // 언마운트 or localStream 변경 시 청소
>>>>>>> hotfix
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
<<<<<<< HEAD
  }, [localStream]);

  // ------------------------------------------------------------
  // (4) doMosaicCapture: hiddenVideo → offscreenCanvas → blob → /yolo_mosaic
  // ------------------------------------------------------------
  async function doMosaicCapture() {
    if (!localStream) return;
    if (!hiddenVideoRef.current || !offscreenCanvasRef.current) return;

    const videoEl = hiddenVideoRef.current;
    const canvas = offscreenCanvasRef.current;

    // videoWidth/Height = 실제 스트림의 해상도
    // offscreenCanvas 크기를 동적으로 조절
    canvas.width = videoEl.videoWidth;
    canvas.height = videoEl.videoHeight;

    isProcessingRef.current = true;
    try {
      const ctx = canvas.getContext("2d");
      ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);

      // canvas -> blob
=======
  }, [localStream, cctvId]);
  // cctvId가 바뀌면 즉시 새 ID로 /yolo_mosaic 호출

  // ------------------------------------------------------------
  // (D) doMosaicCapture: hiddenVideo -> canvas -> blob -> /yolo_mosaic
  // ------------------------------------------------------------
  async function doAutoMosaicCapture() {
    isProcessingRef.current = true;
    try {
      const videoEl = hiddenVideoRef.current;
      const canvas = canvasRef.current;

      if (videoEl.videoWidth < 1 || videoEl.videoHeight < 1) {
        isProcessingRef.current = false;
        return;
      }

      canvas.width = videoEl.videoWidth;
      canvas.height = videoEl.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);

>>>>>>> hotfix
      canvas.toBlob(async (blob) => {
        if (!blob) {
          isProcessingRef.current = false;
          return;
        }
        try {
<<<<<<< HEAD
          const formData = new FormData();
          formData.append("file", blob, "frame.png");

          const res = await fetch("/yolo_mosaic", { method: "POST", body: formData });
          if (!res.ok) {
            console.error("[AppContext] /yolo_mosaic error:", res.status);
            return;
          }
          const resultBlob = await res.blob();
          const url = URL.createObjectURL(resultBlob);

          // (전역 state에 저장) => 어떤 컴포넌트든 mosaicImageUrl를 사용 가능
          setMosaicImageUrl(url);
        } catch (err) {
          console.error("[AppContext] doMosaicCapture fetch error:", err);
=======
          console.log("[callPeopleDetection] cctvId=", cctvId, typeof cctvId);
          const resultBlob = await callPeopleDetection(blob, cctvId);
          const url = URL.createObjectURL(resultBlob);
          setMosaicImageUrl(url);
        } catch (err) {
          console.error("[AppContext] mosaic capture error:", err);
>>>>>>> hotfix
        } finally {
          isProcessingRef.current = false;
        }
      }, "image/png");
    } catch (err) {
<<<<<<< HEAD
      console.error("[AppContext] doMosaicCapture error:", err);
=======
      console.error("[AppContext] doAutoMosaicCapture error:", err);
>>>>>>> hotfix
      isProcessingRef.current = false;
    }
  }

<<<<<<< HEAD
  // ------------------------------------------------------------
  // (5) Context.Provider
  //     localStream, mosaicImageUrl, setLocalStream, ...
  // ------------------------------------------------------------
  return (
    <AppContext.Provider value={{
      localStream, setLocalStream,
      mosaicImageUrl, setMosaicImageUrl,
    }}>
=======

  // ------------------------------------------------------------
  // (E) Context Provider
  // ------------------------------------------------------------
  return (
    <AppContext.Provider
      value={{
        localStream,
        setLocalStream,
        mosaicImageUrl,
        setMosaicImageUrl,

        // int cctvId
        cctvId,
        setCctvId,

        // 필요 시 참조
        // canvasRef,
        // isProcessingRef,
      }}
    >
>>>>>>> hotfix
      {children}
    </AppContext.Provider>
  );
}
