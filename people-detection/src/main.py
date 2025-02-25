# /home/azureuser/FootTrafficReport/people-detection/src/main.py

from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.responses import Response
from typing import Optional
from datetime import datetime
import os
import cv2
import torch
import random
import numpy as np
import asyncio

from ultralytics import YOLO
from dotenv import load_dotenv
import aiohttp
import requests

app = FastAPI()


# ---------------------------------------------------------
# (A) Azure Custom Vision API 클래스
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
        if not self.session:
            self.session = aiohttp.ClientSession()

    async def close(self):
        if self.session:
            await self.session.close()

    async def analyze_image(self, image_path: str):
        """
        로컬 이미지 파일을 Azure Custom Vision으로 전송해
        성별(Male/Female), 연령(Age18to60 등) 확률을 얻는다.
        """
        if not self.url:
            # API URL이 없으면 빈 dict 반환
            return {}

        if not self.session:
            await self.start()

        if not os.path.exists(image_path):
            return {}

        # 이미지 읽어서 POST
        with open(image_path, "rb") as f:
            image_data = f.read()

        async with self.session.post(self.url, headers=self.headers, data=image_data) as response:
            if response.status != 200:
                return {}
            result = await response.json()

        return self.normalize_predictions(result.get('predictions', []))

    def normalize_predictions(self, predictions: list):
        """
        Azure 예측값 중 성별(Male/Female), 연령(Age18to60 등)을
        { 'Male':30, 'Female':70, 'Age18to60':80, ... } 형태로 정규화
        """
        gender_preds = {
            p['tagName']: p['probability'] * 100
            for p in predictions if p['tagName'] in ['Male', 'Female']
        }
        age_preds = {
            p['tagName']: p['probability'] * 100
            for p in predictions if p['tagName'] in ['Age18to60', 'AgeOver60', 'AgeLess18']
        }

        def normalize_group(group_preds):
            total = sum(group_preds.values())
            if total > 0:
                return {k: (v / total) * 100 for k, v in group_preds.items()}
            return group_preds

        return {
            **normalize_group(gender_preds),
            **normalize_group(age_preds)
        }


# ---------------------------------------------------------
# (B) YOLO 추적 + 얼굴 모자이크 + Azure 태깅 + 백엔드 전송 (+스켈레톤)
# ---------------------------------------------------------
class PersonTracker:
    def __init__(
        self,
        model_path="FootTrafficReport/people-detection/model/yolo11n-pose.pt",
        conf=0.5,
        iou=0.5,
        device=None
    ):
        self.device = device if device else ('cuda:0' if torch.cuda.is_available() else 'cpu')
        self.model = YOLO(model_path)
        self.conf = conf
        self.iou = iou

        self.color_map = {}
        self.azure_api = AzureAPI()

        # 백엔드 API URL(예: .env에서 BACKEND_URL 설정, 없으면 아래 디폴트)
        self.backend_url = os.getenv("BACKEND_URL", "https://msteam5iseeu.ddns.net/api/cctv_data")

        # [Optional] COCO 포맷 키포인트 연결 (스켈레톤)
        self.SKELETON = [
            (0, 1), (0, 2),
            (1, 3), (2, 4),
            (4, 6), (5, 6),
            (5, 7), (7, 9),
            (6, 8), (8, 10),
            (5, 11), (6, 12),
            (11, 13), (13, 15),
            (12, 14), (14, 16)
        ]

    def generate_color(self, obj_id):
        if obj_id not in self.color_map:
            self.color_map[obj_id] = [random.randint(0, 255) for _ in range(3)]
        return self.color_map[obj_id]

    def draw_skeleton(self, frame, keypoints, color=(0, 255, 255), conf_thr=0.3):
        """
        각 키포인트를 원으로 표시 + SKELETON 연결선
        keypoints.shape: [17, 3] (x, y, conf)
        """
        num_kpts = keypoints.shape[0]
        # 키포인트 그리기
        for i in range(num_kpts):
            x, y, c = keypoints[i]
            if c > conf_thr:
                cv2.circle(frame, (int(x), int(y)), 4, color, -1)

        # 연결
        for (p1, p2) in self.SKELETON:
            if p1 < num_kpts and p2 < num_kpts:
                x1, y1, c1 = keypoints[p1]
                x2, y2, c2 = keypoints[p2]
                if c1 > conf_thr and c2 > conf_thr:
                    cv2.line(frame, (int(x1), int(y1)), (int(x2), int(y2)), color, 2)

    def estimate_face_area(self, keypoints, box):
        face_indices = [0, 1, 2, 3, 4]  # nose, eyes, ears
        face_kpts = keypoints[face_indices]

        if face_kpts.shape[1] == 3:
            face_kpts = face_kpts[face_kpts[:,2]>0.3][:, :2]

        if len(face_kpts) == 0:
            return None

        x_min, y_min = np.min(face_kpts, axis=0).astype(int)
        x_max, y_max = np.max(face_kpts, axis=0).astype(int)
        # box 범위 안으로 clamp
        x_min, y_min = np.maximum([x_min, y_min], [box[0], box[1]])
        x_max, y_max = np.minimum([x_max, y_max], [box[2], box[3]])

        if x_max<=x_min or y_max<=y_min:
            return None

        # (예) 위아래로 크게 확장
        face_h = y_max-y_min
        expand_up = int(face_h*3)
        expand_down = int(face_h*3)
        face_w = x_max-x_min
        expand_side = int(face_w*0.2)

        x_min -= expand_side
        x_max += expand_side
        y_min -= expand_up
        y_max += expand_down

        x_min = max(x_min, box[0])
        y_min = max(y_min, box[1])
        x_max = min(x_max, box[2])
        y_max = min(y_max, box[3])
        if x_max<=x_min or y_max<=y_min:
            return None

        return (x_min, y_min, x_max, y_max)

    def apply_face_blur(self, frame, face_area):
        if not face_area:
            return frame
        x1, y1, x2, y2 = face_area
        roi = frame[y1:y2, x1:x2]
        blurred = cv2.GaussianBlur(roi, (45, 45), 0)
        frame[y1:y2, x1:x2] = blurred
        return frame

    async def process_single_frame(self, frame_bgr, cctv_id):
        results = self.model.predict(
            frame_bgr,
            conf=self.conf,
            iou=self.iou,
            device=self.device,
            classes=[0]  # 사람만
        )
        if len(results) == 0:
            return frame_bgr

        boxes = results[0].boxes
        keypoints_data = []
        if hasattr(results[0], 'keypoints') and results[0].keypoints is not None:
            keypoints_data = results[0].keypoints.data.cpu().numpy()

        # Azure 세션
        await self.azure_api.start()

        tasks = []
        for i, box in enumerate(boxes):
            x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
            obj_id = i

            # (A) 스켈레톤
            if i < len(keypoints_data):
                self.draw_skeleton(frame_bgr, keypoints_data[i], conf_thr=0.3)
                # (B) 얼굴 blur
                face_area = self.estimate_face_area(keypoints_data[i], [x1,y1,x2,y2])
                if face_area:
                    frame_bgr = self.apply_face_blur(frame_bgr, face_area)

            # (C) 사람 crop & Azure & 백엔드 전송
            tasks.append(self.process_person_image(frame_bgr, x1, y1, x2, y2, obj_id, cctv_id))

            # 디버그 bounding box
            color_box = self.generate_color(obj_id)
            cv2.rectangle(frame_bgr, (x1, y1), (x2, y2), color_box, 2)
            cv2.putText(frame_bgr, f"ID: {obj_id}", (x1, y1-10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color_box, 2)

        await asyncio.gather(*tasks)
        await self.azure_api.close()

        return frame_bgr

    async def process_person_image(self, frame_bgr, x1, y1, x2, y2, obj_id, cctv_id):
        """
        사람 crop -> Azure 분석 -> gender/age -> 백엔드로 전송 (+감지시각)
        """
        cropped_img = frame_bgr[y1:y2, x1:x2]
        if cropped_img.size == 0:
            return

        cropped_path = f"/tmp/cropped_{cctv_id}_{obj_id}.jpg"
        cv2.imwrite(cropped_path, cropped_img)

        preds = await self.azure_api.analyze_image(cropped_path)
        threshold = 30.0

        # 성별
        gender_candidates = [k for k in preds if k in ["Male","Female"] and preds[k]>=threshold]
        if gender_candidates:
            gender_key = max(gender_candidates, key=lambda k: preds[k])
        else:
            gender_key = "Unknown"
        if gender_key == "Male":
            gender="male"
        elif gender_key == "Female":
            gender="female"
        else:
            gender="Unknown"

        # 나이
        age_candidates = [k for k in preds if k in ["AgeLess18","Age18to60","AgeOver60"] and preds[k]>=threshold]
        if age_candidates:
            age_key = max(age_candidates, key=lambda k: preds[k])
        else:
            age_key = "Unknown"

        if age_key=="AgeLess18":
            age="young"
        elif age_key=="Age18to60":
            age="adult"
        elif age_key=="AgeOver60":
            age="old"
        else:
            age="Unknown"

        # 감지 시간
        detection_time = datetime.now()
        # 백엔드 전송
        await self.send_data_to_backend(cctv_id, detection_time, obj_id, gender, age, cropped_path)

    async def send_data_to_backend(self, cctv_id, detection_time, obj_id, gender, age, cropped_path):
        """
        multipart/form-data로
        (cctv_id, detected_time, person_label, gender, age, image_file) 전송
        """
        if not self.backend_url:
            return

        data = {
            "cctv_id": cctv_id,
            "detected_time": detection_time.isoformat(),  # 예: 2025-05-01T12:34:56
            "person_label": str(obj_id),
            "gender": gender,
            "age": age
        }

        files = {}
        if cropped_path and os.path.exists(cropped_path):
            files["image_file"] = open(cropped_path, "rb")

        try:
            # requests 모듈 사용
            response = requests.post(self.backend_url, data=data, files=files)
            if response.status_code == 200 or response.status_code == 201:
                print("[INFO] Upload success:", response.json())
            else:
                print("[WARN] Upload failed:", response.status_code, response.text)
        except Exception as e:
            print("[ERROR] send_data_to_backend:", e)
        finally:
            if "image_file" in files:
                files["image_file"].close()


# ---------------------------------------------------------
# (C) /yolo_mosaic 라우트:
# ---------------------------------------------------------
@app.post("/yolo_mosaic")
async def yolo_mosaic(file: UploadFile = File(...), cctv_id: int = Form(...)):

    """
    브라우저 Canvas -> 스켈레톤 + 얼굴 모자이크 + 성별/연령 태깅 -> PNG
    """
    try:
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        frame_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if frame_bgr is None:
            raise ValueError("Failed to decode image")

        tracker = PersonTracker()
        result_frame = await tracker.process_single_frame(frame_bgr, cctv_id=cctv_id)

        ret, encoded_img = cv2.imencode(".png", result_frame)
        if not ret:
            raise ValueError("Failed to encode result image")

        return Response(content=encoded_img.tobytes(), media_type="image/png")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------
# (E) 앱 실행
# ---------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8500)
