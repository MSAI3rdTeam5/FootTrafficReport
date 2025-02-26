// /home/azureuser/FootTrafficReport/frontend/client/src/context/AppContext.jsx

import React, { createContext, useState, useRef, useEffect } from 'react';

export const AppContext = createContext(null);

export function AppProvider({ children }) {
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
      if (hiddenVideoRef.current) {
        hiddenVideoRef.current.srcObject = null;
      }
    }
  }, [localStream]);

  // ------------------------------------------------------------
  // (2) offscreenCanvas 생성 (필요하면 1회만)
  // ------------------------------------------------------------
  useEffect(() => {
    if (!offscreenCanvasRef.current) {
      offscreenCanvasRef.current = document.createElement('canvas');
      // offscreenCanvasRef.current.width = 640;  // 필요 시 고정 크기 지정 가능
      // offscreenCanvasRef.current.height = 480;
    }
  }, []);

  // ------------------------------------------------------------
  // (3) localStream이 있으면 500ms(2FPS)로 모자이크 캡처
  // ------------------------------------------------------------
  useEffect(() => {
    if (!localStream) {
      // localStream이 없으면 모자이크 중단
      setMosaicImageUrl(null);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // localStream이 있으면 500ms마다 doMosaicCapture()
    intervalRef.current = setInterval(() => {
      if (!isProcessingRef.current) {
        doMosaicCapture();
      }
    }, 500);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
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
      canvas.toBlob(async (blob) => {
        if (!blob) {
          isProcessingRef.current = false;
          return;
        }
        try {
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
        } finally {
          isProcessingRef.current = false;
        }
      }, "image/png");
    } catch (err) {
      console.error("[AppContext] doMosaicCapture error:", err);
      isProcessingRef.current = false;
    }
  }

  // ------------------------------------------------------------
  // (5) Context.Provider
  //     localStream, mosaicImageUrl, setLocalStream, ...
  // ------------------------------------------------------------
  return (
    <AppContext.Provider value={{
      localStream, setLocalStream,
      mosaicImageUrl, setMosaicImageUrl,
    }}>
      {children}
    </AppContext.Provider>
  );
}
