import threading
import asyncio # Added import
from fastapi import APIRouter, Security, HTTPException, BackgroundTasks
from fastapi.security import APIKeyHeader
from pynput import keyboard
# import yaml # yaml is not used directly here if config is passed

class TriggerDetector:
    def __init__(self, config: dict, callback: callable, loop: asyncio.AbstractEventLoop):
        self.config = config
        self.callback = callback
        self.loop = loop # Store the event loop
        self.router = APIRouter()
        self._init_triggers()

    def _init_triggers(self):
        if self.config.get('triggers', {}).get('keyboard', {}).get('enabled', False):
            self._start_keyboard_listener()
        if self.config.get('triggers', {}).get('api', {}).get('enabled', False):
            self._setup_api_trigger()

    def _setup_api_trigger(self):
        api_config = self.config.get('triggers', {}).get('api', {})
        endpoint = api_config.get('endpoint', '/trigger') # Default endpoint
        secret_key = api_config.get('secret_key')

        if not secret_key:
            print("⚠️ API trigger secret key not configured. API trigger will not be secured.")

        api_key_header = APIKeyHeader(name="X-API-KEY", auto_error=False)

        @self.router.post(endpoint)
        async def api_trigger_endpoint(
                background_tasks: BackgroundTasks,
                api_key: str = Security(api_key_header)
        ):
            if secret_key and api_key != secret_key: # Check key only if configured
                raise HTTPException(status_code=401, detail="Invalid API key")
            
            # Ensure callback is callable
            if callable(self.callback):
                if asyncio.iscoroutinefunction(self.callback):
                    # For async callbacks, BackgroundTasks can handle them directly
                    background_tasks.add_task(self.callback)
                else:
                    # For sync callbacks (though on_trigger is async)
                    background_tasks.add_task(self.callback)
                return {"status": "triggered"}
            else:
                print("Error: Trigger callback is not callable.")
                raise HTTPException(status_code=500, detail="Trigger callback not configured")


    def _start_keyboard_listener(self):
        def on_press(key):
            try:
                # Assuming space key is the trigger, adjust as needed
                if key == keyboard.Key.space: 
                    print("🔼 Keyboard trigger detected (Space key)")
                    if callable(self.callback):
                        if asyncio.iscoroutinefunction(self.callback):
                            asyncio.run_coroutine_threadsafe(self.callback(), self.loop)
                        else: # For synchronous callbacks
                            # If the callback is synchronous but needs to run in the main thread's context
                            # self.loop.call_soon_threadsafe(self.callback) 
                            # Or just run it in the current thread if it's safe
                            threading.Thread(target=self.callback).start() 
                    else:
                        print("Error: Keyboard trigger callback is not callable.")
            except Exception as e:
                print(f"Keyboard trigger error: {str(e)}")

        try:
            listener = keyboard.Listener(on_press=on_press)
            listener.daemon = True # Ensure thread exits when main program exits
            listener.start()
            print("🎧 Keyboard listener started.")
        except Exception as e:
            print(f"Failed to start keyboard listener: {e}")
