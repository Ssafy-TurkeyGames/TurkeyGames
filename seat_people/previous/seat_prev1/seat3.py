import cv2
import numpy as np
from ultralytics import YOLO
import math
import time

# YOLOv8 pose 모델 불러오기
model = YOLO('yolov8n-pose.pt')  # Pose 모델 사용

cap = cv2.VideoCapture(1)

if not cap.isOpened():
    print("웹캠을 열 수 없습니다.")
    exit()

# 마커 위치 (좌석 번호 매핑)
aruco_markers = {
    0: (0, 0, 500, 500),  # 좌석 1: 왼쪽 위
    1: (500, 0, 1000, 500),  # 좌석 2: 오른쪽 위
    2: (0, 500, 500, 1000),  # 좌석 3: 왼쪽 아래
    3: (500, 500, 1000, 1000),  # 좌석 4: 오른쪽 아래
}

# 사람 수 기록을 위한 변수
last_people_count = 0
people_count_history = []
stable_count_duration = 5

# 상태 추적을 위한 변수들
seat_state = {seat: False for seat in aruco_markers}  # 각 좌석의 상태 추적
seat_last_change_time = {seat: None for seat in aruco_markers}  # 상태가 마지막으로 변한 시간 추적
stable_time_threshold = 2  # 상태 변화가 있어야 로그를 출력하는 시간 (초), 2초로 설정하여 변화에 즉시 반응

# 사람 수를 서버에 전송함. 추후 전송 데이터 추가
def send_data_to_server(people_count):
    print(f"Sending {people_count} people count to server")

# 사람으로 인식하여 전달받은 두 관절 간 유클리드 거리 계산
def calculate_distance(point1, point2):
    x1, y1 = point1
    x2, y2 = point2
    return math.sqrt((x2 - x1)**2 + (y2 - y1)**2)

# 결과에서 'person' 클래스를 필터링하는 대신 keypoints로 사람을 구별
def extract_persons_from_pose(detections):
    persons = []
    for result in detections:
        keypoints = result.xy  # 관절 좌표
        confidences = result.conf  # 각 관절의 신뢰도

        if keypoints is not None and keypoints.shape[1] > 0:  # keypoints가 비어있지 않으면
            valid_keypoints = []
            for i in range(keypoints.shape[1]):
                # 좌표가 (0.0, 0.0) 이거나 신뢰도가 너무 낮은 경우를 제외
                if keypoints[0][i][0] != 0.0 and keypoints[0][i][1] != 0.0 and confidences[0][i] > 0.5:
                    valid_keypoints.append(keypoints[0][i][:2])  # (x, y) 좌표만 저장

            if len(valid_keypoints) >= 4:  # 어깨 2개, 팔꿈치 2개
                shoulder_left = valid_keypoints[5] if len(valid_keypoints) > 5 else None  # 어깨 왼쪽 (xy[5])
                shoulder_right = valid_keypoints[6] if len(valid_keypoints) > 6 else None  # 어깨 오른쪽 (xy[6])
                elbow_left = valid_keypoints[7] if len(valid_keypoints) > 7 else None  # 팔꿈치 왼쪽 (xy[7])
                elbow_right = valid_keypoints[8] if len(valid_keypoints) > 8 else None  # 팔꿈치 오른쪽 (xy[8])

                if shoulder_left is not None and shoulder_right is not None and (elbow_left is not None or elbow_right is not None):
                    if is_valid_person(shoulder_left, shoulder_right, elbow_left, elbow_right):
                        persons.append(result)
    return persons

def is_valid_person(shoulder_left, shoulder_right, elbow_left, elbow_right):
    # 어깨와 팔꿈치가 모두 존재하는지 확인
    if shoulder_left is None or shoulder_right is None or elbow_left is None or elbow_right is None:
        return False  # 어깨나 팔꿈치가 없으면 유효한 사람이 아님

    # 팔꿈치와 어깨 간의 거리를 계산하여 너무 가까우면 사람으로 인정하지 않음
    min_distance = 10  # 최소 거리 설정 (이 값은 조정이 필요할 수 있습니다)
    
    # 왼쪽 어깨와 왼쪽 팔꿈치 간의 거리 계산
    distance_left = calculate_distance(shoulder_left, elbow_left)
    # 오른쪽 어깨와 오른쪽 팔꿈치 간의 거리 계산
    distance_right = calculate_distance(shoulder_right, elbow_right)
    
    # 팔꿈치와 어깨 간의 거리가 너무 가까우면 유효하지 않음
    if distance_left < min_distance or distance_right < min_distance:
        return False

    return True

# 사람의 좌석 번호를 확인하는 함수
def get_seat_number(person, aruco_markers):
    for marker_id, marker_pos in aruco_markers.items():
        x1, y1, x2, y2 = marker_pos  # 마커 영역 (좌석)
        px, py = person  # 사람의 위치 (예: 중심점)
        
        # 사람의 위치가 마커 영역 내에 있으면 그 좌석 번호에 사람이 있다고 판단
        if x1 <= px <= x2 and y1 <= py <= y2:
            return marker_id  # 해당 좌석 번호 반환
    return None  # 좌석에 앉지 않으면 None 반환

# 마커 영역 내에서 사람의 착석 여부 확인
while True:
    ret, frame = cap.read()

    if not ret:
        print("프레임을 읽을 수 없습니다.")
        break

    results = model(frame, verbose=False)

    # Pose 모델을 사용해 사람 구분
    filtered_people = extract_persons_from_pose(results[0].keypoints)

    # 각 사람의 위치를 확인하여 착석 여부 판단
    seat_occupancy = {}  # 좌석별로 사람 여부 추적
    for person in filtered_people:
        # 사람의 위치 (예: 어깨 중심)
        person_pos = person.xy[0][5][:2]  # 예시로 어깨 좌표를 사용
        seat_number = get_seat_number(person_pos, aruco_markers)  # 사람의 위치에 해당하는 좌석 번호 확인

        if seat_number is not None:
            seat_occupancy[seat_number] = True  # 해당 좌석에 사람 있음
            # 해당 좌석에 사람이 앉았으면 상태를 'True'로 설정하고, 상태 변경 시간 기록
            if seat_last_change_time[seat_number] is None:
                seat_last_change_time[seat_number] = time.time()

    current_time = time.time()

    # 상태 출력 주기 관리
    for seat_num in aruco_markers:
        if seat_num in seat_occupancy:
            # 사람이 앉은 상태에서 즉시 로그 출력
            if not seat_state[seat_num]:
                print(f"좌석 {seat_num}에 사람이 앉아 있습니다.")
                seat_state[seat_num] = True  # 상태 갱신
            seat_last_change_time[seat_num] = current_time  # 로그 시간 기록
        else:
            # 좌석이 비었을 때도 즉시 로그 출력
            if seat_state[seat_num]:
                print(f"좌석 {seat_num}은 비어 있습니다.")
                seat_state[seat_num] = False  # 상태 갱신
            seat_last_change_time[seat_num] = current_time  # 로그 시간 기록

    frame = results[0].plot()
    cv2.putText(frame, f"People: {len(filtered_people)}", (30, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2, cv2.LINE_AA)
    
    cv2.imshow('Real-time Object Detection', frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
