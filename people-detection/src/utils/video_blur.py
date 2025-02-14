import cv2
import os
import asyncio
from ultralytics import YOLO
import torch
import random
from datetime import datetime
import numpy as np


class PersonTracker:
    def __init__(self, model_path, result_dir='../outputs/results/', tracker_config="../data/config/botsort.yaml", conf=0.5, device=None,
                 iou=0.5, img_size= (1280, 720), output_dir='../outputs/results_video'):
        self.device = device if device else ('cuda:0' if torch.cuda.is_available() else 'cpu')
        self.model = YOLO(model_path)
        self.result_dir = result_dir
        self.tracker_config = tracker_config
        self.conf = conf
        self.iou = iou
        self.img_size = img_size
        self.output_dir = output_dir
        self.color_map = {}
        self.detected_ids = set()
    
    def estimate_face_area(self, keypoints, box):
        """
        키포인트를 기반으로 얼굴 영역을 추정합니다.
        """
        face_keypoints_indices = [0, 1, 2, 3, 4]  # 코, 양쪽 눈, 양쪽 귀
        face_keypoints = keypoints[face_keypoints_indices]

        if face_keypoints.shape[1] == 2:  # x, y 좌표만 있는 경우
            valid_points = face_keypoints
        elif face_keypoints.shape[1] == 3:  # x, y, confidence 값이 있는 경우
            valid_points = face_keypoints[face_keypoints[:, 2] > 0.3][:, :2]  # 신뢰도 임계값 낮춤
        else:
            return None

        if len(valid_points) >= 4: #뒷통수는 blur 처리 되지 않도록
            x_min, y_min = np.maximum(np.min(valid_points, axis=0).astype(int), [box[0], box[1]])
            x_max, y_max = np.minimum(np.max(valid_points, axis=0).astype(int), [box[2], box[3]])

            # 얼굴 영역 확장 (bounding box 내에서만)
            width = (x_max - x_min) * 20
            height = (y_max - y_min) * 10
            x_min = max(box[0], x_min - int(width * 0.1))
            y_min = max(box[1], y_min - int(height * 0.1))
            x_max = min(box[2], x_max + int(width * 0.1))
            y_max = min(box[3], y_max + int(height * 0.1))

            return x_min, y_min, x_max, y_max

        return None

    def apply_face_blur(self, frame, face_area):
        if face_area is not None:
            x_min, y_min, x_max, y_max = face_area

            if x_max > x_min and y_max > y_min:
                # 얼굴 영역 추출
                face_roi = frame[y_min:y_max, x_min:x_max]
                # 블러 처리
                blurred_roi = cv2.GaussianBlur(face_roi, (25, 25), 0)
                # 원본 프레임에 블러 처리된 영역 삽입
                frame[y_min:y_max, x_min:x_max] = blurred_roi
        return frame
    
    async def detect_and_track(self, source, cctv_id):
        results = self.model.track(
            source, show=False, stream=True, tracker=self.tracker_config, conf=self.conf,
            device=self.device, iou=self.iou, stream_buffer=True, classes=[0], imgsz=self.img_size, save=True, vid_stride=2
        )

        os.makedirs(self.output_dir, exist_ok=True)
        video_name = datetime.now().strftime("%Y-%m-%d-%H-%M-%S") + "_face_blurred.webm"
        output_path = os.path.join(self.output_dir, video_name)

        cap = cv2.VideoCapture(source)
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        fps = int(cap.get(cv2.CAP_PROP_FPS))
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))  # Total number of frames in the video
        cap.release()

        # Calculate frame skipping interval to process approximately 100 frames
        skip_interval = max(1, total_frames // 200)  # Added logic to determine how many frames to skip

        fourcc = cv2.VideoWriter_fourcc(*'VP80')
        out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))

        frame_count = 0  # Initialize frame counter

        for result in results:
            # Skip frames that are not part of the interval
            if frame_count % skip_interval != 0:  # Added condition to skip frames
                frame_count += 1
                continue

            frame = result.orig_img.copy()
            boxes_data = result.boxes.data.cpu().numpy()
            keypoints_data = result.keypoints.data.cpu().numpy()

            for box_data, kpts in zip(boxes_data, keypoints_data):
                if len(box_data) == 7:  # [x1, y1, x2, y2, ID, confidence, class]
                    x1, y1, x2, y2, obj_id, conf, cls = box_data
                    box = [int(x1), int(y1), int(x2), int(y2)]

                    # Estimate and blur face area
                    face_area = self.estimate_face_area(kpts, box)
                    if face_area:
                        frame = self.apply_face_blur(frame, face_area)

            out.write(frame)  # Save frame to video file

            cv2.imshow("Face Blurred Person Tracking", frame)

            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

            frame_count += 1  # Increment frame counter after processing

        # Release video writer and close windows
        out.release()
        cv2.destroyAllWindows()
        print(f"Face blurred video saved at {output_path}")

if __name__ == '__main__':
    source = "../data/videos/02_도로.mp4"
    tracker = PersonTracker(model_path='../model/yolo11n-pose.pt')
    asyncio.run(tracker.detect_and_track(source=source, cctv_id=1))