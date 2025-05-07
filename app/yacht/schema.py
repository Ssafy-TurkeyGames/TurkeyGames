from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Union


class GameSettings(BaseModel):
    """게임 설정 모델"""
    people: int = Field(..., ge=1, le=4, description="플레이어 수")
    map: int = Field(0, description="맵 설정")
    voice: int = Field(0, description="음성 사용 여부")


class DiceRoll(BaseModel):
    """주사위 굴림 요청 모델"""
    keep_indices: List[int] = Field(default_factory=list, description="유지할 주사위 인덱스")


class DiceResult(BaseModel):
    """주사위 굴림 결과 모델"""
    dice_values: List[int] = Field(..., description="주사위 값 리스트")
    rolls_left: int = Field(..., description="남은 굴림 횟수")


class ScoreSelection(BaseModel):
    """점수 선택 모델"""
    player_id: int = Field(..., description="플레이어 ID")
    category: str = Field(..., description="점수 카테고리")
    value: int = Field(..., ge=0, description="점수")


class ScoreResult(BaseModel):
    """점수 선택 결과 모델"""
    success: bool = Field(..., description="성공 여부")
    next_player: int = Field(..., description="다음 플레이어 인덱스")


class PlayerScore(BaseModel):
    """플레이어 점수 모델"""
    player_id: int = Field(..., description="플레이어 ID")
    scorecard: Dict[str, Union[int, bool]] = Field(..., description="점수표")
    total_score: int = Field(..., description="총점")


class AllScores(BaseModel):
    """모든 플레이어 점수 모델"""
    scores: List[PlayerScore] = Field(..., description="플레이어 점수 리스트")


class GameState(BaseModel):
    """게임 상태 모델"""
    id: str = Field(..., description="게임 ID")
    players: List[int] = Field(..., description="플레이어 ID 리스트")
    current_player_idx: int = Field(..., description="현재 플레이어 인덱스")
    dice_values: List[int] = Field(..., description="주사위 값 리스트")
    rolls_left: int = Field(..., description="남은 굴림 횟수")
    status: str = Field(..., description="게임 상태")


class GameEndResult(BaseModel):
    """게임 종료 결과 모델"""
    success: bool = Field(..., description="성공 여부")
    message: str = Field(..., description="결과 메시지")