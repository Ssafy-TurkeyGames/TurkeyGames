FROM python:3.10-slim

# 시스템 패키지 설치 (OpenCV + evdev 관련)
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    gcc \
    build-essential \
    libgl1 \
    libglib2.0-0 \
    libglib2.0-bin \
    libglib2.0-dev \
    libevdev-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
# 🔧 환경 변수 추가 (keyboard 리스너 비활성화)
ENV USE_PYNPUT=false

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
