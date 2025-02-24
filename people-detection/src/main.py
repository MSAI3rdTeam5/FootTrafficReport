# /home/azureuser/FootTrafficReport/people-detection/src/main.py

from fastapi import FastAPI, File, UploadFile, HTTPException
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
# (B) YOLO 추적 + 얼굴 모자이크 + Azure 태깅 + 백엔드 전송
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

        # (NEW) 백엔드 API URL(예: .env에서 불러오거나 기본값 사용)
        self.backend_url = os.getenv("BACKEND_URL", "https://msteam5iseeu.ddns.net/api/cctv_data")

        # [ADDED for Skeleton] COCO 포맷 기준 키포인트 연결 (스켈레톤)
        self.SKELETON = [
            (0, 1),  # nose -> left eye
            (0, 2),  # nose -> right eye
            (1, 3),  # left eye -> left ear
            (2, 4),  # right eye -> right ear
            (5, 6),  # left shoulder -> right shoulder
            (5, 7),  # left shoulder -> left elbow
            (7, 9),  # left elbow -> left wrist
            (6, 8),  # right shoulder -> right elbow
            (8, 10), # right elbow -> right wrist
            (5, 11), # left shoulder -> left hip
            (6, 12), # right shoulder -> right hip
            (11, 13),# left hip -> left knee
            (13, 15),# left knee -> left ankle
            (12, 14),# right hip -> right knee
            (14, 16) # right knee -> right ankle
        ]

    def generate_color(self, obj_id):
        if obj_id not in self.color_map:
            self.color_map[obj_id] = [random.randint(0, 255) for _ in range(3)]
        return self.color_map[obj_id]

    def draw_skeleton(self, frame, keypoints, color=(0, 255, 255), conf_thr=0.3):
        """
        [ADDED for Skeleton]
        한 사람의 keypoints(17x3: x, y, conf) 정보를 받아
        스켈레톤 라인 + 점을 frame 위에 그린다.
        """
        num_kpts = keypoints.shape[0]  # 보통 17개
        # 관절점 표시
        for i in range(num_kpts):
            x, y, c = keypoints[i]
            if c > conf_thr:
                cv2.circle(frame, (int(x), int(y)), 4, color, -1)

        # 연결선(SKELETON) 그리기
        for (p1, p2) in self.SKELETON:
            if p1 < num_kpts and p2 < num_kpts:
                x1, y1, c1 = keypoints[p1]
                x2, y2, c2 = keypoints[p2]
                if c1 > conf_thr and c2 > conf_thr:
                    cv2.line(frame, (int(x1), int(y1)), (int(x2), int(y2)), color, 2)

    def estimate_face_area(self, keypoints, box):
        # YOLO Pose keypoint 인덱스: nose=0, left eye=1, right eye=2, left ear=3, right ear=4
        face_indices = [0, 1, 2, 3, 4]
        face_kpts = keypoints[face_indices]

        # (x, y, conf) 에서 conf>0.3 이상인 점만 사용
        if face_kpts.shape[1] == 3:
            face_kpts = face_kpts[face_kpts[:, 2] > 0.3][:, :2]

        if len(face_kpts) == 0:
            return None

        # 키포인트로부터 x_min, y_min, x_max, y_max
        x_min, y_min = np.min(face_kpts, axis=0).astype(int)
        x_max, y_max = np.max(face_kpts, axis=0).astype(int)

        # 사람 전체 box와 교차
        x_min, y_min = np.maximum([x_min, y_min], [box[0], box[1]])
        x_max, y_max = np.minimum([x_max, y_max], [box[2], box[3]])

        # 얼굴 폭/높이
        face_w = x_max - x_min
        face_h = y_max - y_min

        if face_w <= 0 or face_h <= 0:
            return None

        # (예시) 위아래로 크게 확장
        expand_up = int(face_h * 3)
        expand_down = int(face_h * 3)
        expand_side = int(face_w * 0.2)

        x_min = x_min - expand_side
        x_max = x_max + expand_side
        y_min = y_min - expand_up
        y_max = y_max + expand_down

        x_min = max(x_min, box[0])
        y_min = max(y_min, box[1])
        x_max = min(x_max, box[2])
        y_max = min(y_max, box[3])

        if x_max <= x_min or y_max <= y_min:
            return None

        return (x_min, y_min, x_max, y_max)

    def apply_face_blur(self, frame, face_area):
        """
        얼굴 영역을 GaussianBlur 처리
        """
        if not face_area:
            return frame
        x1, y1, x2, y2 = face_area
        if x2 > x1 and y2 > y1:
            roi = frame[y1:y2, x1:x2]
            blurred = cv2.GaussianBlur(roi, (45, 45), 0)
            frame[y1:y2, x1:x2] = blurred
        return frame

    async def process_single_frame(self, frame_bgr, cctv_id="webcam"):
        """
        1장 이미지를 사람 감지 -> 스켈레톤 시각화 -> 얼굴 모자이크 -> Azure 태깅 -> 백엔드 전송
        """
        # YOLO 추론(사람=class0)
        results = self.model.predict(
            frame_bgr,
            conf=self.conf,
            iou=self.iou,
            device=self.device,
            classes=[0]
        )

        if len(results) == 0:
            return frame_bgr  # 감지된 사람이 없으면 그대로 리턴

        boxes = results[0].boxes
        keypoints_data = []
        if hasattr(results[0], 'keypoints') and results[0].keypoints is not None:
            # shape: [N, 17, 3] (사람 수 N, 키포인트 17개, [x, y, conf])
            keypoints_data = results[0].keypoints.data.cpu().numpy()

        # Azure API 세션 오픈
        await self.azure_api.start()

        tasks = []
        for i, box in enumerate(boxes):
            x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
            obj_id = i

            # (1) 스켈레톤 그리기
            if i < len(keypoints_data):
                # 원하는 색상 지정 (랜덤 or 고정)
                skeleton_color = (0, 255, 255)
                self.draw_skeleton(frame_bgr, keypoints_data[i], color=skeleton_color, conf_thr=0.3)

                # (2) 얼굴 모자이크
                face_area = self.estimate_face_area(keypoints_data[i], [x1, y1, x2, y2])
                if face_area:
                    frame_bgr = self.apply_face_blur(frame_bgr, face_area)

            # (3) 사람 crop & Azure 분석 & 백엔드 전송
            tasks.append(self.process_person_image(frame_bgr, x1, y1, x2, y2, obj_id, cctv_id))

            # (4) 디버그용 bounding box
            color_box = self.generate_color(obj_id)
            cv2.rectangle(frame_bgr, (x1, y1), (x2, y2), color_box, 2)
            cv2.putText(frame_bgr, f"ID: {obj_id}", (x1, y1 - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, color_box, 2)

        # 모든 사람 crop 비동기 처리
        await asyncio.gather(*tasks)
        await self.azure_api.close()

        return frame_bgr

    async def process_person_image(self, frame_bgr, x1, y1, x2, y2, obj_id, cctv_id):
        """
        사람 영역을 crop -> Azure 분석 -> 성별/연령 추출 -> 백엔드에 전송
        """
        cropped_img = frame_bgr[y1:y2, x1:x2]
        if cropped_img.size == 0:
            return

        # 1) 크롭 이미지 저장
        cropped_path = f"/tmp/cropped_{cctv_id}_{obj_id}.jpg"
        cv2.imwrite(cropped_path, cropped_img)

        # 2) Azure 성별/연령 추론
        preds = await self.azure_api.analyze_image(cropped_path)
        # parse gender/age with threshold
        threshold = 30.0
        # 성별
        gender_candidates = [k for k in preds if k in ["Male", "Female"] and preds[k] >= threshold]
        if gender_candidates:
            gender_key = max(gender_candidates, key=lambda k: preds[k])
        else:
            gender_key = "Unknown"
        if gender_key == "Male":
            gender = "male"
        elif gender_key == "Female":
            gender = "female"
        else:
            gender = "Unknown"

        # 연령
        age_candidates = [k for k in preds if k in ["AgeLess18","Age18to60","AgeOver60"] and preds[k]>= threshold]
        if age_candidates:
            age_key = max(age_candidates, key=lambda k: preds[k])
        else:
            age_key = "Unknown"

        if age_key == "AgeLess18":
            age = "young"
        elif age_key == "Age18to60":
            age = "adult"
        elif age_key == "AgeOver60":
            age = "old"
        else:
            age = "Unknown"

        # 3) 백엔드 API로 정보 전송
        await self.send_data_to_backend(cctv_id, obj_id, gender, age, cropped_path)

    async def send_data_to_backend(self, cctv_id, obj_id, gender, age, cropped_path):
        """
        감지된 사람 정보를 multipart/form-data로 백엔드에 전달 (DB저장 등)
        """
        if not self.backend_url:
            return  # 백엔드URL이 설정 안되었으면 skip

        from aiohttp import FormData
        form = FormData()
        form.add_field("cctv_id", str(cctv_id))
        form.add_field("detected_time", datetime.now().isoformat())
        form.add_field("person_label", str(obj_id))
        form.add_field("gender", gender)
        form.add_field("age", age)

        # 이미지 첨부
        if os.path.exists(cropped_path):
            with open(cropped_path, "rb") as f:
                image_data = f.read()
            form.add_field(
                "image_file",
                image_data,
                filename=os.path.basename(cropped_path),
                content_type="image/jpeg"
            )

        # 실제 POST
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(self.backend_url, data=form) as resp:
                    if resp.status not in (200, 201):
                        print(f"[WARN] Backend responded status={resp.status}")
                    else:
                        rjson = await resp.json()
                        print("[INFO] Backend response:", rjson)
        except Exception as e:
            print("[ERROR] send_data_to_backend:", e)


# ---------------------------------------------------------
# (C) /yolo_mosaic 라우트:
#     브라우저 Canvas → YOLO 사람 감지 + 스켈레톤 + 모자이크 + Azure 태깅 → 이미지 응답
# ---------------------------------------------------------
@app.post("/yolo_mosaic")
async def yolo_mosaic(file: UploadFile = File(...), cctv_id: Optional[str] = "webcam"):
    """
    프론트엔드에서 2FPS 등 주기로 이미지를 업로드 -> 스켈레톤 + 모자이크 + 성별/연령 태깅 -> PNG 이미지 응답
    """
    try:
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        frame_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if frame_bgr is None:
            raise ValueError("Failed to decode image")

        # YOLO + 스켈레톤 + 얼굴 모자이크 + Azure 태깅 + 백엔드 전송
        tracker = PersonTracker()
        result_frame = await tracker.process_single_frame(frame_bgr, cctv_id=cctv_id)

        # 처리된 프레임을 PNG로 인코딩 후 바이너리 응답
        ret, encoded_img = cv2.imencode(".png", result_frame)
        if not ret:
            raise ValueError("Failed to encode result image")

        return Response(content=encoded_img.tobytes(), media_type="image/png")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------
# (D) 이전 RTP/RTMP 관련 라우트 => 제거
# ---------------------------------------------------------
# ...


# ---------------------------------------------------------
# (E) 앱 실행 (개발환경에서 uvicorn)
# ---------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8500)
