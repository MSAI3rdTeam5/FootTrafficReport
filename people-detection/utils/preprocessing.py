import cv2

class Preprocessing:
    @staticmethod
    def resize_frame(frame, width, height):
        """YOLO 입력에 맞게 프레임 크기를 조정합니다."""
        return cv2.resize(frame, (width, height))

    @staticmethod
    def normalize_image(image):
        """YOLO 입력을 위해 픽셀 값을 정규화합니다."""
        return image / 255.0
