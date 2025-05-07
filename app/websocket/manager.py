import socketio
import asyncio

# ✅ Socket.IO 서버 객체
sio = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins="*")
socket_app = socketio.ASGIApp(sio)

# ✅ 클라이언트 연결 시
@sio.event
async def connect(sid, environ):
    print("🟢 Client connected:", sid)

# ✅ 클라이언트 연결 해제 시
@sio.event
async def disconnect(sid):
    print("🔴 Client disconnected:", sid)

# ✅ 서버 → 클라이언트 데이터 전송 함수
async def send_dice_data(data: dict):
    await sio.emit("dice_result", data)

async def test_emit_loop():
    while True:
        await asyncio.sleep(2)
        value = random.randint(1, 6)
        await send_dice_data({"dice": value})
        print(f"📤 무한 루프 전송: {value}")
