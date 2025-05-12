import cv2
import os
import time
import asyncio
import threading
from threading import Event
from typing import Dict, Optional
import uuid
import pathlib # 디렉토리 생성을 위함

from minio import Minio
from minio.error import S3Error
import qrcode # QR 코드 생성을 위함

from app.video.buffer_manager import AudioRingBuffer, CircularBuffer
from app.video.video_writer import VideoSaver
# from .trigger_detector import TriggerDetector # TriggerDetector는 이 파일에서 직접 사용되지 않습니다.
from app.config import load_config
from datetime import datetime, timedelta

os.environ["OPENCV_VIDEOIO_MSMF_ENABLE_HW_TRANSFORMS"] = "0" # MSMF 하드웨어 변환 비활성화 (Windows용)


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
            fps=self.config['video']['fps']
        )
        self.minio_client = self._init_minio_client()
        self._ensure_qr_output_dir()

        self.camera_thread = None
        self.stop_event = Event()
        self.camera_ready_event = Event()
        self._start_camera_thread()
        
         # 오디오 버퍼 초기화
        audio_sr = 44100
        pre_sec = self.config['buffer']['pre_seconds']
        maxlen = int(audio_sr * pre_sec)
        self.audio_buffer = AudioRingBuffer(maxlen_frames=maxlen)
        
        # sounddevice or pyaudio 선택
        try:
            import sounddevice as sd
            self.audio_stream = sd.RawInputStream(
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
                    # NumPy 배열로 변환
                    audio_data = np.frombuffer(in_data, dtype=np.int16)
                    self.audio_buffer.callback(audio_data, frame_count, time_info, status)
                    return (None, pyaudio.paContinue)

                self.audio_stream = self.pa.open(
                    format=pyaudio.paInt16,
                    channels=1,
                    rate=audio_sr,
                    input=True,
                    frames_per_buffer=1024,
                    stream_callback=pyaudio_callback  # 수정된 콜백 함수 사용
                )
                self.audio_stream.start_stream()
                print("✅ PyAudio 오디오 스트림 시작됨.")
            except Exception as e_pa:
                print(f"❌ PyAudio 초기화 실패: {e_pa}. 오디오 기능 사용 불가.")
                self.audio_backend = None
                self.audio_stream = None

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
                
        # 환경 변수에서 Access Key와 Secret Key 확인 (값 자체는 검증하지 않음)
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
            # 버킷 존재 여부 확인 및 생성
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
        """모듈 초기화 (카메라 스레드 시작 등)"""
        # self.saver 와 self.trigger_detector 는 __init__에서 이미 초기화됨
        # 여기서는 주로 카메라 스레드 시작/재시작 로직을 담당
        if self.camera_thread is None or not self.camera_thread.is_alive():
            self._start_camera_thread()
        else:
            print("ℹ️ 카메라 스레드가 이미 실행 중입니다.")

    def _start_camera_thread(self):
        """카메라 캡처 스레드 시작"""
        if self.camera_thread is None or not self.camera_thread.is_alive():
            self.stop_event.clear()
            self.camera_thread = threading.Thread(target=self._capture_frames, daemon=True)
            self.camera_thread.start()
            print("🚀 카메라 캡처 스레드 시작됨")
        else:
             print("ℹ️ 카메라 스레드가 이미 실행 중입니다.")

    def _capture_frames(self):
        """프레임 캡처 로직 (개선된 루프 및 재연결)"""
        cap = None
        camera_index = self.config['camera']['index'] # 초기 카메라 인덱스 사용

        while not self.stop_event.is_set(): # 스레드 종료 이벤트 확인
            if cap is None or not cap.isOpened():
                print(f"🔌 카메라 {camera_index} 연결 시도...")
                cap = cv2.VideoCapture(camera_index)
                if not cap.isOpened():
                    print(f"❌ 카메라 {camera_index} 연결 실패. 대체 장치 검색...")
                    found_alt = False
                    for idx in range(5): # 다른 인덱스로 최대 5번 시도
                        if idx == camera_index: continue # 현재 시도한 인덱스는 건너뛴다.
                        temp_cap = cv2.VideoCapture(idx)
                        if temp_cap.isOpened():
                            print(f"✅ 대체 카메라 {idx} 연결 성공")
                            camera_index = idx # 성공한 인덱스로 업데이트
                            cap = temp_cap
                            found_alt = True
                            break
                        temp_cap.release()

                    if not found_alt:
                        print(f"❌ 사용 가능한 카메라를 찾지 못했습니다. 3초 후 재시도...")
                        self.is_buffer_ready = False
                        self.camera_ready_event.clear()
                        if cap: cap.release()
                        cap = None
                        time.sleep(3)
                        continue

                cap.set(cv2.CAP_PROP_FRAME_WIDTH, self.config['camera']['width'])
                cap.set(cv2.CAP_PROP_FRAME_HEIGHT, self.config['camera']['height'])
                print(f"✅ 카메라 {camera_index} 연결 성공 및 설정 완료.")
                self.is_buffer_ready = True
                self.camera_ready_event.set()

            ret, frame = cap.read()
            if ret:
                if not self.is_buffer_ready:
                    print("✅ 카메라 재연결 성공. 프레임 수신 시작.")
                    self.is_buffer_ready = True
                self.buffer.add_frame(frame)
            else:
                print("⚠️ 카메라 프레임 읽기 실패 또는 연결 끊김. 재연결 시도...")
                self.is_buffer_ready = False
                self.camera_ready_event.clear()
                if cap: cap.release()
                cap = None
                time.sleep(1)

        if cap:
            cap.release()
        print("🛑 카메라 캡처 스레드 종료됨")
        self.is_buffer_ready = False
        self.camera_ready_event.clear()

    async def on_trigger(self, metadata: Dict):
        """트리거 콜백 핸들러 - metadata 포함, post_seconds 만큼 지연 후 저장 시작"""
        if not self.camera_ready_event.wait(timeout=1.0):
            print("⚠️ 트리거 발생했으나 카메라가 아직 준비되지 않음 (1초 대기 초과)")
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

            print(f"🎞️ 클립 프레임 ({len(clip_frames)}개) 검색 완료. 저장 시작...")
            resolution = (int(self.config['camera']['width']), int(self.config['camera']['height']))
            
            # 파일명에 메타데이터 추가
            trigger_type = metadata.get('trigger_type', 'unknown').replace(" ", "_") 
            player_id = metadata.get('player_id', 'unknown')
            timestamp_str = datetime.now().strftime('%Y%m%d_%H%M%S')
            base_filename = f"highlight_P{player_id}_{trigger_type}_{timestamp_str}"
            
            # VideoSaver의 반환된 로컬 파일 경로 사용
            local_file_path = self.saver.save_clip(clip_frames, resolution, base_filename_prefix=base_filename)

            if not local_file_path:
                print("❌ 로컬 클립 저장 실패 (VideoSaver에서 None을 반환했습니다).")
                return
            
            print(f"✅ 로컬 클립 저장 완료: {local_file_path}")

            if not self.minio_client or not self.minio_config:
                print("⚠️ MinIO 클라이언트 또는 설정이 없음음.")
                return

            # MinIO 업로드
            # MinIO 객체 이름 예시: highlights/game_{게임ID}/P{플레이어ID}/{트리거타입}_{타임스탬프}.mp4
            file_extension = pathlib.Path(local_file_path).suffix
            game_id = metadata.get('game_id', 'unknown') # '알수없음' 대신 'unknown' 사용 (일관성)
            minio_object_name = f"highlights/game_{game_id}/P{player_id}/{base_filename}{file_extension}"

            print(f"☁️ MinIO 업로드 시작: {minio_object_name} (버킷: {self.minio_config['bucket_name']})")
            self.minio_client.fput_object(
                self.minio_config['bucket_name'],
                minio_object_name,
                local_file_path
            )
            print(f"✅ MinIO 업로드 완료: {minio_object_name}")

            # QR 코드 생성
            # QR 코드에 포함될 다운로드 URL (새로운 API 엔드포인트 사용)
            # URL 인코딩된 MinIO 객체 이름 사용 고려
            download_url = self.minio_client.presigned_get_object(
                # "GET",
                self.minio_config['bucket_name'],
                minio_object_name,
                # expires=timedelta(days=1)  
            )

            # download_trigger_url = f"{self.minio_config['qr_code_base_url'].rstrip('/')}/{minio_object_name.replace('/', '%2F')}"
            
            # qr_img = qrcode.make(download_trigger_url)
            qr_img = qrcode.make(download_url)
            qr_filename = f"{base_filename}.png"
            qr_filepath = os.path.join(self.minio_config['qr_output_dir'], qr_filename)
            qr_img.save(qr_filepath)
            print(f"📱 QR 코드 생성 완료: {qr_filepath} (URL: {download_url})")

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

        # 로컬 파일 삭제
        try:
            if os.path.exists(local_path):
                os.remove(local_path)
                print(f"🗑️ 로컬 파일 삭제 성공: {local_path}")
            else:
                print(f"⚠️ 로컬 파일을 찾을 수 없습니다 (이미 삭제되었을 수 있음): {local_path}")
        except Exception as e:
            print(f"❌ 로컬 파일 삭제 중 오류 발생: {e}")

        # MinIO 파일 삭제
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
        """서비스 중지 (카메라 스레드 종료)"""
        print("⏳ 서비스 중지를 요청합니다...")
        self.stop_event.set() # 스레드 종료 이벤트 설정
        if self.camera_thread and self.camera_thread.is_alive():
            print("🕰️ 카메라 스레드 종료를 기다리는 중...")
            self.camera_thread.join(timeout=5) # 스레드가 종료될 때까지 최대 5초 대기
            if self.camera_thread.is_alive():
                print("⚠️ 카메라 스레드가 5초 내에 정상적으로 종료되지 않음.")
        # 오디오 스트림 중지
        if self.audio_backend == "sounddevice":
            if self.audio_stream:
                self.audio_stream.stop()
                self.audio_stream.close()
        elif self.audio_backend == "pyaudio":
            if self.audio_stream:
                self.audio_stream.stop_stream()
                self.audio_stream.close()
            if hasattr(self, 'pa'):  # pa가 초기화되었는지 확인
                self.pa.terminate()

        print("⏹️ 서비스가 중지되었습니다.")
