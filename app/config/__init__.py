import os
import yaml
from pathlib import Path
from typing import Dict, Any

_BASE_DIR = Path(__file__).parent


def load_config(filename: str) -> Dict[str, Any]:
    """모듈별 YAML 설정 파일 로드"""
    config_path = _BASE_DIR / filename
    if not config_path.exists():
        raise FileNotFoundError(f"Config file {filename} not found!")

    with open(config_path) as f:
        return yaml.safe_load(f)
