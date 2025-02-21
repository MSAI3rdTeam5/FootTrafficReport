import os
import cv2
import torch
import subprocess
import asyncio
from datetime import datetime
import tempfile  # 임시 파일 생성용

# main.py와 동일 디렉토리에 있다고 가정
# => "people-detection/src/main.py"
# => "people-detection/src/webcam_pipeline.py"
# 필요한 경우 경로 조정 or from .main import PersonTracker
from main import PersonTracker

"""
로컬 웹캠(장치번호=0)에서 영상을 읽어,
사람 감지(YOLO) + 얼굴 모자이크 처리 후,
FFmpeg를 통해 SRS에 RTMP 푸시하는 스크립트.

SRS가 rtmp://<ip>/live/<stream> 로 받아서
WebRTC(webrtc://...) 또는 HLS(m3u8)로 재전송할 수 있음.
"""

# 해상도/프레임레이트 설정
WIDTH = 640
HEIGHT = 480
FPS = 25

async def process_webcam(rtmp_url: str, cctv_id="webcam"):
    """
    웹캠 -> 모자이크(YOLO) -> FFmpeg RTMP(SRS)
    :param rtmp_url: 예) "rtmp://srs:1935/live/mosaic_webrtc"
    :param cctv_id:  백엔드 전송 시 식별자 (Azure 분석 포함)
    """

    # (1) YOLO PersonTracker
    tracker = PersonTracker(
        model_path="FootTrafficReport/people-detection/model/yolo11n-pose.pt",
        conf=0.5,
        iou=0.5
    )

    # (2) 웹캠 열기
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("[ERROR] Failed to open local webcam (index=0).")
        return

    # 해상도, FPS 설정
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, WIDTH)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, HEIGHT)
    cap.set(cv2.CAP_PROP_FPS, FPS)

    # (3) FFmpeg 파이프 생성
    #  - rawvideo(bgr24) 표준입력 -> RTMP
    ffmpeg_cmd = [
        "ffmpeg",
        "-y",
        "-f", "rawvideo",
        "-pix_fmt", "bgr24",
        "-s", f"{WIDTH}x{HEIGHT}",
        "-r", str(FPS),
        "-i", "pipe:0",
        "-c:v", "libx264",
        "-preset", "veryfast",
        "-f", "flv",
        rtmp_url  # 예: rtmp://srs:1935/live/mosaic_webrtc
    ]
    ffmpeg_proc = subprocess.Popen(ffmpeg_cmd, stdin=subprocess.PIPE)

    print(f"[INFO] Start capturing webcam => pushing to {rtmp_url}")

    # Azure 분석 세션이 필요없다면, 아래 세 줄을 주석 처리해도 됩니다.
    await tracker.azure_api.start()  # Azure 세션 시작
    print("[INFO] Azure API session started.")

    frame_count = 0
    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                print("[INFO] Camera frame read failed or ended.")
                break

            frame_count += 1

            # (A) YOLO 감지
            results = tracker.model.predict(
                frame,
                conf=tracker.conf,
                iou=tracker.iou,
                device=tracker.device
            )

            # (B) 감지 결과(BBox) 모자이크 처리
            if len(results) > 0:
                for box in results[0].boxes:
                    x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
                    # 얼굴 or 인물 범위 -> 블러
                    roi = frame[y1:y2, x1:x2]
                    blurred_roi = cv2.GaussianBlur(roi, (25, 25), 0)
                    frame[y1:y2, x1:x2] = blurred_roi

                    # (선택) 예시: 30프레임마다 Azure 분석
                    # if frame_count % 30 == 0:
                    #     with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
                    #         cropped_path = tmp.name
                    #         cv2.imwrite(cropped_path, roi)  # ROI 저장
                    #     try:
                    #         obj_id = 999
                    #         await tracker.process_person(obj_id, cropped_path, cctv_id, None)
                    #         print(f"[DBG] Azure analysis at frame={frame_count}, box=({x1},{y1},{x2},{y2})")
                    #     except Exception as e:
                    #         print("[WARN] Azure analysis failed:", e)
                    #     finally:
                    #         os.remove(cropped_path)

            # (C) FFmpeg STDIN에 모자이크된 프레임 전달
            ffmpeg_proc.stdin.write(frame.tobytes())

            # (옵션) 'q' 키 누르면 종료
            if cv2.waitKey(1) & 0xFF == ord('q'):
                print("[INFO] 'q' pressed => stopping pipeline.")
                break

    except KeyboardInterrupt:
        print("[INFO] Pipeline stopped by KeyboardInterrupt.")
    finally:
        cap.release()
        ffmpeg_proc.stdin.close()
        ffmpeg_proc.wait()

        # Azure 세션 종료 (필요없다면 제거 가능)
        await tracker.azure_api.close()

        cv2.destroyAllWindows()
        print("[INFO] Webcam pipeline finished.")

# -----------------------------------------------------------------------
if __name__ == "__main__":
    """
    로컬 테스트 시:
      python webcam_pipeline.py rtmp://<SRS_IP>/live/mosaic_webrtc
    또는
      RTMP_URL=rtmp://<SRS_IP>/live/mosaic_webrtc python webcam_pipeline.py
    -> SRS에서 webrtc://<SRS_IP>/live/mosaic_webrtc 로 플레이
    """
    import sys

    if len(sys.argv) > 1:
        rtmp_url = sys.argv[1]
    else:
        # 기본값을 srs 컨테이너로 설정 (docker-compose)
        rtmp_url = os.getenv("RTMP_URL", "rtmp://srs:1935/live/mosaic_webrtc")

    print(f"[DBG] Using RTMP URL => {rtmp_url}")
    asyncio.run(process_webcam(rtmp_url, cctv_id="webcam_test"))
