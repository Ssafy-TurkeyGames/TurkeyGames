from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from app.routers.video_router import router as video_router
from app.routers.yacht_router import router as yacht_router
from app.routers.api_router import router as api_router
from app.video import VideoService

# FastAPI 앱 초기화
app = FastAPI(title="Turkey Games")

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 실제 배포 시에는 특정 도메인으로 제한
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(yacht_router)
app.include_router(video_router)
app.include_router(api_router)

# video 초기화
@asynccontextmanager
async def lifespan(app: FastAPI):
    # VideoService 인스턴스 생성 시 __init__에서 카메라 스레드가 시작됨
    video_service = VideoService()
    yield
    # 애플리케이션 종료 시 필요한 정리 작업 (예: video_service.stop()) 추가 가능
    print("⏳ 애플리케이션 종료 중... VideoService 중지 시도...")
    video_service.stop() # 애플리케이션 종료 시 서비스 중지

@app.get("/")
def read_root():
    return {"message": "Welcome to Turkey Games API"}


# This code will only run if this file is executed directly (not imported)
if __name__ == "__main__":
    # Run the server with Uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
