# ArUco Marker 가이드라인

## 1단계: 개발 환경 구축 및 카메라 화면 띄우기
### 1. 목적
AI 비전 개발을 위한 Python/OpenCV 환경을 구축하고,

카메라 화면을 실시간으로 띄워 영상 입력이 정상적으로 되는지 확인한다.

### 2. 준비사항
Python 3.8 이상 설치

웹캠(노트북 내장/외장 USB 카메라 등)

Git Bash, CMD, PowerShell, macOS/Linux 터미널 등(운영체제에 맞게)

### 3. 프로젝트 폴더 및 가상환경 구성
#### 1. 프로젝트 폴더 생성

bash
```
mkdir aruco_project
cd aruco_project
```
#### 2. 가상환경 생성 및 활성화

(Windows, Git Bash)

bash
```
python -m venv venv
source venv/Scripts/activate
```
(macOS/Linux)

bash
```
python3 -m venv venv
source venv/bin/activate
```
#### 3. 필수 패키지 설치

bash
```
pip install opencv-contrib-python numpy
```
#### 4. 의존성 파일 저장

bash
```
pip freeze > requirements.txt
```