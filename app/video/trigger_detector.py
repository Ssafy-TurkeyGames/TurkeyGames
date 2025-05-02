import threading

from fastapi import APIRouter, Security, HTTPException, BackgroundTasks
from fastapi.security import APIKeyHeader
from pynput import keyboard
import yaml

class TriggerDetector:
    def __init__(self, config: dict, callback: callable):
        self.config = config
        self.callback = callback
        self.router = APIRouter()
        self._init_hardware()

    def load_config(self, path):
        with open(path) as f:
            self.config = yaml.safe_load(f)

    def _init_api(self):
        if self.config['triggers']['api']['enabled']:
            api_key_header = APIKeyHeader(name="X-API-KEY")

            @self.router.post(self.config['triggers']['api']['endpoint'])
            def api_trigger(
                background_tasks: BackgroundTasks,
                api_key: str = Security(api_key_header)
            ):
                if api_key != self.config['triggers']['api']['secret_key']:
                    raise HTTPException(status_code=401, detail="Invalid API key")
                if self.trigger_callback:
                    background_tasks.add_task(self.trigger_callback)
                return {"status": "triggered"}

    def _init_hardware(self):
        if self.config['triggers']['keyboard']['enabled']:
            self._start_keyboard_listener()
        if self.config['triggers']['api']['enabled']:
            self._start_api_server()

    def _start_api_server(self):
        api_key_header = APIKeyHeader(name="X-API-KEY")

        @self.router.post(self.config['triggers']['api']['endpoint'])
        async def api_trigger(
                background_tasks: BackgroundTasks,
                api_key: str = Security(api_key_header)
        ):
            if api_key != self.config['triggers']['api']['secret_key']:
                return {"status": "invalid_key"}
            background_tasks.add_task(self.callback)
            return {"status": "triggered"}

    def _start_keyboard_listener(self):
        def on_press(key):
            try:
                if key == keyboard.Key.space:
                    print("🔼 트리거 감지 (버퍼 플러시 시작)")
                    threading.Thread(target=self.callback).start()  # 별도 스레드에서 처리
            except Exception as e:
                print(f"트리거 오류: {str(e)}")

        listener = keyboard.Listener(on_press=on_press)
        listener.daemon = True
        listener.start()

    def set_callback(self, callback):
        self.trigger_callback = callback

    def get_router(self):
        return self.router

_trigger_detector = None
def get_trigger_detector():
    global _trigger_detector
    if _trigger_detector is None:
        # 콜백 함수는 실제 영상 저장 로직 함수로 연결
        from app.video.video_writer import save_video_clip
        _trigger_detector = TriggerDetector(callback=save_video_clip)
    return _trigger_detector