import threading
import asyncio  # ✅ 비동기 콜백 처리를 위해 추가
from fastapi import APIRouter, Security, HTTPException, BackgroundTasks
from fastapi.security import APIKeyHeader
from pynput import keyboard
import yaml


class TriggerDetector:
    def __init__(self, config: dict, callback: callable):
        self.config = config
        self.callback = callback  # 🎯 트리거 시 호출될 콜백 함수
        self.router = APIRouter()
        self.loop = asyncio.get_event_loop()  # ✅ 비동기 콜백을 위한 이벤트 루프 저장
        self._init_hardware()

    def load_config(self, path):
        with open(path) as f:
            self.config = yaml.safe_load(f)

    def _init_api(self):
        """API 방식 트리거 초기화 (미사용 상태)"""
        if self.config['triggers']['api']['enabled']:
            api_key_header = APIKeyHeader(name="X-API-KEY")

            @self.router.post(self.config['triggers']['api']['endpoint'])
            def api_trigger(
                background_tasks: BackgroundTasks,
                api_key: str = Security(api_key_header)
            ):
                if api_key != self.config['triggers']['api']['secret_key']:
                    raise HTTPException(status_code=401, detail="Invalid API key")
                if self.callback:
                    background_tasks.add_task(self.callback)
                return {"status": "triggered"}

    def _init_hardware(self):
        """하드웨어/네트워크 기반 트리거 초기화"""
        if self.config['triggers']['keyboard']['enabled']:
            self._start_keyboard_listener()
        if self.config['triggers']['api']['enabled']:
            self._start_api_server()

    def _start_api_server(self):
        """FastAPI 기반 API 트리거 엔드포인트 등록"""
        api_key_header = APIKeyHeader(name="X-API-KEY")

        @self.router.post(self.config['triggers']['api']['endpoint'])
        async def api_trigger(
                background_tasks: BackgroundTasks,
                api_key: str = Security(api_key_header)
        ):
            if api_key != self.config['triggers']['api']['secret_key']:
                return {"status": "invalid_key"}

            if asyncio.iscoroutinefunction(self.callback):
                await self.callback()  # ✅ 비동기 콜백인 경우 await
            else:
                background_tasks.add_task(self.callback)  # ✅ 동기 콜백은 백그라운드 실행

            return {"status": "triggered"}

    def _start_keyboard_listener(self):
        """키보드 스페이스 입력 시 트리거 감지"""
        def on_press(key):
            try:
                if key == keyboard.Key.space:
                    print("🔼 트리거 감지 (버퍼 플러시 시작)")

                    if asyncio.iscoroutinefunction(self.callback):
                        # ✅ 비동기 콜백이면 메인 루프에 등록 (스레드 안전)
                        asyncio.run_coroutine_threadsafe(self.callback(), self.loop)
                    else:
                        # ✅ 동기 콜백이면 별도 스레드에서 실행
                        threading.Thread(target=self.callback).start()

            except Exception as e:
                print(f"트리거 오류: {str(e)}")

        listener = keyboard.Listener(on_press=on_press)
        listener.daemon = True
        listener.start()

    def set_callback(self, callback):
        """콜백 변경용 Setter (테스트용 또는 동적 연결용)"""
        self.callback = callback

    def get_router(self):
        """FastAPI 라우터 반환 (main에서 include_router용)"""
        return self.router


# 싱글톤 패턴
_trigger_detector = None
def get_trigger_detector():
    global _trigger_detector
    if _trigger_detector is None:
        from app.video.video_writer import save_video_clip  # 🎯 콜백 함수 연결
        _trigger_detector = TriggerDetector(config={}, callback=save_video_clip)
    return _trigger_detector
