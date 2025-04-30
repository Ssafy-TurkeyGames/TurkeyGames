import cv2
import threading
import time
from .buffer_manager import CircularBuffer
from .video_writer import VideoSaver
from .trigger_detector import TriggerDetector
from app.config import load_config

class VideoService:
    def __init__(self):
        # video_config.yaml 전용 설정 로드
        self.config = load_config('video_config.yaml')
        self.buffer = CircularBuffer(self.config)
        self.saver = VideoSaver(self.config)
        self.trigger_detector = None
        self.is_saving = False
        self.is_buffer_ready = False

    def initialize(self):
        """모듈 초기화"""
        self.saver = VideoSaver(self.config)
        self.trigger_detector = TriggerDetector(self.config)
        self.trigger_detector.set_callback(self.on_trigger)
        self._start_camera_thread()

    def _start_camera_thread(self):
        """카메라 캡처 스레드 시작"""
        threading.Thread(target=self._capture_frames, daemon=True).start()

    def _capture_frames(self):
        """프레임 캡처 로직"""
        while True:
            cap = cv2.VideoCapture(self.config['camera']['index'])
            if not cap.isOpened():
                print("카메라 연결 실패! 3초 후 재시도...")
                time.sleep(3)
                continue

            cap.set(cv2.CAP_PROP_FRAME_WIDTH, self.config['camera']['width'])
            cap.set(cv2.CAP_PROP_FRAME_HEIGHT, self.config['camera']['height'])
            self.buffer = CircularBuffer(self.config)
            self.is_buffer_ready = True

            while True:
                ret, frame = cap.read()
                if ret:
                    self.buffer.add_frame(frame)
                else:
                    print("카메라 연결 끊김. 재연결 시도...")
                    cap.release()
                    self.is_buffer_ready = False
                    break

    def on_trigger(self):
        """트리거 콜백 핸들러"""
        if not self.is_buffer_ready or self.is_saving:
            return

        self.is_saving = True
        try:
            print("🎥 트리거 감지! 영상 저장 시작...")
            clip = self.buffer.get_clip(
                self.config['buffer']['pre_seconds'],
                self.config['buffer']['post_seconds']
            )
            if clip:
                resolution = (
                    self.config['camera']['width'],
                    self.config['camera']['height']
                )
                self.saver.save_clip(clip, resolution)
        finally:
            self.is_saving = False
