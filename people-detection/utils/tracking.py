import cv2
from deep_sort_realtime.deepsort_tracker import DeepSort

class TrackedObject:
    def __init__(self, track_id, bbox, confidence=None, class_name=None, timestamp=None):
        self.track_id = track_id  # 객체 ID
        self.bbox = bbox  # 바운딩 박스 (ltrb: left, top, right, bottom)
        self.confidence = confidence  # YOLO 모델의 신뢰도
        self.class_name = class_name  # 클래스 이름 (예: 'person')
        self.timestamp = timestamp  # 객체가 생성된 시점
    
    def get_center(self):
        """바운딩 박스의 중심 좌표를 반환"""
        print(f"bbox: {self.bbox}")  # Debug print
        if len(self.bbox) != 4:
            raise ValueError(f"Expected bbox to have 4 elements, but got {len(self.bbox)}: {self.bbox}")
        left, top, right, bottom = self.bbox
        center_x = (left + right) / 2
        center_y = (top + bottom) / 2
        return center_x, center_y

class ObjectTracking:
    def __init__(self):
        self.tracker = DeepSort(max_age=30, nms_max_overlap=0.5) # 프레임 수 30, 동일 객체 판달할 NMS 겹침 비율 0.5
        self.track_centers = {}  # track_id별 이전 중심점을 저장하는 딕셔너리

    def track(self, frame, detections):
        # detections 형식 변환
        # YOLOv8 출력을 DeepSORT 입력 형식으로 변환
        deepsort_detections = []
        for bbox, conf in zip(detections[0], detections[1]):
            print(f"bbox: {bbox}, conf: {conf}")  # Debug print
            if len(bbox) != 4:
                raise ValueError(f"Expected bbox to have 4 elements, but got {len(bbox)}: {bbox}")
            x1, y1, x2, y2 = bbox
            w, h = x2 - x1, y2 - y1
            deepsort_detections.append(([x1, y1, w, h], conf, 'person'))

        # DeepSORT 업데이트
        tracks = self.tracker.update_tracks(deepsort_detections, frame=frame)

        # 트래킹 결과 처리
        tracked_objects = []
        for track in tracks:
            if not track.is_confirmed():
                continue
            track_id = track.track_id
            ltrb = track.to_ltrb()  # (x1, y1, x2, y2)

            # 중심점 계산
            center_x = (ltrb[0] + ltrb[2]) / 2
            center_y = (ltrb[1] + ltrb[3]) / 2
            center = (center_x, center_y)

            # 이전 중심점 저장
            prev_center = self.track_centers.get(track_id, center)  # 이전에 추적한 적이 없으면 현재 중심점으로 설정
            self.track_centers[track_id] = center

            # TrackedObject 생성
            tracked_object = TrackedObject(track_id, ltrb, class_name='person')
            tracked_objects.append(tracked_object)

        return tracked_objects