import cv2
from .tracker import Tracker
from .feature_extractor import FeatureExtractor

class DeepSORT:
    def __init__(self, model_path):
        self.tracker = Tracker()
        self.feature_extractor = FeatureExtractor(model_path)

    def run(self, video_path):
        cap = cv2.VideoCapture(video_path)
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            detections = self._detect(frame)  # YOLOv8로 객체 감지
            features = self._extract_features(frame, detections)  # 특징 벡터 추출
            self.tracker.update(detections, features)  # 트랙 업데이트

            # 프레임에 결과 표시
            self._draw_tracks(frame)
            cv2.imshow("Deep SORT", frame)
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

        cap.release()
        cv2.destroyAllWindows()

    def _detect(self, frame):
        # YOLOv8을 이용해 객체 감지 (예시)
        return [[100, 100, 200, 200, 0.9]]  # [x1, y1, x2, y2, confidence]

    def _extract_features(self, frame, detections):
        features = []
        for det in detections:
            x1, y1, x2, y2, _ = map(int, det)
            cropped = frame[y1:y2, x1:x2]
            pil_image = Image.fromarray(cropped)
            features.append(self.feature_extractor.extract(pil_image))
        return features

    def _draw_tracks(self, frame):
        for track in self.tracker.tracks:
            x1, y1, x2, y2 = map(int, track['bbox'])
            track_id = track['id']
            cv2.rectangle(frame, (x1, y1), (x2, y2), (255, 0, 0), 2)
            cv2.putText(frame, f"ID: {track_id}", (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 0, 0), 2)
