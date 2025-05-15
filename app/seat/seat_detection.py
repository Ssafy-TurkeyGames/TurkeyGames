import cv2
import numpy as np
import time

# 좌석 상태 추적을 위한 변수
seat_state = {0: False, 1: False, 2: False, 3: False}  # 좌석 상태 (비어있으면 False, 앉아있으면 True)
confirmed_occupied_time = {}

# 시간 기반 텀 설정 (몇 초 동안 사람 위치가 변하지 않으면 갱신하지 않음)
LAST_SEEN_THRESHOLD = 2  # 2초 동안 변하지 않으면 무시
POSITION_THRESHOLD = 15  # 위치 변화가 15픽셀 이하일 경우 변화 없음
STABILITY_WINDOW = 5  # 평균을 계산할 때 사용할 최근 N번의 값 (위치 안정화 용도)
EMPTY_SEAT_TIMEOUT = 3.0  # 이 시간 동안 사람이 감지되지 않으면 좌석이 비었다고 판단

last_seen_time = {}  # 사람의 마지막 인식 시간을 저장할 변수
last_empty_time = {}  # 좌석이 마지막으로 비어있다고 감지된 시간

# 사람 위치에 대한 최근 위치 기록을 위한 변수 (위치 안정화용)
recent_positions = {i: [] for i in range(4)}  # 각 좌석에 대해 최근 위치 기록

# 마지막 로그 출력 시간 (불필요한 로그 제한용)
last_log_time = {i: 0 for i in range(4)}
general_log_time = 0  # 일반 로그용

aruco_dict = cv2.aruco.getPredefinedDictionary(cv2.aruco.DICT_6X6_250)
parameters = cv2.aruco.DetectorParameters()
detector = cv2.aruco.ArucoDetector(aruco_dict, parameters)

id_to_corner = {0: 0, 1: 1, 2: 2, 3: 3}  # 지웅 코드 기준 좌표 맵핑

# id 기반으로 중심점 정렬
def order_points_by_id(centers, ids):
    full_rect = [None, None, None, None]
    for pt, id_ in zip(centers, ids):
        idx = id_to_corner.get(int(id_[0]), -1)
        if idx >= 0:
            full_rect[idx] = pt
    return full_rect

# 4번째 마커 추정
def estimate_missing_point(rect):
    idx_missing = rect.index(None)
    if idx_missing == 0:  # 좌상
        pt = np.array(rect[1]) + np.array(rect[3]) - np.array(rect[2])
    elif idx_missing == 1:  # 우상
        pt = np.array(rect[0]) + np.array(rect[2]) - np.array(rect[3])
    elif idx_missing == 2:  # 우하
        pt = np.array(rect[1]) + np.array(rect[3]) - np.array(rect[0])
    elif idx_missing == 3:  # 좌하
        pt = np.array(rect[0]) + np.array(rect[2]) - np.array(rect[1])
    return pt.astype(int)

# 아루코 마커 감지 및 좌석 매핑
def draw_aruco_markers(frame):
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY) # 흑백으로 받아오기
    gray = cv2.equalizeHist(gray)  # 명암 대비 조정

    corners, ids, _ = cv2.aruco.detectMarkers(gray, aruco_dict, parameters=parameters)

    aruco_markers = {}

    if ids is not None and len(ids) > 0:
        cv2.aruco.drawDetectedMarkers(frame, corners, ids)

        centers = []
        for i, corner in enumerate(corners):
            pts = corner[0].astype(int)
            center_x = int(pts[:, 0].mean())
            center_y = int(pts[:, 1].mean())
            centers.append([center_x, center_y])

        if len(ids) >= 3:
            rect = order_points_by_id(centers, ids)

            if None in rect and rect.count(None) == 1:
                missing_pt = estimate_missing_point(rect)
                idx_missing = rect.index(None)
                rect[idx_missing] = missing_pt

            if all(x is not None for x in rect):
                for seat_num, (cx, cy) in enumerate(rect):
                    radius = 30  # 고정 반지름, 필요 시 조정 가능

                    color = (0, 255, 0) if not seat_state.get(seat_num, False) else (0, 0, 255)
                    cv2.circle(frame, (cx, cy), radius, color, 2)

                    status = "Occupied" if seat_state.get(seat_num, False) else "Empty"
                    cv2.putText(frame, f"Seat {seat_num}: {status}", (cx, cy),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 2)

                    aruco_markers[seat_num] = (cx, cy, radius)
            else:
                return {}
        else:
            return {}

    else:
        return {}

    # 마커가 없으면 빈 딕셔너리 반환
    return aruco_markers


# 사람 위치를 좌석에 맞게 할당하는 함수
def get_seat_number(person_pos, aruco_markers, seat_threshold=130):
    if not aruco_markers:  # 마커가 없으면 None 반환
        return None

    px, py = person_pos
    for seat_num, (cx, cy, r) in aruco_markers.items():
        # 원의 방정식: (px - cx)^2 + (py - cy)^2 <= r^2
        distance = np.linalg.norm(np.array([px, py]) - np.array([cx, cy]))

        if distance <= r + seat_threshold:
            return seat_num  # 해당 좌석 번호 반환
    return None  # 좌석에 앉지 않으면 None 반환

# 일정 시간마다만 로그를 출력하는 함수
def log_with_throttle(message, seat_num=None, throttle_time=1.0):
    current_time = time.time()
    if seat_num is not None:
        if current_time - last_log_time.get(seat_num, 0) >= throttle_time:
            print(message)
            last_log_time[seat_num] = current_time
    else:
        global general_log_time
        if current_time - general_log_time >= throttle_time:
            print(message)
            general_log_time = current_time

# 좌석 상태 추적
def get_seat_occupancy(people_positions, aruco_markers):
    current_time = time.time()
    detected_seats = set()  # 현재 프레임에서 감지된 좌석
    
    for pos in people_positions:
        seat_num = get_seat_number(pos, aruco_markers)

        if seat_num is not None:
            detected_seats.add(seat_num)
            now = time.time()

            # 위치 안정화 위한 최근 위치 기록
            recent_positions[seat_num].append(pos)
            if len(recent_positions[seat_num]) > STABILITY_WINDOW:
                recent_positions[seat_num].pop(0)  # 리스트 크기 제한

            # 평균 위치 계산
            if len(recent_positions[seat_num]) >= 3:
                avg_position = np.mean(recent_positions[seat_num], axis=0)
                position_diff = np.linalg.norm(np.array(pos) - avg_position)

            # 3초 이상 지속 로직 (초기 감지 시간 기록 및 duration 계산)
            if seat_num not in confirmed_occupied_time:
                confirmed_occupied_time[seat_num] = now
            duration = now - confirmed_occupied_time[seat_num]

            if duration >= EMPTY_SEAT_TIMEOUT:  # 3초 이상 유지된 경우만 True
                if not seat_state[seat_num]:
                    log_with_throttle(f"사람이 좌석 {seat_num}에 앉았습니다.", seat_num, 2.0)
                seat_state[seat_num] = True
            else:
                seat_state[seat_num] = False

            last_seen_time[seat_num] = now

    # 사람이 하나도 감지되지 않은 경우 모든 좌석 False 처리
    if len(people_positions) == 0:
        for seat_num in seat_state:
            if seat_state[seat_num]:
                log_with_throttle(f"좌석 {seat_num}이 비어 있습니다.", seat_num, 2.0)
            seat_state[seat_num] = False
        return seat_state

    # 현재 프레임에서 감지되지 않은 좌석 처리
    for seat_num in range(4):
        if seat_num not in detected_seats :
            if seat_num in last_seen_time:
                time_diff = current_time - last_seen_time[seat_num]
                if time_diff > EMPTY_SEAT_TIMEOUT:
                    log_with_throttle(f"좌석 {seat_num}이 비어 있습니다.", seat_num, 2.0)
                    seat_state[seat_num] = False

    return seat_state

# 좌석 상태 갱신 및 로그 출력
def update_seat_status(current_occupancy):
    for seat_num in seat_state:
        occupied = current_occupancy.get(seat_num, False)
        seat_state[seat_num] = occupied
    return seat_state


# occupied 좌석들에 대해 순서대로 1, 2, 3... 번호 부여해서 반환
def get_ordered_seat_mapping():
    occupied_seats = [seat_num for seat_num, occupied in seat_state.items() if occupied]
    occupied_seats.sort()  # 순서 보장: 0, 1, 2, 3

    result = []
    for idx, seat_num in enumerate(occupied_seats):
        result.append({
            "original": seat_num,
            "assigned": idx + 1
        })
    return result

