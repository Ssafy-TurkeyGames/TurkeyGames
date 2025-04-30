# video_writer.py
import cv2
from datetime import datetime


class VideoSaver:
    def __init__(self, output_dir="output"):
        self.output_dir = output_dir
        self.fourcc = cv2.VideoWriter_fourcc(*'XVID')

    def save_clip(self, frames, resolution=(640, 480)):
        filename = f"{self.output_dir}/clip_{datetime.now().strftime('%Y%m%d_%H%M%S')}.avi"
        out = cv2.VideoWriter(filename, self.fourcc, 30.0, resolution)

        for frame in frames:
            out.write(frame)
        out.release()
