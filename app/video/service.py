import cv2
import os
import time
import asyncio
import threading # Added import
from threading import Event
from app.video.buffer_manager import CircularBuffer
from app.video.video_writer import VideoSaver
from .trigger_detector import TriggerDetector
from app.config import load_config
os.environ["OPENCV_VIDEOIO_MSMF_ENABLE_HW_TRANSFORMS"] = "0"


class VideoService:

    def __init__(self):
        self.config = self._validate_config(load_config('video_config.yaml'))
        self.is_buffer_ready = False
        self.is_saving = False  # ✅ is_saving 초기화 추가
        self.buffer = CircularBuffer(
            max_frames=self.config['buffer']['max_frames'],
            frame_width=self.config['camera']['width'],
            frame_height=self.config['camera']['height']
        )
        self.saver = VideoSaver(
            output_dir=self.config['output']['dir'],
            codec=self.config['video']['codec'],
            fps=self.config['video']['fps']
        )
        # self._init_components()
        self.camera_thread = None
        self.stop_event = Event() # 스레드 종료 이벤트
        self.camera_ready_event = Event() # ✅ 카메라 준비 완료 이벤트 추가
        self._start_camera_thread() # ✅ __init__에서 카메라 스레드 시작

    def _validate_config(self, config: dict) -> dict:
        """필수 설정 값 검증"""
        required_keys = {
            'camera': ['index', 'width', 'height'],
            'buffer': ['pre_seconds', 'post_seconds', 'max_frames'],
            'video': ['codec', 'fps'],
            'output': ['dir']
        }

        for section, keys in required_keys.items():
            if section not in config:
                raise ValueError(f"Config 섹션 '{section}' 누락")
            for key in keys:
                if key not in config[section]:
                    raise ValueError(f"Config 키 '{section}.{key}' 누락")

        return config

    def initialize(self):
        """모듈 초기화"""
        self.saver = VideoSaver(self.config)
        self.trigger_detector = TriggerDetector(self.config)
        # __init__에서 이미 초기화되므로 중복 제거 또는 역할 명확화 필요
        # 여기서는 카메라 스레드 시작만 담당하도록 가정
        if self.camera_thread is None or not self.camera_thread.is_alive():
            self._start_camera_thread()
        else:
            print("ℹ️ 카메라 스레드가 이미 실행 중입니다.")


    def _start_camera_thread(self):
        """카메라 캡처 스레드 시작"""
        if self.camera_thread is None or not self.camera_thread.is_alive():
            self.stop_event.clear()
            self.camera_thread = threading.Thread(target=self._capture_frames, daemon=True)
            self.camera_thread.start()
            print("🚀 카메라 캡처 스레드 시작됨")
        else:
             print("ℹ️ 카메라 스레드가 이미 실행 중입니다.")


    def _capture_frames(self):
        """프레임 캡처 로직 (개선된 루프 및 재연결)"""
        cap = None
        while not self.stop_event.is_set(): # ✅ 종료 이벤트 확인
            if cap is None or not cap.isOpened():
                print(f"🔌 카메라 {self.config['camera']['index']} 연결 시도...")
                cap = cv2.VideoCapture(self.config['camera']['index'])
                if not cap.isOpened():
                    print(f"❌ 카메라 {self.config['camera']['index']} 연결 실패. 대체 장치 검색...")
                    original_index = self.config['camera']['index']
                    found_alt = False
                    for idx in range(5):
                        if idx == original_index: continue # 원래 인덱스는 건너뛰기
                        temp_cap = cv2.VideoCapture(idx)
                        if temp_cap.isOpened():
                            print(f"✅ 대체 카메라 {idx} 연결 성공")
                            self.config['camera']['index'] = idx # 설정 업데이트 (주의: 임시적 변경일 수 있음)
                            cap = temp_cap
                            found_alt = True
                            break
                        temp_cap.release()

                    if not found_alt:
                        print(f"❌ 사용 가능한 카메라를 찾지 못했습니다. 3초 후 재시도...")
                        self.is_buffer_ready = False
                        if cap: cap.release()
                        cap = None
                        time.sleep(3)
                        continue # 다음 연결 시도

                # 카메라 성공적으로 열렸을 때 설정 적용
                cap.set(cv2.CAP_PROP_FRAME_WIDTH, self.config['camera']['width'])
                cap.set(cv2.CAP_PROP_FRAME_HEIGHT, self.config['camera']['height'])
                print(f"✅ 카메라 {self.config['camera']['index']} 연결 성공 및 설정 완료.")
                self.is_buffer_ready = True
                self.camera_ready_event.set() # ✅ 카메라 준비 완료 신호 보내기

            # 프레임 읽기
            ret, frame = cap.read()
            if ret:
                if not self.is_buffer_ready: # 연결 끊겼다가 다시 성공한 경우
                    print("✅ 카메라 재연결 성공. 프레임 수신 시작.")
                    self.is_buffer_ready = True
                self.buffer.add_frame(frame)
                # print(f"🖼️ 프레임 수신: {time.time()}") # 디버깅용 로그
            else:
                print("⚠️ 카메라 프레임 읽기 실패 또는 연결 끊김. 재연결 시도...")
                self.is_buffer_ready = False
                self.camera_ready_event.clear() # ✅ 카메라 준비 안됨 신호
                if cap: cap.release()
                cap = None
                time.sleep(1) # 대기 후 재연결 시도

        # 스레드 종료 시 자원 해제
        if cap:
            cap.release()
        print("🛑 카메라 캡처 스레드 종료됨")
        self.is_buffer_ready = False
        self.camera_ready_event.clear() # ✅ 스레드 종료 시 카메라 준비 안됨 신호


    async def on_trigger(self):
        """트리거 콜백 핸들러 - post_seconds 만큼 지연 후 저장 시작"""
        # 카메라 준비 완료 이벤트를 최대 1초간 기다림
        if not self.camera_ready_event.wait(timeout=1.0):
            print("⚠️ 트리거 발생했으나 카메라가 아직 준비되지 않음 (1초 대기 초과)")
            return

        if self.is_saving:
            print("⚠️ 트리거 발생했으나 현재 다른 클립 저장 중")
            return

        self.is_saving = True
        post_seconds = self.config['buffer']['post_seconds']
        print(f"🎥 트리거 감지! {post_seconds}초 동안 추가 녹화 후 저장 예정...")

        # post_seconds 후에 _finalize_and_save_clip 메소드 실행 예약
        # 이 시간 동안 _capture_frames 스레드는 계속 버퍼에 프레임을 추가합니다.
        asyncio.create_task(self._delayed_finalize_and_save_clip(post_seconds))

    async def _delayed_finalize_and_save_clip(self, delay):
        await asyncio.sleep(delay)
        await self._finalize_and_save_clip()

    async def _finalize_and_save_clip(self):
        """post_seconds 경과 후 실제 클립 생성 및 저장 로직"""
        print(f"⏰ {self.config['buffer']['post_seconds']}초 경과. 클립 생성 및 저장 실행...")
        try:
            pre_seconds = self.config['buffer']['pre_seconds']
            # post_seconds 값은 get_clip에서 직접 사용되진 않지만, 로직상 필요했던 시간임
            post_seconds = self.config['buffer']['post_seconds']
            fps = self.config['video']['fps']

            # Now buffer contains frames from pre_seconds before trigger + post_seconds after trigger
            clip_frames = self.buffer.get_clip(
                pre_seconds=pre_seconds,
                post_seconds=post_seconds,
                fps=fps
            )

            if clip_frames:
                print(f"🎞️ Clip frames ({len(clip_frames)} frames) retrieval complete. Starting save...")
                resolution = (
                    int(self.config['camera']['width']),
                    int(self.config['camera']['height'])
                )
                self.saver.save_clip(clip_frames, resolution)
                print(f"✅ 클립 저장 완료.")
            else:
                print("⚠️ Clip creation failed (empty list returned from get_clip. Insufficient frames in buffer or other issue occurred)")
        except Exception as e:
            print(f"❌ Error occurred during clip save: {e}")
        finally:
            # Release flag after save attempt is complete
            self.is_saving = False
            print("🔄 Save state released.")


    def stop(self):
        """서비스 중지 (카메라 스레드 종료)"""
        print("⏳ 서비스 중지 요청...")
        self.stop_event.set() # 스레드 종료 신호
        if self.camera_thread and self.camera_thread.is_alive():
            print("🕰️ 카메라 스레드 종료 대기...")
            self.camera_thread.join(timeout=5) # 스레드가 종료될 때까지 최대 5초 대기
            if self.camera_thread.is_alive():
                print("⚠️ 카메라 스레드가 5초 내에 종료되지 않았습니다.")
        print("⏹️ 서비스 중지 완료.")
