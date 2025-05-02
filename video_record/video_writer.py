import cv2
import os
from datetime import datetime
from typing import List


class VideoSaver:
    def __init__(self, config: dict):
        self.output_dir = config['output']['dir']
        self.codec = config['video']['codec']
        self.fps = config['video']['fps']
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

    def save_clip(self, frames: List, resolution: tuple):
        """프레임 리스트를 영상 파일로 저장"""
        if not frames:
            return

        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"{self.output_dir}/clip_{timestamp}.{self._get_file_ext()}"

        try:
            out = self._get_writer(filename, resolution)
            for frame in frames:
                out.write(frame)
        finally:
            out.release()

    def _get_file_ext(self) -> str:
        """코덱별 파일 확장자 매핑"""
        codec_ext_map = {
            'XVID': 'avi',
            'H264': 'mp4',
            'MP4V': 'mp4'
        }
        return codec_ext_map.get(self.codec, 'avi')
