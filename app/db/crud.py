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

def create_player_score_available(db: Session, player_id: int) -> models.ScoreTableYachtAvailable:
    """새 플레이어 점수 선택 가능 여부 테이블 생성"""
    player_available = models.ScoreTableYachtAvailable(
        id=player_id,  # 점수표와 동일한 ID 사용
        ace=False, dual=False, triple=False, quad=False, penta=False,
        hexa=False, chance=False, poker=False, full_house=False,
        small_straight=False, large_straight=False, turkey=False
    )
    db.add(player_available)
    db.commit()
    db.refresh(player_available)
    return player_available


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

    # 점수 선택 가능 여부 테이블도 함께 생성
    create_player_score_available(db, player_score.id)

    return player_score

def get_player_score(db: Session, player_id: int) -> Optional[models.ScoreTableYacht]:
    """플레이어 점수표 조회"""
    return db.query(models.ScoreTableYacht).filter(models.ScoreTableYacht.id == player_id).first()

def update_player_score(db: Session, player_id: int, category: str, value: int) -> bool:
    """플레이어 점수표 업데이트"""
    player_score = db.query(models.ScoreTableYacht).filter(models.ScoreTableYacht.id == player_id).first()
    player_available = db.query(models.ScoreTableYachtAvailable).filter(
        models.ScoreTableYachtAvailable.id == player_id).first()

    if not player_score or not player_available:
        return False

    # 이미 선택된 카테고리인지 확인
    if hasattr(player_available, category) and getattr(player_available, category):
        return False  # 이미 선택된 카테고리면 False 반환

    if hasattr(player_score, category):
        # 점수 업데이트
        setattr(player_score, category, value)

        # 카테고리 선택 처리
        setattr(player_available, category, True)

        # 상단 섹션 보너스 계산 (Aces부터 Sixes까지 63점 이상이면 보너스)
        upper_section_score = (
                player_score.ace + player_score.dual + player_score.triple +
                player_score.quad + player_score.penta + player_score.hexa
        )
        if upper_section_score >= 63:
            player_score.bonus_available = True

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
        # 점수 선택 가능 여부 테이블도 함께 삭제
        db.query(models.ScoreTableYachtAvailable).filter(models.ScoreTableYachtAvailable.id == player_id).delete()

    db.commit()
    return True


def check_game_finished(db: Session, player_ids: List[int]) -> bool:
    """모든 플레이어의 점수표가 채워졌는지 확인"""
    for player_id in player_ids:
        # 선택 가능 여부 테이블을 확인해서 모든 카테고리가 선택되었는지 확인
        player_available = db.query(models.ScoreTableYachtAvailable).filter(
            models.ScoreTableYachtAvailable.id == player_id).first()
        if not player_available:
            continue

        # 모든 카테고리가 선택되었는지 확인 (True인지)
        if not (player_available.ace and player_available.dual and
                player_available.triple and player_available.quad and
                player_available.penta and player_available.hexa and
                player_available.chance and player_available.poker and
                player_available.full_house and player_available.small_straight and
                player_available.large_straight and player_available.turkey):
            return False

    return True