from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from app.routers.video_router import router as video_router
from app.routers.yacht_router import router as yacht_router
from app.video import VideoService
from app.websocket.manager import socket_app, test_emit_loop  # socket.IO 통합


# ✅ lifespan 정의 (앱 생명주기 동안 실행할 로직)
@asynccontextmanager
async def lifespan(app: FastAPI):
    # VideoService 인스턴스 생성 시 카메라 스레드 시작됨
    video_service = VideoService()

    # 테스트용 WebSocket emit 루프 시작
    import asyncio
    asyncio.create_task(test_emit_loop())

    yield  # 앱 실행 유지

    # 앱 종료 시 정리 작업
    print("⏳ 애플리케이션 종료 중... VideoService 중지 시도...")
    video_service.stop()


# ✅ FastAPI 앱 초기화
app = FastAPI(title="Turkey Games", lifespan=lifespan)

# ✅ CORS 설정 (프론트엔드 연결 허용)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 배포 시에는 보안상 도메인 제한 권장
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ 라우터 등록
app.include_router(yacht_router)
app.include_router(video_router)

# ✅ Socket.IO 앱 mount (WebSocket 실시간 통신)
app.mount("/ws", socket_app)


# ✅ 루트 테스트 엔드포인트
@app.get("/")
def read_root():
    return {"message": "Welcome to Turkey Games API"}


# ✅ 직접 실행 시 Uvicorn 서버 실행
if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
