from ultralytics import YOLO
from datetime import datetime
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
 
import os
import torch
import cv2
import random
import pandas as pd
import aiohttp
import asyncio
import numpy as np
import onnxruntime as ort
 
app = FastAPI()
 
# 프론트엔드에서 전달하는 요청 body의 구조를 정의하는 Pydantic 모델
class DetectionRequest(BaseModel):
    cctv_url: str
    cctv_id: str
 
class ONNXModel:
    def __init__(self, model_path):
        self.session = ort.InferenceSession(model_path)
        self.input_name = self.session.get_inputs()[0].name
        self.output_names = [output.name for output in self.session.get_outputs()]

    def predict(self, image):
        input_data = np.array(image).astype(np.float32)
        results = self.session.run(self.output_names, {self.input_name: input_data})
        return self.process_output(results)

    def process_output(self, results):
        predictions = results[0]  # 첫 번째 출력 선택

        if isinstance(predictions, np.ndarray) and predictions.shape == (1, 1):
            # 단일 클래스 레이블 처리
            class_label = predictions[0][0]  # 예: 'AgeLess18', 'Male', 'Female'
            
            # 성별 및 나이를 추출
            if class_label in ['Male', 'Female']:
                gender = class_label
                age = 'unknown'
            elif class_label in ['AgeLess18', 'Age18to60', 'AgeOver60']:
                gender = 'unknown'
                age = class_label
            else:
                gender = 'unknown'
                age = 'unknown'

            return {'gender': gender, 'age': age}
        else:
            print("Unexpected output format:", predictions)
            return {'gender': 'unknown', 'age': 'unknown'}

# Initialize PersonTracker with model and configuration
# 모델 및 구성으로 PersonTracker 초기화
class PersonTracker:
    def __init__(self, model_path, onnx_model_path, result_dir='../outputs/results/', tracker_config="../data/config/botsort.yaml", conf=0.5, device=None,
                 iou=0.5, img_size=(720, 1080), output_dir='../outputs/results_video'):
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
        self.onnx_model = ONNXModel(onnx_model_path)
   
    def is_fully_inside_frame(self, x1, y1, x2, y2, frame_shape):  # 추가된 코드
        h, w, _ = frame_shape
        return x1 >= 0 and y1 >= 0 and x2 <= w and y2 <= h
 
    def save_full_frame(self, frame, obj_id):  # 추가된 코드
        save_dir = "../outputs/full_frames/"
        os.makedirs(save_dir, exist_ok=True)
        timestamp = datetime.now().strftime("%Y-%m-%d-%H-%M-%S")
        file_name = f"{save_dir}{timestamp}_ID{obj_id}.jpg"
        cv2.imwrite(file_name, frame)
        print(f"[INFO] Full frame saved: {file_name}")
 
    # Generate a unique color for each object ID
    # 각 객체 ID에 대한 고유한 색상 생성
    def generate_color(self, obj_id):
        if obj_id not in self.color_map:
            self.color_map[obj_id] = [random.randint(0, 255) for _ in range(3)]
        return self.color_map[obj_id]
    
    # 얼굴 블러처리를 위한 계산
    def estimate_face_area(self, keypoints, box):
        face_keypoints_indices = [0, 1, 2, 3, 4]
        face_keypoints = keypoints[face_keypoints_indices]

        if face_keypoints.shape[1] == 2:
            valid_points = face_keypoints
        elif face_keypoints.shape[1] == 3:
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
    # 얼굴 블러
    def apply_face_blur(self, frame, face_area):
        if face_area is not None:
            x_min, y_min, x_max, y_max = face_area

            if x_max > x_min and y_max > y_min:
                face_roi = frame[y_min:y_max, x_min:x_max]
                blurred_roi = cv2.GaussianBlur(face_roi, (25, 25), 0)
                frame[y_min:y_max, x_min:x_max] = blurred_roi
        return frame
 
    # Detect and track people in the video stream
    # 비디오 스트림에서 사람을 감지하고 추적
    async def detect_and_track(self, source, cctv_id):
        results = self.model.track(
            source, show=False, stream=True, tracker=self.tracker_config, conf=self.conf,
            device=self.device, iou=self.iou, stream_buffer=True, classes=[0], imgsz=self.img_size
        )

        for result in results:
            original_frame = result.orig_img.copy()  # 원본 프레임 저장
            display_frame = original_frame.copy()    # 디스플레이용 프레임
            boxes = result.boxes
            keypoints_data = result.keypoints.data.cpu().numpy()

            self.frames.append(display_frame)
            self.boxes.append(boxes)

            tasks = []
            new_object_detected = False

            for box, kpts in zip(boxes, keypoints_data):
                x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
                if box.id is not None:
                    obj_id = int(box.id)
                else:
                    continue

                color = self.generate_color(obj_id)

                if obj_id not in self.detected_ids:
                    self.detected_ids.add(obj_id)
                    cropped_path = self.save_cropped_person(original_frame, x1, y1, x2, y2, obj_id)  # 원본 프레임에서 크롭
                    tasks.append(self.process_person(obj_id, cropped_path, cctv_id))
                    new_object_detected = True

                face_area = self.estimate_face_area(kpts, [x1, y1, x2, y2])
                if face_area:
                    display_frame = self.apply_face_blur(display_frame, face_area)

                cv2.rectangle(display_frame, (x1, y1), (x2, y2), color, 2)
                cv2.putText(display_frame, f"ID: {obj_id}", (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)

            await asyncio.gather(*tasks)

            if new_object_detected:
                self.save_full_frame(original_frame, obj_id)  # 원본 프레임 저장

            cv2.imshow("Person Tracking", display_frame)

            key = cv2.waitKey(1) & 0xFF
            if key == ord('q'):
                break
            elif key == ord('s'):
                while True:
                    if cv2.waitKey(1) & 0xFF == ord('s'):
                        break

        cv2.destroyAllWindows()
        self.save_blurred_video_prompt()
 
    # Process detected person using ONNX
    # ONNX를 사용하여 감지된 사람 처리
    async def process_person(self, obj_id, cropped_path, cctv_id):
        image = cv2.imread(cropped_path)
        image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        image = cv2.resize(image, (224, 224))
        image = image.astype(np.float32) / 255.0
        image = np.transpose(image, (2, 0, 1))
        image = np.expand_dims(image, axis=0)
        
        predictions = self.onnx_model.predict(image)
        gender = predictions['gender']
        age = predictions['age']
        
        print(f"ID: {obj_id}, Gender: {gender}, Age: {age}")
        
        await self.send_data_to_server(obj_id, gender, age, cctv_id)

 
    # Send analysis results to the backend server
    # 분석 결과를 백엔드 서버로 전송
    async def send_data_to_server(self, obj_id, gender, age, cctv_id):
        """백엔드 서버로 분석 결과 전송"""
        url = "https://msteam5iseeu.ddns.net/api/cctv_data"
        data = {
            "cctv_id": cctv_id,
            "detected_time": datetime.now().isoformat(),
            "person_label": str(obj_id),
            "gender": gender,
            "age": age
        }
 
        session = aiohttp.ClientSession()
        try:
            async with session.post(url, json=data) as response:
                print(await response.json())
        except aiohttp.ClientError as e:
            print(f"⚠️ Failed to connect to server: {e}")
        finally:
            await session.close()
 
    # Save cropped image of detected person
    # 감지된 사람의 크롭된 이미지 저장    
    def save_cropped_person(self, frame, x1, y1, x2, y2, obj_id, save_dir="../outputs/cropped_people/"):
        os.makedirs(save_dir, exist_ok=True)
        file_name = f"{save_dir}person_{obj_id}.jpg"
        cv2.imwrite(file_name, frame[y1:y2, x1:x2])
        return file_name
   
    # Prompt user to save blurred video
    # 사용자에게 블러 처리된 비디오 저장 여부 묻기
    def save_blurred_video_prompt(self):
        save_input = input("Do you want to save the blurred video? (y/n): ").strip().lower()
        if save_input == 'y':
            self.save_blurred_video()
        elif save_input == 'n':
            print("Video not saved.")
        else:
            print("Invalid input. Please enter 'y' or 'n'.")
            self.save_blurred_video_prompt()
 
    # Save video with blurred faces
    # 얼굴이 블러 처리된 비디오 저장
    def save_blurred_video(self):
        os.makedirs(self.output_dir, exist_ok=True)
        video_name = datetime.now().strftime("%Y-%m-%d-%H-%M-%S") + "_blurred.webm"
        output_path = os.path.join(self.output_dir, video_name)
       
        fourcc = cv2.VideoWriter_fourcc(*'VP80')
        height, width, _ = self.frames[0].shape
        out = cv2.VideoWriter(output_path, fourcc, 30, (width, height))
       
        for frame, boxes in zip(self.frames, self.boxes):
            for box in boxes:
                x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
                roi = frame[y1:y2, x1:x2]
                blurred_roi = cv2.GaussianBlur(roi, (15, 15), 0)
                frame[y1:y2, x1:x2] = blurred_roi
 
            out.write(frame)
 
        out.release()
        print(f"Blurred video saved at {output_path}")

'''
Test code 할때는 __name__ == "__main__"으로 실행 (detect_people 함수는 주석 처리)
웹으로 호출해서 실제 cctv에서 실행할때는 detect_people로 실행 (__name__ == "__main__" 주석 처리)
'''
# # 웹으로 호출되는 함수
# @app.post("/detect") 
# async def detect_people(request: DetectionRequest):
#     try:
#         tracker = PersonTracker(
#             model_path='FootTrafficReport/people-detection/model/yolo11n-pose.pt'
#         )
#         result = await tracker.detect_and_track(source=request.cctv_url, cctv_id=request.cctv_id)
#         return result
    
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))

# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run(app, host="0.0.0.0", port=8500)


#Test할때 하는 작업 (cctv_id는 임의로 설정)
if __name__ == '__main__':
    source = "../data/videos/05_seoul.mp4"
    yolo_model_path = '../model/yolo11n-pose.pt'
    onnx_model_path = '../model/model.onnx'
    tracker = PersonTracker(model_path=yolo_model_path, onnx_model_path=onnx_model_path)
    asyncio.run(tracker.detect_and_track(source=source, cctv_id=1))
