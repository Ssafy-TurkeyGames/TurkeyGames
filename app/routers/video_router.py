from fastapi import APIRouter, Depends
from app.video.service import VideoService

router = APIRouter(
    prefix="/video",
    tags=["video"]
)

def get_video_service():
    return VideoService()

@router.post("/trigger")
async def trigger_video(service: VideoService = Depends(get_video_service)):
    service.on_trigger()
    return {"status": "trigger_processed"}
