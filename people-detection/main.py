import os
import cv2
import torch
import random
import pandas as pd
import aiohttp
import asyncio
import requests
from datetime import datetime
from ultralytics import YOLO
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI()

# 프론트엔드에서 전달하는 요청 body의 구조를 정의하는 Pydantic 모델
class DetectionRequest(BaseModel):
    cctv_url: str
    cctv_id: str

class AzureAPI:
    def __init__(self):
        self.url = "https://cvteam5-prediction.cognitiveservices.azure.com/customvision/v3.0/Prediction/b87cc58e-8c3d-4d37-8777-d33c07195f06/classify/iterations/Iteration2/image"
        self.headers = {
            "Prediction-Key": "8Icrrz5XXYWn6WOToZXmP6wWZ68hWOQDF4X6fOa3g8jPXc3zmrR0JQQJ99BAACYeBjFXJ3w3AAAIACOGhaam",
            "Content-Type": "application/octet-stream"
        }
        self.session = None

    async def start(self):
        self.session = aiohttp.ClientSession()

    async def close(self):
        if self.session:
            await self.session.close()
            
    async def analyze_image(self, image_path):
        if not self.session:
            await self.start()
            
        with open(image_path, "rb") as image_file:
            image_data = image_file.read()
            
        async with self.session.post(self.url, headers=self.headers, data=image_data) as response:
            result = await response.json()
            
        return self.normalize_predictions(result['predictions'])
    
    def normalize_predictions(self, predictions):
        gender_preds = {p['tagName']: p['probability'] * 100 for p in predictions if p['tagName'] in ['male', 'female']}
        age_preds = {p['tagName']: p['probability'] * 100 for p in predictions if p['tagName'] in ['adult', 'old', 'young']}
        
        def normalize_group(group_preds):
            total = sum(group_preds.values())
            return {k: (v/total)*100 for k, v in group_preds.items()} if total > 0 else group_preds
        
        return {**normalize_group(gender_preds), **normalize_group(age_preds)}    
    
class PersonTracker:
    def __init__(self, model_path, result_dir='results/', tracker_config="/Users/chonakyung/project-3/FootTrafficReport/people-detection/config/botsort.yaml", conf=0.5, device=None,
                 iou=0.5, img_size=(720, 1080), output_dir='results_video'):
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

    def generate_color(self, obj_id):
        if obj_id not in self.color_map:
            self.color_map[obj_id] = [random.randint(0, 255) for _ in range(3)] 
        return self.color_map[obj_id] 
   
    async def detect_and_track(self, source, cctv_id):
        results = self.model.track(
            source, show=False, stream=True, tracker=self.tracker_config, conf=self.conf,
            device=self.device, iou=self.iou, stream_buffer=True, classes=[0], imgsz=self.img_size
        )

        await self.azure_api.start()
        
        for result in results:
            frame = result.orig_img
            boxes = result.boxes

            self.frames.append(frame)
            self.boxes.append(boxes)

            tasks = []
            for box in boxes:
                x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
                obj_id = int(box.id)
                color = self.generate_color(obj_id)

                if obj_id not in self.detected_ids:
                    self.detected_ids.add(obj_id)
                    cropped_path = self.save_cropped_person(frame, x1, y1, x2, y2, obj_id)
                    tasks.append(self.process_person(obj_id, cropped_path, cctv_id))

                cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
                cv2.putText(frame, f"ID: {obj_id}", (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)

            await asyncio.gather(*tasks)

            cv2.imshow("Person Tracking", frame)
            
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
    
    async def process_person(self, obj_id, cropped_path, cctv_id):
        predictions = await self.azure_api.analyze_image(cropped_path)
        gender = max([k for k in predictions if k in ['male', 'female']], key=predictions.get, default="Unknown")
        age = max([k for k in predictions if k in ['adult', 'old', 'young']], key=predictions.get, default="Unknown")
        
        await self.send_data_to_server(obj_id, gender, age, cctv_id)

    async def send_data_to_server(self, obj_id, gender, age, cctv_id):
        """백엔드 서버로 분석 결과 전송"""
        url = "https://msteam5iseeu.ddns.net/api/cctv_data"
        data = {
            "cctv_id": cctv_id,
            "detected_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
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
                
    def save_cropped_person(self, frame, x1, y1, x2, y2, obj_id, save_dir="cropped_people/"):
        os.makedirs(save_dir, exist_ok=True)
        file_name = f"{save_dir}person_{obj_id}.jpg"
        cv2.imwrite(file_name, frame[y1:y2, x1:x2])
        return file_name
    
    def save_blurred_video_prompt(self):
        save_input = input("Do you want to save the blurred video? (y/n): ").strip().lower()
        if save_input == 'y':
            self.save_blurred_video()
        elif save_input == 'n':
            print("Video not saved.")
        else:
            print("Invalid input. Please enter 'y' or 'n'.")
            self.save_blurred_video_prompt()

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

# 비동기 함수로 정의하여 await를 사용할 수 있도록 합니다.
@app.post("/detect")
async def detect_people(request: DetectionRequest):
    try:
        # PersonTracker 초기화 (모델 경로는 실제 경로로 수정)
        tracker = PersonTracker(
            model_path='/Users/chonakyung/project-3/FootTrafficReport/people-detection/model/yolo11n.pt'
        )
        # 프론트엔드에서 받은 cctv_url을 source로 전달
        result = await tracker.detect_and_track(source=request.cctv_url, cctv_id=request.cctv_id)
        # 예를 들어, 결과가 videoStreamUrl, recognitionLog 등을 포함한다고 가정
        return result
    except Exception as e:
        # 에러 발생 시 HTTP 500 에러 반환
        raise HTTPException(status_code=500, detail=str(e))

### 웹으로 호출되는 함수로 매개변수 (soruce url(cctv_url), cctv_id)를 받아서 실행
# @app.post("/detect")
# def detect_people(payload: dict):
#     source = payload["cctv_url"]
#     cctv_id = payload["cctv_id"]
#     tracker = PersonTracker(model_path='/Users/chonakyung/project-3/FootTrafficReport/people-detection/model/yolo11n.pt')
#     asyncio.run(tracker.detect_and_track(source=source, cctv_id=cctv_id))

# def detect_people(source, cctv_id):
#     tracker = PersonTracker(model_path='/Users/chonakyung/project-3/FootTrafficReport/people-detection/model/yolo11n.pt')
#     asyncio.run(tracker.detect_and_track(source=source, cctv_id=cctv_id)) 
   
### Test할때 하는 작업 (cctv_id는 임의로 설정)
# if __name__ == '__main__':
#     source = "/Users/chonakyung/project-3/FootTrafficReport/people-detection/data/08_store.mp4"
#     tracker = PersonTracker(model_path='/Users/chonakyung/project-3/FootTrafficReport/people-detection/model/yolo11n.pt')
    
#     asyncio.run(tracker.detect_and_track(source=source, cctv_id=13))  

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8500)