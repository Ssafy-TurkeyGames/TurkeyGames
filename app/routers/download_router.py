import asyncio
import os
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from starlette.responses import FileResponse, RedirectResponse
from minio import Minio
from minio.error import S3Error
import urllib.parse

from app.config import load_config

router = APIRouter(
    prefix="/download",
    tags=["download"],
)


video_config = load_config('video_config.yaml') 
minio_config = load_config('minio_config.yaml') 
minio_client: Minio | None = None


if minio_config:
    access_key = os.getenv('MINIO_ACCESS_KEY')
    secret_key = os.getenv('MINIO_SECRET_KEY')

    if not access_key or not secret_key:
        print("❌ MinIO Access Key 또는 Secret Key가 환경 변수에 설정되지 않았습니다. Download Router MinIO 초기화 실패.")
        minio_client = None
    else:
        try:
            minio_client = Minio(
                minio_config['endpoint'],
                access_key=access_key,
                secret_key=secret_key,
                secure=minio_config['secure']
            )
            # 버킷 이름 확인, 없으면 생성
            bucket_name = minio_config['bucket_name']
            if not minio_client.bucket_exists(bucket_name):
                minio_client.make_bucket(bucket_name)
                print(f"MinIO 버킷 '{bucket_name}' 생성됨.")
            else:
                print(f"MinIO 버킷 '{bucket_name}' 확인됨.")
            print("✅ Download Router MinIO 클라이언트 초기화 성공")
        except Exception as e:
            print(f"❌ Download Router MinIO 클라이언트 초기화 실패: {e}")
            minio_client = None
else:
    print("⚠️ MinIO 설정 파일(minio_config.yaml) 로드 실패 또는 내용 없음. 다운로드 기능 제한됨.")

# 삭제 예약된 항목들을 추적하기 위한 메모리 내 세트
DELETION_SCHEDULED_ITEMS = set()
DELETION_DELAY_SECONDS = 600  # 10분

async def schedule_full_deletion(minio_object_name: str, bucket_name: str, local_file_path: str | None):
    """지정된 시간 후 MinIO 객체 및 해당 로컬 파일 삭제를 예약합니다."""
    if minio_object_name in DELETION_SCHEDULED_ITEMS:
        print(f"MinIO 객체 '{minio_object_name}'에 대한 삭제가 이미 예약되어 있습니다.")
        return
    
    DELETION_SCHEDULED_ITEMS.add(minio_object_name)
    print(f"MinIO 객체 '{minio_object_name}' 및 로컬 파일 '{local_file_path}' 삭제 예약 ({DELETION_DELAY_SECONDS}초 후).")
    
    await asyncio.sleep(DELETION_DELAY_SECONDS)
    
    # MinIO 객체 삭제
    if minio_client:
        try:
            minio_client.remove_object(bucket_name, minio_object_name)
            print(f"MinIO 객체 삭제 성공: {minio_object_name}")
        except S3Error as e:
            print(f"MinIO 객체 '{minio_object_name}' 삭제 중 S3 오류 발생: {e}")
    else:
        print(f"MinIO 클라이언트 사용 불가. MinIO 객체 '{minio_object_name}' 삭제 불가.")

    # 로컬 파일 삭제
    if local_file_path:
        try:
            if os.path.exists(local_file_path):
                os.remove(local_file_path)
                print(f"로컬 파일 삭제 성공: {local_file_path}")
            else:
                print(f"로컬 파일 '{local_file_path}'을(를) 찾을 수 없습니다.")
        except Exception as e:
            print(f"로컬 파일 '{local_file_path}' 삭제 중 오류 발생: {e}")
    else:
        print(f"MinIO 객체 '{minio_object_name}'에 대한 로컬 파일 경로가 제공되지 않았습니다. ")
        
    DELETION_SCHEDULED_ITEMS.discard(minio_object_name) # 삭제 시도 후 세트에서 제거


def reconstruct_local_path(minio_object_name: str, app_config: dict) -> str | None:
    """
    MinIO 객체 이름으로부터 로컬 파일 경로를 재구성합니다.
    MinIO 객체 이름 형식: highlights/game_{game_id}/P{player_id}/{base_filename}{ext}
    로컬 파일 경로 형식: {output_dir}/{base_filename}{ext}
    """
    try:
        parts = minio_object_name.split('/')
        if len(parts) < 4 or parts[0] != 'highlights': # 경로 구조를 확인
            print(f"로컬 경로 재구성 불가: 잘못된 MinIO 객체 이름 형식입니다: {minio_object_name}")
            return None
        
        actual_filename_with_ext = parts[-1] # 예: highlight_P1_yacht_20230101_120000.mp4
        
        # video_config에서 output.dir을 가져옵니다.
        output_dir = app_config.get('output', {}).get('dir')
        if not output_dir:
            print("로컬 경로 재구성 불가: 설정 파일에 'output.dir'이 없습니다.")
            return None
            
        # output_dir이 절대 경로인지 확인하거나, 필요한 경우 기준 경로를 사용하여 해석
        # 현재는 절대 경로 또는 그대로 해석 가능한 경로로 가정
        local_path = os.path.join(output_dir, actual_filename_with_ext)
        return os.path.abspath(local_path) # 정규화된 절대 경로를 반환
    except Exception as e:
        print(f"'{minio_object_name}'의 로컬 경로 재구성 중 오류 발생: {e}")
        return None


@router.get("/video/{encoded_object_name:path}")
async def download_video_and_schedule_deletion(
    encoded_object_name: str, 
    background_tasks: BackgroundTasks
):
    if not minio_client or not minio_config:
        raise HTTPException(status_code=503, detail="MinIO 서비스가 설정되지 않았거나 사용할 수 없습니다.")

    minio_object_name = urllib.parse.unquote(encoded_object_name) # URL 디코딩
    bucket_name = minio_config['bucket_name']
    
    # video_config를 전달하여 output.dir을 찾도록 수정
    local_file_path = reconstruct_local_path(minio_object_name, video_config) 
    if not local_file_path:
        # 로컬 경로를 재구성할 수 없는 경우에도 MinIO 다운로드는 허용할 수 있지만,
        # 로컬 삭제는 수행되지 않음을 경고로 기록
        # 또는 로컬 삭제가 중요하다면 오류를 발생시킬 수 있습니다. 현재는 경고 후 진행
        print(f"⚠️ MinIO 객체 '{minio_object_name}'의 로컬 경로를 재구성할 수 없습니다.")

    try:
        # 옵션 1: 사전 서명된 URL을 생성하고 리디렉션합니다.
        presigned_url = minio_client.presigned_get_object(
            bucket_name, 
            minio_object_name, 
            expires=timedelta(minutes=15) # URL 유효 시간은 15분
        )
        
        # MinIO 객체와 로컬 파일 모두 삭제를 예약
        background_tasks.add_task(schedule_full_deletion, minio_object_name, bucket_name, local_file_path)
        
        print(f"MinIO 사전 서명 URL로 리디렉션: {minio_object_name}. 로컬 경로: {local_file_path}")
        return RedirectResponse(url=presigned_url)

    except S3Error as e:
        print(f"객체 '{minio_object_name}'에 대한 MinIO S3 오류: {e}")
        if e.code == "NoSuchKey": # 해당 키(파일)가 없는 경우
            raise HTTPException(status_code=404, detail=f"비디오를 찾을 수 없습니다: {minio_object_name}")
        raise HTTPException(status_code=500, detail=f"MinIO 오류: {str(e)}") # 그 외 MinIO 오류
    except Exception as e:
        print(f"객체 '{minio_object_name}'에 대한 예기치 않은 오류: {e}")
        raise HTTPException(status_code=500, detail="내부 서버 오류")

from datetime import timedelta
