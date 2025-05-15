from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, Request
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db import crud
from app.yacht import schema
from app.yacht.dice import DiceGame
from app.yacht.dice_monitor import dice_monitor
from app.websocket.manager import broadcast_scores, game_rooms, sio, on_dice_change
from app.config.detaction_config import settings

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

    game_id = str(db_setting.id)

    DiceGame.games[game_id] = {
        "id": game_id,
        "setting_id": db_setting.id,
        "players": player_ids,
        "current_player_idx": 0,
        "dice_values": [0, 0, 0, 0, 0],
        "rolls_left": 3,
        "status": "waiting",
        "turn_counts": {player_id: 0 for player_id in player_ids}
    }

    # 게임 상태 생성
    game_state = schema.GameState(
        id=game_id,
        players=player_ids,
        current_player_idx=0,
        dice_values=[0, 0, 0, 0, 0],
        rolls_left=3,
        status="waiting"
    )

    if settings.AUTO_DICE_DETECTION_ENABLED:
        try:
            # 모니터링 시작
            dice_monitor.start_monitoring(game_id)
            # 콜백 설정
            dice_monitor.set_callback(game_id, on_dice_change)

            # 웹소켓으로 모니터링 시작 알림 (room 없이)
            background_tasks.add_task(sio.emit, 'monitoring_started', {
                "game_id": game_id,
                "message": "주사위 자동 인식이 시작되었습니다"
            })

        except Exception as e:
            print(f"주사위 모니터링 시작 실패: {e}")

    # 로비에 게임 생성 정보 전송
    background_tasks.add_task(sio.emit, 'game_created', {
        "game_id": game_id,
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
        request: Request, # 앱 상태 접근을 위함
        db: Session = Depends(get_db)
):
    """점수 선택 및 기록"""
    # 게임 상태 조회
    game = DiceGame.get_game(game_id)
    if game:
        game["dice_values"] = [0, 0, 0, 0, 0]
        game["rolls_left"] = 3

    if not game:
        raise HTTPException(status_code=404, detail="게임을 찾을 수 없습니다")

    current_player_id = game["players"][game["current_player_idx"]]
    if current_player_id != selection.player_id:
        raise HTTPException(status_code=400, detail="현재 플레이어의 턴이 아닙니다")

    # 점수 업데이트
    success = crud.update_player_score(db, selection.player_id, selection.category, selection.value)
    if success :
        game["turn_counts"][selection.player_id] += 1  # 턴 수 증가
        remaining_turns = 12 - game["turn_counts"][selection.player_id]
    
        # 2. 하이라이트 트리거 호출 추가 (아래 코드 추가)
        yacht_detector = request.app.state.yacht_highlight_detector
        all_scores = await get_scores(game_id, db)  # 기존 코드 재사용
        background_tasks.add_task(
            yacht_detector.process_game_state,
            game_id,
            selection.player_id,
            game["dice_values"],
            {str(s.player_id): s.dict() for s in all_scores.scores},
            remaining_turns
        )
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

    dice_monitor.stop_monitoring(game_id)

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


@router.get("/{game_id}/dice/current")
async def get_current_dice(game_id: str):
    """현재 인식된 주사위 값 조회"""
    values = dice_monitor.get_current_values(game_id)
    return {"game_id": game_id, "dice_values": values}

@router.post("/{game_id}/monitoring/toggle")
async def toggle_monitoring(game_id: str, enable: bool):
    """게임의 모니터링 켜기/끄기"""
    if enable:
        dice_monitor.start_monitoring(game_id)
        dice_monitor.set_callback(game_id, on_dice_change)
        return {"message": "모니터링이 시작되었습니다"}
    else:
        dice_monitor.stop_monitoring(game_id)
        return {"message": "모니터링이 중지되었습니다"}