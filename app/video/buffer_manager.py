import threading
import mmap
import os
import cv2
import numpy as np
import collections

class CircularBuffer:
    def __init__(self, max_frames: int, frame_width: int, frame_height: int):
        self.max_frames = max_frames
        self.frame_width = frame_width
        self.frame_height = frame_height
        self.frame_size = frame_width * frame_height * 3  # Assuming 3 bytes per pixel (BGR)
        self.buffer_size = self.max_frames * self.frame_size
        self.file_path = "video_buffer.mmap"  # You can specify a different path
        
        # Create or open the file
        self.fd = os.open(self.file_path, os.O_RDWR | os.O_CREAT)
        
        # Resize the file to the buffer size
        os.ftruncate(self.fd, self.buffer_size)
        
        # Map the file into memory
        self.mmap = mmap.mmap(self.fd, self.buffer_size, access=mmap.ACCESS_WRITE)
        
        self.lock = threading.Lock()
        self.head = 0  # Index of the next frame to be written

    def add_frame(self, frame):
        with self.lock:
            # Resize the frame if necessary
            if frame.shape[1] != self.frame_width or frame.shape[0] != self.frame_height:
                frame = cv2.resize(frame, (self.frame_width, self.frame_height))
            
            # Calculate the offset for writing the frame
            offset = (self.head % self.max_frames) * self.frame_size
            
            # Flatten the frame and write it to the mmap
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
    def callback(self, indata, frames, time, status):
        array = np.frombuffer(indata, dtype=np.int16).copy()
        self.buffer.append(array)
