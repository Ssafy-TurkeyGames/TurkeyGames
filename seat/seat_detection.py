import cv2
import time
from main import process_frame  # main.py에서 사람 처리 함수 import

# 아루코 마커와 좌석 영역 매핑
aruco_markers = {
    0: (0, 0, 500, 500),  # 좌석 1: 왼쪽 위
    1: (500, 0, 1000, 500),  # 좌석 2: 오른쪽 위
    2: (0, 500, 500, 1000),  # 좌석 3: 왼쪽 아래
    3: (500, 500, 1000, 1000),  # 좌석 4: 오른쪽 아래
}

cap = cv2.VideoCapture(1)

if not cap.isOpened():
    print("웹캠을 열 수 없습니다.")
    exit()

def detect_aruco_markers(frame):
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    aruco_dict = cv2.aruco.Dictionary_get(cv2.aruco.DICT_6X6_250)
    parameters = cv2.aruco.DetectorParameters_create()
    corners, ids, _ = cv2.aruco.detectMarkers(gray, aruco_dict, parameters=parameters)
    return corners, ids

def get_seat_number(person_pos, aruco_markers):
    for marker_id, marker_pos in aruco_markers.items():
        x1, y1, x2, y2 = marker_pos  # 좌석의 영역 (x1, y1, x2, y2)
        px, py = person_pos  # 사람의 위치 (예: 어깨 좌표)
        
        # 사람의 위치가 좌석 영역 내에 있으면 그 좌석 번호에 사람이 앉았다고 판단
        if x1 <= px <= x2 and y1 <= py <= y2:
            return marker_id
    return None

seat_state = {seat: False for seat in aruco_markers}  # 좌석 상태 추적
last_log_time = time.time()

while True:
    filtered_people, frame = process_frame(cap)

    if filtered_people is None:
        break

    seat_occupancy = {}  # 좌석에 사람이 앉았는지 추적하는 딕셔너리

    # 사람의 위치 확인
    for person in filtered_people:
        person_pos = person.xy[0][5][:2]  # 사람의 위치 (예: 어깨 좌표 사용)
        
        # 사람의 위치가 어느 좌석에 해당하는지 확인
        seat_number = get_seat_number(person_pos, aruco_markers)

        if seat_number is not None:
            seat_occupancy[seat_number] = True  # 해당 좌석에 사람이 앉았다고 기록

    current_time = time.time()

    if current_time - last_log_time >= 1:  # 1초마다 상태 확인
        # 각 좌석의 상태를 출력
        for seat_num in aruco_markers:
            if seat_num in seat_occupancy and not seat_state[seat_num]:
                print(f"좌석 {seat_num}에 사람이 앉아 있습니다.")
                seat_state[seat_num] = True  # 상태 갱신
            elif seat_num not in seat_occupancy and seat_state[seat_num]:
                print(f"좌석 {seat_num}은 비어 있습니다.")
                seat_state[seat_num] = False  # 상태 갱신

        last_log_time = current_time

    # ArUco 마커 그리기
    corners, ids = detect_aruco_markers(frame)
    if ids is not None:
        cv2.aruco.drawDetectedMarkers(frame, corners, ids)  # 마커가 감지되면 화면에 그리기

    # 디버깅: 사람의 위치 표시
    for person in filtered_people:
        person_pos = person.xy[0][5][:2]  # 어깨 좌표
        cv2.circle(frame, (int(person_pos[0]), int(person_pos[1])), 5, (0, 255, 0), -1)

    # 결과 화면 표시
    cv2.imshow('ArUco Detection with People Occupancy', frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()




'''
import cv2
import numpy as np
from main import extract_persons_from_pose  # 사람 탐지 함수 import
import time

aruco_markers = {
    0: (0, 0, 500, 500),  # 좌석 1: 왼쪽 위
    1: (500, 0, 1000, 500),  # 좌석 2: 오른쪽 위
    2: (0, 500, 500, 1000),  # 좌석 3: 왼쪽 아래
    3: (500, 500, 1000, 1000),  # 좌석 4: 오른쪽 아래
}

cap = cv2.VideoCapture(1)

if not cap.isOpened():
    print("웹캠을 열 수 없습니다.")
    exit()

# 마커 탐지 기능 (ArUco 마커)
def detect_aruco_markers(frame):
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    aruco_dict = cv2.aruco.Dictionary_get(cv2.aruco.DICT_6X6_250)
    parameters = cv2.aruco.DetectorParameters_create()
    corners, ids, _ = cv2.aruco.detectMarkers(gray, aruco_dict, parameters=parameters)

    return corners, ids

# 사람의 좌석 번호를 확인하는 함수
def get_seat_number(person, aruco_markers):
    for marker_id, marker_pos in aruco_markers.items():
        x1, y1, x2, y2 = marker_pos  # 마커 영역 (좌석)
        px, py = person  # 사람의 위치 (예: 중심점)
        
        # 사람의 위치가 마커 영역 내에 있으면 그 좌석 번호에 사람이 있다고 판단
        if x1 <= px <= x2 and y1 <= py <= y2:
            return marker_id  # 해당 좌석 번호 반환
    return None  # 좌석에 앉지 않으면 None 반환

# 상태 추적을 위한 변수들
seat_state = {seat: False for seat in aruco_markers}  # 각 좌석의 상태 추적
seat_last_change_time = {seat: None for seat in aruco_markers}  # 상태가 마지막으로 변한 시간 추적
last_log_time = time.time()  # 로그 출력을 위한 시간 기록

while True:
    ret, frame = cap.read()

    if not ret:
        print("프레임을 읽을 수 없습니다.")
        break

    # 사람 탐지
    results = main.model(frame)  # main.py에서 모델 불러옴
    filtered_people = extract_persons_from_pose(results[0].keypoints)

    seat_occupancy = {}  # 좌석별로 사람 여부 추적
    for person in filtered_people:
        # 사람의 위치 (예: 어깨 중심)
        person_pos = person.xy[0][5][:2]  # 예시로 어깨 좌표를 사용
        seat_number = get_seat_number(person_pos, aruco_markers)  # 사람의 위치에 해당하는 좌석 번호 확인

        if seat_number is not None:
            seat_occupancy[seat_number] = True  # 해당 좌석에 사람 있음

    # 현재 시간
    current_time = time.time()

    # 상태 출력 주기 관리: 1초마다 한 번만 로그를 출력
    if current_time - last_log_time >= 1:  # 1초마다 로그 출력
        for seat_num in aruco_markers:
            if seat_num in seat_occupancy:
                # 사람이 앉은 상태에서 즉시 로그 출력
                if not seat_state[seat_num]:
                    print(f"좌석 {seat_num}에 사람이 앉아 있습니다.")
                    seat_state[seat_num] = True  # 상태 갱신
            else:
                # 좌석이 비었을 때도 즉시 로그 출력
                if seat_state[seat_num]:
                    print(f"좌석 {seat_num}은 비어 있습니다.")
                    seat_state[seat_num] = False  # 상태 갱신

        # 마지막 로그 시간 업데이트
        last_log_time = current_time  # 로그 시간 기록

    # ArUco 마커 탐지
    corners, ids = detect_aruco_markers(frame)
    if ids is not None:
        cv2.aruco.drawDetectedMarkers(frame, corners, ids)

    cv2.imshow('ArUco Detection with People Occupancy', frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
'''