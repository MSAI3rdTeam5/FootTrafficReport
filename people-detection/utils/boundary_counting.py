import cv2
import time
from deep_sort_realtime.deepsort_tracker import DeepSort

class BoundaryCounting:
    def __init__(self, boundary):
        self.boundary = boundary  # (x1, y1, x2, y2)
        self.count = 0  # 총 유동인구 수 (경계선 안에 들어온 적이 있는 객체)
        self.crossed_ids = set()  # 경계선을 들어왔던 사람들의 ID 저장
        self.time_inside = {}  # 경계선 안에 머문 시간을 추적하기 위한 딕셔너리

        # 배경 차이 추적기 초기화
        self.bg_subtractor = cv2.createBackgroundSubtractorMOG2()

        # DeepSORT 트래커 초기화
        self.tracker = DeepSort()

    def count_objects(self, frame, tracked_objects):
        x1, y1, x2, y2 = self.boundary
        current_time = time.time()

        # 배경 차이로 모션 감지
        fg_mask = self.bg_subtractor.apply(frame)

        # 윤곽선 추출 (모션 감지된 부분)
        contours, _ = cv2.findContours(fg_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        # 객체 탐지 결과
        detections = []
        for contour in contours:
            if cv2.contourArea(contour) > 500:  # 너무 작은 객체는 무시
                (x, y, w, h) = cv2.boundingRect(contour)
                detections.append(([x, y, w, h], 1.0, 'person'))  # 신뢰도는 임의로 설정

        # DeepSORT로 객체 추적
        tracks = self.tracker.update_tracks(detections, frame)

        # 객체 추적 및 경계선 통과 확인
        for track in tracks:
            if track.is_confirmed():
                track_id = track.track_id
                x1, y1, x2, y2 = track.to_ltrb()

                # 중심 좌표 계산
                center_x = (x1 + x2) / 2
                center_y = (y1 + y2) / 2

                # 경계선 통과 확인
                if self.boundary[0] <= center_x <= self.boundary[2] and self.boundary[1] <= center_y <= self.boundary[3]:
                    # 해당 객체가 경계선을 처음 통과한 경우 카운트 증가
                    if track_id not in self.crossed_ids:
                        self.crossed_ids.add(track_id)  # 경계선을 들어온 적이 있는 ID 저장
                        self.count += 1

                    # 객체가 경계선 안에 3분 이상 머무른 경우 처리 (추가 작업)
                    if track_id not in self.time_inside:
                        self.time_inside[track_id] = current_time
                    elif current_time - self.time_inside[track_id] > 180:
                        print(f"Object {track_id} has been inside the boundary for over 3 minutes.")

        return self.count
