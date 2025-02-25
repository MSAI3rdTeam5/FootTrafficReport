// /home/azureuser/FootTrafficReport/frontend/client/src/context/AppContext.jsx

import React, { createContext, useState, useRef, useEffect } from "react";
import { callPeopleDetection } from "../utils/api";

export const AppContext = createContext(null);

export function AppProvider({ children }) {
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
      if (hiddenVideoRef.current) {
        hiddenVideoRef.current.srcObject = null;
      }
    }
  }, [localStream]);

  // ------------------------------------------------------------
  // (B) canvasRef 준비 (없으면 생성)
  // ------------------------------------------------------------
  useEffect(() => {
    if (!canvasRef.current) {
      canvasRef.current = document.createElement("canvas");
    }
  }, []);

  // ------------------------------------------------------------
  // (C) localStream 있으면 500ms 간격(약 2FPS)으로 모자이크 캡처
  // ------------------------------------------------------------
  useEffect(() => {
    if (!localStream) {
      // 스트림이 없다면 모자이크 중단
      setMosaicImageUrl(null);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // 스트림이 생겼을 때 500ms 주기로 doMosaicCapture
    intervalRef.current = setInterval(() => {
      if (!hiddenVideoRef.current || !canvasRef.current) return;
      if (isProcessingRef.current) return;

      doAutoMosaicCapture();
    }, 500);

    // 언마운트 or localStream 변경 시 청소
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
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

      canvas.toBlob(async (blob) => {
        if (!blob) {
          isProcessingRef.current = false;
          return;
        }
        try {
          console.log("[callPeopleDetection] cctvId=", cctvId, typeof cctvId);
          const resultBlob = await callPeopleDetection(blob, cctvId);
          const url = URL.createObjectURL(resultBlob);
          setMosaicImageUrl(url);
        } catch (err) {
          console.error("[AppContext] mosaic capture error:", err);
        } finally {
          isProcessingRef.current = false;
        }
      }, "image/png");
    } catch (err) {
      console.error("[AppContext] doAutoMosaicCapture error:", err);
      isProcessingRef.current = false;
    }
  }

  // // ------------------------------------------------------------
  // // 2FPS 모자이크 (int cctvId)
  // // ------------------------------------------------------------
  // useEffect(() => {
  //   if (!localStream) {
  //     setMosaicImageUrl(null);
  //     return;
  //   }
  //   const intervalId = setInterval(() => {
  //     if (!localVideoRef.current) return;
  //     if (isProcessingRef.current) return;

  //     isProcessingRef.current = true;
  //     const ctx = canvasRef.current.getContext("2d");
  //     ctx.drawImage(localVideoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);

  //     canvasRef.current.toBlob(async (blob) => {
  //       if (!blob) {
  //         isProcessingRef.current = false;
  //         return;
  //       }
  //       try {
  //         // (A) callPeopleDetection로 /yolo_mosaic 호출
  //         const resultBlob = await callPeopleDetection(blob, cctvId);

  //         // (B) resultBlob -> ObjectURL
  //         const imgUrl = URL.createObjectURL(resultBlob);
  //         setMosaicImageUrl(imgUrl);
  //       } catch (err) {
  //         console.error("auto-mosaic error:", err);
  //       } finally {
  //         isProcessingRef.current = false;
  //       }
  //     }, "image/png");
  //   }, 500);

  //   return () => clearInterval(intervalId);
  // }, [localStream, cctvId, setMosaicImageUrl, isProcessingRef]);

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
      {children}
    </AppContext.Provider>
  );
}
