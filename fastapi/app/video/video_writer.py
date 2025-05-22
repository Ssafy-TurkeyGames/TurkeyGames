import cv2
import os
import subprocess # ffmpeg 호출용
import tempfile 
from datetime import datetime
from typing import List, Tuple, Optional
from app.video.buffer_manager import AudioRingBuffer 


class VideoSaver:
    def __init__(self, output_dir: str, codec: str, fps: float, audio_config: dict):
        self.output_dir = output_dir
        self.codec = codec
        self.fps = fps
        self.audio_config = audio_config # 오디오 설정 저장
        self._create_output_dir()

    def _create_output_dir(self):
        """출력 디렉토리 생성 (없을 경우)"""
        os.makedirs(self.output_dir, exist_ok=True)

    def _get_video_writer(self, filename: str, resolution: Tuple[int, int]):
        """VideoWriter 생성 (임시 비디오 파일용 - AVI/XVID)"""
        temp_codec = 'XVID' # 임시 AVI 파일에 XVID 사용
        fourcc = cv2.VideoWriter_fourcc(*temp_codec)
        return cv2.VideoWriter(
            filename, # tempfile의 직접 경로 사용
            fourcc,
            self.fps,
            resolution
        ), filename # 원본 파일명 반환

    def _get_final_file_ext(self) -> str:
        """최종 출력 파일 확장자 결정 (MP4 선호)"""
        return 'mp4' # 최종 출력은 MP4

    def _merge_audio_video(self, video_path: str, audio_path: str, output_path: str) -> bool:
        """ffmpeg를 사용하여 오디오와 비디오 병합"""
        # ffmpeg.exe의 전체 경로를 명시적으로 지정 추후 변경 가능... 
        ffmpeg_executable = r'C:\ffmpeg\bin\ffmpeg.exe' # Windows 경로에 raw string 사용
        
        # 지정된 경로에 실행 파일이 있는지 확인
        if not os.path.exists(ffmpeg_executable):
            print(f"❌ FFmpeg 오류: 실행 파일 '{ffmpeg_executable}'을(를) 찾을 수 없습니다. 경로를 확인하세요.")
            # 하드코딩된 경로가 잘못된 경우 PATH 조회로 대체
            ffmpeg_executable = 'ffmpeg' 
            print("⚠️ 하드코딩된 FFmpeg 경로를 찾을 수 없어 PATH에서 'ffmpeg'를 다시 시도합니다.")

        command = [
            ffmpeg_executable, # 전체 경로 또는 대체 경로 사용
            '-y',             # 출력 파일 덮어쓰기
            '-i', video_path, # 입력 비디오 파일 (현재 AVI)
            '-i', audio_path, # 입력 오디오 파일
            '-c:v', 'libx264', # 비디오를 MP4용 H.264로 재인코딩
            '-preset', 'fast', # 인코딩 속도/품질 절충
            '-crf', '23',      # 고정 비율 계수 (품질, 18-28이 좋은 범위)
            '-c:a', 'aac',    # 오디오를 AAC로 인코딩
            '-b:a', '192k',   # 오디오 비트 전송률
            '-strict', 'experimental', 
            '-shortest',      # 가장 짧은 입력 스트림이 끝나면 종료
            output_path       # 출력 파일
        ]
        print(f"🏃‍♀️ 실행 중인 FFmpeg 명령어: {' '.join(command)}")
        try:
            result = subprocess.run(command, check=True, capture_output=True, text=True)
            print("✅ FFmpeg 병합 성공")
            print("FFmpeg stdout:", result.stdout)
            print("FFmpeg stderr:", result.stderr) # Stderr은 종종 진행률/정보를 포함합니다
            return True
        except FileNotFoundError:
            print("❌ FFmpeg 오류: 'ffmpeg' 명령어를 찾을 수 없습니다. 시스템에 FFmpeg가 설치되어 있고 PATH에 있는지 확인하세요.")
            return False
        except subprocess.CalledProcessError as e:
            print(f"❌ FFmpeg 병합 실패: {e}")
            print("FFmpeg stdout:", e.stdout)
            print("FFmpeg stderr:", e.stderr)
            return False
        except Exception as e:
            print(f"❌ FFmpeg 실행 중 예외 발생: {e}")
            return False

    def save_clip(self, frames: List, resolution: Tuple[int, int], audio_buffer: AudioRingBuffer, base_filename_prefix: Optional[str] = None) -> Optional[str]:
        """비디오 프레임과 오디오 버퍼를 받아 최종 비디오 파일로 저장"""
        if not frames:
            print("⚠️ 저장할 비디오 프레임이 없습니다.")
            return None

        temp_video_path = None
        temp_audio_path = None
        final_output_path = None

        try:
            self._create_output_dir()

            if base_filename_prefix:
                filename_part = base_filename_prefix
            else:
                filename_part = f"clip_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

            # 최종 출력 경로 정의
            final_output_path = os.path.abspath(
                f"{self.output_dir}/{filename_part}.{self._get_final_file_ext()}" # .mp4여야 합니다
            )

            # 비디오 프레임을 임시 AVI 파일로 저장
            with tempfile.NamedTemporaryFile(suffix='.avi', delete=False) as temp_video_file_obj:
                temp_video_path = temp_video_file_obj.name
            
            # .avi 임시 파일의 직접 경로를 writer에 전달
            out, written_temp_video_path = self._get_video_writer(temp_video_path, resolution)
            if not out.isOpened():
                 print(f"❌ 임시 비디오 파일({written_temp_video_path})을 열 수 없습니다.")
                 raise IOError(f"임시 비디오 파일을 열 수 없습니다: {written_temp_video_path}")
            for frame in frames:
                out.write(frame)
            out.release() # 중요: 비디오 writer 해제
            print(f"✅ 임시 비디오 저장 완료: {temp_video_path} ({len(frames)} 프레임)")

            with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as temp_audio_file:
                temp_audio_path = temp_audio_file.name

            audio_saved = audio_buffer.save_to_wav(
                temp_audio_path,
                sample_rate=self.audio_config['sample_rate'],
                channels=self.audio_config['channels']
            )

            if not audio_saved:
                print("⚠️ 오디오 데이터 저장 실패. 오디오 없이 비디오만 저장합니다.")
                os.rename(temp_video_path, final_output_path)
                print(f"✅ 오디오 없이 비디오 저장 완료: {final_output_path}")
                temp_video_path = None # 나중에 삭제 방지
                return final_output_path

            # 3. 병합
            print(f"🔄 오디오/비디오 병합 시작: 비디오='{temp_video_path}', 오디오='{temp_audio_path}', 출력='{final_output_path}'")
            merge_success = self._merge_audio_video(temp_video_path, temp_audio_path, final_output_path)

            if merge_success:
                print(f"✅ 최종 비디오(오디오 포함) 저장 완료: {final_output_path}")
                return final_output_path
            else:
                print(f"❌ 오디오/비디오 병합 실패. 최종 파일이 생성되지 않았을 수 있습니다.")
                return None # 실패 표시

        except Exception as e:
            print(f"❌ 클립 저장 중 예외 발생: {str(e)}")
            # 전체 트레이스백 로깅 고려
            return None
        finally:
            # 4. 임시 파일 정리
            if temp_video_path and os.path.exists(temp_video_path):
                try:
                    os.remove(temp_video_path)
                    print(f"🗑️ 임시 비디오 파일 삭제: {temp_video_path}")
                except Exception as e:
                    print(f"⚠️ 임시 비디오 파일 삭제 실패 ({temp_video_path}): {e}")
            if temp_audio_path and os.path.exists(temp_audio_path):
                try:
                    os.remove(temp_audio_path)
                    print(f"🗑️ 임시 오디오 파일 삭제: {temp_audio_path}")
                except Exception as e:
                    print(f"⚠️ 임시 오디오 파일 삭제 실패 ({temp_audio_path}): {e}")
