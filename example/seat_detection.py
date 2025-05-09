import cv2
import numpy as np

# 좌석 상태 추적을 위한 변수
seat_state = {0: False, 1: False, 2: False, 3: False}  # 좌석 상태 (비어있으면 False, 앉아있으면 True)

# 아루코 마커 감지 및 좌석 매핑
def draw_aruco_markers(frame):
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    aruco_dict = cv2.aruco.getPredefinedDictionary(cv2.aruco.DICT_4X4_250)
    parameters = cv2.aruco.DetectorParameters()
    corners, ids, _ = cv2.aruco.detectMarkers(gray, aruco_dict, parameters=parameters)

    if ids is not None:
        cv2.aruco.drawDetectedMarkers(frame, corners, ids)

        if len(corners) == 4:  # 아루코 마커 4개가 모두 감지되었을 경우
            markers = [corners[i][0] for i in range(len(corners))]
            
            # 마커들을 정렬하여 각 마커의 좌석 번호를 결정
            sorted_markers = sort_markers_based_on_position(markers)

            # 각 좌석 번호에 맞는 좌석 범위 매핑
            top_left = sorted_markers[0]  # 0번 좌석 (왼쪽 위)
            top_right = sorted_markers[1]  # 1번 좌석 (오른쪽 위)
            bottom_left = sorted_markers[2]  # 2번 좌석 (왼쪽 아래)
            bottom_right = sorted_markers[3]  # 3번 좌석 (오른쪽 아래)

            # 좌석 좌표 범위를 동적으로 매핑
            return {
                0: (top_left[0][0], top_left[0][1], top_right[0][0], top_right[0][1]),
                1: (top_right[0][0], top_right[0][1], bottom_right[0][0], bottom_right[0][1]),
                2: (bottom_left[0][0], bottom_left[0][1], top_left[0][0], top_left[0][1]),
                3: (bottom_right[0][0], bottom_right[0][1], top_right[0][0], top_right[0][1])
            }

# 아루코 마커들의 위치를 좌석 번호에 맞게 정렬하는 함수
def sort_markers_based_on_position(markers):
    # 마커들이 영상 내에서 변할 때마다 상대적인 위치를 바탕으로 순서를 결정
    # (왼쪽 위, 오른쪽 위, 왼쪽 아래, 오른쪽 아래 순서대로 정렬)
    top_left = sorted(markers, key=lambda x: (x[0], x[1]))[0]  # 왼쪽 위
    top_right = sorted(markers, key=lambda x: (x[0], -x[1]))[0]  # 오른쪽 위
    bottom_left = sorted(markers, key=lambda x: (-x[0], x[1]))[0]  # 왼쪽 아래
    bottom_right = sorted(markers, key=lambda x: (-x[0], -x[1]))[0]  # 오른쪽 아래

    return [top_left, top_right, bottom_left, bottom_right]

# 사람 위치를 좌석에 맞게 할당하는 함수
def get_seat_number(person_pos, aruco_markers):
    px, py = person_pos
    for seat_num, (x1, y1, x2, y2) in aruco_markers.items():
        if x1 <= px <= x2 and y1 <= py <= y2:
            return seat_num  # 해당 좌석 번호 반환
    return None  # 좌석에 앉지 않으면 None 반환

# 최종 좌석 상태 추적
def get_seat_occupancy(people_positions, aruco_markers):
    occupancy = {}
    for pos in people_positions:
        seat_num = get_seat_number(pos, aruco_markers)
        if seat_num is not None:
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