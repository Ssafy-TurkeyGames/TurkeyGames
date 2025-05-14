import os
import yaml
from pathlib import Path

_BASE_DIR = Path(__file__).parent

def load_config(filename: str) -> dict:
    config_path = _BASE_DIR / filename
    print(f"🔧 Loading config from: {config_path}")  # 경로 확인 로그
    with open(config_path, 'r', encoding='utf-8') as f:
        config = yaml.safe_load(f)
    print("📄 Config content:", config)  # 파싱 결과 확인
    return config
