#!/usr/bin/env python3
# /home/azureuser/FootTrafficReport/people-detection/src/rtp_pipeline.py
# rtp_pipeline.py (using PyAV, debug logging)

import os
import sys
import av  # PyAV
import cv2
import torch
import subprocess
import asyncio
import numpy as np
from datetime import datetime

# main.py의 PersonTracker import (YOLO 등 사용 시)
from main import PersonTracker

"""
Mediasoup SFU -> RTP -> PyAV -> YOLO(mosaic) -> FFmpeg -> RTMP -> SRS

Usage:
  1) python rtp_pipeline.py [RTP_URL] [RTMP_URL] [CCTV_ID]
     예: python rtp_pipeline.py rtp://media-sfu:40000 rtmp://srs:1935/live/mosaic_sfu sfu_test

  2) python rtp_pipeline.py [RTP_HOST] [RTP_PORT] [RTMP_URL] [CCTV_ID]
     예: python rtp_pipeline.py media-sfu 40012 rtmp://srs:1935/live/mosaic_sfu sfu_test
     => 내부적으로 rtp_url = "rtp://media-sfu:40012"

설정:
  - TARGET_WIDTH, TARGET_HEIGHT, TARGET_FPS 등 해상도/프레임레이트
  - 모델 파일: PersonTracker.model 등
  - /start_rtp_pipeline -> 이 스크립트를 subprocess.Popen으로 호출
"""

TARGET_WIDTH = 640
TARGET_HEIGHT = 480
TARGET_FPS = 25

async def process_rtp(rtp_url: str, rtmp_url: str, cctv_id: str):
    print(f"[rtp_pipeline] Starting process_rtp() with:")
    print(f"  RTP_URL  = {rtp_url}")
    print(f"  RTMP_URL = {rtmp_url}")
    print(f"  CCTV_ID  = {cctv_id}", flush=True)

    # (A) YOLO PersonTracker (간단 예시)
    print("[rtp_pipeline] Initializing YOLO PersonTracker...", flush=True)
    # 만약 자세한 'track' 로직이 필요하다면, 사람추적+모자이크를 PersonTracker.detect_and_track(...)에 위임.
    # 여기서는 단순히 .model.predict()로 bounding box만 얻어오도록 사용.
    tracker = PersonTracker(
        model_path="FootTrafficReport/people-detection/model/yolo11n-pose.pt",
        conf=0.5,
        iou=0.5
    )

    # (B) PyAV로 RTP 스트림 열기
    print(f"[rtp_pipeline] Attempting to open RTP stream via PyAV: {rtp_url}", flush=True)
    try:
        # PyAV 10.x 이상에서는 av.error.OSError 등으로 예외 처리
        container = av.open(rtp_url, format=None, options={
            "rtsp_flags": "prefer_tcp",
            "stimeout": "5000000",  # 예시: 5초 타임아웃
        })
        print("[rtp_pipeline] Successfully opened RTP stream with PyAV.", flush=True)
    except av.error.OSError as e:
        print(f"[rtp_pipeline:ERROR] Failed to open RTP stream: {e}", flush=True)
        return

    # (C) FFmpeg 파이프 (RTMP Out)
    #  - PyAV가 디코딩/모자이크한 raw frames를 ffmpeg stdin으로 보낸 뒤, libx264 인코딩 -> RTMP 송출
    ffmpeg_cmd = [
        "ffmpeg",
        "-y",
        "-f", "rawvideo",
        "-pix_fmt", "bgr24",
        f"-s", f"{TARGET_WIDTH}x{TARGET_HEIGHT}",
        "-r", str(TARGET_FPS),
        "-i", "pipe:0",
        "-c:v", "libx264",
        "-preset", "veryfast",
        "-tune", "zerolatency",
        "-f", "flv",
        rtmp_url
    ]
    print(f"[rtp_pipeline] Launching FFmpeg subprocess:\n  {' '.join(ffmpeg_cmd)}", flush=True)
    ffmpeg_proc = subprocess.Popen(ffmpeg_cmd, stdin=subprocess.PIPE)

    # (D) Azure API 등 세션 준비 (예시)
    # tracker.azure_api 를 쓰고 싶다면 아래와 같이 세션을 열 수 있음.
    print("[rtp_pipeline] Starting Azure API session...", flush=True)
    await tracker.azure_api.start()
    print("[rtp_pipeline] Azure API session started.", flush=True)

    # (E) PyAV demux/decode 루프 설정
    video_stream = None
    for s in container.streams:
        if s.type == "video":
            video_stream = s
            break
    if video_stream is None:
        print("[rtp_pipeline:ERROR] No video stream found in container.", flush=True)
        container.close()
        return

    print(f"[rtp_pipeline] Found video stream: {video_stream}", flush=True)

    frame_count = 0
    try:
        # packets -> frames -> YOLO inference -> mosaic -> send to ffmpeg pipe
        for packet in container.demux(video_stream):
            for av_frame in packet.decode():
                if not isinstance(av_frame, av.VideoFrame):
                    continue

                frame_count += 1
                if frame_count % 30 == 1:  # 30프레임마다 로그
                    print(f"[rtp_pipeline] Received frame {frame_count}", flush=True)

                # AVFrame -> numpy(RGB) -> BGR
                rgb_image = av_frame.to_rgb().to_ndarray()
                frame_bgr = cv2.cvtColor(rgb_image, cv2.COLOR_RGB2BGR)

                # 리사이즈
                frame_bgr = cv2.resize(frame_bgr, (TARGET_WIDTH, TARGET_HEIGHT))

                # (F) YOLO 추론 + 블러(간단 모자이크)
                results = tracker.model.predict(
                    frame_bgr,
                    conf=tracker.conf,
                    iou=tracker.iou,
                    device=tracker.device
                )
                # 사람 감지 -> bounding box 부분만 blur
                if len(results) > 0 and len(results[0].boxes) > 0:
                    for box in results[0].boxes:
                        x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
                        # 모자이크(블러) 처리
                        roi = frame_bgr[y1:y2, x1:x2]
                        blurred = cv2.GaussianBlur(roi, (25, 25), 0)
                        frame_bgr[y1:y2, x1:x2] = blurred

                # (G) 모자이크된 프레임 -> ffmpeg stdin
                try:
                    ffmpeg_proc.stdin.write(frame_bgr.tobytes())
                except BrokenPipeError as e:
                    print(f"[rtp_pipeline:ERROR] ffmpeg_proc.stdin BrokenPipeError: {e}", flush=True)
                    break

    except KeyboardInterrupt:
        print("[rtp_pipeline] KeyboardInterrupt => stopping pipeline.", flush=True)
    except Exception as ex:
        print(f"[rtp_pipeline:ERROR] Unexpected error in demux/decode loop: {ex}", flush=True)
    finally:
        print("[rtp_pipeline] Cleaning up resources...", flush=True)
        container.close()
        ffmpeg_proc.stdin.close()
        ffmpeg_proc.wait()

        await tracker.azure_api.close()
        print("[rtp_pipeline] Pipeline finished. Exiting now.", flush=True)


if __name__ == "__main__":
    """
    여러 가지 명령행 인자 패턴 지원:
      1) python rtp_pipeline.py rtp://media-sfu:40000 rtmp://srs:1935/live/mosaic_sfu sfu_test
      2) python rtp_pipeline.py media-sfu 40012 rtmp://srs:1935/live/mosaic_sfu my_cctv
    """
    rtp_url = "rtp://media-sfu:40000"
    rtmp_url = "rtmp://srs:1935/live/mosaic_sfu"
    cctv_id = "sfu_test"

    args = sys.argv[1:]
    if len(args) == 1:
        # e.g. python rtp_pipeline.py rtp://media-sfu:40000
        rtp_url = args[0]
    elif len(args) == 2:
        # e.g. python rtp_pipeline.py rtp://media-sfu:40000 rtmp://srs:1935/live/test
        rtp_url, rtmp_url = args
    elif len(args) == 3:
        # e.g. python rtp_pipeline.py rtp://media-sfu:40000 rtmp://srs:1935/live/test cctv_id
        rtp_url, rtmp_url, cctv_id = args
    elif len(args) == 4:
        # e.g. python rtp_pipeline.py media-sfu 40012 rtmp://srs:1935/live/mosaic2 my_cctv
        rtp_host, rtp_port, rtmp_url, cctv_id = args
        rtp_url = f"rtp://{rtp_host}:{rtp_port}"

    print("[rtp_pipeline] Script started from __main__.", flush=True)
    print(f"[rtp_pipeline] Args => rtp_url={rtp_url}, rtmp_url={rtmp_url}, cctv_id={cctv_id}", flush=True)

    asyncio.run(process_rtp(rtp_url, rtmp_url, cctv_id))
