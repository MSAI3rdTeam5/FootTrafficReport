# /home/azureuser/FootTrafficReport/people-detection/src/main.py

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import Response
from typing import Optional
import os
import cv2
import numpy as np
import torch
from ultralytics import YOLO
import random

from dotenv import load_dotenv

app = FastAPI()

# (선택) AzureAPI or Custom Vision 등이 필요하다면 그대로 남김/주석
class AzureAPI:
    def __init__(self):
        load_dotenv()  # .env 로드
        self.url = os.getenv("AZURE_API_URL")
        # etc...

    # ...start, close, analyze_image 등...


class ImageMosaic:
    """
    간단히 '이미지 한 장'에 대해 YOLO 모자이크 처리하는 클래스 예시
    """
    def __init__(self, model_path=None, conf=0.5, iou=0.5):
        self.device = "cuda:0" if torch.cuda.is_available() else "cpu"
        self.model_path = model_path or "FootTrafficReport/people-detection/model/yolo11n-pose.pt"
        self.model = YOLO(self.model_path)
        self.conf = conf
        self.iou = iou

    def mosaic_frame(self, frame_bgr: np.ndarray) -> np.ndarray:
        """
        YOLO로 '사람' 검출 → 모자이크(blur) 처리 후 결과 이미지 반환
        (사람 감지만 한다고 가정, classes=[0])
        """
        results = self.model.predict(
            frame_bgr,
            conf=self.conf,
            iou=self.iou,
            device=self.device,
            classes=[0],  # 0=person
        )
        # YOLOv8 results => list
        if len(results) > 0:
            boxes = results[0].boxes
            for box in boxes:
                x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
                roi = frame_bgr[y1:y2, x1:x2]
                blurred = cv2.GaussianBlur(roi, (25, 25), 0)
                frame_bgr[y1:y2, x1:x2] = blurred
        return frame_bgr


# ---------------------------------------------------------
# (A) Canvas 업로드 방식 => /yolo_mosaic
# ---------------------------------------------------------
@app.post("/yolo_mosaic")
async def yolo_mosaic(file: UploadFile = File(...)):
    """
    브라우저에서 <canvas>.toBlob() 형태로 이미지를 업로드하면,
    YOLO 모자이크 처리 후 이미지(PNG)로 응답
    """
    try:
        # 파일 바이너리 읽기
        contents = await file.read()
        # OpenCV로 디코딩
        nparr = np.frombuffer(contents, np.uint8)
        frame_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if frame_bgr is None:
            raise ValueError("Failed to decode image")

        # YOLO 모자이크 처리
        mosaicor = ImageMosaic()
        result_frame = mosaicor.mosaic_frame(frame_bgr)

        # 결과 이미지를 PNG로 인코딩
        ret, encoded_img = cv2.imencode(".png", result_frame)
        if not ret:
            raise ValueError("Failed to encode mosaic image")

        return Response(content=encoded_img.tobytes(), media_type="image/png")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------
# (B) /detect 등 RTP 기반 스트리밍 로직 => 제거/주석
# ---------------------------------------------------------
"""
@app.post("/detect")
async def detect_people(...):
    # 이전엔 SFU RTP or RTMP source -> YOLO tracking
    # 이제는 미사용. 필요시 주석 처리 or 삭제
    pass
"""

# ---------------------------------------------------------
# (C) /start_webcam, /start_rtp_pipeline => 삭제/주석
# ---------------------------------------------------------
"""
@app.post("/start_webcam")
def start_webcam(...):
    # 이전 webcam_pipeline.py => RTMP push
    # 제거/주석
    pass

@app.post("/start_rtp_pipeline")
def start_rtp_pipeline(...):
    # RTP -> PyAV -> YOLO -> RTMP
    # 제거/주석
    pass
"""

# ---------------------------------------------------------
# (D) 메인 실행
# ---------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8500)
