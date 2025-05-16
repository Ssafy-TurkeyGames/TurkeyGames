# app/video/video_service.py 수정 버전
import cv2
import os
import time
import asyncio
import threading
from threading import Event
from typing import Dict, Optional
import uuid
from pathlib import Path
import pathlib # 디렉토리 생성을 위함
import numpy as np

from minio import Minio
from minio.error import S3Error
import qrcode

from app.video.buffer_manager import AudioRingBuffer, CircularBuffer
from app.video.video_writer import VideoSaver
from app.video.camera_manager import camera_manager  # 추가
from app.config import load_config
from datetime import datetime, timedelta
from app.video.shared_state import highlight_data_store # Import the shared state

os.environ["OPENCV_VIDEOIO_MSMF_ENABLE_HW_TRANSFORMS"] = "0"


class VideoService:

    def __init__(self):
        self.config = self._validate_config(load_config('video_config.yaml'))
        self.minio_config = load_config('minio_config.yaml')
        self._validate_minio_config()

        self.is_buffer_ready = False
        self.is_saving = False
        self.buffer = CircularBuffer(
            max_frames=self.config['buffer']['max_frames'],
            frame_width=self.config['camera']['width'],
            frame_height=self.config['camera']['height']
        )
        self.saver = VideoSaver(
            output_dir=self.config['output']['dir'],
            codec=self.config['video']['codec'],
            fps=self.config['video']['fps'],
            audio_config=self.config['audio']
        )
        self.minio_client = self._init_minio_client()
        self._ensure_qr_output_dir()

        # 카메라 매니저에 구독
        camera_manager.subscribe("video_service", self._on_frame_received)
        self.is_buffer_ready = True  # 카메라 매니저가 관리하므로 바로 준비 상태

        # 오디오 버퍼 초기화
        self.audio_cfg = self.config['audio']
        audio_sr = self.audio_cfg['sample_rate']
        channels = self.audio_cfg['channels']
        buf_size = self.audio_cfg['frames_per_buffer']
        wav_dir = self.audio_cfg['wav_dir']
        pre_sec = self.config['buffer']['pre_seconds']
        maxlen = int(audio_sr * pre_sec)
        os.makedirs(wav_dir, exist_ok=True)
        print(f"✅ 오디오 WAV 저장 디렉토리 확인: {wav_dir}")
        self.audio_buffer = AudioRingBuffer(maxlen_frames=maxlen)

        # sounddevice or pyaudio 선택
        print("🔊 [Audio Init] 시작")
        try:
            import sounddevice as sd
            print("🔊 sounddevice import 성공")
            self.audio_stream = sd.InputStream(
                device=1,
                samplerate=audio_sr,
                channels=1,
                dtype='int16',
                callback=self.audio_buffer.callback
            )
            self.audio_stream.start()
            self.audio_backend = "sounddevice"
            print("✅ Sounddevice 오디오 스트림 시작됨.")
        except Exception as e:
            print(f"⚠️ Sounddevice 초기화 실패: {e}, PyAudio 사용")
            try:
                import pyaudio
                self.audio_backend = "pyaudio"
                self.pa = pyaudio.PyAudio()

                def pyaudio_callback(in_data, frame_count, time_info, status):
                    audio_data = np.frombuffer(in_data, dtype=np.int16)
                    self.audio_buffer.callback(audio_data, frame_count, time_info, status)
                    return (None, pyaudio.paContinue)

                self.audio_stream = self.pa.open(
                    format=pyaudio.paInt16,
                    channels=1,
                    rate=audio_sr,
                    input=True,
                    frames_per_buffer=1024,
                    stream_callback=pyaudio_callback
                )
                self.audio_stream.start_stream()
                print("✅ PyAudio 오디오 스트림 시작됨.")
            except Exception as e_pa:
                print(f"❌ PyAudio 초기화 실패: {e_pa}. 오디오 기능 사용 불가.")
                self.audio_backend = None
                self.audio_stream = None

    def _on_frame_received(self, frame):
        """카메라 매니저로부터 프레임 받기"""
        # 버퍼에 프레임 추가
        self.buffer.add_frame(frame)

    def _validate_config(self, config: dict) -> dict:
        """필수 설정 값 검증"""
        required_keys = {
            'camera': ['index', 'width', 'height'],
            'buffer': ['pre_seconds', 'post_seconds', 'max_frames'],
            'video': ['codec', 'fps'],
            'output': ['dir']
        }

        for section, keys in required_keys.items():
            if section == 'minio':
                continue
            if section not in config:
                raise ValueError(f"Config 섹션 '{section}' 누락")
            for key in keys:
                if key not in config[section]:
                    raise ValueError(f"Config 키 '{section}.{key}' 누락")
        return config

    def _validate_minio_config(self):
        """minio_config.yaml 필수 설정 값 검증"""
        if not self.minio_config:
            raise ValueError("MinIO 설정 파일(minio_config.yaml) 로드 실패 또는 내용 없음")

        required_minio_keys = ['endpoint', 'bucket_name', 'secure', 'qr_code_base_url', 'qr_output_dir']
        for key in required_minio_keys:
            if key not in self.minio_config:
                raise ValueError(f"MinIO 설정 키 '{key}' 누락 (minio_config.yaml)")

        if not os.getenv('MINIO_ACCESS_KEY'):
            print("⚠️ 경고: 환경 변수 'MINIO_ACCESS_KEY'가 설정되지 않았습니다.")

        if not os.getenv('MINIO_SECRET_KEY'):
            print("⚠️ 경고: 환경 변수 'MINIO_SECRET_KEY'가 설정되지 않았습니다.")

    def _init_minio_client(self) -> Optional[Minio]:
        """MinIO 클라이언트 초기화 (환경 변수 사용)"""
        if not self.minio_config:
            print("⚠️ MinIO 설정이 로드되지 않아 클라이언트를 초기화할 수 없습니다.")
            return None

        access_key = os.getenv('MINIO_ACCESS_KEY')
        secret_key = os.getenv('MINIO_SECRET_KEY')

        if not access_key or not secret_key:
            print("❌ MinIO Access Key 또는 Secret Key가 환경 변수에 설정되지 않았습니다. MinIO 초기화 실패.")
            return None

        try:
            client = Minio(
                self.minio_config['endpoint'],
                access_key=access_key,
                secret_key=secret_key,
                secure=self.minio_config['secure']
            )
            bucket_name = self.minio_config['bucket_name']
            found = client.bucket_exists(bucket_name)
            if not found:
                client.make_bucket(self.minio_config['bucket_name'])
                print(f"✅ MinIO 버킷 '{self.minio_config['bucket_name']}' 생성됨")
            else:
                print(f"✅ MinIO 버킷 '{self.minio_config['bucket_name']}' 확인됨")
            print("✅ MinIO 클라이언트 초기화 성공")
            return client
        except Exception as e:
            print(f"❌ MinIO 클라이언트 초기화 실패: {e}")
            return None

    def _ensure_qr_output_dir(self):
        """QR 코드 출력 디렉토리 생성 (없을 경우)"""
        if self.minio_config and self.minio_config.get('qr_output_dir'):
            pathlib.Path(self.minio_config['qr_output_dir']).mkdir(parents=True, exist_ok=True)
            print(f"✅ QR 코드 저장 디렉토리 확인/생성: {self.minio_config['qr_output_dir']}")

    def initialize(self):
        """모듈 초기화 - 카메라 매니저가 관리하므로 특별한 작업 없음"""
        print("✅ VideoService 초기화됨 (카메라는 CameraManager가 관리)")

    async def on_trigger(self, metadata: Dict):
        """트리거 콜백 핸들러 - metadata 포함, post_seconds 만큼 지연 후 저장 시작"""
        if not self.is_buffer_ready:
            print("⚠️ 트리거 발생했으나 버퍼가 준비되지 않음")
            return

        if self.is_saving:
            print("⚠️ 트리거 발생했으나 현재 다른 클립 저장 중")
            return

        self.is_saving = True
        post_seconds = self.config['buffer']['post_seconds']
        trigger_type_log = metadata.get('trigger_type', '알 수 없음')
        player_id_log = metadata.get('player_id', '알 수 없음')
        print(f"🎥 P{player_id_log} 플레이어의 '{trigger_type_log}' 트리거 감지! {post_seconds}초 후 저장 예정...")
        asyncio.create_task(self._delayed_finalize_and_save_clip(post_seconds, metadata))

    async def _delayed_finalize_and_save_clip(self, delay: float, metadata: Dict):
        await asyncio.sleep(delay)
        await self._finalize_and_save_clip(metadata)

    async def _finalize_and_save_clip(self, metadata: Dict):
        """post_seconds 경과 후 실제 클립 생성, 저장, 업로드, QR 생성 로직"""
        trigger_type_log = metadata.get('trigger_type', '알 수 없음')
        player_id_log = metadata.get('player_id', '알 수 없음')
        print(f"⏰ {self.config['buffer']['post_seconds']}초 경과. P{player_id_log} 플레이어의 '{trigger_type_log}' 클립 처리 시작...")
        local_file_path = None

        try:
            pre_seconds = self.config['buffer']['pre_seconds']
            post_seconds = self.config['buffer']['post_seconds']
            fps = self.config['video']['fps']

            clip_frames = self.buffer.get_clip(pre_seconds=pre_seconds, post_seconds=post_seconds, fps=fps)

            if not clip_frames:
                print("⚠️ 클립 생성 실패 (get_clip에서 빈 리스트 반환). 버퍼에 프레임이 부족하거나 기타 문제가 발생.")
                return
            print(f"🔊 오디오 버퍼 길이: {len(self.audio_buffer.buffer)}")

            print(f"🎞️ 클립 프레임 ({len(clip_frames)}개) 검색 완료. 저장 시작...")
            resolution = (int(self.config['camera']['width']), int(self.config['camera']['height']))

            trigger_type = metadata.get('trigger_type', 'unknown').replace(" ", "_")
            player_id = metadata.get('player_id', 'unknown')
            timestamp_str = datetime.now().strftime('%Y%m%d_%H%M%S')
            base_filename = f"highlight_P{player_id}_{trigger_type}_{timestamp_str}"

            local_file_path = self.saver.save_clip(
                frames=clip_frames,
                resolution=resolution,
                audio_buffer=self.audio_buffer,
                base_filename_prefix=base_filename
            )

            if not local_file_path:
                print("❌ 로컬 클립 저장 실패 (VideoSaver에서 None 반환).")
                return

            print(f"✅ 로컬 클립 저장 완료: {local_file_path}")

            if not self.minio_client or not self.minio_config:
                print("⚠️ MinIO 클라이언트 또는 설정이 없음음.")
                return

            file_extension = pathlib.Path(local_file_path).suffix
            game_id = metadata.get('game_id', 'unknown')
            minio_object_name = f"highlights/game_{game_id}/P{player_id}/{base_filename}{file_extension}"

            print(f"☁️ MinIO 업로드 시작: {minio_object_name} (버킷: {self.minio_config['bucket_name']})")
            self.minio_client.fput_object(
                self.minio_config['bucket_name'],
                minio_object_name,
                local_file_path
            )
            print(f"✅ MinIO 업로드 완료: {minio_object_name}")

            download_url = self.minio_client.presigned_get_object(
                self.minio_config['bucket_name'],
                minio_object_name,
            )

            qr_img = qrcode.make(download_url)
            qr_filename = f"{base_filename}.png"
            qr_filepath = os.path.join(self.minio_config['qr_output_dir'], qr_filename)
            qr_img.save(qr_filepath)
            print(f"📱 QR 코드 생성 완료: {qr_filepath} (URL: {download_url})")

            # Store the highlight data in the shared state
            game_id = metadata.get('game_id', 'unknown')
            player_id = metadata.get('player_id', 'unknown')
            key = f"{game_id}_{player_id}"
            normalized_local = Path(local_file_path).as_posix() 
            normalized_qr    = Path(qr_filepath).as_posix()
            # Store the paths in the shared state
            highlight_data_store[key] = {
                # "local_path": local_file_path,
                "local_path": normalized_local, 
                "minio_path": minio_object_name, 
                "qr_code": download_url, 
                # "local_qr_path": qr_filepath 
                "local_qr_path": normalized_qr
            }
            print(f"✅ 하이라이트 데이터 공유 상태에 저장됨: 키 '{key}', 데이터: {highlight_data_store[key]}")


        except S3Error as s3e:
            print(f"❌ MinIO S3 오류 발생: {s3e}")
        except Exception as e:
            print(f"❌ 클립 처리 중 예외 발생: {e}")
        finally:
            self.is_saving = False
            print("🔄 저장 상태 플래그 해제.")

    async def _schedule_deletion(self, local_path: str, minio_object: str, delay_seconds: int):
        """지정된 시간 후 로컬 및 MinIO 파일 삭제."""
        await asyncio.sleep(delay_seconds)
        print(f"⏰ {delay_seconds}초 경과. 파일 삭제 시도: 로컬='{local_path}', MinIO='{minio_object}'")

        try:
            if os.path.exists(local_path):
                os.remove(local_path)
                print(f"🗑️ 로컬 파일 삭제 성공: {local_path}")
            else:
                print(f"⚠️ 로컬 파일을 찾을 수 없습니다 (이미 삭제되었을 수 있음): {local_path}")
        except Exception as e:
            print(f"❌ 로컬 파일 삭제 중 오류 발생: {e}")

        if self.minio_client and self.minio_config:
            try:
                self.minio_client.remove_object(self.minio_config['bucket_name'], minio_object)
                print(f"🗑️ MinIO 객체 삭제 성공: {minio_object}")
            except S3Error as s3e:
                print(f"❌ MinIO 객체 삭제 중 S3 오류 발생: {s3e}")
            except Exception as e:
                print(f"❌ MinIO 객체 삭제 중 알 수 없는 오류 발생: {e}")
        else:
            print("⚠️ MinIO 클라이언트 또는 설정이 없어 MinIO 객체 삭제를 건너뛴다.")

    def stop(self):
        """서비스 중지"""
        print("⏳ VideoService 중지를 요청합니다...")

        # 카메라 매니저 구독 해제
        camera_manager.unsubscribe("video_service")

        # 오디오 스트림 중지
        if self.audio_backend == "sounddevice":
            if self.audio_stream:
                self.audio_stream.stop()
                self.audio_stream.close()
        elif self.audio_backend == "pyaudio":
            if self.audio_stream:
                self.audio_stream.stop_stream()
                self.audio_stream.close()
            if hasattr(self, 'pa'):
                self.pa.terminate()

        print("⏹️ VideoService가 중지되었습니다.")
