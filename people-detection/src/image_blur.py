import cv2
import os
import numpy as np
from ultralytics import YOLO
from datetime import datetime

class ObjectDetectionWithFaceBlur:
    def __init__(self, model_path, conf=0.5, iou=0.5, img_size=(1280, 720), output_dir='../outputs'):
        self.model = YOLO(model_path)  # YOLO 모델 로드
        self.conf = conf
        self.iou = iou
        self.img_size = img_size
        self.output_dir = output_dir

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

        if len(valid_points) >= 4:
            x_min, y_min = np.maximum(np.min(valid_points, axis=0).astype(int), [box[0], box[1]])
            x_max, y_max = np.minimum(np.max(valid_points, axis=0).astype(int), [box[2], box[3]])

            # 얼굴 영역 약간 확장 (bounding box 내에서만)
            width = (x_max - x_min) * 20
            height = (y_max - y_min) * 20
            x_min = max(box[0], x_min - int(width * 0.1))
            y_min = max(box[1], y_min - int(height * 0.1))
            x_max = min(box[2], x_max + int(width * 0.1))
            y_max = min(box[3], y_max + int(height * 0.1))

            return x_min, y_min, x_max, y_max

        return None

    def apply_face_blur(self, frame, face_area):
        """
        얼굴 영역에 블러를 적용합니다.
        """
        if face_area is not None:
            x_min, y_min, x_max, y_max = face_area

            if x_max > x_min and y_max > y_min:
                # 얼굴 영역 추출 및 블러 처리
                face_roi = frame[y_min:y_max, x_min:x_max]
                blurred_roi = cv2.GaussianBlur(face_roi, (25, 25), 0)
                frame[y_min:y_max, x_min:x_max] = blurred_roi

        return frame

    def process_image(self, image_path):
        # 이미지 로드
        image = cv2.imread(image_path)
        if image is None:
            print(f"Error: Unable to load image from {image_path}")
            return

        # YOLO 모델 실행 (객체 탐지)
        results = self.model(image, conf=self.conf, iou=self.iou)

        # 바운딩 박스 및 키포인트 데이터 추출 및 시각화
        for result in results:
            boxes_data = result.boxes.data.cpu().numpy()  # 바운딩 박스 데이터 가져오기
            keypoints_data = result.keypoints.data.cpu().numpy() if result.keypoints is not None else []

            for box_data, keypoints in zip(boxes_data, keypoints_data):
                if len(box_data) >= 6:  
                    box = [int(box_data[0]), int(box_data[1]), int(box_data[2]), int(box_data[3])]

                    # 얼굴 영역 추정 및 블러 처리
                    face_area = self.estimate_face_area(keypoints=keypoints[:5], box=box)
                    image = self.apply_face_blur(frame=image, face_area=face_area)

        # 결과 저장 및 표시
        os.makedirs(self.output_dir, exist_ok=True)
        output_filename = datetime.now().strftime("%Y-%m-%d-%H-%M-%S") + "_blurred.jpg"
        output_path = os.path.join(self.output_dir, output_filename)

        cv2.imwrite(output_path, image)
        print(f"Processed image saved at {output_path}")

        cv2.imshow("Face Blurred Person Detection", image)
        cv2.waitKey(0)
        cv2.destroyAllWindows()

# 실행 예제
if __name__ == "__main__":
    model_path = "../model/yolo11n-pose.pt"  # YOLO 모델 경로
    input_image = "../data/videos/02_도로.png"  # 입력 이미지 경로

    detector = ObjectDetectionWithFaceBlur(model_path=model_path)
    detector.process_image(input_image)
