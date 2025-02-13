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

app = FastAPI()


# Azure API 연결 세부 정보 초기화
class AzureAPI:
    def __init__(self):
        self.url = "PATH_YOUR_URL"
        self.headers = {
            "Prediction-Key": "PATH_YOUR_KEY",
            "Content-Type": "PATH_YOUR_TYPE"
        }
        self.session = None

    # aiohttp 클라이언트 세션 시작
    async def start(self):
        self.session = aiohttp.ClientSession()

    # Close the aiohttp client session
    # aiohttp 클라이언트 세션 종료
    async def close(self):
        if self.session:
            await self.session.close()

    # Analyze an image using Azure API
    # Azure API를 사용하여 이미지 분석
    async def analyze_image(self, image_path):
        if not self.session:
            await self.start()
        with open(image_path, "rb") as image_file:
            image_data = image_file.read()
        async with self.session.post(self.url, headers=self.headers, data=image_data) as response:
            result = await response.json()
        return self.normalize_predictions(result['predictions'])
    
    # Normalize prediction results
    # 예측 결과 정규화
    def normalize_predictions(self, predictions):
        gender_preds = {p['tagName']: p['probability'] * 100 for p in predictions if p['tagName'] in ['male', 'female']}
        age_preds = {p['tagName']: p['probability'] * 100 for p in predictions if p['tagName'] in ['adult', 'old', 'young']}
        
        def normalize_group(group_preds):
            total = sum(group_preds.values())
            return {k: (v/total)*100 for k, v in group_preds.items()} if total > 0 else group_preds
        
        return {**normalize_group(gender_preds), **normalize_group(age_preds)}

# Initialize PersonTracker with model and configuration
# 모델 및 구성으로 PersonTracker 초기화
class PersonTracker:
    def __init__(self, model_path, result_dir='../outputs/results/', tracker_config="../data/config/botsort.yaml", conf=0.5, device=None,
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
        self.azure_api = AzureAPI()

    # Generate a unique color for each object ID
    # 각 객체 ID에 대한 고유한 색상 생성
    def generate_color(self, obj_id):
        if obj_id not in self.color_map:
            self.color_map[obj_id] = [random.randint(0, 255) for _ in range(3)]
        return self.color_map[obj_id]

    # Detect and track people in the video stream
    # 비디오 스트림에서 사람을 감지하고 추적
    async def detect_and_track(self, source, cctv_id):
        results = self.model.track(
            source, show=False, stream=True, tracker=self.tracker_config, conf=self.conf,
            device=self.device, iou=self.iou, stream_buffer=True, classes=[0], imgsz=self.img_size
        )

        await self.azure_api.start()

        for result in results:
            frame = result.orig_img.copy()  
            display_frame = frame.copy()    
            boxes = result.boxes

            self.frames.append(frame)
            self.boxes.append(boxes)

            tasks = []
            for box in boxes:
                x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
                if box.id is not None:
                    obj_id = int(box.id)
                else:
                    continue  # box.id가 없으면 건너뜀

                color = self.generate_color(obj_id)

                if obj_id not in self.detected_ids:
                    self.detected_ids.add(obj_id)
                    cropped_path = self.save_cropped_person(frame, x1, y1, x2, y2, obj_id)
                    tasks.append(self.process_person(obj_id, cropped_path, cctv_id))

                cv2.rectangle(display_frame, (x1, y1), (x2, y2), color, 2)
                cv2.putText(display_frame, f"ID: {obj_id}", (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)

            await asyncio.gather(*tasks)

            cv2.imshow("Person Tracking", display_frame)

            key = cv2.waitKey(1) & 0xFF
            if key == ord('q'):
                break
            elif key == ord('s'):
                while True:
                    if cv2.waitKey(1) & 0xFF == ord('s'):
                        break

        cv2.destroyAllWindows()
        await self.azure_api.close()
        self.save_blurred_video_prompt()

    # Process detected person using Azure API
    # Azure API를 사용하여 감지된 사람 처리
    async def process_person(self, obj_id, cropped_path, cctv_id):
        predictions = await self.azure_api.analyze_image(cropped_path)
        gender = max([k for k in predictions if k in ['male', 'female']], key=predictions.get, default="Unknown")
        age = max([k for k in predictions if k in ['adult', 'old', 'young']], key=predictions.get, default="Unknown")
        
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

# 프론트엔드에서 전달하는 요청 body의 구조를 정의하는 Pydantic 모델
class DetectionRequest(BaseModel):
    cctv_url: str
    cctv_id: str

# 웹으로 호출되는 함수
@app.post("/detect") 
async def detect_people(request: DetectionRequest):
    try:
        tracker = PersonTracker(
            model_path='FootTrafficReport/people-detection/model/yolo11n-pose.pt'
        )
        # result = await tracker.detect_and_track(source=request.cctv_url, cctv_id=request.cctv_id)
        result = await tracker.detect_and_track(source="../data/videos/02_도로.mp4", cctv_id=request.cctv_id)
        return result
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8500)


### Test할때 하는 작업 (cctv_id는 임의로 설정)
# if __name__ == '__main__':
#     source = "../data/videos/02_도로.mp4"
#     tracker = PersonTracker(model_path='../model/yolo11n-pose.pt')
#     asyncio.run(tracker.detect_and_track(source=source, cctv_id=1))
