from ultralytics import YOLO
from datetime import datetime
import os
import torch
import cv2
import random
import pandas as pd
import aiohttp
import asyncio

class AzureAPI:
    def __init__(self):
        self.url = "https://cvteam5-prediction.cognitiveservices.azure.com/customvision/v3.0/Prediction/6bf7f6a6-8f58-48ef-a6ad-3c1cf2d37ced/classify/iterations/Iteration2/image"
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
    def __init__(self, model_path, result_dir='results/', tracker_config="config/botsort.yaml", conf=0.5, device=None,
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

    async def detect_and_track(self, source):
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
                    tasks.append(self.process_person(obj_id, cropped_path))

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

    async def process_person(self, obj_id, cropped_path):
        predictions = await self.azure_api.analyze_image(cropped_path)
        gender = max([k for k in predictions if k in ['male', 'female']], key=predictions.get, default="Unknown")
        age = max([k for k in predictions if k in ['adult', 'old', 'young']], key=predictions.get, default="Unknown")
        await self.save_to_csv(obj_id, gender, age)

    def save_cropped_person(self, frame, x1, y1, x2, y2, obj_id, save_dir="cropped_people/"):
        os.makedirs(save_dir, exist_ok=True)
        cropped_img = frame[y1:y2, x1:x2]
        file_name = f"{save_dir}person_{obj_id}.jpg"
        cv2.imwrite(file_name, cropped_img)
        return file_name

    async def save_to_csv(self, obj_id, gender, age):
        csv_path = "results/person_data.csv"
        os.makedirs(os.path.dirname(csv_path), exist_ok=True)
        if not os.path.exists(csv_path):
            pd.DataFrame(columns=['cctv_id', 'detected_time', 'person_label', 'gender', 'age']).to_csv(csv_path, index=False)
        
        df = pd.read_csv(csv_path)
        new_data = pd.DataFrame([{
            'cctv_id': None, 'detected_time': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            'person_label': obj_id, 'gender': gender, 'age': age
        }])
        df = pd.concat([df, new_data], ignore_index=True)
        df.to_csv(csv_path, index=False)

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

if __name__ == '__main__':
    source = "data/street.webm"
    tracker = PersonTracker(model_path='model/yolo11n.pt')
    asyncio.run(tracker.detect_and_track(source=source))

### WebCam
#if __name__ == '__main__':
#    source = 0  # Use 0 for the default webcam
#    tracker = PersonTracker(model_path='model/yolo11n.pt')
#    asyncio.run(tracker.detect_and_track(source=source))
