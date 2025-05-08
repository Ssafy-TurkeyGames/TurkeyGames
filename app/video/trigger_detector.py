import threading
import asyncio
import os
from fastapi import APIRouter, Security, HTTPException, BackgroundTasks
from fastapi.security import APIKeyHeader

# 🔧 pynput 안전 처리
try:
    from pynput import keyboard
    PYNPUT_AVAILABLE = True
except Exception as e:
    print(f"[WARN] pynput 사용 불가: {e}")
    PYNPUT_AVAILABLE = False

class TriggerDetector:
    def __init__(self, config: dict, callback: callable, loop: asyncio.AbstractEventLoop):
        self.config = config
        self.callback = callback
        self.loop = loop
        self.router = APIRouter()
        self._init_triggers()

    def _init_triggers(self):
        if self.config.get('triggers', {}).get('keyboard', {}).get('enabled', False):
            self._start_keyboard_listener()

        if self.config.get('triggers', {}).get('api', {}).get('enabled', False):
            self._setup_api_trigger()

    def _setup_api_trigger(self):
        api_config = self.config.get('triggers', {}).get('api', {})
        endpoint = api_config.get('endpoint', '/trigger')
        secret_key = api_config.get('secret_key')

        if not secret_key:
            print("⚠️ API trigger secret key not configured.")

        api_key_header = APIKeyHeader(name="X-API-KEY", auto_error=False)

        @self.router.post(endpoint)
        async def api_trigger_endpoint(
            background_tasks: BackgroundTasks,
            api_key: str = Security(api_key_header)
        ):
            if secret_key and api_key != secret_key:
                raise HTTPException(status_code=401, detail="Invalid API key")

            if callable(self.callback):
                background_tasks.add_task(self.callback)
                return {"status": "triggered"}
            else:
                raise HTTPException(status_code=500, detail="Callback is not callable")

    def _start_keyboard_listener(self):
        use_pynput = os.getenv("USE_PYNPUT", "false").lower() == "true"

        if not use_pynput:
            print("ℹ️ USE_PYNPUT=false: 키보드 리스너 비활성화됨.")
            return

        if not PYNPUT_AVAILABLE:
            print("❌ pynput 모듈 사용 불가로 키보드 리스너 실행 중단")
            return

        def on_press(key):
            try:
                if key == keyboard.Key.space:
                    print("🔼 Space 키 눌림 - 트리거 발생")
                    if callable(self.callback):
                        if asyncio.iscoroutinefunction(self.callback):
                            asyncio.run_coroutine_threadsafe(self.callback(), self.loop)
                        else:
                            threading.Thread(target=self.callback).start()
            except Exception as e:
                print(f"⚠️ 키보드 리스너 에러: {e}")

        try:
            listener = keyboard.Listener(on_press=on_press)
            listener.daemon = True
            listener.start()
            print("🎧 키보드 리스너 시작됨")
        except Exception as e:
            print(f"❌ 리스너 시작 실패: {e}")
