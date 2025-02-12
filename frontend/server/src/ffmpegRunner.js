// server/src/ffmpegRunner.js

const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

// 카메라별 FFmpeg 프로세스를 관리하는 객체
// cameraId -> child_process 객체
const processes = {};

/**
 * startFfmpeg
 *  - 특정 cameraId, rtspUrl에 대해 FFmpeg를 실행하여 HLS 세그먼트를 생성
 */
function startFfmpeg(cameraId, rtspUrl) {
  // 이미 실행 중인지 확인
  if (processes[cameraId]) {
    console.log(`[FFmpegRunner] Camera ${cameraId} is already running.`);
    return;
  }

  // HLS 출력 폴더 지정
  const outputDir = path.join(__dirname, "hls", cameraId);

  // 폴더가 없으면 생성
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // ffmpeg 인자 예시 (RTSP → HLS)
  const args = [
    "-i", rtspUrl,               // 입력: RTSP URL
    "-c:v", "libx264",
    "-preset", "veryfast",
    "-tune", "zerolatency",
    "-f", "hls",
    "-hls_time", "2",           // 세그먼트 길이(초)
    "-hls_list_size", "5",      
    "-hls_flags", "delete_segments+append_list",
    path.join(outputDir, "playlist.m3u8") // 출력 파일
  ];

  console.log(`[FFmpegRunner] Starting ffmpeg for cameraId=${cameraId}`);
  const ffmpegProcess = spawn("ffmpeg", args);

  ffmpegProcess.stdout.on("data", (data) => {
    console.log(`[FFmpeg STDOUT - ${cameraId}] ${data}`);
  });
  ffmpegProcess.stderr.on("data", (data) => {
    console.log(`[FFmpeg STDERR - ${cameraId}] ${data}`);
  });
  ffmpegProcess.on("close", (code) => {
    console.log(`[FFmpegRunner] cameraId=${cameraId} exited with code ${code}`);
    delete processes[cameraId];
  });

  processes[cameraId] = ffmpegProcess;
}

/**
 * stopFfmpeg
 *  - 특정 cameraId의 FFmpeg 프로세스를 종료
 */
function stopFfmpeg(cameraId) {
  const proc = processes[cameraId];
  if (!proc) {
    console.log(`[FFmpegRunner] No process found for cameraId=${cameraId}`);
    return;
  }
  console.log(`[FFmpegRunner] Stopping ffmpeg for cameraId=${cameraId}`);
  proc.kill("SIGKILL"); 
  delete processes[cameraId];
}

/**
 * getHlsUrl
 *  - cameraId 기준으로, "/hls/<cameraId>/playlist.m3u8" 형태의 HLS 플레이리스트 URL을 반환
 *  - 프론트엔드가 이 URL로 접근해 Hls.js 로 재생
 */
function getHlsUrl(cameraId) {
  return `/hls/${cameraId}/playlist.m3u8`;
}

module.exports = {
  startFfmpeg,
  stopFfmpeg,
  getHlsUrl
};
