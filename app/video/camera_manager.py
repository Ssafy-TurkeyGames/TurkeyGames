# app/video/camera_manager.py
import cv2
import threading
from typing import Dict, List, Callable
import time


class CameraManager:
    """중앙 카메라 관리자"""

    def __init__(self):
        self.cap = None
        self.frame = None
        self.is_running = False
        self.capture_thread = None
        self.subscribers: Dict[str, Callable] = {}
        self.camera_index = None
        self.lock = threading.Lock()

    def start_camera(self, camera_index: int = 0):
        """카메라 시작"""
        if self.is_running:
            return

        self.camera_index = camera_index
        self.cap = cv2.VideoCapture(camera_index)

        if not self.cap.isOpened():
            raise Exception(f"카메라 {camera_index}를 열 수 없습니다")

        self.is_running = True
        self.capture_thread = threading.Thread(target=self._capture_loop)
        self.capture_thread.start()
        print(f"카메라 {camera_index} 시작됨")

    def stop_camera(self):
        """카메라 중지"""
        self.is_running = False
        if self.capture_thread:
            self.capture_thread.join()
        if self.cap:
            self.cap.release()
            self.cap = None
        print("카메라 중지됨")

    def subscribe(self, subscriber_id: str, callback: Callable):
        """프레임 구독"""
        self.subscribers[subscriber_id] = callback
        print(f"{subscriber_id}가 카메라 프레임 구독")

    def unsubscribe(self, subscriber_id: str):
        """구독 해제"""
        if subscriber_id in self.subscribers:
            del self.subscribers[subscriber_id]
            print(f"{subscriber_id}가 구독 해제")

    def get_frame(self):
        """현재 프레임 가져오기"""
        with self.lock:
            if self.frame is not None:
                return self.frame.copy()
        return None

    def _capture_loop(self):
        """백그라운드 캡처 루프"""
        while self.is_running:
            ret, frame = self.cap.read()
            if ret:
                with self.lock:
                    self.frame = frame

                # 모든 구독자에게 프레임 전달
                for subscriber_id, callback in self.subscribers.items():
                    try:
                        callback(frame.copy())
                    except Exception as e:
                        print(f"프레임 전달 오류 ({subscriber_id}): {e}")

            time.sleep(0.01)  # 약간의 딜레이


# 싱글톤 인스턴스
camera_manager = CameraManager()
