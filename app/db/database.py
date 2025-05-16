from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv
from pathlib import Path

# # ..env 파일에서 환경 변수 로드. DB 오류난 가현ver
# BASE_DIR    = Path(__file__).resolve().parent.parent.parent  
# dotenv_path = BASE_DIR / ".env"
# load_dotenv(dotenv_path=dotenv_path, override=True)

# ..env 파일에서 환경 변수 로드
load_dotenv()

# 데이터베이스 URL 가져오기
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://username:password@localhost/dbname")

# SQLAlchemy 엔진 생성
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,  # 이 한 줄로 대부분의 문제 해결
    pool_recycle=3600   # 추가 안전장치
)
# 세션 생성기
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 모델 베이스 클래스
Base = declarative_base()

# DB 세션 의존성 함수
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()