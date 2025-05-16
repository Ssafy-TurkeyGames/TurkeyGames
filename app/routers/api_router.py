from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.video.shared_state import highlight_data_store # Import the shared state


router = APIRouter(
    prefix="/highlight",
    tags=["highlight"],
)

class HighlightVideoData(BaseModel):
    local_path: str
    minio_path: str
    qr_code: str
    local_qr_path: str 

@router.get("/{game_id}/{player_id}", response_model=HighlightVideoData)
async def get_highlight_video_data(game_id: str, player_id: str):

    key = f"{game_id}_{player_id}"
    highlight_data = highlight_data_store.get(key)

    if not highlight_data:
        raise HTTPException(status_code=404, detail=f"하이라이트 데이터가 없습니다.: {game_id}, player_id: {player_id}")

    return HighlightVideoData(**highlight_data)
