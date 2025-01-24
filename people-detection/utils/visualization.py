import cv2

class Visualization:
    @staticmethod
    def draw_boundary(frame, boundary, color=(0, 255, 0), thickness=2):
        """프레임 위에 경계 상자를 그립니다."""
        x1, y1, x2, y2 = boundary
        cv2.rectangle(frame, (x1, y1), (x2, y2), color, thickness)

    @staticmethod
    def draw_text(frame, text, position, font_scale=0.5, color=(255, 255, 255), thickness=1):
        """프레임 위에 텍스트를 표시합니다."""
        cv2.putText(frame, text, position, cv2.FONT_HERSHEY)
