from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from app.seat.seat_people_service import detect_seat_status, video_stream
from fastapi import HTTPException

router = APIRouter(
    prefix="/seat",
    tags=["seat"]
    )

@router.get("/detect_seat_status/")
async def detect_seat_status_api():
    try:
        seat_status = detect_seat_status()  # 사람 인식 및 좌석 감지
        return seat_status
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error in detecting seat status: {str(e)}")

@router.get("/video_feed/")
async def video_feed():
    try:
        # 실시간 비디오 스트리밍
        return StreamingResponse(video_stream(), media_type="multipart/x-mixed-replace; boundary=frame")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error in video stream: {str(e)}")
