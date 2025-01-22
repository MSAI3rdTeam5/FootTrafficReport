import cv2
import numpy as np

class DataPreparation:
    def __init__(self, target_size=(640, 480)):
        self.target_size = target_size

    def preprocess_frame(self, frame):
        # 프레임 크기 조정
        resized_frame = cv2.resize(frame, self.target_size)
        # 노이즈 제거
        denoised_frame = cv2.GaussianBlur(resized_frame, (5, 5), 0)
        return denoised_frame
