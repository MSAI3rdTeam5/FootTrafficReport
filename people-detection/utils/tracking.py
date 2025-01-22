import cv2
from deep_sort_realtime.deepsort_tracker import DeepSort

class TrackedObject:
    def __init__(self, ltrb, track_id, prev_center, center):
        self.ltrb = ltrb  # (x1, y1, x2, y2)
        self.track_id = track_id
        self.prev_center = prev_center  # 이전 중심점 (x, y)
        self.center = center  # 현재 중심점 (x, y)

class ObjectTracking:
    def __init__(self):
        self.tracker = DeepSort(max_age=5)
        self.track_centers = {}  # track_id별 이전 중심점을 저장하는 딕셔너리

    def track(self, frame, detections):
        # detections 형식 변환
        # YOLOv8 출력을 DeepSORT 입력 형식으로 변환
        deepsort_detections = []
        for bbox, conf in zip(detections[0], detections[1]):
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

            # 이전 중심점 갱신
            self.track_centers[track_id] = center

            tracked_objects.append(TrackedObject(ltrb, track_id, prev_center, center))

        return tracked_objects
