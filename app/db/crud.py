from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Optional
from sqlalchemy import text

from app.db import models
from app.yacht import schema

# 야추
def create_game_setting(db: Session, settings: schema.GameSettings) -> models.TurkeyDiceSetting:
    db_setting = models.TurkeyDiceSetting(
        people=settings.people,
        map=settings.map,
        voice=settings.voice
    )
    db.add(db_setting)
    db.commit()
    db.refresh(db_setting)
    return db_setting


# crud.py 수정
def create_player_score(db: Session) -> models.ScoreTableYacht:
    """새 플레이어 점수표를 생성"""
    # ID를 지정하지 않음 - SERIAL이 자동 할당
    player_score = models.ScoreTableYacht(
        ace=0, dual=0, triple=0, quad=0, penta=0,
        hexa=0, bonus_available=False, chance=0,
        poker=0, full_house=0, small_straight=0,
        large_straight=0, turkey=0
    )
    db.add(player_score)
    db.commit()
    db.refresh(player_score)  # 자동 생성된 ID 가져오기

    # 점수 선택 가능 여부 테이블도 함께 생성
    create_player_score_available(db, player_score.id)

    return player_score


def create_player_score_available(db: Session, player_id: int) -> models.ScoreTableYachtAvailable:
    """새 플레이어 점수 선택 가능 여부 테이블 생성"""
    # ID를 지정하지 않음 - SERIAL이 자동 할당
    player_available = models.ScoreTableYachtAvailable(
        # id=player_id,  # 이 줄 제거!
        ace=False, dual=False, triple=False, quad=False, penta=False,
        hexa=False, chance=False, poker=False, full_house=False,
        small_straight=False, large_straight=False, turkey=False
    )
    db.add(player_available)
    db.commit()
    db.refresh(player_available)
    return player_available

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
    prepare_new_game(db)

    # 게임 설정 삭제
    db.query(models.TurkeyDiceSetting).filter(models.TurkeyDiceSetting.id == setting_id).delete()

    # 플레이어 점수표 삭제
    for player_id in player_ids:
        db.query(models.ScoreTableYacht).filter(models.ScoreTableYacht.id == player_id).delete()
        # 점수 선택 가능 여부 테이블도 함께 삭제
        db.query(models.ScoreTableYachtAvailable).filter(models.ScoreTableYachtAvailable.id == player_id).delete()

    db.commit()
    return True


def reset_sequence_to_max(db: Session, table_name: str, sequence_name: str):
    """시퀀스를 현재 테이블의 최대값+1로 설정"""
    # 현재 최대 ID 찾기
    result = db.execute(text(f"SELECT COALESCE(MAX(id), 0) FROM {table_name}"))
    max_id = result.scalar()

    # 시퀀스를 최대값+1로 설정
    db.execute(text(f"ALTER SEQUENCE {sequence_name} RESTART WITH {max_id + 1}"))
    db.commit()


# 게임 시작할 때마다 실행
def prepare_new_game(db: Session):
    """새 게임 시작 전 시퀀스 정리"""
    reset_sequence_to_max(db, 'turkey_dice_setting', 'turkey_dice_setting_id_seq')
    reset_sequence_to_max(db, 'turkey_dice_score', 'turkey_dice_score_id_seq')
    reset_sequence_to_max(db, 'turkey_dice_score_available', 'turkey_dice_score_available_id_seq')

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

# 5초 준다

def create_five_sec_setting(db: Session, settings) -> models.FiveSecSetting:
    """5초준다 게임 설정 생성"""
    db_setting = models.FiveSecSetting(
        people=settings.people,
        round=settings.round,
        voice=settings.voice
    )
    db.add(db_setting)
    db.commit()
    db.refresh(db_setting)
    return db_setting


def create_five_sec_score(db: Session) -> models.FiveSecScore:
    """5초준다 게임 점수 생성"""
    db_score = models.FiveSecScore(score=0)
    db.add(db_score)
    db.commit()
    db.refresh(db_score)
    return db_score


def get_five_sec_score(db: Session, player_id: int) -> Optional[models.FiveSecScore]:
    """5초준다 게임 점수 조회"""
    return db.query(models.FiveSecScore).filter(models.FiveSecScore.id == player_id).first()


def update_five_sec_score(db: Session, player_id: int, success: bool) -> bool:
    """5초준다 게임 점수 업데이트 (성공/실패)"""
    db_score = get_five_sec_score(db, player_id)
    if not db_score:
        return False

    if success:
        db_score.score += 1

    db.commit()
    db.refresh(db_score)
    return True


def update_five_sec_score_direct(db: Session, player_id: int, score: int) -> bool:
    """5초준다 게임 점수 직접 설정"""
    db_score = get_five_sec_score(db, player_id)
    if not db_score:
        return False

    db_score.score = score
    db.commit()
    db.refresh(db_score)
    return True


def delete_five_sec_game(db: Session, setting_id: int, player_ids: List[int]) -> bool:
    """5초준다 게임 삭제 (설정 및 점수)"""
    try:
        # 설정 삭제
        db_setting = db.query(models.FiveSecSetting).filter(models.FiveSecSetting.id == setting_id).first()
        if db_setting:
            db.delete(db_setting)

        # 플레이어 점수 삭제
        for player_id in player_ids:
            db_score = db.query(models.FiveSecScore).filter(models.FiveSecScore.id == player_id).first()
            if db_score:
                db.delete(db_score)

        db.commit()
        return True
    except Exception:
        db.rollback()
        return False