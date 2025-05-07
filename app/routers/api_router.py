from fastapi import APIRouter, Depends, Request
from app.video.service import VideoService


router = APIRouter()

@router.post("/trigger")
async def trigger_video_capture(request: Request, video_service: VideoService = Depends()):
    """
    API endpoint to trigger video capture.
    """
    data = await request.json()
    print(f"Received data: {data}")

    video_service.on_trigger()
    return {"message": "Video capture triggered", "data": data}
