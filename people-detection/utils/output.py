import cv2

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
