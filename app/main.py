from contextlib import asynccontextmanager
import asyncio
import cv2
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.docs import get_swagger_ui_html  # ✅ 추가
import uvicorn

from app.routers import yacht_router
from app.routers import fivesec_router
from app.routers import download_router # Import the new download router
from app.routers.video_router import create_video_router
from app.video.yacht_highlight_detector import YachtHighlightDetector
from app.websocket.manager import socket_app
from app.video import VideoService
# from app.video.trigger_detector import TriggerDetector
from app.video.camera_manager import camera_manager
from app.yacht.dice_monitor import dice_monitor
from app.config.detaction_config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 서버 시작 시
    try:
        # 1. 카메라 매니저 시작 (가장 먼저)
        camera_index = settings.DICE_CAMERA_INDEX  # 또는 video_config에서 가져오기
        camera_manager.start_camera(camera_index)
        print("✅ CameraManager 시작됨")

        # 2. VideoService 초기화
        video_service = VideoService()
        app.state.video_service = video_service
        print("✅ VideoService 초기화됨")

        # 3. YachtHighlightDetector 초기화
        yacht_highlight_detector = YachtHighlightDetector(video_service)
        app.state.yacht_highlight_detector = yacht_highlight_detector
        print("✅ YachtHighlightDetector 초기화됨")

        # 4. Video router 생성 및 등록
        video_router_instance = create_video_router(video_service)
        app.include_router(video_router_instance)
        print("✅ Video router 등록됨")

        # 5. 주사위 모니터링 시작
        if settings.AUTO_DICE_DETECTION_ENABLED:
            dice_monitor.start_monitoring("preview")
            if settings.DICE_SHOW_PREVIEW:
                dice_monitor.set_preview(True)
            print("✅ 주사위 모니터링 시작됨")

    except Exception as e:
        print(f"❌ 초기화 실패: {e}")
        raise

    yield

    # 서버 종료 시
    try:
        print("⏳ 서비스 종료 중...")

        # 1. 주사위 모니터링 중지
        if settings.AUTO_DICE_DETECTION_ENABLED:
            dice_monitor.stop_monitoring("preview")

        # 2. VideoService 중지
        app.state.video_service.stop()

        # 3. 카메라 매니저 중지 (모든 구독자에게 알림)
        camera_manager.stop_camera()

        # 4. 창 닫기
        cv2.destroyAllWindows()

        print("✅ 모든 서비스 종료됨")
    except Exception as e:
        print(f"❌ 종료 중 오류: {e}")

# ✅ Swagger 자동 docs 끔 → 직접 커스터마이징
app = FastAPI(
    title="Turkey Games",
    lifespan=lifespan
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
