// /home/azureuser/FootTrafficReport/frontend/client/src/utils/srswebrtc.js

/**
 * SRS WebRTC 플레이어를 시작하는 함수 (전역 window.SrsRtcPlayerAsync 사용)
 *
 * @param {string} streamUrl      예) "webrtc://<SRS_IP>/live/mosaic_webrtc"
 * @param {string} videoElementId <video> 태그의 ID
 * @returns {Promise<Object>}     SrsRtcPlayerAsync 인스턴스 반환
 *
 * 사용 예:
 *   import { startSrsWebrtcPlayer } from '../utils/srswebrtc';
 *   ...
 *   const player = await startSrsWebrtcPlayer("webrtc://<SRS_IP>/live/mosaic_webrtc", "myVideo");
 *   // player.stop() 등 메서드 사용 가능
 */
export async function startSrsWebrtcPlayer(streamUrl, videoElementId) {
  // 1) 전역 window 객체에서 SRS SDK 가져오기
  const SrsRtcPlayerAsync = window.SrsRtcPlayerAsync;
  if (!SrsRtcPlayerAsync) {
    throw new Error(
      "[SRSWebRTC] SRS SDK not found. Make sure /srs.sdk.js is loaded in index.html"
    );
  }

  // 2) <video> 요소 확인
  const videoEl = document.getElementById(videoElementId);
  if (!videoEl) {
    throw new Error(`[SRSWebRTC] <video id="${videoElementId}"> not found in DOM.`);
  }

  console.log(`[SRSWebRTC] Starting WebRTC player for url=${streamUrl}`);

  // 3) SRS SDK 인스턴스 생성
  //    - audio:true 옵션을 추가해 양방향 오디오를 처리할 수도 있음
  const player = new SrsRtcPlayerAsync({
    url: streamUrl,
    video: videoEl
    // audio: true, // 필요하면 추가
  });

  // 4) 실제 WebRTC 플레이
  try {
    await player.play();
    console.log("[SRSWebRTC] WebRTC play success.");
    return player; // 추후 stop() 등 사용
  } catch (err) {
    console.error("[SRSWebRTC] play() error:", err);
    throw err;
  }
}

/**
 * SRS WebRTC 플레이어 중지 함수
 * @param {Object} player SrsRtcPlayerAsync 인스턴스
 */
export function stopSrsWebrtcPlayer(player) {
  if (player) {
    try {
      player.stop();
      console.log("[SRSWebRTC] WebRTC stopped.");
    } catch (err) {
      console.error("[SRSWebRTC] stop() error:", err);
    }
  }
}
