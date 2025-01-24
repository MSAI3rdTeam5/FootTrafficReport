import cv2
import torch
from deep_sort.deepsort import DeepSORT
from utils.visualization import Visualization
from utils.preprocessing import Preprocessing

class PedestrianCountingSystem:
    def __init__(self, video_path, yolo_model_path, deepsort_model_path, config_path):
        # 모델 경로와 비디오 경로 설정
        self.video_path = video_path
        self.yolo_model_path = yolo_model_path
        self.deepsort_model_path = deepsort_model_path
        self.config_path = config_path

        # YOLO 모델 로드
        self.yolo_model = torch.hub.load('ultralytics/yolov8:v8.0', 'yolov8n', pretrained=False)
        self.yolo_model.load_state_dict(torch.load(self.yolo_model_path))

        # Deep SORT 객체 생성
        self.deepsort = DeepSORT(self.deepsort_model_path, config_path=self.config_path)

        # 시각화 객체 생성
        self.visualizer = Visualization()

    def process_video(self):
        # 비디오 캡처 객체 생성
        cap = cv2.VideoCapture(self.video_path)
        ret, frame = cap.read()
        
        # 프레임 크기 추출
        frame_height, frame_width = frame.shape[:2]
        
        # 카운트 변수
        people_count = 0
        tracker = self.deepsort

        while ret:
            # YOLO로 사람 감지
            detections = self.detect_people(frame)
            
            # Deep SORT로 사람 추적
            tracks = tracker.update(detections)

            # 추적된 객체들에 대한 시각화 (사람 수 카운팅)
            for track in tracks:
                track_id, bbox, class_id = track
                if class_id == 0:  # 사람 클래스
                    people_count += 1  # 카운트 증가

            # 시각화
            self.visualizer.overlay_count(frame, people_count)
            self.visualizer.draw_boundary(frame)

            # 결과 출력
            cv2.imshow("Pedestrian Counting", frame)

            # 종료 조건 (ESC 키)
            if cv2.waitKey(1) & 0xFF == 27:
                break

            # 다음 프레임 읽기
            ret, frame = cap.read()

        cap.release()
        cv2.destroyAllWindows()

    def detect_people(self, frame):
        """YOLO 모델을 사용하여 사람을 감지합니다."""
        # 이미지 전처리
        frame_resized = Preprocessing.resize_frame(frame, 640, 640)
        frame_normalized = Preprocessing.normalize_image(frame_resized)

        # YOLO 감지 실행
        results = self.yolo_model(frame_normalized)
        detections = []

        # 감지된 사람 정보 추출 (bbox와 confidence)
        for result in results.xywh[0]:
            if result[4] > 0.5:  # confidence threshold (50%)
                x1, y1, x2, y2 = result[:4].int().tolist()
                detections.append((x1, y1, x2, y2))

        return detections

if __name__ == "__main__":
    # 시스템 실행 (필요한 경로와 설정 파일)
    video_path = 'data/day.mp4'
    yolo_model_path = 'model/yolov8n.pt'
    deepsort_model_path = 'model/resnet18.pth'
    config_path = 'config/deepsort_config.yaml'

    pedestrian_system = PedestrianCountingSystem(video_path, yolo_model_path, deepsort_model_path, config_path)
    pedestrian_system.process_video()
