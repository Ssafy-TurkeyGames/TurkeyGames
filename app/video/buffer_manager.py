# buffer_manager.py
from collections import deque
import threading
import cv2
import time


class CircularBuffer:
    def __init__(self, config: dict):
        self.max_frames = int(config['buffer']['max_frames'])  # 명시적 형변환
        self.buffer = deque(maxlen=self.max_frames)
        self.lock = threading.Lock()

    def add_frame(self, frame):
        with self.lock:
            self.buffer.append(frame)

    def get_clip(self, pre_sec=10, post_sec=20):
        with self.lock:
            total_frames = int((pre_sec + post_sec) * 30)
            return list(self.buffer)[-total_frames:]
