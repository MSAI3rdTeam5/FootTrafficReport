// client/src/pages/LiveStreamPlayer.jsx
import React, { useRef, useEffect } from "react";
import Hls from "hls.js";

function LiveStreamPlayer() {
  const videoRef = useRef(null);
  
  // 아래 URL은 네트워크 탭에서 확인한 m3u8 플레이리스트 URL입니다.
  // 주의: URL의 토큰(t, td 등)이 시간이 지나면 만료될 수 있으므로, 테스트 시 유효한 URL인지 확인하세요.
  const streamUrl = "https://videos-3.earthcam.com/fecnetwork/32781.flv/chunklist_w678325738.m3u8?t=wFpB2Fyz3qRC%2BL7EEuRepKwbaynYM1VRHVhMSXiPmu6doVjT%2BpI06iVNLdLPV4ra&td=202502042208";

  useEffect(() => {
    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(streamUrl);
      hls.attachMedia(videoRef.current);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        videoRef.current.play();
      });
      // Clean up on unmount
      return () => {
        hls.destroy();
      };
    } else if (videoRef.current.canPlayType("application/vnd.apple.mpegurl")) {
      // 일부 브라우저(iOS 사파리 등)는 기본적으로 HLS를 지원합니다.
      videoRef.current.src = streamUrl;
      videoRef.current.addEventListener("loadedmetadata", () => {
        videoRef.current.play();
      });
    }
  }, [streamUrl]);

  return (
    <div>
      <h1>EarthCam Live Stream</h1>
      <video
        ref={videoRef}
        controls
        style={{ width: "100%", maxWidth: "640px" }}
        autoPlay
        muted  // 필요에 따라 음소거 처리 (브라우저 정책에 따라 자동재생을 위해 음소거가 필요할 수 있음)
      />
    </div>
  );
}

export default LiveStreamPlayer;