from ultralytics import YOLO
import cv2
import numpy as np

class PersonDetection:
    def __init__(self, model_path='..\model\yolov8n.pt'):
        # YOLOv8 모델 로드
        self.model = YOLO(model_path)

    def detect(self, frame):
        # YOLOv8로 객체 탐지 수행
        results = self.model(frame)

        # 사람 클래스(0)에 해당하는 탐지 결과만 필터링
        person_detections = results[0].boxes[results[0].boxes.cls == 0]

        # 바운딩 박스와 신뢰도 점수 추출
        bboxes = person_detections.xyxy.cpu().numpy()
        confidences = person_detections.conf.cpu().numpy()

        return bboxes, confidences

    def draw_boxes(self, frame, bboxes, confidences):
        # 바운딩 박스를 프레임에 그리기
        for bbox, confidence in zip(bboxes, confidences):
            x1, y1, x2, y2 = map(int, bbox)
            label = f'Person: {confidence:.2f}'
            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
            cv2.putText(frame, label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
        return frame

class BoundaryCounting:
    def __init__(self, boundary):
        self.boundary = boundary  # 경계선 좌표 (x1, y1, x2, y2)
        self.total_count = 0  # 총 카운트
        self.crossed_ids = set()

    def count_objects(self, tracked_objects):
        for obj in tracked_objects:
            if self.is_crossing_boundary(obj):
                self.update_count(obj)
        return {'count': self.total_count, 'people': len(self.crossed_ids)}

    def is_crossing_boundary(self, obj):
        # obj는 (x, y, id) 형태의 튜플로 가정
        x, y, _ = obj
        x1, y1, x2, y2 = self.boundary
        return (x1 < x < x2 and y1 < y < y2)

    def update_count(self, obj):
        _, _, obj_id = obj  # obj_id 추출
        if obj_id not in self.crossed_ids:
            self.total_count += 1
            self.crossed_ids.add(obj_id)

def main():
    # 사용자에게 입력받기
    input_type = input("Choose input type (1: Webcam, 2: Video file): ").strip()

    # 비디오 소스 설정
    if input_type == '1':
        video_source = 0  # 웹캠
    elif input_type == '2':
        video_source = '..\\data\\day.mp4'
    else:
        print("Invalid input. Exiting.")
        return

    detector = PersonDetection()

    # 비디오 캡처
    cap = cv2.VideoCapture(video_source)
    if not cap.isOpened():
        print("Error: Could not open video source.")
        return

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        # 탐지 수행
        bboxes, confidences = detector.detect(frame)

        # 결과 시각화
        output_frame = detector.draw_boxes(frame, bboxes, confidences)
        cv2.imshow("Person Detection", output_frame)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()
