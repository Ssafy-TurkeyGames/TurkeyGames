import threading
import mmap
import os
import cv2
import numpy as np
import collections
import wave

class CircularBuffer:
    def __init__(self, max_frames: int, frame_width: int, frame_height: int):
        self.max_frames = max_frames
        self.frame_width = frame_width
        self.frame_height = frame_height
        self.frame_size = frame_width * frame_height * 3  
        self.buffer_size = self.max_frames * self.frame_size
        self.file_path = "video_buffer.mmap"  
        
        # 파일 생성 또는 열기
        self.fd = os.open(self.file_path, os.O_RDWR | os.O_CREAT)
        
        # 파일 크기를 버퍼 크기로 조정
        os.ftruncate(self.fd, self.buffer_size)
        
        # 파일을 메모리에 매핑
        self.mmap = mmap.mmap(self.fd, self.buffer_size, access=mmap.ACCESS_WRITE)
        
        self.lock = threading.Lock()
        self.head = 0  # 다음에 쓸 프레임의 인덱스

    def add_frame(self, frame):
        with self.lock:
            # 필요한 경우 프레임 크기 조정
            if frame.shape[1] != self.frame_width or frame.shape[0] != self.frame_height:
                frame = cv2.resize(frame, (self.frame_width, self.frame_height))
            
            # 프레임 쓰기를 위한 오프셋 계산
            offset = (self.head % self.max_frames) * self.frame_size
            
            # 프레임을 평탄화하여 mmap에 쓰기
            self.mmap[offset:offset + self.frame_size] = frame.flatten().tobytes()
            
            self.head += 1

    def get_clip(self, pre_seconds: int, post_seconds: int, fps: int):
        with self.lock:
            num_pre_frames = int(pre_seconds * fps)
            num_post_frames = int(post_seconds * fps)
            total_frames_needed = num_pre_frames + num_post_frames
            
            current_buffer_size = min(self.head, self.max_frames)
            
            if current_buffer_size < total_frames_needed:
                print(f"⚠️ 요청된 총 프레임 수({total_frames_needed})보다 버퍼 내 프레임({current_buffer_size})이 적습니다. 가능한 프레임만 반환합니다.")
                start_index = 0
                num_frames_to_get = current_buffer_size
            else:
                start_index = current_buffer_size - total_frames_needed
                num_frames_to_get = total_frames_needed
            
            clip_frames = []
            for i in range(num_frames_to_get):
                frame_index = (self.head - num_frames_to_get + i) % self.max_frames
                offset = (frame_index) * self.frame_size
                frame_bytes = self.mmap[offset:offset + self.frame_size]
                frame = np.frombuffer(frame_bytes, dtype=np.uint8).reshape((self.frame_height, self.frame_width, 3))
                clip_frames.append(frame)
            
            print(f"🎞️ get_clip: 버퍼 크기={current_buffer_size}, 요청 프레임={total_frames_needed}, 반환 프레임={len(clip_frames)}")
            
            return clip_frames

    def close(self):
        self.mmap.close()
        os.close(self.fd)


class AudioRingBuffer:
    def __init__(self, maxlen_frames):
        self.buffer = collections.deque(maxlen=maxlen_frames)
        self.lock = threading.Lock() # 스레드 안전성을 위한 잠금 추가

    def callback(self, indata, frames, time, status):
        """오디오 데이터를 버퍼에 추가하는 콜백 함수입니다."""
        with self.lock:
            
            self.buffer.append(indata.copy()) # 잠재적인 dtype 문제를 피하기 위해 원시 바이트 저장

    def get_all_audio_data(self) -> np.ndarray:
        """버퍼에서 모든 오디오 데이터를 단일 NumPy 배열로 검색합니다."""
        with self.lock:
            if not self.buffer:
                return np.array([], dtype=np.int16) # 버퍼가 비어 있으면 빈 배열 반환

            # deque의 모든 바이트 청크 연결
            all_data_bytes = b''.join(self.buffer)
            # 연결된 바이트를 int16 NumPy 배열로 다시 변환
            all_data_np = np.frombuffer(all_data_bytes, dtype=np.int16)
            return all_data_np

    def save_to_wav(self, filename: str, sample_rate: int, channels: int):
        """버퍼링된 오디오 데이터를 WAV 파일로 저장합니다."""
        audio_data = self.get_all_audio_data()

        if audio_data.size == 0:
            print("⚠️ 오디오 버퍼가 비어있어 WAV 파일을 저장할 수 없습니다.")
            return False

        try:
            with wave.open(filename, 'wb') as wf:
                wf.setnchannels(channels)
                wf.setsampwidth(2)  # int16의 경우 2바이트
                wf.setframerate(sample_rate)
                wf.writeframes(audio_data.tobytes())
            print(f"✅ 오디오 데이터 저장 완료: {filename} ({len(audio_data)} 샘플)")
            return True
        except Exception as e:
            print(f"❌ 오디오 WAV 파일 저장 실패 ({filename}): {e}")
            return False
