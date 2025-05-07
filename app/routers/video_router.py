from fastapi import APIRouter
from app.video.trigger_detector import TriggerDetector
from app.config import load_config
from app.video.service import VideoService

router = APIRouter(prefix="/video", tags=["video"])

# 서비스, 트리거 생성
video_service = VideoService()
trigger_detector = TriggerDetector(config=video_service.config, callback=video_service.on_trigger)

# TriggerDetector의 라우터를 video_router에 포함
router.include_router(trigger_detector.router)

@router.post("/trigger")
async def trigger_video():
    video_service.on_trigger()
    return {"status": "trigger_processed"}
