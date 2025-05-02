import cv2
from ultralytics import YOLO
import time
import math

# YOLOv8 pose 모델 불러오기
model = YOLO('yolov8n-pose.pt')  # Pose 모델 사용

cap = cv2.VideoCapture(1)

if not cap.isOpened():
    print("웹캠을 열 수 없습니다.")
    exit()

# 사람 수 기록을 위한 변수
last_people_count = 0
people_count_history = []
stable_count_duration = 5

def send_data_to_server(people_count):
    print(f"Sending {people_count} people count to server")

def calculate_distance(bbox1, bbox2):
    cx1, cy1 = (bbox1[0] + bbox1[2]) / 2, (bbox1[1] + bbox1[3]) / 2
    cx2, cy2 = (bbox2[0] + bbox2[2]) / 2, (bbox2[1] + bbox2[3]) / 2
    return math.sqrt((cx2 - cx1)**2 + (cy2 - cy1)**2)

# 결과에서 'person' 클래스를 필터링하는 대신 keypoints로 사람을 구별
def extract_persons_from_pose(detections):
    persons = []
    for result in detections:
        keypoints = result.xy  # 각 사람의 관절 좌표들
        if keypoints is not None and len(keypoints) > 5:
            # 예시로, 어깨 좌표만 확인하거나, 어깨, 팔꿈치, 손목 등 특정 부위를 확인
            shoulder = keypoints[5]  # 어깨
            elbow = keypoints[7]  # 팔꿈치
            wrist = keypoints[9]  # 손목
            if is_valid_person(shoulder, elbow, wrist):
                persons.append(result)
        else :
            print("ㅠㅠ")
    return persons

def is_valid_person(shoulder, elbow, wrist):
    min_distance = 50
    distance = calculate_distance(shoulder, wrist)
    return distance > min_distance

def filter_by_distance(detections, min_distance=100):
    valid_detections = []
    for i, bbox1 in enumerate(detections):
        too_close = False
        for j, bbox2 in enumerate(detections):
            if i != j:
                distance = calculate_distance(bbox1, bbox2)
                if distance < min_distance:
                    too_close = True
                    break
        if not too_close:
            valid_detections.append(bbox1)
    return valid_detections

# def limit_people_count(detections, max_people=4):
#     return detections[:max_people]

while True:
    ret, frame = cap.read()
    
    if not ret:
        print("프레임을 읽을 수 없습니다.")
        break

    results = model(frame)

    # Pose 모델을 사용해 사람 구분
    filtered_people = extract_persons_from_pose(results[0].keypoints)

    # 최소 거리 기준으로 필터링
    filtered_people = filter_by_distance(filtered_people)

    # # 최대 사람 수 제한
    # filtered_people = limit_people_count(filtered_people)

    people_count_history.append(len(filtered_people))
    if len(people_count_history) > stable_count_duration:
        people_count_history.pop(0)

    if len(set(people_count_history)) == 1:
        if len(filtered_people) != last_people_count:
            send_data_to_server(len(filtered_people))
            last_people_count = len(filtered_people)

    frame = results[0].plot()

    cv2.putText(frame, f"People: {len(filtered_people)}", (30, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2, cv2.LINE_AA)
    
    cv2.imshow('Real-time Object Detection', frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
