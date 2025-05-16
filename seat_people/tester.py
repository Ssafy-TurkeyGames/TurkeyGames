import os
from dotenv import load_dotenv

# .env 파일 로드
load_dotenv()

# 환경 변수 수정 (잘못된 값 수정)
database_url = os.getenv('DATABASE_URL')

# 여기서 문제가 있을 경우
if '\\x3a' in database_url:
    database_url = database_url.replace('\\x3a', ':')

print(f"DATABASE_URL: {database_url}")
