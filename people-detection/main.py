from ultralytics import YOLO
from datetime import datetime
import os
import torch

class PersonTracker:
    def __init__(self, model_path, result_dir='results/', tracker_config="bytetrack.yaml", conf=0.5, device=None,
                 iou=0.5, img_size=(720, 1080)):
        # Set device to 'cuda:0' if GPU is available, else use 'cpu'
        self.device = device if device else ('cuda:0' if torch.cuda.is_available() else 'cpu')
        
        self.model = YOLO(model_path)
        self.result_dir = result_dir
        self.tracker_config = tracker_config
        self.conf = conf
        self.iou = iou
        self.img_size = img_size

    def create_result_file(self):
        folder_name = datetime.now().strftime("%Y-%m-%d-%H-%M-%S")
        result_file_path = os.path.join(self.result_dir, folder_name + ".txt")
        os.makedirs(self.result_dir, exist_ok=True)
        with open(result_file_path, 'w') as file:
            file.write(folder_name + "\n")
        return result_file_path

    def detect_and_track(self, source, show=True, logger=None):
        result_file = self.create_result_file()
        person_count = 0
        previous_person_count = 0

        results = self.model.track(
            source, show=show, stream=True, tracker=self.tracker_config, conf=self.conf,
            device=self.device, iou=self.iou, stream_buffer=True, classes=[0], imgsz=self.img_size
        )

        for i, result in enumerate(results):
            boxes = result.boxes
            try:
                id_count = boxes.id.int().tolist()
                max_id = max(id_count)

                if max_id > person_count:
                    person_count = max_id

                if person_count != previous_person_count:
                    previous_person_count = person_count
                    with open(result_file, 'a') as filewrite:
                        filewrite.write(f"Person count: {person_count}\n")

                    if logger:
                        logger.info(f"Person count: {person_count}")

            except Exception as e:
                pass

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
