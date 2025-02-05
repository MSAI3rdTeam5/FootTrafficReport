from ultralytics import YOLO
from datetime import datetime
import os
import torch
import cv2
import random
import pandas as pd
import requests

class AzureAPI:
    def __init__(self):
        self.url = "https://cvteam5-prediction.cognitiveservices.azure.com/customvision/v3.0/Prediction/b87cc58e-8c3d-4d37-8777-d33c07195f06/classify/iterations/Iteration2/image"
        self.headers = {
            "Prediction-Key": "8Icrrz5XXYWn6WOToZXmP6wWZ68hWOQDF4X6fOa3g8jPXc3zmrR0JQQJ99BAACYeBjFXJ3w3AAAIACOGhaam",
            "Content-Type": "application/octet-stream"
        }

    def analyze_image(self, image_path):
        with open(image_path, "rb") as image_file:
            image_data = image_file.read()
        response = requests.post(self.url, headers=self.headers, data=image_data)
        result = response.json()
        return self.normalize_predictions(result['predictions'])
    
    def normalize_predictions(self, predictions):
        gender_preds = {p['tagName']: p['probability'] * 100 for p in predictions if p['tagName'] in ['male', 'female']}
        age_preds = {p['tagName']: p['probability'] * 100 for p in predictions if p['tagName'] in ['adult', 'old', 'young']}
        
        def normalize_group(group_preds):
            total = sum(group_preds.values())
            return {k: (v/total)*100 for k, v in group_preds.items()} if total > 0 else group_preds
        
        return {**normalize_group(gender_preds), **normalize_group(age_preds)}

"""탐지된 사람을 크롭하여 저장하는 함수"""
def save_cropped_person(frame, x1, y1, x2, y2, obj_id, save_dir="cropped_people/"):
        os.makedirs(save_dir, exist_ok=True)  
        cropped_img = frame[y1:y2, x1:x2]  

        file_name = f"{save_dir}person_{obj_id}.jpg"
        
        print(f" Cropping person {obj_id}: {file_name}")
        success = cv2.imwrite(file_name, cropped_img)  
        
        return file_name 
    
    
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
    
    ''' save_cropped_person 함수를 호출하여 크롭된 이미지를 저장하고, Azure API를 호출하여 성별과 나이를 분석하는 함수'''
    def detect_and_track(self, source, cctv_id, show=True, logger=None):
        results = self.model.track(
            source, show=False, stream=True, tracker=self.tracker_config, conf=self.conf,
            device=self.device, iou=self.iou, stream_buffer=True, classes=[0], imgsz=self.img_size
        )

        for i, result in enumerate(results):
            frame = result.orig_img  
            boxes = result.boxes  

            self.frames.append(frame)  
            self.boxes.append(boxes)  

            try:
                try:
                    id_count = [int(box.id) for box in boxes]
                except:
                    id_count = []

                for box in boxes:
                    x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())  
                    obj_id = int(box.id)  
                    color = self.generate_color(obj_id)   
                    
                    if obj_id not in self.detected_ids:
                        self.detected_ids.add(obj_id) 
                        cropped_path = save_cropped_person(frame, x1, y1, x2, y2, obj_id)
                        
                        predictions = self.azure_api.analyze_image(cropped_path)
                        
                        gender = max([k for k in predictions if k in ['male', 'female']], key=predictions.get, default="Unknown")
                        age = max([k for k in predictions if k in ['adult', 'old', 'young']], key=predictions.get, default="Unknown")

                        print(f"Detected: {gender}, {age}")  
                    
                        # 백엔드 서버의 URL (API endpoint)
                        url = "https://msteam5iseeu.ddns.net/api/cctv_data" 
                        
                        current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

                        data = {
                            "cctv_id": cctv_id,
                            "detected_time": current_time,
                            "person_label": obj_id,
                            "gender": gender,
                            "age": age
                        }
                        
                        response = requests.post(url, json=data, verify=False)
                
                        print(response.json())

                    cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)

                    cv2.putText(frame, f"ID: {obj_id}", (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)

                max_id = max(id_count) if id_count else 0  

            except Exception as e:
                print(f"Error: {e}")

            cv2.imshow("Person Tracking", frame)
            
            key = cv2.waitKey(1) & 0xFF
            if key == ord('q'): 
                break
            elif key == ord('s'):  
                while True:
                    key = cv2.waitKey(1) & 0xFF
                    if key == ord('s'):  
                        break
                    elif key == ord('q'):  
                        return

        cv2.destroyAllWindows()

        self.save_video_prompt()

    def save_video_prompt(self):
        save_input = input("Do you want to save the video? (y/n): ").strip().lower()
        if save_input == 'y':
            save_dir = "results_video"  
            os.makedirs(save_dir, exist_ok=True)  

            video_name = datetime.now().strftime("%Y-%m-%d-%H-%M-%S") + ".webm"
            video_path = os.path.join(self.result_dir, video_name)
            fourcc = cv2.VideoWriter_fourcc(*'VP80')  
            height, width, _ = self.frames[0].shape
            out = cv2.VideoWriter(video_path, fourcc, 30, (width, height))

            for frame in self.frames:
                out.write(frame)

            out.release()
            print(f"Video saved at {video_path}")

            self.blur_bounding_box_areas(video_path)

        elif save_input == 'n':
            print("Video not saved.")
        else:
            print("Invalid input. Please enter 'y' or 'n'.")
            self.save_video_prompt()

    def blur_bounding_box_areas(self, video_path):
        
        output_name = os.path.basename(video_path).replace(".webm", "_blurred.webm")
        output_path = os.path.join(self.output_dir, output_name)
        
        cap = cv2.VideoCapture(video_path)
        fourcc = cv2.VideoWriter_fourcc(*'VP80') 
        out = cv2.VideoWriter(output_path, fourcc, 30, (int(cap.get(3)), int(cap.get(4))))
        
        for i in range(len(self.frames)):
            ret, frame = cap.read()
            if not ret:
                break

            boxes = self.boxes[i]  
            for box in boxes:
                x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
                roi = frame[y1:y2, x1:x2]
                blurred_roi = cv2.GaussianBlur(roi, (15, 15), 0)
                frame[y1:y2, x1:x2] = blurred_roi

            out.write(frame)

        cap.release()
        out.release()
        print(f"Blurred video saved at {output_path}")
'''
Test code 할때는 __name__ == "__main__"으로 실행 (detect_people 함수는 주석 처리)
웹으로 호출해서 실제 cctv에서 실행할때는 detect_people로 실행 (__name__ == "__main__" 주석 처리)
'''
### 웹으로 호출되는 함수로 매개변수 (soruce url(cctv_url), cctv_id)를 받아서 실행
# def detect_people(source, cctv_id):
#     tracker = PersonTracker(model_path='/Users/chonakyung/project-3/FootTrafficReport/people-detection/model/yolo11n.pt')
#     tracker.detect_and_track(source=source, cctv_id=cctv_id)
    
### Test할때 하는 작업
if __name__ == '__main__':
    source = "/Users/chonakyung/project-3/FootTrafficReport/people-detection/data/08_store.mp4"
    tracker = PersonTracker(model_path='/Users/chonakyung/project-3/FootTrafficReport/people-detection/model/yolo11n.pt')
    tracker.detect_and_track(source=source, cctv_id= 13)

