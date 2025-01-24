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

    def draw_boxes(self, frame, bboxes, confidences, tracked_ids):
        # 바운딩 박스를 프레임에 그리기
        for bbox, confidence, obj_id in zip(bboxes, confidences, tracked_ids):
            x1, y1, x2, y2 = map(int, bbox)
            label = f'ID: {obj_id} - {confidence:.2f}'
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
        video_source = 'data\\7eleven.mp4'
    else:
        print("Invalid input. Exiting.")
        return

    detector = PersonDetection()

    # 경계선 설정 (중앙에 70% 크기의 사각형)
    frame_width, frame_height = 640, 480
    boundary_width = int(frame_width * 0.7)
    boundary_height = int(frame_height * 0.7)
    x1 = (frame_width - boundary_width) // 2
    y1 = (frame_height - boundary_height) // 2
    x2 = x1 + boundary_width
    y2 = y1 + boundary_height
    boundary_counter = BoundaryCounting(boundary=(x1, y1, x2, y2))

    # 비디오 캡처
    cap = cv2.VideoCapture(video_source)
    if not cap.isOpened():
        print("Error: Could not open video source.")
        return

    # 추적 ID를 부여할 카운터
    object_id_counter = 0
    tracked_ids = []  # 추적된 객체들의 ID를 저장할 리스트
    tracked_objects = []  # (x, y, id) 형식의 트래킹된 객체 정보

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        # 탐지 수행
        bboxes, confidences = detector.detect(frame)

        # 탐지된 사람들의 좌표와 ID를 추적
        for bbox, confidence in zip(bboxes, confidences):
            x1, y1, x2, y2 = map(int, bbox)
            tracked_objects.append(((x1 + x2) // 2, (y1 + y2) // 2, object_id_counter))  # 중심 좌표와 ID
            tracked_ids.append(object_id_counter)
            object_id_counter += 1  # ID 증가

        # 경계선 통과 객체 카운팅
        total_count = boundary_counter.count_objects(tracked_objects)

        # 결과 시각화
        output_frame = detector.draw_boxes(frame, bboxes, confidences, tracked_ids)

        # 화면 왼쪽 위에 사람 수 표시
        cv2.putText(output_frame, f'People: {total_count["count"]}', (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

        # 결과 프레임 출력
        cv2.imshow("Person Detection", output_frame)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

class VisualizationOutput:
    def __init__(self):
        pass

    def visualize(self, frame, counts, boundary):
        # 카운트 정보 표시
        self.draw_counts(frame, counts)

        # 경계선 그리기
        self.draw_boundary(frame, boundary)

        return frame

    def draw_counts(self, frame, count):
        """화면 왼쪽 상단에 카운트 정보 표시"""
        count_text = f"persons: {count}"
        cv2.putText(frame, count_text, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)


    def draw_boundary(self, frame, boundary):
        """경계선을 프레임에 그리기"""
        x1, y1, x2, y2 = boundary
        cv2.rectangle(frame, (x1, y1), (x2, y2), (255, 0, 0), 2)

if __name__ == "__main__":
    main()
