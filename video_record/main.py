# main.py 최종 버전
import cv2
import os
import yaml
import threading
import uvicorn
from fastapi import FastAPI
from contextlib import asynccontextmanager
from buffer_manager import CircularBuffer
from video_writer import VideoSaver
from trigger_detector import TriggerDetector

os.environ["OPENCV_VIDEOIO_MSMF_ENABLE_HW_TRANSFORMS"] = "0"

app = None
buffer = None
saver = None
trigger_detector = None


def load_config():
    with open("config.yaml") as f:
        return yaml.safe_load(f)


def capture_frames():
    global buffer
    config = load_config()

    cap = cv2.VideoCapture(config['camera']['index'])
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, config['camera']['width'])
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, config['camera']['height'])

    buffer = CircularBuffer(max_frames=config['buffer']['max_frames'])

    while True:
        ret, frame = cap.read()
        if ret:
            buffer.add_frame(frame)
        else:
            print("카메라 연결 오류! 재시도 중...")
            cap.release()
            cap = cv2.VideoCapture(config['camera']['index'])
            from datetime import time
            time.sleep(1)


async def on_trigger():
    global buffer
    if buffer is None:
        return

    config = load_config()
    pre_sec = config['buffer']['pre_seconds']
    post_sec = config['buffer']['post_seconds']

    clip = buffer.get_clip(pre_sec, post_sec)
    if clip:
        resolution = (config['camera']['width'], config['camera']['height'])
        saver.save_clip(clip, resolution)


@asynccontextmanager
async def lifespan(app: FastAPI):
    global saver, trigger_detector
    config = load_config()

    # 초기화
    saver = VideoSaver(config)
    trigger_detector = TriggerDetector(config_path="config.yaml")
    trigger_detector.set_callback(on_trigger)

    # 웹캠 스레드 시작
    threading.Thread(target=capture_frames, daemon=True).start()

    yield

    # 정리
    print("시스템 종료 중...")


app = FastAPI(lifespan=lifespan)

if __name__ == "__main__":
    config = load_config()
    uvicorn.run(app,
                host=config['server']['host'],
                port=config['server']['port'])
