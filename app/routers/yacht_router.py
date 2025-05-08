from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db import crud
from app.yacht import schema
from app.yacht.dice import DiceGame
from app.websocket.manager import broadcast_scores, game_rooms, sio

# 요트 게임 라우터 초기화
router = APIRouter(
    prefix="/yacht",
    tags=["yacht"],
)


@router.post("/start", response_model=schema.GameState)
async def start_game(settings: schema.GameSettings, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """새 게임 시작"""
    # 게임 설정 저장
    db_setting = crud.create_game_setting(db, settings)

    # 각 플레이어의 점수표 생성
    player_ids = []
    for _ in range(settings.people):
        player_score = crud.create_player_score(db)
        player_ids.append(player_score.id)

    # 게임 세션 생성 (인메모리 저장)
    game_id = DiceGame.create_game(db_setting.id, player_ids)

    # 게임 ID가 문자열인지 확인 (Pydantic 검증 통과를 위해)
    game_id_str = str(game_id) if game_id else "1"

    # 게임 상태 생성
    game_state = schema.GameState(
        id=game_id_str,
        players=player_ids,
        current_player_idx=0,
        dice_values=[0, 0, 0, 0, 0],
        rolls_left=3,
        status="waiting"
    )

    # 로비에 게임 생성 정보 전송
    background_tasks.add_task(sio.emit, 'game_created', {
        "game_id": game_id_str,
        "settings": settings.dict()
    })
    return game_state

@router.get("/{game_id}/status", response_model=schema.GameState)
async def get_game_status(game_id: str):
    """게임 상태 조회"""
    game = DiceGame.get_game(game_id)
    if not game:
        raise HTTPException(status_code=404, detail="게임을 찾을 수 없습니다")

    return schema.GameState(
        id=game["id"],
        players=game["players"],
        current_player_idx=game["current_player_idx"],
        dice_values=game["dice_values"],
        rolls_left=game["rolls_left"],
        status=game["status"]
    )


@router.post("/{game_id}/roll", response_model=schema.DiceResult)
async def roll_dice(game_id: str, roll_request: schema.DiceRoll):
    """주사위 굴리기"""
    result = DiceGame.roll_dice(game_id, roll_request.keep_indices)
    if not result:
        raise HTTPException(status_code=404, detail="게임을 찾을 수 없거나 주사위를 굴릴 수 없습니다")

    dice_values, rolls_left = result

    return schema.DiceResult(dice_values=dice_values, rolls_left=rolls_left)


@router.post("/{game_id}/select", response_model=schema.ScoreResult)
async def select_score(
        game_id: str,
        selection: schema.ScoreSelection,
        background_tasks: BackgroundTasks,
        db: Session = Depends(get_db)
):
    """점수 선택 및 기록"""
    # 게임 상태 조회
    game = DiceGame.get_game(game_id)
    if not game:
        raise HTTPException(status_code=404, detail="게임을 찾을 수 없습니다")

    current_player_id = game["players"][game["current_player_idx"]]
    if current_player_id != selection.player_id:
        raise HTTPException(status_code=400, detail="현재 플레이어의 턴이 아닙니다")

    # 점수 업데이트
    success = crud.update_player_score(db, selection.player_id, selection.category, selection.value)
    if not success:
        raise HTTPException(status_code=400, detail="이미 선택한 카테고리이거나 점수를 업데이트할 수 없습니다")

    # 다음 플레이어 턴으로 변경
    next_player_idx = DiceGame.next_turn(game_id)

    # 게임 종료 확인
    is_finished = crud.check_game_finished(db, game["players"])
    if is_finished:
        DiceGame.end_game(game_id)

    # 백그라운드에서 점수 업데이트 브로드캐스트
    # get_scores 함수의 로직을 재사용하여 점수 데이터 가져오기
    scores = []
    for player_id in game["players"]:
        player_score = crud.get_player_score(db, player_id)
        if player_score:
            # 보너스 계산 (Boolean -> Int)
            bonus_value = 35 if player_score.bonus_available else 0

            # 총점 계산
            total_score = (
                    player_score.ace + player_score.dual + player_score.triple +
                    player_score.quad + player_score.penta + player_score.hexa +
                    bonus_value + player_score.chance +
                    player_score.poker + player_score.full_house +
                    player_score.small_straight + player_score.large_straight +
                    player_score.turkey
            )

            scores.append(schema.PlayerScore(
                player_id=player_id,
                scorecard={
                    "ace": player_score.ace,
                    "dual": player_score.dual,
                    "triple": player_score.triple,
                    "quad": player_score.quad,
                    "penta": player_score.penta,
                    "hexa": player_score.hexa,
                    "bonus_available": bonus_value,  # Boolean -> Int
                    "chance": player_score.chance,
                    "poker": player_score.poker,
                    "full_house": player_score.full_house,
                    "small_straight": player_score.small_straight,
                    "large_straight": player_score.large_straight,
                    "turkey": player_score.turkey
                },
                total_score=total_score
            ))

    # 스코어 데이터와 게임 상태를 함께 전송
    score_data = {
        "game_id": game_id,
        "scores": [score.dict() for score in scores],
        "current_player_idx": next_player_idx,
        "is_finished": is_finished
    }

    # 비동기적으로 점수 업데이트 브로드캐스트
    background_tasks.add_task(broadcast_scores, game_id, score_data)

    return schema.ScoreResult(success=True, next_player=next_player_idx)


@router.get("/{game_id}/scores", response_model=schema.AllScores)
async def get_scores(game_id: str, db: Session = Depends(get_db)):
    """모든 플레이어 점수 조회"""
    game = DiceGame.get_game(game_id)
    if not game:
        raise HTTPException(status_code=404, detail="게임을 찾을 수 없습니다")

    scores = []
    for player_id in game["players"]:
        player_score = crud.get_player_score(db, player_id)
        if player_score:
            # 보너스 계산 (Boolean -> Int)
            bonus_value = 35 if player_score.bonus_available else 0

            # 총점 계산
            total_score = (
                    player_score.ace + player_score.dual + player_score.triple +
                    player_score.quad + player_score.penta + player_score.hexa +
                    bonus_value + player_score.chance +
                    player_score.poker + player_score.full_house +
                    player_score.small_straight + player_score.large_straight +
                    player_score.turkey
            )

            scores.append(schema.PlayerScore(
                player_id=player_id,
                scorecard={
                    "ace": player_score.ace,
                    "dual": player_score.dual,
                    "triple": player_score.triple,
                    "quad": player_score.quad,
                    "penta": player_score.penta,
                    "hexa": player_score.hexa,
                    "bonus_available": bonus_value,  # Boolean -> Int
                    "chance": player_score.chance,
                    "poker": player_score.poker,
                    "full_house": player_score.full_house,
                    "small_straight": player_score.small_straight,
                    "large_straight": player_score.large_straight,
                    "turkey": player_score.turkey
                },
                total_score=total_score
            ))

    return schema.AllScores(scores=scores)


@router.delete("/{game_id}", response_model=schema.GameEndResult)
async def end_game(game_id: str, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """게임 종료 및 데이터 정리"""
    game = DiceGame.get_game(game_id)
    if not game:
        raise HTTPException(status_code=404, detail="게임을 찾을 수 없습니다")

    # DB에서 게임 설정 및 플레이어 점수 삭제
    crud.delete_game(db, game["setting_id"], game["players"])

    # 게임 종료 메시지 브로드캐스트
    background_tasks.add_task(
        broadcast_scores,
        game_id,
        {"game_id": game_id, "is_finished": True, "message": "게임이 종료되었습니다"}
    )

    # 인메모리 게임 상태 삭제
    DiceGame.delete_game(game_id)

    return schema.GameEndResult(success=True, message="게임이 종료되었습니다")