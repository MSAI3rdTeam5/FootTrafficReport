from ultralytics import YOLO
from datetime import datetime
import os
import torch
import cv2
import random

class PersonTracker:
    def __init__(self, model_path, result_dir='results/', tracker_config="config/botsort.yaml", conf=0.5, device=None,
                 iou=0.5, img_size=(720, 1080)):
        # Set device to 'cuda:0' if GPU is available, else use 'cpu'
        self.device = device if device else ('cuda:0' if torch.cuda.is_available() else 'cpu')
        
        # YOLO 모델 로드
        self.model = YOLO(model_path)
        self.result_dir = result_dir
        self.tracker_config = tracker_config
        self.conf = conf
        self.iou = iou
        self.img_size = img_size

        # ID별 색상 매핑을 저장할 딕셔너리
        self.color_map = {}

    def create_result_file(self):
        folder_name = datetime.now().strftime("%Y-%m-%d-%H-%M-%S")  # 현재 시간으로 폴더 이름 생성
        result_file_path = os.path.join(self.result_dir, folder_name + ".txt")  # 결과 파일 경로
        os.makedirs(self.result_dir, exist_ok=True)  # 결과 디렉토리가 없으면 생성
        with open(result_file_path, 'w') as file:
            file.write(folder_name + "\n")  # 파일에 현재 폴더 이름을 기록
        return result_file_path

    def generate_color(self, obj_id):
        # 객체 ID에 따라 고유 색상을 생성 (이미 있으면 기존 색상 반환)
        if obj_id not in self.color_map:
            self.color_map[obj_id] = [random.randint(0, 255) for _ in range(3)]  # RGB 값 랜덤 생성
        return self.color_map[obj_id]

    def detect_and_track(self, source, show=True, logger=None):
        result_file = self.create_result_file()  # 결과 파일 생성
        person_count = 0  # 현재 사람 수
        previous_person_count = 0  # 이전 사람 수

        # YOLO 모델을 사용하여 추적 시작
        results = self.model.track(
            source, show=False, stream=True, tracker=self.tracker_config, conf=self.conf,
            device=self.device, iou=self.iou, stream_buffer=True, classes=[0], imgsz=self.img_size
        )

        for i, result in enumerate(results):
            frame = result.orig_img  # 현재 프레임 가져오기
            boxes = result.boxes  # 박스 정보 가져오기

            try:
                id_count = boxes.id.int().tolist()
                for box in boxes:
                    x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())  # 바운딩 박스 좌표
                    obj_id = int(box.id)  # 객체 ID
                    color = self.generate_color(obj_id)  # 객체 ID에 따른 색상 생성
                    
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

### Video
if __name__ == '__main__':
    source = "data/street.webm"
    tracker = PersonTracker(model_path='model/yolo11n.pt')
    tracker.detect_and_track(source=source)

### WebCam
#if __name__ == '__main__':
#    source = 0  # Use 0 for the default webcam
#    tracker = PersonTracker(model_path='model/yolo11n.pt')
#    tracker.detect_and_track(source=source)
