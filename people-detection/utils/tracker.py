import cv2
import numpy as np

class SimpleTracker:
    def __init__(self):
        self.template = None
        self.roi = None
        self.prev_gray = None
        self.points = None
        
    def init(self, frame, bbox):
        x, y, w, h = bbox
        self.roi = (x, y, w, h)
        
        roi_gray = cv2.cvtColor(frame[y:y+h, x:x+w], cv2.COLOR_BGR2GRAY)
        self.template = cv2.resize(roi_gray, (64, 64))
        
        self.points = cv2.goodFeaturesToTrack(
            roi_gray, 
            maxCorners=50,
            qualityLevel=0.01,
            minDistance=5,
            blockSize=3
        )
        
        if self.points is not None:
            self.points = self.points + np.float32([x, y])
        
        self.prev_gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
    def update(self, frame):
        if self.points is None or len(self.points) < 10:
            return None
            
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        # Lucas-Kanade 광학 흐름으로 특징점 추적
        new_points, status, _ = cv2.calcOpticalFlowPyrLK(
            self.prev_gray, 
            gray, 
            self.points, 
            None,
            winSize=(15, 15),
            maxLevel=2
        )
        
        good_points = new_points[status == 1]
        if len(good_points) < 10:
            return None
            
        median_x = np.median(good_points[:, 0] - self.points[status == 1][:, 0])
        median_y = np.median(good_points[:, 1] - self.points[status == 1][:, 1])
        
        x, y, w, h = self.roi
        x = int(x + median_x)
        y = int(y + median_y)
        
        x = max(0, min(x, frame.shape[1] - w))
        y = max(0, min(y, frame.shape[0] - h))
        
        self.roi = (x, y, w, h)
        self.points = good_points.reshape(-1, 1, 2)
        self.prev_gray = gray
        
        roi_gray = cv2.resize(gray[y:y+h, x:x+w], (64, 64))
        match_val = cv2.matchTemplate(
            roi_gray, 
            self.template, 
            cv2.TM_CCOEFF_NORMED
        )[0][0]
        
        if match_val < 0.5:
            return None
            
        return self.roi