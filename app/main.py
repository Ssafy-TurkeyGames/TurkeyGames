from contextlib import asynccontextmanager
import asyncio

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.docs import get_swagger_ui_html  # ✅ 추가
import uvicorn

from app.routers import yacht_router
from app.routers import fivesec_router
from app.routers import download_router
from app.routers import api_router 
from app.routers.video_router import create_video_router
from app.video.yacht_highlight_detector import YachtHighlightDetector
from app.websocket.manager import socket_app
from app.video import VideoService
# from app.video.trigger_detector import TriggerDetector

# ✅ Swagger 자동 docs 끔 → 직접 커스터마이징
app = FastAPI(
    title="Turkey Games"
)

# ✅ Swagger UI 직접 구성
@app.get("/docs", include_in_schema=False)  # 이 부분을 수정 (/fastapi 제거)
async def custom_swagger_ui_html():
    return get_swagger_ui_html(
        openapi_url="/openapi.json",  # 이 부분을 수정 (/fastapi 제거)
        title="Turkey Games Swagger",
        swagger_js_url="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.9.0/swagger-ui-bundle.js",
        swagger_css_url="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.9.0/swagger-ui.css"
    )
# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 실제 배포 시에는 특정 도메인으로 제한
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(yacht_router)
app.include_router(fivesec_router)
app.include_router(download_router.router) # Include the download router
app.include_router(api_router.router)


# video 초기화
# @asynccontextmanager
# async def lifespan(app_instance: FastAPI):
@app.on_event("startup")
async def startup_event():
    print("🚀 애플리케이션 시작: 서비스 초기화...")
    video_service = VideoService()
    # app_instance.state.video_service = video_service
    app.state.video_service = video_service

    current_loop = asyncio.get_event_loop()
    # trigger_detector = TriggerDetector(
    #     config=video_service.config,
    #     callback=video_service.on_trigger,
    #     loop=current_loop
    # )
    # app_instance.state.trigger_detector = trigger_detector
    # app.state.trigger_detector = trigger_detector

    # 야추 하이라이트 디텍터 초기화.
    yacht_highlight_detector = YachtHighlightDetector(video_service)
    # app_instance.state.yacht_highlight_detector = yacht_highlight_detector
    app.state.yacht_highlight_detector = yacht_highlight_detector

    # video_router만 의존성이 필요하므로 lifespan 내부에서 생성 및 등록
    video_router_instance = create_video_router(video_service) #,trigger_detector
    # app_instance.include_router(video_router_instance)
    # app.state.video_router = video_router_instance
    app.include_router(video_router_instance)

    print("✅ Services initialized and routers included.")
    # yield

    # print("⏳ 애플리케이션 종료 및 VideoService 중지 시도...")
    # video_service.stop()
    # print("🛑 VideoService 중지 완료.")

# Assign lifespan to the app
# app.lifespan = lifespan
# shutdown_event 
@app.on_event("shutdown")
async def shutdown_event():
    print("⏳ 애플리케이션 종료: 서비스 중지 시도...")
    app.state.video_service.stop()
    print("🛑 VideoService 중지 완료.")


@app.get("/")
def read_root():
    return {"message": "Welcome to Turkey Games API"}

# Socket.IO 앱 마운트
app.mount("/", socket_app) #>>socket_app mount 경로 변경 (가장 권장)
# app.mount("/ws", socket_app)  # 👉 웹소켓 전용 prefix 부여

# This code will only run if this file is executed directly (not imported)
if __name__ == "__main__":
    # Run the server with Uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
