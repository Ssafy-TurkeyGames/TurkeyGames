import cv2
import numpy as np

# 좌석 상태 추적을 위한 변수
seat_state = {0: False, 1: False, 2: False, 3: False}  # 좌석 상태 (비어있으면 False, 앉아있으면 True)

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
                    cv2.circle(frame, (center_x, center_y), radius, (0, 255, 0), 2)

                    cv2.putText(frame, f"Seat {seat_num}", (center_x, center_y),
                                cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

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
def get_seat_number(person_pos, aruco_markers, seat_threshold=70):
    px, py = person_pos
    for seat_num, (cx, cy, r) in aruco_markers.items():
        # 원의 방정식: (px - cx)^2 + (py - cy)^2 <= r^2
        distance_squared = (px - cx) ** 2 + (py - cy) ** 2
        distance = np.sqrt(distance_squared)

        print(f"좌석 {seat_num} 중심: ({cx}, {cy}), 반지름: {r}, 사람의 위치: ({px}, {py}), 거리: {distance}")

        if distance <= r + seat_threshold:
            print(f"사람이 좌석 {seat_num}에 착석했습니다!!")  # 착석했다고 출력
            return seat_num  # 해당 좌석 번호 반환
    return None  # 좌석에 앉지 않으면 None 반환

# 최종 좌석 상태 추적
def get_seat_occupancy(people_positions, aruco_markers):
    occupancy = {}
    for pos in people_positions:
        seat_num = get_seat_number(pos, aruco_markers)
        if seat_num is not None:
            print(f"사람이 좌석 {seat_num}에 앉았습니다.")
            occupancy[seat_num] = True
    return occupancy

# 좌석 상태 갱신 및 로그 출력
def update_seat_status(current_occupancy):
    global seat_state
    for seat_num in seat_state:
        occupied = current_occupancy.get(seat_num, False)
        if occupied and not seat_state[seat_num]:
            print(f"좌석 {seat_num}에 사람이 앉아 있습니다.")
            seat_state[seat_num] = True
        elif not occupied and seat_state[seat_num]:
            print(f"좌석 {seat_num}은 비어 있습니다.")
            seat_state[seat_num] = False