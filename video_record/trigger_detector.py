from fastapi import APIRouter, Security, HTTPException, BackgroundTasks
from fastapi.security import APIKeyHeader
from pynput import keyboard
import yaml

class TriggerDetector:
    def __init__(self, config_path="config.yaml"):
        self.router = APIRouter()
        self.load_config(config_path)
        self._init_api()
        self._init_keyboard()
        self.trigger_callback = None

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

    def _init_keyboard(self):
        if self.config['triggers']['keyboard']['enabled']:
            self.keyboard_listener = keyboard.Listener(
                on_press=self._on_key_press
            )
            self.keyboard_listener.start()

    def _on_key_press(self, key):
        trigger_key = f"Key.{self.config['triggers']['keyboard']['key']}"
        if str(key) == trigger_key:
            if self.trigger_callback:
                self.trigger_callback()

    def set_callback(self, callback):
        self.trigger_callback = callback

    def get_router(self):
        return self.router
