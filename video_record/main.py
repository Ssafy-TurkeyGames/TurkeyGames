# main.py
from buffer_manager import CircularBuffer
from video_writer import VideoSaver
import threading

buffer = CircularBuffer(max_frames=900)  # 30초 버퍼 (10+20)
saver = VideoSaver()


def capture_thread():
    cap = cv2.VideoCapture(0)
    while True:
        ret, frame = cap.read()
        if ret:
            buffer.add_frame(frame)


def trigger_handler():
    while True:
        if check_trigger():  # 트리거 감지 로직
            clip_frames = buffer.get_clip()
            save_thread = threading.Thread(target=saver.save_clip, args=(clip_frames,))
            save_thread.start()


# 스레드 시작
threading.Thread(target=capture_thread).start()
threading.Thread(target=trigger_handler).start()
