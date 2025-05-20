import socketio
from typing import Dict, List, Any

from app.yacht.dice import DiceGame

# Socket.IO 서버 인스턴스 생성 시 CORS 설정
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins=["http://localhost:8000", "http://localhost:5173", "http://127.0.0.1:5500", "*"]
)

socket_app = socketio.ASGIApp(
    sio,
    socketio_path="socket.io"
)

# 게임별 플레이어 추적을 위한 딕셔너리
game_rooms: Dict[str, List[str]] = {}


@sio.event
async def connect(sid, environ, auth):
    """클라이언트 연결 시 호출"""
    print(f"Client connected: {sid}")


@sio.event
async def disconnect(sid):
    """클라이언트 연결 해제 시 호출"""
    print(f"Client disconnected: {sid}")
    # 모든 게임룸에서 해당 클라이언트 제거
    for game_id, sids in list(game_rooms.items()):
        if sid in sids:
            sids.remove(sid)
            if not sids:  # 룸이 비어있으면 제거
                del game_rooms[game_id]


@sio.event
async def join_game(sid, data):
    """게임 룸 참여"""
    game_id = data.get('game_id')
    if not game_id:
        return {"error": "게임 ID가 필요합니다."}

    if game_id not in game_rooms:
        game_rooms[game_id] = []

    if sid not in game_rooms[game_id]:
        game_rooms[game_id].append(sid)

    return {"success": True, "message": f"게임 {game_id}에 참여했습니다."}


@sio.event
async def leave_game(sid, data):
    """게임 룸 나가기"""
    game_id = data.get('game_id')
    if not game_id or game_id not in game_rooms:
        return {"error": "유효하지 않은 게임 ID입니다."}

    if sid in game_rooms[game_id]:
        game_rooms[game_id].remove(sid)
        if not game_rooms[game_id]:  # 룸이 비어있으면 제거
            del game_rooms[game_id]

    return {"success": True, "message": f"게임 {game_id}에서 나갔습니다."}

async def broadcast_scores(game_id: str, scores_data: Any):
    """특정 게임의 스코어 업데이트를 모든 참여자에게 브로드캐스트"""
    print(f"Broadcasting scores for game {game_id}: {scores_data}")

    # 모든 연결된 클라이언트에게 브로드캐스트
    await sio.emit('score_update', scores_data)

    print(f"Broadcasted to all connected clients")
    return True


async def on_dice_change(game_id: str,stable_values: List[tuple] , timeout: bool = False): #  dice_values: List[int]
    """주사위 값이 변경되었을 때 웹소켓으로 브로드캐스트"""
    game = DiceGame.get_game(game_id)
    from app.yacht.dice_monitor import dice_monitor
    if game and dice_monitor.game_monitors.get(game_id):
        if timeout:
            # 타임아웃 알림
            await sio.emit('dice_detection_timeout', {
                'game_id': game_id,
                'message': '주사위를 인식할 수 없습니다. 다시 시도해주세요.',
                'rolls_left': game["rolls_left"]
            })
        else:
            # NumPy int64를 Python int로 변환
            # dice_values = [int(val) for val in dice_values]
            dice_values = [int(v) for v, (x, y) in stable_values]
            coords = [(x, y) for _, (x, y) in stable_values]

            # 게임 상태 업데이트
            game["dice_values"] = dice_values

            print(f"게임 {game_id}: 주사위 값 전송 - {dice_values}")

            # 안정적인 주사위 값 감지 알림
            await sio.emit('dice_update', {
                'game_id': game_id,
                'dice_values': dice_values,
                'coords': coords,
                'rolls_left': game["rolls_left"],
                'status': 'detected'
            })

            # 값을 전송한 후 플래그 비활성화 (중복 전송 방지)
            dice_monitor.game_monitors[game_id]["waiting_for_roll"] = False

async def broadcast_end_game(game_id: str, scores_data: Any):
    """특정 게임의 스코어 업데이트를 모든 참여자에게 브로드캐스트"""
    print(f"Broadcasting scores for game {game_id}: {scores_data}")

    # 모든 연결된 클라이언트에게 브로드캐스트
    await sio.emit('end_game', scores_data)

    print(f"Broadcasted to all connected clients")
    return True