from ultralytics import YOLO
from datetime import datetime
import os
import torch
import cv2
import random
import pandas as pd
import requests

# Azure Custom Vision API 호출을 위한 클래스
class AzureAPI:
    def __init__(self):
        self.url = "https://cvteam5-prediction.cognitiveservices.azure.com/customvision/v3.0/Prediction/6bf7f6a6-8f58-48ef-a6ad-3c1cf2d37ced/classify/iterations/Iteration2/image"
        self.headers = {
            "Prediction-Key": "8Icrrz5XXYWn6WOToZXmP6wWZ68hWOQDF4X6fOa3g8jPXc3zmrR0JQQJ99BAACYeBjFXJ3w3AAAIACOGhaam",
            "Content-Type": "application/octet-stream"
        }

    def analyze_image(self, image_path):
        """ Azure API를 호출하여 이미지 분석 결과를 반환 """
        with open(image_path, "rb") as image_file:
            image_data = image_file.read()
        response = requests.post(self.url, headers=self.headers, data=image_data)
        result = response.json()
        return self.normalize_predictions(result['predictions'])
    
    def get_highest_confidence(self, predictions):
        """ 성별 및 연령 분석 결과 중 가장 높은 확률을 가진 값을 반환 """
        gender_preds = {p['tagName']: p['probability'] * 100 for p in predictions if p['tagName'] in ['male', 'female']}
        age_preds = {p['tagName']: p['probability'] * 100 for p in predictions if p['tagName'] in ['adult', 'old', 'young']}

        gender = max(gender_preds, key=gender_preds.get, default=None)
        age = max(age_preds, key=age_preds.get, default=None)

        return {
            'Gender': gender,
            'Age': age
        }

    def normalize_predictions(self, predictions):
        """ 성별 및 연령 분석 결과를 정규화하여 반환 """
        gender_preds = {p['tagName']: p['probability'] * 100 for p in predictions if p['tagName'] in ['male', 'female']}
        age_preds = {p['tagName']: p['probability'] * 100 for p in predictions if p['tagName'] in ['adult', 'old', 'young']}
        
        def normalize_group(group_preds):
            total = sum(group_preds.values())
            return {k: (v/total)*100 for k, v in group_preds.items()} if total > 0 else group_preds
        
        return {**normalize_group(gender_preds), **normalize_group(age_preds)}


# 저장할 CSV 파일 경로
# CSV_PATH = "results/person_data.csv"
# os.makedirs(os.path.dirname(CSV_PATH), exist_ok=True)
# if not os.path.exists(CSV_PATH):
#     pd.DataFrame(columns=['cctv_id', 'detected_time','person_label','gender','age']).to_csv(CSV_PATH, index=False)


# # CSV에 데이터 저장
# def save_to_csv(obj_id, gender, age):
#     df = pd.read_csv(CSV_PATH)
#     current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
#     new_data = pd.DataFrame([{
#         'cctv_id': None, 'detected_time': current_time, 'person_label': obj_id, 'gender': gender, 'age': age
#     }])
#     df = pd.concat([df, new_data], ignore_index=True)
#     df.to_csv(CSV_PATH, index=False)

def save_cropped_person(frame, x1, y1, x2, y2, obj_id, save_dir="cropped_people/"):
        """탐지된 사람을 크롭하여 저장하는 함수"""
        os.makedirs(save_dir, exist_ok=True)  
        cropped_img = frame[y1:y2, x1:x2]  

        # 저장할 파일 이름 (객체 ID와 프레임 정보 활용)
        file_name = f"{save_dir}person_{obj_id}.jpg"
        
        print(f" Cropping person {obj_id}: {file_name}")
        success = cv2.imwrite(file_name, cropped_img)  

        if success:
            print(f"Saved: {file_name}")
        else:
            print(f"Failed to save: {file_name}")  

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
        self.azure_api = AzureAPI()  # Azure API 객체 생성


    def create_result_file(self):
        folder_name = datetime.now().strftime("%Y-%m-%d-%H-%M-%S")  
        result_file_path = os.path.join(self.result_dir, folder_name + ".txt") 
        os.makedirs(self.result_dir, exist_ok=True)  
        with open(result_file_path, 'w') as file:
            file.write(folder_name + "\n") 
        return result_file_path

    def generate_color(self, obj_id):
        # 객체 ID에 따라 고유 색상을 생성 (이미 있으면 기존 색상 반환)
        if obj_id not in self.color_map:
            self.color_map[obj_id] = [random.randint(0, 255) for _ in range(3)] 
        return self.color_map[obj_id] 
    
    def detect_and_track(self, source, show=True, logger=None):
        result_file = self.create_result_file()
        person_count = 0  
        previous_person_count = 0  

        # YOLO 모델을 사용하여 추적 시작
        results = self.model.track(
            source, show=False, stream=True, tracker=self.tracker_config, conf=self.conf,
            device=self.device, iou=self.iou, stream_buffer=True, classes=[0], imgsz=self.img_size
        )

        for i, result in enumerate(results):
            frame = result.orig_img  # 현재 프레임 가져오기
            boxes = result.boxes  # 박스 정보 가져오기

            self.frames.append(frame)  # 저장할 프레임 추가
            self.boxes.append(boxes)  # 바운딩 박스 정보 저장

            try:
                 # ID 가져오기 (예외처리 추가)
                try:
                    id_count = [int(box.id) for box in boxes]
                except:
                    id_count = []

                for box in boxes:
                    x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())  # 바운딩 박스 좌표
                    obj_id = int(box.id)  
                    color = self.generate_color(obj_id)   
                    
                     # **🔹 처음 감지된 사람만 크롭 & 저장**
                    if obj_id not in self.detected_ids:
                        self.detected_ids.add(obj_id)  # 감지된 ID 저장
                        cropped_path = save_cropped_person(frame, x1, y1, x2, y2, obj_id)
                        print(f"📤 Cropped Image Path: {cropped_path}")

                        # **Azure Custom Vision API로 전송**
                        predictions = self.azure_api.analyze_image(cropped_path)
                        print(predictions)  # 결과 출력
                        
                        # 확률이 가장 높은 성별과 연령 가져오기
                        gender = max([k for k in predictions if k in ['male', 'female']], key=predictions.get, default="Unknown")
                        age = max([k for k in predictions if k in ['adult', 'old', 'young']], key=predictions.get, default="Unknown")

                         # 🔹 추가된 print문: 성별과 나이를 따로 출력
                        print(f"Detected: {gender}, {age}")  
                        
                        gender = predictions.get('Gender', 'Unknown')
                        age = predictions.get('Age', 'Unknown')
                    
                        #save_to_csv(obj_id, gender, age)
                        
                    # 바운딩 박스 그리기
                    cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)

                    # 객체 ID 텍스트 추가
                    cv2.putText(frame, f"ID: {obj_id}", (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)

                max_id = max(id_count) if id_count else 0  # 현재까지 탐지된 객체 수

                # 사람 수 출력
                #cv2.putText(frame, f"Total Persons: {max_id}", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

                # 사람이 추가될 때마다 결과 파일에 기록
                if max_id > person_count:
                    person_count = max_id
                    with open(result_file, 'a') as filewrite:
                        filewrite.write(f"Person count: {person_count}\n")

                    if logger:
                        logger.info(f"Person count: {person_count}")

            except Exception as e:
                print(f"Error: {e}")

            # 프레임 디스플레이
            cv2.imshow("Person Tracking", frame)

            # 키 입력 처리
            key = cv2.waitKey(1) & 0xFF
            if key == ord('q'):  # 'q'를 누르면 프로그램 종료
                print("Exiting...")
                break
            elif key == ord('s'):  # 's'를 누르면 영상 정지
                print("Pausing video...")
                while True:
                    key = cv2.waitKey(1) & 0xFF
                    if key == ord('s'):  # 's'를 다시 눌러 재개
                        print("Resuming video...")
                        break
                    elif key == ord('q'):  # 'q'를 누르면 종료
                        print("Exiting...")
                        return

        cv2.destroyAllWindows()

        # 사용자 입력을 받아 저장 여부 결정
        self.save_video_prompt()

    def save_video_prompt(self):
        save_input = input("Do you want to save the video? (y/n): ").strip().lower()
        if save_input == 'y':
            save_dir = "results_video"  
            os.makedirs(save_dir, exist_ok=True)  # 폴더 생성 (이미 존재하면 건너뜀)

            video_name = datetime.now().strftime("%Y-%m-%d-%H-%M-%S") + ".webm"
            video_path = os.path.join(self.result_dir, video_name)
            fourcc = cv2.VideoWriter_fourcc(*'VP80')  # WebM 코덱 (VP80), MP4 코덱 (mp4v)
            height, width, _ = self.frames[0].shape
            out = cv2.VideoWriter(video_path, fourcc, 30, (width, height))

            for frame in self.frames:
                out.write(frame)

            out.release()
            print(f"Video saved at {video_path}")

            # 바운딩 박스 내 영역을 블러 처리 호출
            self.blur_bounding_box_areas(video_path)

        elif save_input == 'n':
            print("Video not saved.")
        else:
            print("Invalid input. Please enter 'y' or 'n'.")
            self.save_video_prompt()

    def blur_bounding_box_areas(self, video_path):
        
        #바운딩 박스 영역을 블러 처리하는 메서드
        output_name = os.path.basename(video_path).replace(".webm", "_blurred.webm")
        output_path = os.path.join(self.output_dir, output_name)
        
        # Video reading and processing
        cap = cv2.VideoCapture(video_path)
        fourcc = cv2.VideoWriter_fourcc(*'VP80') # WebM 코덱 (VP80), MP4 코덱 (mp4v)
        out = cv2.VideoWriter(output_path, fourcc, 30, (int(cap.get(3)), int(cap.get(4))))
        
        for i in range(len(self.frames)):
            ret, frame = cap.read()
            if not ret:
                break

            boxes = self.boxes[i]  # 해당 프레임의 박스 정보 가져오기
            for box in boxes:
                x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
                # 바운딩 박스 영역을 흐리게 처리
                roi = frame[y1:y2, x1:x2]
                blurred_roi = cv2.GaussianBlur(roi, (15, 15), 0)
                frame[y1:y2, x1:x2] = blurred_roi

            out.write(frame)

        cap.release()
        out.release()
        print(f"Blurred video saved at {output_path}")



### Video
if __name__ == '__main__':
    source = "/Users/chonakyung/project-3/FootTrafficReport/people-detection/data/street.webm"
    tracker = PersonTracker(model_path='/Users/chonakyung/project-3/FootTrafficReport/people-detection/model/yolo11n.pt')
    tracker.detect_and_track(source=source)

### WebCam
#if __name__ == '__main__':
#    source = 0  # Use 0 for the default webcam
#    tracker = PersonTracker(model_path='model/yolo11n.pt')
#    tracker.detect_and_track(source=source)
