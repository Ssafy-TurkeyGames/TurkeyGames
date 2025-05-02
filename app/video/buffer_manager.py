import threading
from collections import deque

class CircularBuffer:
    def __init__(self, max_frames: int):
        self.buffer = deque(maxlen=max_frames)
        self.lock = threading.Lock()

    def add_frame(self, frame):
        with self.lock:
            self.buffer.append(frame)

    def get_clip(self, pre_seconds: int, post_seconds: int, fps: int): # fps 매개변수 추가
        with self.lock:

            # FPS를 기반으로 필요한 프레임 수 계산
            num_pre_frames = int(pre_seconds * fps)
            num_post_frames = int(post_seconds * fps)
            total_frames_needed = num_pre_frames + num_post_frames

            # FPS를 기반으로 필요한 총 프레임 수 계산
            total_frames_needed = int((pre_seconds + post_seconds) * fps)

            # 현재 버퍼에 있는 프레임 수 확인
            current_buffer_size = len(self.buffer)

            # 필요한 총 프레임 수보다 버퍼에 프레임이 적으면 경고 출력
            if current_buffer_size < total_frames_needed:
                print(f"⚠️ 요청된 총 프레임 수({total_frames_needed})보다 버퍼 내 프레임({current_buffer_size})이 적습니다. 가능한 프레임만 반환합니다.")
                # 이 경우, 버퍼에 있는 모든 프레임을 반환
                start_index = 0
                num_frames_to_get = current_buffer_size
            else:
                # 버퍼의 끝에서부터 필요한 총 프레임 수만큼 가져옴
                start_index = current_buffer_size - total_frames_needed
                num_frames_to_get = total_frames_needed

            # deque는 음수 인덱싱이나 복잡한 슬라이싱이 불편하므로 list로 변환
            buffer_list = list(self.buffer)

            # 계산된 시작 인덱스부터 필요한 개수만큼 프레임 추출
            clip_frames = buffer_list[start_index : start_index + num_frames_to_get]

            # 실제 반환되는 프레임 수 로그 추가 (디버깅용)
            print(f"🎞️ get_clip: 버퍼 크기={current_buffer_size}, 요청 프레임={total_frames_needed}, 반환 프레임={len(clip_frames)}")

            return clip_frames
