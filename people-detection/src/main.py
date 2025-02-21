from ultralytics import YOLO
from datetime import datetime
from fastapi import FastAPI, HTTPException, Body
from pydantic import BaseModel
from aiohttp import FormData
from dotenv import load_dotenv

import os
import torch
import cv2
import random
import pandas as pd
import aiohttp
import asyncio
import numpy as np
import base64
import subprocess
from typing import Optional

app = FastAPI()

# ---------------------------------------------------------
# 예: FastAPI로 들어오는 JSON Body
# {
#   "cctv_url": "rtmp://srs:1935/live/mosaic_webrtc",
#   "cctv_id": "some_id_string"
# }
# ---------------------------------------------------------
class DetectionRequest(BaseModel):
    cctv_url: str
    cctv_id: str


# ---------------------------------------------------------
# Azure Custom Vision API (성별/연령 태깅) 예시 클래스
# ---------------------------------------------------------
class AzureAPI:
    def __init__(self):
        load_dotenv()  # .env 파일 로드 (AZURE_API_URL, AZURE_PREDICTION_KEY)
        self.url = os.getenv("AZURE_API_URL")
        self.headers = {
            "Prediction-Key": os.getenv("AZURE_PREDICTION_KEY"),
            "Content-Type": "application/octet-stream"
        }
        self.session = None

    async def start(self):
        self.session = aiohttp.ClientSession()

    async def close(self):
        if self.session:
            await self.session.close()

    async def analyze_image(self, image_path: str):
        """
        image_path에 있는 이미지를 Azure Custom Vision API로 보내어,
        성별(Male, Female)과 나이(Age18to60 등) 태그를 가져온다.
        """
        if not self.session:
            await self.start()

        if not self.url:
            # .env에 AZURE_API_URL이 설정되지 않았다면 패스
            return {}

        with open(image_path, "rb") as image_file:
            image_data = image_file.read()

        async with self.session.post(self.url, headers=self.headers, data=image_data) as response:
            if response.status != 200:
                return {}
            result = await response.json()

        return self.normalize_predictions(result.get('predictions', []))

    def normalize_predictions(self, predictions: list):
        """
        Azure에서 내려온 예측값 중,
        성별(Male/Female), 연령(Age18to60/AgeOver60/AgeLess18)을
        {Male: 30, Female: 70, Age18to60:90, AgeOver60:10...} 형태로 정규화.
        """
        gender_preds = {p['tagName']: p['probability'] * 100
                        for p in predictions if p['tagName'] in ['Male', 'Female']}
        age_preds = {p['tagName']: p['probability'] * 100
                     for p in predictions if p['tagName'] in ['Age18to60', 'AgeOver60', 'AgeLess18']}

        def normalize_group(group_preds):
            total = sum(group_preds.values())
            return {k: (v / total) * 100 for k, v in group_preds.items()} if total > 0 else group_preds

        return {
            **normalize_group(gender_preds),
            **normalize_group(age_preds)
        }


# ---------------------------------------------------------
# YOLO 추적 + 얼굴 모자이크 PersonTracker 클래스
# ---------------------------------------------------------
class PersonTracker:
    def __init__(
        self,
        model_path,
        result_dir='../outputs/results/',
        tracker_config="../data/config/botsort.yaml",
        conf=0.5,
        device=None,
        iou=0.5,
        img_size=(720, 1080),
        output_dir='../outputs/results_video'
    ):
        self.device = device if device else ('cuda:0' if torch.cuda.is_available() else 'cpu')
        self.model = YOLO(model_path)
        self.result_dir = result_dir
        self.tracker_config = tracker_config
        self.conf = conf
        self.iou = iou
        self.img_size = img_size
        self.output_dir = output_dir
        self.color_map = {}
        self.frames = []
        self.boxes = []
        self.detected_ids = set()
        self.captured_objects = set()
        self.detected_ids_full_entry = set()

        # Azure API for face analysis
        self.azure_api = AzureAPI()

    def generate_color(self, obj_id):
        """
        obj_id별로 고유 컬러 맵핑 (박스 표시용)
        """
        if obj_id not in self.color_map:
            self.color_map[obj_id] = [random.randint(0, 255) for _ in range(3)]
        return self.color_map[obj_id]

    def estimate_face_area(self, keypoints, box):
        """
        (선택) H/face keypoints → 블러 영역 추정
        """
        face_keypoints_indices = [0, 1, 2, 3, 4]  # head/eyes/ears
        face_keypoints = keypoints[face_keypoints_indices]

        # keypoints shape = [num_points, 2 or 3]
        if face_keypoints.shape[1] == 2:
            valid_points = face_keypoints
        elif face_keypoints.shape[1] == 3:
            # 스코어>0.3 인 부분만 유효
            valid_points = face_keypoints[face_keypoints[:, 2] > 0.3][:, :2]
        else:
            return None

        if len(valid_points) >= 4:
            x_min, y_min = np.maximum(np.min(valid_points, axis=0).astype(int), [box[0], box[1]])
            x_max, y_max = np.minimum(np.max(valid_points, axis=0).astype(int), [box[2], box[3]])

            width = (x_max - x_min) * 20
            height = (y_max - y_min) * 10
            x_min = max(box[0], x_min - int(width * 0.1))
            y_min = max(box[1], y_min - int(height * 0.1))
            x_max = min(box[2], x_max + int(width * 0.1))
            y_max = min(box[3], y_max + int(height * 0.1))

            return x_min, y_min, x_max, y_max
        return None

    def apply_face_blur(self, frame, face_area):
        """
        face_area 영역을 blur 처리
        """
        if face_area is not None:
            x_min, y_min, x_max, y_max = face_area
            if x_max > x_min and y_max > y_min:
                face_roi = frame[y_min:y_max, x_min:x_max]
                blurred_roi = cv2.GaussianBlur(face_roi, (25, 25), 0)
                frame[y_min:y_max, x_min:x_max] = blurred_roi
        return frame

    async def detect_and_track(self, source, cctv_id):
        """
        RTMP(or video file, webcam) -> YOLO tracking -> 모자이크 -> optional Azure
        source: "rtmp://..." or "0" or ...
        """
        # 모델 track() -> stream=True -> generator
        # classes=[0] => 사람만
        results = self.model.track(
            source,
            show=False,
            stream=True,
            tracker=self.tracker_config,
            conf=self.conf,
            device=self.device,
            iou=self.iou,
            stream_buffer=True,
            classes=[0],
            imgsz=self.img_size
        )

        # Azure 분석 세션 준비
        await self.azure_api.start()

        for result in results:
            # 각 프레임별로 result
            original_frame = result.orig_img.copy()  # numpy array (H,W,3)
            display_frame = original_frame.copy()
            boxes = result.boxes
            keypoints_data = result.keypoints.data.cpu().numpy()

            self.frames.append(display_frame)
            self.boxes.append(boxes)

            tasks = []

            # 모든 객체(box) 탐색
            for box, kpts in zip(boxes, keypoints_data):
                x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())

                if box.id is not None:
                    obj_id = int(box.id)
                else:
                    continue

                color = self.generate_color(obj_id)

                # 최초 감지 시(객체ID) => Azure 분석 + cropped 저장
                if obj_id not in self.detected_ids:
                    self.detected_ids.add(obj_id)
                    face_area = self.estimate_face_area(kpts, [x1, y1, x2, y2])
                    cropped_path, full_frame_path = self.save_cropped_person(
                        original_frame, x1, y1, x2, y2, obj_id, face_area
                    )
                    tasks.append(
                        self.process_person(obj_id, cropped_path, cctv_id, full_frame_path)
                    )

                # 얼굴 부분 블러
                face_area = self.estimate_face_area(kpts, [x1, y1, x2, y2])
                if face_area:
                    display_frame = self.apply_face_blur(display_frame, face_area)

                # bbox 시각화
                cv2.rectangle(display_frame, (x1, y1), (x2, y2), color, 2)
                cv2.putText(display_frame, f"ID: {obj_id}", (x1, y1 - 10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)

            # 비동기 Azure 분석
            await asyncio.gather(*tasks)

            # 디버그용 보여주기
            cv2.imshow("Person Tracking", display_frame)
            key = cv2.waitKey(1) & 0xFF
            if key == ord('q'):
                break
            elif key == ord('s'):
                # 's' 누르면 일시정지 -> 다시 's' 누르면 재개
                while True:
                    if cv2.waitKey(1) & 0xFF == ord('s'):
                        break

        cv2.destroyAllWindows()
        await self.azure_api.close()

    async def process_person(self, obj_id, cropped_path, cctv_id, full_frame_path):
        """
        Azure API 호출 => gender/age 추론 => /api/cctv_data 전송
        """
        threshold = 0.3
        predictions = await self.azure_api.analyze_image(cropped_path)  # dict

        age_mapping = {'AgeLess18': 'young', 'Age18to60': 'adult', 'AgeOver60': 'old'}
        gender_mapping = {'Male': 'male', 'Female': 'female'}

        # 성별
        gender_key = max(
            [k for k in predictions if k in gender_mapping and predictions[k] >= threshold],
            key=predictions.get,
            default="Unknown"
        )
        gender = gender_mapping.get(gender_key, "Unknown")

        # 나이
        age_key = max(
            [k for k in predictions if k in age_mapping and predictions[k] >= threshold],
            key=predictions.get,
            default="Unknown"
        )
        age = age_mapping.get(age_key, "Unknown")

        # 결과 서버 전송
        await self.send_data_to_server(obj_id, gender, age, cctv_id, full_frame_path)

    async def send_data_to_server(self, obj_id, gender, age, cctv_id, image_path=None):
        """
        백엔드 API(/api/cctv_data)로 사람 감지 정보를 전송
        - 이미지 파일 포함
        """
        url = "https://msteam5iseeu.ddns.net/api/cctv_data"  # 예시

        form = FormData()
        form.add_field("cctv_id", str(cctv_id))
        form.add_field("detected_time", datetime.now().isoformat())
        form.add_field("person_label", str(obj_id))
        form.add_field("gender", gender)
        form.add_field("age", age)

        if image_path and os.path.exists(image_path):
            try:
                async with aiohttp.ClientSession() as session:
                    with open(image_path, "rb") as f:
                        image_data = f.read()
                    form.add_field(
                        "image_file",
                        image_data,
                        filename="myimage.jpg",
                        content_type="image/jpeg"
                    )
                    async with session.post(url, data=form) as response:
                        # 단순 디버그 출력
                        res_json = await response.json()
                        print("[INFO] cctv_data API response:", res_json)
            except aiohttp.ClientError as e:
                print(f"[ERROR] Failed to send data: {e}")

    def save_cropped_person(self, frame, x1, y1, x2, y2, obj_id, face_area, save_dir="../outputs/"):
        """
        사람 영역(cropped), 전체 프레임(full_frame)에 블러 처리 후 저장
        """
        os.makedirs(save_dir + "cropped_people/", exist_ok=True)
        os.makedirs(save_dir + "full_frames/", exist_ok=True)

        # (1) cropped
        cropped_file_name = f"{save_dir}cropped_people/person_{obj_id}.jpg"
        cv2.imwrite(cropped_file_name, frame[y1:y2, x1:x2])

        # (2) full_frame 블러
        full_frame = frame.copy()

        # 사람 전체 사각형 부분만 유지, 나머지는 블러
        mask = np.zeros(full_frame.shape[:2], dtype=np.uint8)
        cv2.rectangle(mask, (x1, y1), (x2, y2), 255, -1)
        blurred = cv2.GaussianBlur(full_frame, (55, 55), 0)
        full_frame = np.where(mask[:, :, None] == 255, full_frame, blurred)

        color = self.generate_color(obj_id)
        cv2.rectangle(full_frame, (x1, y1), (x2, y2), color, 2)
        cv2.putText(full_frame, f"ID: {obj_id}", (x1, y1 - 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)

        # 얼굴 추가 블러
        if face_area:
            fx1, fy1, fx2, fy2 = face_area
            face_roi = full_frame[fy1:fy2, fx1:fx2]
            blurred_face = cv2.GaussianBlur(face_roi, (25, 25), 0)
            full_frame[fy1:fy2, fx1:fx2] = blurred_face

        timestamp = datetime.now().strftime("%Y-%m-%d-%H-%M-%S")
        full_frame_file_name = f"{save_dir}full_frames/{timestamp}_ID{obj_id}.jpg"
        cv2.imwrite(full_frame_file_name, full_frame)

        return cropped_file_name, full_frame_file_name


# ---------------------------------------------------------
# /detect: RTMP(or file) source => YOLO detect
# ---------------------------------------------------------
@app.post("/detect")
async def detect_people(request: DetectionRequest):
    """
    예: POST /detect
    Body: {
      "cctv_url": "rtmp://srs:1935/live/test",
      "cctv_id": "my-cctv-01"
    }
    """
    try:
        tracker = PersonTracker(
            model_path='FootTrafficReport/people-detection/model/yolo11n-pose.pt'
        )
        # source = rtmp://... (또는 동영상 파일, 0(웹캠)도 가능)
        result = await tracker.detect_and_track(
            source=request.cctv_url,
            cctv_id=request.cctv_id
        )
        return {"detail": "detection finished"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------
# /start_webcam
# 로컬 FFmpeg/파이썬으로 webcam => RTMP 푸시
# ---------------------------------------------------------
@app.post("/start_webcam")
def start_webcam(rtmp_url: Optional[str] = "rtmp://srs:1935/live/mosaic_webrtc"):
    """
    예: POST /start_webcam?rtmp_url=rtmp://srs:1935/live/mosaic_webrtc
    이 엔드포인트를 호출하면, subprocess로 webcam_pipeline.py 실행.

    webcam_pipeline.py 내부에서:
    - OpenCV/FFmpeg로 로컬(컨테이너 내부 or VM 내부) webcam을 읽어
    - rtmp_url로 push.
    """
    script_path = "/app/src/webcam_pipeline.py"  # Dockerfile에서 WORKDIR /app, COPY src/ /app/src

    if not os.path.exists(script_path):
        raise HTTPException(status_code=500, detail=f"Script not found: {script_path}")

    try:
        # 비동기/Detach 실행 => 요청이 끝나도 파이프라인 프로세스 계속 동작
        subprocess.Popen(["python", script_path, rtmp_url])
        return {"status": "started", "rtmp_url": rtmp_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------
# uvicorn main
# ---------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8500)
