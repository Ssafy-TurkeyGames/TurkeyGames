from fastapi import APIRouter, Depends
from app.video.service import VideoService
from app.video.trigger_detector import TriggerDetector
# No need to import load_config here if config comes from VideoService

# Factory function to create the video router with dependencies
def create_video_router(video_service_instance: VideoService, trigger_detector_instance: TriggerDetector):
    router = APIRouter(prefix="/video", tags=["video"])

    # Include TriggerDetector's router
    # The TriggerDetector instance passed here is already initialized with the correct callback
    router.include_router(trigger_detector_instance.router)

    @router.post("/manual_trigger") # Renamed for clarity, or keep as /trigger if preferred
    async def manual_trigger_video():
        # Use the VideoService instance passed to the factory
        await video_service_instance.on_trigger()
        return {"status": "manual_trigger_processed"}

    # Example: Endpoint to get video service status (optional)
    @router.get("/status")
    async def get_video_status():
        return {
            "is_camera_ready": video_service_instance.is_buffer_ready,
            "is_saving": video_service_instance.is_saving,
            "buffer_max_frames": video_service_instance.buffer.max_frames,
            "output_dir": video_service_instance.saver.output_dir
        }
        
    return router
