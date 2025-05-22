import cv2
import numpy as np
import time

# 좌석 상태 추적을 위한 변수
seat_state = {0: False, 1: False, 2: False, 3: False}  # 좌석 상태 (비어있으면 False, 앉아있으면 True)

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


# 아루코 마커 감지 및 좌석 매핑
def draw_aruco_markers(frame):
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    aruco_dict = cv2.aruco.getPredefinedDictionary(cv2.aruco.DICT_6X6_250)
    parameters = cv2.aruco.DetectorParameters()

    corners, ids, _ = cv2.aruco.detectMarkers(gray, aruco_dict, parameters=parameters)

    aruco_markers = {}

    if ids is not None:
        cv2.aruco.drawDetectedMarkers(frame, corners, ids)

        if len(corners) == 4:
            # 사분면 기준 정렬
            marker_id_order = sort_markers_by_spatial_position(corners, ids)

            if marker_id_order:

                # 마커 정렬된 순서대로 좌석 번호 표시
                for seat_num, marker_id in enumerate(marker_id_order):
                    
                    # 마커 ID에 해당하는 인덱스 찾음
                    idx = np.where(ids == marker_id)[0][0]
                    c = corners[idx][0]

                    # 마커 중앙좌표 계산
                    center_x = int(np.mean(c[:, 0]))
                    center_y = int(np.mean(c[:, 1]))

                    # 원 반지름 계산
                    radius = int(np.linalg.norm(c[0] - c[1]) / 2)

                    # 원 그리기
                    color = (0, 255, 0) if not seat_state[seat_num] else (0, 0, 255)
                    cv2.circle(frame, (center_x, center_y), radius, (0, 255, 0), 2)

                    status = "Occupied" if seat_state[seat_num] else "Empty"
                    cv2.putText(frame, f"Seat {seat_num}: {status}", (center_x, center_y),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 2)

                    # 마커 정보 저장
                    aruco_markers[seat_num] = (center_x, center_y, radius)

    # 마커가 없으면 빈 딕셔너리 반환
    return aruco_markers

# 아루코 마커들의 위치를 좌석 번호에 맞게 정렬. 4개 미만이면 정렬x
def sort_markers_by_spatial_position(corners, ids):
    if len(corners) != 4:
        return None
    
    centers = []
    for i in range(4):
        c = corners[i][0]
        center_x = np.mean(c[:, 0])
        center_y = np.mean(c[:, 1])
        centers.append((ids[i][0], center_x, center_y)) 

    avg_x = np.mean([c[1] for c in centers])
    avg_y = np.mean([c[2] for c in centers])

    quadrant = {}
    for marker_id, x, y in centers:
        if x <= avg_x and y <= avg_y:
            quadrant[0] = marker_id  # 왼상
        elif x > avg_x and y <= avg_y:
            quadrant[1] = marker_id  # 오상
        elif x <= avg_x and y > avg_y:
            quadrant[2] = marker_id  # 왼하
        else:
            quadrant[3] = marker_id  # 오하

    return [quadrant[i] for i in range(4)]  # [0번좌석 ID, 1번, 2번, 3번]

# 사람 위치를 좌석에 맞게 할당하는 함수
def get_seat_number(person_pos, aruco_markers, seat_threshold=100):
    if not aruco_markers:  # 마커가 없으면 None 반환
        return None

    px, py = person_pos
    for seat_num, (cx, cy, r) in aruco_markers.items():
        # 원의 방정식: (px - cx)^2 + (py - cy)^2 <= r^2
        distance_squared = (px - cx) ** 2 + (py - cy) ** 2
        distance = np.sqrt(distance_squared)

        # print(f"좌석 {seat_num} 중심: ({cx}, {cy}), 반지름: {r}, 사람의 위치: ({px}, {py}), 거리: {distance}")

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
        # current_time = time.time()

        if seat_num is not None:
            detected_seats.add(seat_num)

            # 위치 안정화 위한 최근 위치 기록
            recent_positions[seat_num].append(pos)
            if len(recent_positions[seat_num]) > STABILITY_WINDOW:
                recent_positions[seat_num].pop(0)  # 리스트 크기 제한

            # 평균 위치 계산
            if len(recent_positions[seat_num]) >= 3:  # 최소 3개 이상의 위치가 있어야 안정화 적용
                avg_position = np.mean(recent_positions[seat_num], axis=0)
                position_diff = np.linalg.norm(np.array(pos) - avg_position)

                # # 위치 변화가 미세하면 갱신x (안정화)
                # if position_diff < POSITION_THRESHOLD:
                #     continue
            
            # 좌석 상태 업데이트
            last_seen_time[seat_num] = current_time
            
            # 상태가 변경될 때만 로그 출력
            if not seat_state[seat_num]:
                log_with_throttle(f"사람이 좌석 {seat_num}에 앉았습니다.", seat_num, 2.0)
                seat_state[seat_num] = True
            
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