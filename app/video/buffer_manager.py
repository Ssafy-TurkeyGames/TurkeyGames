import threading
from collections import deque

class CircularBuffer:
    def __init__(self, max_frames: int):
        self.buffer = deque(maxlen=max_frames)
        self.lock = threading.Lock()
        self.ready_event = threading.Event()  # 버퍼 준비 상태 플래그 추가

    def add_frame(self, frame):
        with self.lock:
            self.buffer.append(frame)
            if len(self.buffer) == self.buffer.maxlen:
                self.ready_event.set()  # 버퍼 가득 찼을 때 신호 발생

    def get_clip(self, pre_seconds: int, post_seconds: int, fps: int): # fps 매개변수 추가
        with self.lock:
            if not self.ready_event.is_set():
                print("⚠️ get_clip 호출 시 버퍼 미준비 상태")
                return []  # 버퍼 미준비 시 빈 리스트 반환

            # FPS를 기반으로 필요한 프레임 수 계산
            num_pre_frames = int(pre_seconds * fps)
            num_post_frames = int(post_seconds * fps)
            total_frames_needed = num_pre_frames + num_post_frames

            # 현재 버퍼에 있는 프레임 수 확인
            current_buffer_size = len(self.buffer)

            if current_buffer_size < num_pre_frames:
                 print(f"⚠️ 버퍼에 트리거 이전({pre_seconds}초) 영상({num_pre_frames} 프레임) 부족. 현재: {current_buffer_size} 프레임")
                 # 필요한 이전 프레임이 부족하면 가능한 만큼만 반환하거나 빈 리스트 반환 (여기서는 가능한 만큼)
                 # return [] # 또는 빈 리스트 반환 선택
                 start_index = 0 # 가능한 가장 오래된 프레임부터 시작
            else:
                # 트리거 시점을 기준으로 필요한 이전 프레임만큼 거슬러 올라간 인덱스 계산
                # 현재 버퍼의 마지막 프레임이 트리거 시점이라고 가정
                start_index = max(0, current_buffer_size - num_pre_frames)


            # 실제 반환할 프레임 슬라이스 추출 (post_seconds는 현재 이후이므로 버퍼의 마지막까지 포함)
            # deque는 음수 인덱싱을 지원하지 않으므로 list로 변환 후 슬라이싱
            buffer_list = list(self.buffer)
            clip_frames = buffer_list[start_index:] # start_index부터 끝까지

            # post_seconds 에 해당하는 프레임이 아직 버퍼에 없을 수 있음 (미래 시점)
            # 이 구현은 트리거 시점까지 버퍼에 쌓인 프레임만 사용함.
            # 실시간으로 post_seconds 만큼 더 기다려서 프레임을 추가하는 로직은 VideoService 등 상위 레벨에서 처리 필요.
            # 현재 로직은 트리거 시점의 버퍼 스냅샷에서 pre_seconds 만큼 과거 프레임 + 트리거 시점 프레임을 반환.
            # post_seconds 개념을 반영하려면, 트리거 후 일정 시간 동안 프레임을 더 수집하는 로직 필요.
            # 여기서는 일단 get_clip이 호출된 시점의 버퍼에서 최선을 다해 반환.

            if len(clip_frames) < total_frames_needed:
                 print(f"⚠️ 요청된 총 프레임 수({total_frames_needed})보다 적은 프레임({len(clip_frames)}) 반환됨.")


            return clip_frames
