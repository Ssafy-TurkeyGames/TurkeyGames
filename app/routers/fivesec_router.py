from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import Dict

from app.db.database import get_db
from app.db import crud
from app.fivesec import schema
from app.fivesec.game import FiveSecGame

# 5초준다 게임 라우터 초기화
router = APIRouter(
    prefix="/fivesec",
    tags=["fivesec"],
)


@router.post("/start", response_model=schema.GameState)
async def start_game(settings: schema.GameSettings, db: Session = Depends(get_db)):
    """새 게임 시작"""
    # 게임 설정 저장
    db_setting = crud.create_five_sec_setting(db, settings)

    # 각 플레이어의 점수표 생성
    player_ids = []
    for _ in range(settings.people):
        player_score = crud.create_five_sec_score(db)
        player_ids.append(player_score.id)

    # 게임 세션 생성
    game_id = FiveSecGame.create_game(db_setting.id, player_ids)

    # 최대 라운드 설정
    FiveSecGame.set_max_rounds(game_id, settings.round)

    # 게임 상태 조회
    game = FiveSecGame.get_game(game_id)

    return schema.GameState(
        id=game_id,
        players=player_ids,
        current_player_idx=0,
        scores=game["scores"],
        round=1,
        max_rounds=settings.round,
        status="playing"
    )


@router.get("/{game_id}", response_model=schema.GameState)
async def get_game_status(game_id: str):
    """게임 상태 조회"""
    game = FiveSecGame.get_game(game_id)
    if not game:
        raise HTTPException(status_code=404, detail="게임을 찾을 수 없습니다")

    return schema.GameState(
        id=game["id"],
        players=game["players"],
        current_player_idx=game["current_player_idx"],
        scores=game["scores"],
        round=game["round"],
        max_rounds=game["max_rounds"],
        status=game["status"]
    )


@router.post("/{game_id}/next-turn", response_model=schema.GameState)
async def next_turn(game_id: str):
    """다음 플레이어 턴으로 넘기기"""
    game = FiveSecGame.get_game(game_id)
    if not game:
        raise HTTPException(status_code=404, detail="게임을 찾을 수 없습니다")

    next_player_idx = FiveSecGame.next_turn(game_id)
    if next_player_idx is None:
        raise HTTPException(status_code=400, detail="다음 턴으로 넘길 수 없습니다")

    # 업데이트된 게임 상태 조회
    game = FiveSecGame.get_game(game_id)

    return schema.GameState(
        id=game["id"],
        players=game["players"],
        current_player_idx=next_player_idx,
        scores=game["scores"],
        round=game["round"],
        max_rounds=game["max_rounds"],
        status=game["status"]
    )


@router.post("/{game_id}/update-score", response_model=schema.GameResult)
async def update_player_score(game_id: str, score_update: schema.ScoreUpdate, db: Session = Depends(get_db)):
    """플레이어 점수 업데이트"""
    game = FiveSecGame.get_game(game_id)
    if not game:
        raise HTTPException(status_code=404, detail="게임을 찾을 수 없습니다")

    # DB 점수 업데이트
    success = crud.update_five_sec_score_direct(db, score_update.player_id, score_update.score)
    if not success:
        raise HTTPException(status_code=400, detail="점수를 업데이트할 수 없습니다")

    FiveSecGame.update_score(game_id, score_update.player_id, score_update.score)

    return schema.GameResult(success=True, message="점수가 업데이트되었습니다")


@router.get("/{game_id}/scores", response_model=Dict[str, int])
async def get_scores(game_id: str):
    """현재 게임의 모든 플레이어 점수 조회"""
    game = FiveSecGame.get_game(game_id)
    if not game:
        raise HTTPException(status_code=404, detail="게임을 찾을 수 없습니다")

    return game["scores"]


@router.get("/{game_id}/final-scores", response_model=Dict[str, int])
async def get_final_scores(game_id: str, db: Session = Depends(get_db)):
    """게임 종료 시 최종 점수 조회 (DB에서 가져옴)"""
    game = FiveSecGame.get_game(game_id)
    if not game:
        raise HTTPException(status_code=404, detail="게임을 찾을 수 없습니다")

    if game["status"] != "finished":
        raise HTTPException(status_code=400, detail="게임이 아직 종료되지 않았습니다")

    # DB에서 최종 점수 가져오기
    final_scores = {}
    for player_id in game["players"]:
        player_score = crud.get_five_sec_score(db, player_id)
        if player_score:
            final_scores[str(player_id)] = player_score.score

    return final_scores


@router.delete("/{game_id}", response_model=schema.GameResult)
async def end_game(game_id: str):
    """게임 종료"""
    game = FiveSecGame.get_game(game_id)
    if not game:
        raise HTTPException(status_code=404, detail="게임을 찾을 수 없습니다")

    # 게임 종료 처리
    FiveSecGame.end_game(game_id)

    return schema.GameResult(success=True, message="게임이 종료되었습니다")


@router.delete("/{game_id}/cleanup", response_model=schema.GameResult)
async def cleanup_game(game_id: str, db: Session = Depends(get_db)):
    """게임 데이터 완전 삭제 (DB 및 인메모리)"""
    game = FiveSecGame.get_game(game_id)
    if not game:
        raise HTTPException(status_code=404, detail="게임을 찾을 수 없습니다")

    # DB에서 게임 설정 및 플레이어 점수 삭제
    crud.delete_five_sec_game(db, game["setting_id"], game["players"])

    FiveSecGame.delete_game(game_id)

    return schema.GameResult(success=True, message="게임 데이터가 완전히 삭제되었습니다")