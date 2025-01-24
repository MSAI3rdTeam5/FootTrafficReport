from ultralytics import YOLO
from datetime import datetime
import os
import torch
import cv2

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

    def create_result_file(self):
        folder_name = datetime.now().strftime("%Y-%m-%d-%H-%M-%S")  # 현재 시간으로 폴더 이름 생성
        result_file_path = os.path.join(self.result_dir, folder_name + ".txt")  # 결과 파일 경로
        os.makedirs(self.result_dir, exist_ok=True)  # 결과 디렉토리가 없으면 생성
        with open(result_file_path, 'w') as file:
            file.write(folder_name + "\n")  # 파일에 현재 폴더 이름을 기록
        return result_file_path

    def detect_and_track(self, source, show=True, logger=None):
        # 객체 탐지 및 추적을 수행하는 함수
        result_file = self.create_result_file()  # 결과 파일 생성
        person_count = 0  # 현재 사람 수
        previous_person_count = 0  # 이전 사람 수

        # YOLO 모델을 사용하여 추적 시작
        results = self.model.track(
            source, show=show, stream=True, tracker=self.tracker_config, conf=self.conf,
            device=self.device, iou=self.iou, stream_buffer=True, classes=[0], imgsz=self.img_size
        )

        for i, result in enumerate(results):
            boxes = result.boxes
            try:
                id_count = boxes.id.int().tolist()
                max_id = max(id_count)

                # 새로운 사람이 탐지되었을 때 사람 수 갱신
                if max_id > person_count:
                    person_count = max_id

                # 사람이 추가될 때마다 결과 파일에 기록
                if person_count != previous_person_count:
                    previous_person_count = person_count
                    with open(result_file, 'a') as filewrite:
                        filewrite.write(f"Person count: {person_count}\n")

                    if logger:
                        logger.info(f"Person count: {person_count}")

            except Exception as e:
                pass

            key = cv2.waitKey(1) & 0xFF
            if key == ord('q'):  # 'q'를 누르면 프로그램 종료
                print("Exiting...")
                break
            elif key == ord('s'):  # 's'를 누르면 영상 정지
                print("Pausing video...")
                # 추적 중지 및 영상 정지
                while True:
                    # 계속해서 's'를 눌러서 정지 상태를 유지
                    key = cv2.waitKey(1) & 0xFF
                    if key == ord('s'):  # 's'를 다시 눌러 재개
                        print("Resuming video...")
                        break
                    elif key == ord('q'):  # 'q'를 누르면 종료
                        print("Exiting...")
                        return
                    
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
