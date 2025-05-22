from pydantic import BaseModel
from typing import Dict, List, Optional


class GameSettings(BaseModel):
    """게임 설정"""
    people: int  # 플레이어 수
    round: int = 3  # 라운드 수 (기본값 10)
    voice: int = 1  # 음성 ID (기본값 1)


class GameState(BaseModel):
    """게임 상태"""
    id: str  # 게임 ID
    players: List[int]  # 플레이어 ID 목록
    current_player_idx: int  # 현재 플레이어 인덱스
    scores: Dict[str, int]  # 플레이어별 점수
    round: int  # 현재 라운드
    max_rounds: int  # 최대 라운드 수
    status: str  # 게임 상태: playing, finished


class ScoreUpdate(BaseModel):
    """플레이어 점수 업데이트"""
    player_id: int  # 플레이어 ID
    score: int  # 업데이트할 점수


class GameResult(BaseModel):
    """게임 결과"""
    success: bool  # 성공 여부
    message: str = ""  # 메시지