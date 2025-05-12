import cv2
import time
import numpy as np
from people_recognition import process_frame  # main.py에서 사람 처리 함수 import

# 아루코 마커와 좌석 영역 매핑
aruco_markers = {
    0: (0, 0, 500, 500),  # 좌석 1: 왼쪽 위
    1: (500, 0, 1000, 500),  # 좌석 2: 오른쪽 위
    2: (0, 500, 500, 1000),  # 좌석 3: 왼쪽 아래
    3: (500, 500, 1000, 1000),  # 좌석 4: 오른쪽 아래
}

seat_state = {seat: False for seat in aruco_markers}  # 좌석 상태 추적
last_log_time = time.time()

# 카메라 매트릭스와 왜곡 계수 불러오기
camera_matrix = np.load('camera_matrix.npy')
dist_coeffs = np.load('dist_coeffs.npy')

# 왜곡 보정 함수
def undistort_frame(frame, camera_matrix, dist_coeffs):
    # 왜곡 보정
    undistorted_frame = cv2.undistort(frame, camera_matrix, dist_coeffs)
    return undistorted_frame

# 아루코 마커 감지 함수
def detect_aruco_markers(frame):
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    aruco_dict = cv2.aruco.Dictionary(cv2.aruco.DICT_4X4_250, 250)
    parameters = cv2.aruco.DetectorParameters()

    # 아루코 마커 감지
    corners, ids, _ = cv2.aruco.detectMarkers(gray, aruco_dict, parameters=parameters)

    # 마커 감지되지 않으면 메시지 출력
    if ids is None:
        return None, None

    return corners, ids

def get_seat_number(person_pos, aruco_markers):
    for marker_id, marker_pos in aruco_markers.items():
        x1, y1, x2, y2 = marker_pos  # 좌석의 영역 (x1, y1, x2, y2)
        px, py = person_pos  # 사람의 위치 (예: 어깨 좌표)
        
        # 사람의 위치가 좌석 영역 내에 있으면 그 좌석 번호에 사람이 앉았다고 판단
        if x1 <= px <= x2 and y1 <= py <= y2:
            return marker_id
    return None

cap = cv2.VideoCapture(1)

if not cap.isOpened():
    print("웹캠을 열 수 없습니다.")
    exit()

while True:
    filtered_people, frame = process_frame(cap)

    if filtered_people is None:
        continue

    seat_occupancy = {}  # 좌석에 사람이 앉았는지 추적하는 딕셔너리

    # 이미지 왜곡 보정
    undistorted_frame = undistort_frame(frame, camera_matrix, dist_coeffs)

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
    corners, ids = detect_aruco_markers(undistorted_frame)
    if ids is not None:
        cv2.aruco.drawDetectedMarkers(undistorted_frame, corners, ids)  # 마커가 감지되면 화면에 그리기

    # 디버깅: 사람의 위치 표시
    for person in filtered_people:
        person_pos = person.xy[0][5][:2]  # 어깨 좌표
        cv2.circle(frame, (int(person_pos[0]), int(person_pos[1])), 5, (0, 255, 0), -1)

    # 결과 화면 표시
    cv2.imshow('ArUco Detection with People Occupancy', undistorted_frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()