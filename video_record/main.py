import cv2
import yaml
import threading
import time
import uvicorn
from fastapi import FastAPI
from contextlib import asynccontextmanager
from app.video.buffer_manager import CircularBuffer
from app.video.video_writer import VideoSaver
from app.video.trigger_detector import TriggerDetector

app = None
buffer = None
saver = None
trigger_detector = None
is_saving = False
is_buffer_ready = False  # 버퍼 준비 상태 플래그


def load_config():
    with open("../app/config/video_config.yaml") as f:
        return yaml.safe_load(f)


def capture_frames():
    global buffer, is_buffer_ready
    config = load_config()

    while True:
        # 카메라 연결 재시도 루프
        cap = cv2.VideoCapture(config['camera']['index'])
        if not cap.isOpened():
            print("카메라 연결 실패! 3초 후 재시도...")
            time.sleep(3)
            continue

        # 카메라 설정
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, config['camera']['width'])
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, config['camera']['height'])
        buffer = CircularBuffer(max_frames=config['buffer']['max_frames'])
        is_buffer_ready = True  # 버퍼 준비 완료

        # 프레임 캡처 루프
        while True:
            ret, frame = cap.read()
            if ret:
                buffer.add_frame(frame)
            else:
                print("카메라 연결 끊김. 재연결 시도...")
                cap.release()
                is_buffer_ready = False
                break


def on_trigger():
    global is_saving, is_buffer_ready
    if not is_buffer_ready:
        print("⚠️ 버퍼가 아직 준비되지 않았습니다.")
        return
    if is_saving:
        print("⚠️ 이미 저장 중인 트리거가 있습니다.")
        return

    is_saving = True
    print("🎥 트리거 감지! 영상 저장 시작...")

    try:
        config = load_config()
        pre_sec = config['buffer']['pre_seconds']
        post_sec = config['buffer']['post_seconds']
        clip = buffer.get_clip(pre_sec, post_sec)

        if clip:
            resolution = (config['camera']['width'], config['camera']['height'])
            saver.save_clip(clip, resolution)
            print("✅ 영상 저장 완료.")
        else:
            print("❌ 저장할 프레임이 없습니다.")
    except Exception as e:
        print(f"❌ 저장 실패: {str(e)}")
    finally:
        is_saving = False


@asynccontextmanager
async def lifespan(app: FastAPI):
    global saver, trigger_detector
    config = load_config()

    # 비디오 세이버 초기화
    saver = VideoSaver(config)

    # 트리거 감지기 설정
    trigger_detector = TriggerDetector(config_path="../app/config/video_config.yaml")
    trigger_detector.set_callback(on_trigger)
    app.include_router(trigger_detector.get_router())

    # 웹캠 스레드 시작
    threading.Thread(target=capture_frames, daemon=True).start()

    yield

    # 종료 시 리소스 정리
    print("🛑 시스템 종료 중...")


app = FastAPI(lifespan=lifespan)

if __name__ == "__main__":
    config = load_config()
    uvicorn.run(
        app,
        host=config['server']['host'],
        port=config['server']['port']
    )
