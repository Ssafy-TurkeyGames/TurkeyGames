from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from app.seat.seat_people_service import detect_seat_status, video_stream, get_seat_occupancy
from fastapi import HTTPException

router = APIRouter(
    prefix="/seat",
    tags=["seat"]
    )

# 실시간 비디오 스트리밍
@router.get("/video_feed/")
async def video_feed():
    try:
        return StreamingResponse(video_stream(), media_type="multipart/x-mixed-replace; boundary=frame")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error in video stream: {str(e)}")
    
# 착석여부 판별
@router.get("/detect_seat_status/")
async def detect_seat_status_api():
    try:
        seat_status = detect_seat_status()  # 사람 인식 및 좌석 감지
        return seat_status
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error in detecting seat status: {str(e)}")

# 착석여부 안정화 및 번호 부여    
@router.get("/seats/assigned")
def get_assigned_seats():
    """
    현재 앉은 좌석에 대해 1번부터 순서대로 부여된 매핑을 반환
    """
    assigned = get_ordered_seat_mapping()
    return {"seats": assigned}

