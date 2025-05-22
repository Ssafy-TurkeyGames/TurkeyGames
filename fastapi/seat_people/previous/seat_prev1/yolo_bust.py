import cv2
from ultralytics import YOLO
import time
import math

# YOLOv8 모델 불러오기
model = YOLO('yolov8n.pt')

# USB 웹캠 열기
cap = cv2.VideoCapture(1)  # 웹캠 번호 1 (USB 웹캠)

# 웹캠이 정상적으로 열리면
if not cap.isOpened():
    print("웹캠을 열 수 없습니다.")
    exit()

# 사람 수 기록을 위한 변수
last_people_count = 0  # 마지막으로 서버로 전송한 사람 수
people_count_history = []  # 사람 수 기록을 위한 리스트
stable_count_duration = 5  # 사람 수 안정화 시간 (5초 동안 안정적인 사람 수가 계속 유지되어야 서버로 전송)

# 서버로 데이터 전송하는 함수 (예시)
def send_data_to_server(people_count):
    # 여기에 서버로 데이터를 보내는 로직을 추가
    print(f"Sending {people_count} people count to server")

# 두 bounding box의 중심점 간 거리 계산
def calculate_distance(bbox1, bbox2):
    cx1, cy1 = (bbox1[0] + bbox1[2]) / 2, (bbox1[1] + bbox1[3]) / 2
    cx2, cy2 = (bbox2[0] + bbox2[2]) / 2, (bbox2[1] + bbox2[3]) / 2
    return math.sqrt((cx2 - cx1)**2 + (cy2 - cy1)**2)

# 상반신만 필터링하는 함수
def extract_upper_body_from_detections(detections):
    upper_bodies = []
    for detection in detections:
        # bbox는 detection[0]이 아니라 detection.boxes로 접근해야 함
        box = detection.xyxy[0]  # 좌표는 xyxy (좌상단 x, y, 우하단 x, y)
        if is_upper_body(box):
            upper_bodies.append(box)
    return upper_bodies

# 상반신 판단하는 함수 (예: 상반신 비율)
def is_upper_body(bbox):
    height = bbox[3] - bbox[1]  # bbox[3] (하단 y) - bbox[1] (상단 y)
    width = bbox[2] - bbox[0]   # bbox[2] (우측 x) - bbox[0] (좌측 x)
    upper_body_ratio = 0.6  # 상반신의 높이가 신체 전체 높이의 60% 이상인 경우만 상반신으로 판단
    return height / width > upper_body_ratio

# 최소 거리 기준으로 사람을 구분하는 함수
def filter_close_bodies(detections, min_distance=50, max_people=4):
    filtered_detections = []
    people_count = 0  # 추적되는 사람 수
    for i, bbox1 in enumerate(detections):
        close_to_another = False
        for j, bbox2 in enumerate(detections):
            if i != j:
                distance = calculate_distance(bbox1, bbox2)
                if distance < min_distance:
                    close_to_another = True
                    break
        if not close_to_another:
            filtered_detections.append(bbox1)
            people_count += 1
            if people_count >= max_people:
                break  # 최대 사람 수를 초과하지 않도록 제한
    return filtered_detections

# 실시간으로 비디오 스트림을 처리하면서 객체 감지 수행
while True:
    ret, frame = cap.read()  # 프레임 읽기
    
    if not ret:
        print("프레임을 읽을 수 없습니다.")
        break

    # YOLOv8 모델을 사용하여 객체 감지
    results = model(frame)

    # 결과에서 'person' 클래스를 필터링
    people = [result for result in results[0].boxes if results[0].names[int(result.cls[0])] == 'person']

    # 사람 수 기록
    people_count = len(people)
    print(f"Detected people: {people_count}")

    # 상반신만 추출 (필터링)
    upper_bodies = extract_upper_body_from_detections(people)

    # 최소 거리 기준으로 사람 필터링
    filtered_people = filter_close_bodies(upper_bodies)

    # 사람 수 안정화
    people_count_history.append(len(filtered_people))
    if len(people_count_history) > stable_count_duration:
        people_count_history.pop(0)

    if len(set(people_count_history)) == 1:  # 사람 수가 안정화되었으면
        if len(filtered_people) != last_people_count:
            send_data_to_server(len(filtered_people))
            last_people_count = len(filtered_people)  # 마지막 전송된 값 갱신

    # 감지된 객체들을 원본 영상에 표시
    frame = results[0].plot()  # 감지된 객체가 그려진 이미지를 반환
    
    # 사람 수를 영상에 텍스트로 표시
    cv2.putText(frame, f"People: {len(filtered_people)}", (30, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2, cv2.LINE_AA)
    
    # 화면에 실시간 영상 출력
    cv2.imshow('Real-time Object Detection', frame)

    # 'q' 키를 눌러 종료
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# 웹캠 리소스 해제 및 종료
cap.release()
cv2.destroyAllWindows()
