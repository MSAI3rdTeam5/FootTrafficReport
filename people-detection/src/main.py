from ultralytics import YOLO
from datetime import datetime
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
 
import os
import cv2
import random
from datetime import datetime
import aiohttp
import numpy as np
 
app = FastAPI()

# 프론트엔드 요청 바디 구조 (API용)
class DetectionRequest(BaseModel):
    cctv_url: str
    cctv_id: str

# Azure API 연결: 이미지 분석을 통해 성별/연령 통계 추출 (현재 DB 전송은 주석 처리)
class AzureAPI:
    def __init__(self):
        load_dotenv()  # .env 파일 로드
        self.url = os.getenv("AZURE_API_URL")
        self.headers = {
            "Prediction-Key": "GEbnMihAUjSdLaPRMRkMyioJBnQLV45TnpV66sh1tD0BxUO9Nkl9JQQJ99BAACYeBjFXJ3w3AAAEACOG0gLQ",
            "Content-Type": "application/octet-stream"
        }
        self.session = None

    async def start(self):
        if not self.session:
            print("[AzureAPI] Starting client session...")
            self.session = aiohttp.ClientSession()

    async def close(self):
        if self.session:
            print("[AzureAPI] Closing client session...")
            await self.session.close()
            self.session = None

    async def analyze_image(self, image_path):
        try:
            await self.start()
            with open(image_path, "rb") as image_file:
                image_data = image_file.read()
            async with self.session.post(self.url, headers=self.headers, data=image_data) as response:
                print(f"[AzureAPI] Response status: {response.status}")
                result = await response.json()
                print(f"[AzureAPI] Result received: {result}")
            return self.normalize_predictions(result.get('predictions', []))
        except Exception as e:
            print(f"[AzureAPI] Error in analyze_image: {e}")
            raise e

    def normalize_predictions(self, predictions):
        gender_preds = {p['tagName']: p['probability'] * 100 for p in predictions if p['tagName'] in ['Male', 'Female']}
        age_preds = {p['tagName']: p['probability'] * 100 for p in predictions if p['tagName'] in ['Age18to60', 'AgeOver60', 'AgeLess18']}
        def normalize_group(group_preds):
            total = sum(group_preds.values())
            return {k: (v/total)*100 for k, v in group_preds.items()} if total > 0 else group_preds
        normalized = {**normalize_group(gender_preds), **normalize_group(age_preds)}
        print(f"[AzureAPI] Normalized predictions: {normalized}")
        return normalized

# 사람 감지, 모자이크 처리 및 (DB 전송 주석 처리) 클래스
class PersonTracker:
    def __init__(self, model_path, result_dir='../outputs/results/', tracker_config="../data/config/botsort.yaml",
                 conf=0.5, device=None, iou=0.5, img_size=(720, 1080), output_dir='../outputs/results_video'):
        self.device = device if device else ('cuda:0' if torch.cuda.is_available() else 'cpu')
        self.model = YOLO(model_path)
        self.result_dir = result_dir
        self.tracker_config = tracker_config
        self.conf = conf
        self.iou = iou
        self.img_size = img_size
        self.output_dir = output_dir
        self.color_map = {}
        self.processed_frames = []  # 모자이크 처리된 프레임 저장 (최종 영상 저장용)
        self.boxes = []             # 각 프레임의 박스 정보 저장
        self.detected_ids = set()
        self.azure_api = AzureAPI()
   
    def is_fully_inside_frame(self, x1, y1, x2, y2, frame_shape):  # 추가된 코드
        h, w, _ = frame_shape
        return x1 >= 0 and y1 >= 0 and x2 <= w and y2 <= h
 

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
                mosaic_scale = 0.1  # 값이 클수록 모자이크 효과 강함
                small_roi = cv2.resize(face_roi, None, fx=mosaic_scale, fy=mosaic_scale, interpolation=cv2.INTER_LINEAR)
                mosaic_roi = cv2.resize(small_roi, (face_roi.shape[1], face_roi.shape[0]), interpolation=cv2.INTER_NEAREST)
                frame[y_min:y_max, x_min:x_max] = mosaic_roi
        return frame
 
    # Detect and track people in the video stream
    # 비디오 스트림에서 사람을 감지하고 추적
    async def detect_and_track(self, source, cctv_id):
        results = self.model.track(
            source, show=False, stream=True, tracker=self.tracker_config, conf=self.conf,
            device=self.device, iou=self.iou, stream_buffer=True, classes=[0], imgsz=self.img_size
        )
 
        await self.azure_api.start()
 
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
 
            if obj_id not in self.detected_ids:
                self.detected_ids.add(obj_id)
                cropped_path = self.save_cropped_person(original_frame, x1, y1, x2, y2, obj_id)
                tasks.append(self.process_person(obj_id, cropped_path, cctv_id))
                new_object_detected = True
 
 
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
        threshold = 0.3  # 30% 기준
        predictions = await self.azure_api.analyze_image(cropped_path)
       
        # 라벨 변환 매핑
        age_mapping = {'AgeLess18': 'young', 'Age18to60': 'adult', 'AgeOver60': 'old'}
        gender_mapping = {'Male': 'male', 'Female': 'female'}
 
        # 성별 예측
        gender_key = max([k for k in predictions if k in gender_mapping and predictions[k] >= threshold],
                        key=predictions.get, default="Unknown")
        gender = gender_mapping.get(gender_key, "Unknown")
 
        # 연령대 예측
        age_key = max([k for k in predictions if k in age_mapping and predictions[k] >= threshold],
                    key=predictions.get, default="Unknown")

        age = age_mapping.get(age_key, "Unknown")
       
        await self.send_data_to_server(obj_id, gender, age, cctv_id)
 
    # Send analysis results to the backend server
    # 분석 결과를 백엔드 서버로 전송
    async def send_data_to_server(self, obj_id, gender, age, cctv_id):
        """백엔드 서버로 분석 결과 전송"""
        url = "https://msteam5iseeu.ddns.net/api/cctv_data"
 
        # 1) FormData 생성
        form = FormData()
        form.add_field("cctv_id", str(cctv_id))
        form.add_field("detected_time", datetime.now().isoformat())
        form.add_field("person_label", str(obj_id))
        form.add_field("gender", gender)
        form.add_field("age", age)
 
        # 2) 이미지 파일이 있다면 파일을 비동기적으로 읽어 추가
        if image_path:
            try:
                async with aiohttp.ClientSession() as session:
                    with open(image_path, "rb") as f:
                        image_data = f.read()
                   
                    form.add_field(
                        "image_file",
                        image_data,
                        filename="myimage.jpg",  # 원하는 파일명
                        content_type="image/jpeg"  # 혹은 "image/png"
                    )
 
                    # 3) multipart/form-data로 POST 요청
                    async with session.post(url, data=form) as response:
                        res_json = await response.json()
                        print(res_json)
            except aiohttp.ClientError as e:
                print(f"[ERROR] Failed to send data: {e}")
            finally:
                await session.close()
 
    # Save cropped image of detected person
    # 감지된 사람의 크롭된 이미지 저장    
    def save_cropped_person(self, frame, x1, y1, x2, y2, obj_id, face_area, save_dir="../outputs/"):
        os.makedirs(save_dir + "cropped_people/", exist_ok=True)
        os.makedirs(save_dir + "full_frames/", exist_ok=True)
       
        # 크롭된 이미지 저장
        cropped_file_name = f"{save_dir}cropped_people/person_{obj_id}.jpg"
        cv2.imwrite(cropped_file_name, frame[y1:y2, x1:x2])
       
        # 풀 프레임 처리
        full_frame = frame.copy()
       
        # 바운딩 박스 외부 블러 처리
        mask = np.zeros(full_frame.shape[:2], dtype=np.uint8)
        cv2.rectangle(mask, (x1, y1), (x2, y2), 255, -1)
        blurred = cv2.GaussianBlur(full_frame, (55, 55), 0)
        full_frame = np.where(mask[:,:,None] == 255, full_frame, blurred)
 
         # 바운딩 박스 그리기
        color = self.generate_color(obj_id)
        cv2.rectangle(full_frame, (x1, y1), (x2, y2), color, 2)
        cv2.putText(full_frame, f"ID: {obj_id}", (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
           
        # 얼굴 블러 처리
        if face_area:
            fx1, fy1, fx2, fy2 = face_area
            face_roi = full_frame[fy1:fy2, fx1:fx2]
            blurred_face = cv2.GaussianBlur(face_roi, (25, 25), 0)
            full_frame[fy1:fy2, fx1:fx2] = blurred_face
       
        # 풀 프레임 저장
        timestamp = datetime.now().strftime("%Y-%m-%d-%H-%M-%S")
        full_frame_file_name = f"{save_dir}full_frames/{timestamp}_ID{obj_id}.jpg"
        cv2.imwrite(full_frame_file_name, full_frame)
       
        return cropped_file_name, full_frame_file_name
 
#-----------------영상 후 블러 처리 코드-----------------
 
    # # Prompt user to save blurred video
    # # 사용자에게 블러 처리된 비디오 저장 여부 묻기
    # def save_blurred_video_prompt(self):
    #     save_input = input("Do you want to save the blurred video? (y/n): ").strip().lower()
    #     if save_input == 'y':
    #         self.save_blurred_video()
    #     elif save_input == 'n':
    #         print("Video not saved.")
    #     else:
    #         print("Invalid input. Please enter 'y' or 'n'.")
    #         self.save_blurred_video_prompt()
 
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
 
    #     out.release()
    #     print(f"Blurred video saved at {output_path}")
 
#-----------------영상 후 블러 처리 코드-----------------
 
'''
Test code 할때는 __name__ == "__main__"으로 실행 (detect_people 함수는 주석 처리)
웹으로 호출해서 실제 cctv에서 실행할때는 detect_people로 실행 (__name__ == "__main__" 주석 처리)
'''
# 웹으로 호출되는 함수
        out.release()
        print(f"Blurred video saved at {output_path}")

    def save_blurred_video_prompt(self):
        # API 모드에서는 자동 저장
        print("[INFO] Blurred video prompt skipped in API mode. Automatically saving blurred video.")
        self.save_blurred_video()

    async def detect_and_track(self, source, cctv_id):
        print(f"[INFO] Starting detection and tracking for source: {source}")
        # 유효한 소스 검사 (테스트 시 로컬 파일 경로여야 합니다)
        if not os.path.exists(source):
            raise ValueError(f"Source '{source}' does not exist. Provide a valid video source.")
        try:
            results = self.model.track(
                source, show=False, stream=True, tracker=self.tracker_config, conf=self.conf,
                device=self.device, iou=self.iou, stream_buffer=True, classes=[0], imgsz=self.img_size
            )
            await self.azure_api.start()
            async for result in results:
                original_frame = result.orig_img.copy()   # 분석용 원본 프레임
                display_frame = original_frame.copy()       # 모자이크 처리 후 디스플레이용
                boxes = result.boxes
                keypoints_data = result.keypoints.data.cpu().numpy()
                tasks = []
                new_object_detected = False
                for box, kpts in zip(boxes, keypoints_data):
                    x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
                    if box.id is None:
                        continue
                    obj_id = int(box.id)
                    color = self.generate_color(obj_id)
                    if obj_id not in self.detected_ids:
                        self.detected_ids.add(obj_id)
                        cropped_path = self.save_cropped_person(original_frame, x1, y1, x2, y2, obj_id)
                        tasks.append(self.process_person(obj_id, cropped_path, cctv_id))
                        new_object_detected = True
                    face_area = self.estimate_face_area(kpts, [x1, y1, x2, y2])
                    if face_area:
                        display_frame = self.apply_face_mosaic(display_frame, face_area)
                    cv2.rectangle(display_frame, (x1, y1), (x2, y2), color, 2)
                    cv2.putText(display_frame, f"ID: {obj_id}", (x1, y1 - 10),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
                if tasks:
                    await asyncio.gather(*tasks)
                if new_object_detected:
                    self.save_full_frame(original_frame, obj_id)
                self.processed_frames.append(display_frame.copy())
                cv2.imshow("Person Tracking", display_frame)
                key = cv2.waitKey(1) & 0xFF
                if key == ord('q'):
                    break
                elif key == ord('s'):
                    while True:
                        if cv2.waitKey(1) & 0xFF == ord('s'):
                            break
        except Exception as e:
            print(f"[ERROR] Error in detect_and_track: {e}")
            raise e
        finally:
            cv2.destroyAllWindows()
            await self.azure_api.close()
            self.save_blurred_video_prompt()

# API 엔드포인트: 프론트엔드에서 /detect 요청 시 동작
@app.post("/detect")
async def detect_people(request: DetectionRequest):
    try:
        print(f"[INFO] Received detection request: {request}")
        tracker = PersonTracker(
            model_path='FootTrafficReport/people-detection/model/yolo11n-pose.pt'
        )
        result = await tracker.detect_and_track(source=request.cctv_url, cctv_id=request.cctv_id)
        return result
   
    except Exception as e:
        print(f"[ERROR] detect_people endpoint error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
 
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8500)
 
 
# #Test할때 하는 작업 (cctv_id는 임의로 설정)
# if __name__ == '__main__':
#     source = "../data/videos/05_seoul.mp4"
#     tracker = PersonTracker(model_path='../model/yolo11n-pose.pt')
#     asyncio.run(tracker.detect_and_track(source=source, cctv_id=1))
