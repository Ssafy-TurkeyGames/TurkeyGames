from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Optional

from app.db import models
from app.yacht import schema


def create_game_setting(db: Session, settings: schema.GameSettings) -> models.TurkeyDiceSetting:
    """게임 설정을 데이터베이스에 저장"""
    # 다음 사용할 ID 찾기
    max_id = db.query(func.max(models.TurkeyDiceSetting.id)).scalar()
    next_id = 1 if max_id is None else max_id + 1

    db_setting = models.TurkeyDiceSetting(
        id=next_id,  # ID 수동 할당
        people=settings.people,
        map=settings.map,
        voice=settings.voice
    )
    db.add(db_setting)
    db.commit()
    db.refresh(db_setting)
    return db_setting

def create_player_score(db: Session) -> models.ScoreTableYacht:
    """새 플레이어 점수표를 생성"""
    # 다음 사용할 ID 찾기
    max_id = db.query(func.max(models.ScoreTableYacht.id)).scalar()
    next_id = 1 if max_id is None else max_id + 1

    player_score = models.ScoreTableYacht(
        id=next_id,  # ID 수동 할당
        ace=0, dual=0, triple=0, quad=0, penta=0,
        hexa=0, bonus_available=False, chance=0,
        poker=0, full_house=0, small_straight=0,
        large_straight=0, turkey=0
    )
    db.add(player_score)
    db.commit()
    db.refresh(player_score)
    return player_score

def get_player_score(db: Session, player_id: int) -> Optional[models.ScoreTableYacht]:
    """플레이어 점수표 조회"""
    return db.query(models.ScoreTableYacht).filter(models.ScoreTableYacht.id == player_id).first()


def update_player_score(db: Session, player_id: int, category: str, value: int) -> bool:
    """플레이어 점수표 업데이트"""
    player_score = db.query(models.ScoreTableYacht).filter(models.ScoreTableYacht.id == player_id).first()
    if not player_score:
        return False

    if hasattr(player_score, category):
        setattr(player_score, category, value)

        # 상단 섹션 보너스 계산 (Aces부터 Sixes까지 63점 이상이면 보너스)
        upper_section_score = (
                player_score.ace + player_score.dual + player_score.triple +
                player_score.quad + player_score.penta + player_score.hexa
        )
        if upper_section_score >= 63:
            player_score.bonus_available = True  # BOOLEAN 타입으로 변경

        db.commit()
        return True
    return False


def delete_game(db: Session, setting_id: int, player_ids: List[int]) -> bool:
    """게임 데이터 삭제"""
    # 게임 설정 삭제
    db.query(models.TurkeyDiceSetting).filter(models.TurkeyDiceSetting.id == setting_id).delete()

    # 플레이어 점수표 삭제
    for player_id in player_ids:
        db.query(models.ScoreTableYacht).filter(models.ScoreTableYacht.id == player_id).delete()

    db.commit()
    return True

def check_game_finished(db: Session, player_ids: List[int]) -> bool:
    """모든 플레이어의 점수표가 채워졌는지 확인"""
    for player_id in player_ids:
        player = db.query(models.ScoreTableYacht).filter(models.ScoreTableYacht.id == player_id).first()
        if not player:
            continue

        # 모든 카테고리가 0이 아닐 때 완료로 간주 (초기 설정이 0이므로)
        if (player.ace == 0 or player.dual == 0 or player.triple == 0 or
                player.quad == 0 or player.penta == 0 or player.hexa == 0 or
                player.chance == 0 or player.poker == 0 or player.full_house == 0 or
                player.small_straight == 0 or player.large_straight == 0 or player.turkey == 0):
            return False

    return True