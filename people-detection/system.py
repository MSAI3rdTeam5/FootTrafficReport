import cv2
import time
from utils.data_preparation import DataPreparation
from utils.person_detection import PersonDetection
from utils.tracking import ObjectTracking
from utils.boundary_counting import BoundaryCounting
from utils.output import VisualizationOutput

class System:
    def __init__(self, video_source):
        self.video_source = video_source
        self.data_prep = DataPreparation()
        self.person_detector = PersonDetection()
        self.object_tracker = ObjectTracking()
        self.visualizer = VisualizationOutput()
        self.time_inside = {}  # 객체가 경계선 안에 머문 시간을 추적하기 위한 딕셔너리

        self.boundary_counter = None  # 경계선 설정은 첫 프레임에서 진행
        self.frame_width = 0
        self.frame_height = 0

    def initialize_boundary(self, frame):
        """첫 프레임으로 경계선 설정"""
        self.frame_height, self.frame_width = frame.shape[:2]
        boundary_width = int(self.frame_width * 0.7)  # 화면 너비의 70%
        boundary_height = int(self.frame_height * 0.7)  # 화면 높이의 70%
        x1 = (self.frame_width - boundary_width) // 2
        y1 = (self.frame_height - boundary_height) // 2
        x2 = x1 + boundary_width
        y2 = y1 + boundary_height
        self.boundary_counter = BoundaryCounting(boundary=(x1, y1, x2, y2))

    def process_frame(self, frame):
        if self.boundary_counter is None:
            self.initialize_boundary(frame)

        # 1. 데이터 준비
        processed_frame = self.data_prep.preprocess_frame(frame)

        # 2. 사람 탐지
        detections = self.person_detector.detect(frame)

        # 3. 객체 트래킹
        tracked_objects = self.object_tracker.track(frame, detections)

        # 4. 경계선 기반 유동인구 수 카운트
        total_people = self.boundary_counter.count_objects(tracked_objects)

        # 5. 결과 시각화
        visualized_frame = self.visualizer.visualize(frame, total_people, self.boundary_counter.boundary)

        return visualized_frame, total_people


    def run(self):
        cap = cv2.VideoCapture(self.video_source)

        while cap.isOpened():
            ret, frame = cap.read()

            if not ret:
                break

            # 프레임 처리
            visualized_frame, total_people = self.process_frame(frame)

            # 프레임 출력
            cv2.imshow("Processed Video", visualized_frame)

            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

        cap.release()
        cv2.destroyAllWindows()

if __name__ == '__main__':
    system = System('data/7eleven.mp4')  # 테스트할 비디오 파일 경로
    system.run()
