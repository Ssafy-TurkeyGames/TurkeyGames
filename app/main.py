from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from app.routers.yacht_router import router as yacht_router

from app.routers import yacht_router
from app.websocket.manager import socket_app

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

@app.get("/")
def read_root():
    return {"message": "Welcome to Turkey Games API"}

# Socket.IO 앱 마운트
app.mount("/", socket_app)

# This code will only run if this file is executed directly (not imported)
if __name__ == "__main__":
    # Run the server with Uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)