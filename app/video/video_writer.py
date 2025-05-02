import cv2
import os
from datetime import datetime
from typing import List


class VideoSaver:
    def __init__(self, output_dir: str, codec: str, fps: float):
        self.output_dir = output_dir
        self.codec = codec
        self.fps = fps
        self._create_output_dir()

    def _create_output_dir(self):
        """출력 디렉토리 생성 (없을 경우)"""
        os.makedirs(self.output_dir, exist_ok=True)

    def _get_writer(self, filename: str, resolution: tuple):
        """코덱별 VideoWriter 생성"""
        fourcc = cv2.VideoWriter_fourcc(*self.codec)
        return cv2.VideoWriter(
            filename,
            fourcc,
            self.fps,
            resolution
        )

    def _get_file_ext(self) -> str:
        codec_ext_map = {
            'XVID': 'avi',
            'H264': 'mp4',
            'MJPG': 'avi',
            'MP4V': 'mp4'
        }
        return codec_ext_map.get(self.codec, 'avi')

    def save_clip(self, frames: List, resolution: tuple):
        if not frames:
            print("⚠️ 저장할 프레임이 없습니다.")
            return

        try:
            self._create_output_dir()  # 저장 전 디렉토리 재확인
            filename = os.path.abspath(  # 절대 경로 사용
                f"{self.output_dir}/clip_{datetime.now().strftime('%Y%m%d_%H%M%S')}.{self._get_file_ext()}"
            )
            out = self._get_writer(filename, resolution)
            for frame in frames:
                out.write(frame)
            print(f"✅ {filename} 저장 완료 ({len(frames)}프레임)")
        except Exception as e:
            print(f"❌ 저장 실패: {str(e)}")
            raise  # 오류 상세 정보 출력
