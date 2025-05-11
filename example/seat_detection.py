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

    aruco_markers = {}

    if ids is not None:
        cv2.aruco.drawDetectedMarkers(frame, corners, ids)

        # 중복 마커 처리용 변수
        unique_markers = []  # 중복 제거를 위함

        for i, corner in enumerate(corners):
            # 마커의 중앙 좌표 계산
            center_x = int(np.mean(corner[0][:, 0]))
            center_y = int(np.mean(corner[0][:, 1]))

            # 좌표 중복 제거 (허용 오차 범위 지정)
            is_duplicate = False
            for m in unique_markers:
                # 중복 좌표를 허용하는 최소 오차 (atol 값을 더 작게 설정)
                if np.isclose([center_x, center_y], m, atol=2).all():  # atol=5로 더 정확하게 처리
                    is_duplicate = True
                    break
            
            if not is_duplicate:
                unique_markers.append([center_x, center_y])

        if len(corners) == 4:  # 아루코 마커 4개가 모두 감지되었을 경우

            sorted_markers = sort_markers_based_on_position(unique_markers)

            # 각 좌석 번호에 맞는 좌석 범위 매핑
            top_left = sorted_markers[0]  # 0번 좌석 (왼쪽 위)
            top_right = sorted_markers[1]  # 1번 좌석 (오른쪽 위)
            bottom_left = sorted_markers[2]  # 2번 좌석 (왼쪽 아래)
            bottom_right = sorted_markers[3]  # 3번 좌석 (오른쪽 아래)

            # 각 좌석의 좌표 범위를 ARUCO_MARKERS에 저장
            aruco_markers[0] = (top_left[0], top_left[1], top_right[0], top_right[1])  # 좌석 0번
            aruco_markers[1] = (top_right[0], top_right[1], bottom_right[0], bottom_right[1])  # 좌석 1번
            aruco_markers[2] = (bottom_left[0], bottom_left[1], top_left[0], top_left[1])  # 좌석 2번
            aruco_markers[3] = (bottom_right[0], bottom_right[1], top_right[0], top_right[1])  # 좌석 3번

            # 각 좌석의 범위 출력
            print(f"ArUco markers (seat ranges):")
            for seat_num, (x1, y1, x2, y2) in aruco_markers.items():
                print(f"Seat {seat_num}: ({x1}, {y1}) to ({x2}, {y2})")

            # for seat_number, (center_x, center_y) in detected_markers.items():
            for seat_number, (center_x, center_y) in enumerate(unique_markers):
                cv2.putText(frame, f"Seat {seat_number}", (center_x - 20, center_y - 20),
                            cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

    return aruco_markers  # 마커가 없으면 빈 딕셔너리 반환

# 아루코 마커들의 위치를 좌석 번호에 맞게 정렬하는 함수
def sort_markers_based_on_position(markers):
    if len(markers) < 4:  # 마커가 4개 미만이면 정렬하지 않음
        return markers  # 4개 미만일 경우 그대로 반환
    
    # 변경된 부분: 튜플 변환을 없앴습니다.
    markers = [marker for marker in markers]  # 튜플로 변환할 필요가 없음

    # 마커들이 영상 내에서 변할 때마다 상대적인 위치를 바탕으로 순서를 결정
    # (왼쪽 위, 오른쪽 위, 왼쪽 아래, 오른쪽 아래 순서대로 정렬)
    top_left = sorted(markers, key=lambda x: (x[1], x[0]))[0]  # 가장 위쪽, 가장 왼쪽
    top_right = sorted(markers, key=lambda x: (x[1], -x[0]))[0]  # 가장 위쪽, 가장 오른쪽
    bottom_left = sorted(markers, key=lambda x: (-x[1], x[0]))[0]  # 가장 아래쪽, 가장 왼쪽
    bottom_right = sorted(markers, key=lambda x: (-x[1], -x[0]))[0]  # 가장 아래쪽, 가장 오른쪽

    print(f"Sorted markers: {top_left}, {top_right}, {bottom_left}, {bottom_right}")

    return [top_left, top_right, bottom_left, bottom_right]

# 사람 위치를 좌석에 맞게 할당하는 함수
def get_seat_number(person_pos, aruco_markers):
    px, py = person_pos
    for seat_num, (x1, y1, x2, y2) in aruco_markers.items():
        print(f"Checking seat {seat_num}:")
        print(f"Person position: ({px}, {py})")
        print(f"Seat boundaries: ({x1}, {y1}) to ({x2}, {y2})")  # 좌석 범위 출력

        # 좌석의 경계 안에 사람의 위치가 있는지 확인
        if x1 <= px <= x2 and y1 <= py <= y2:
            print(f"Person is in seat {seat_num}.")
            return seat_num  # 해당 좌석 번호 반환
        # 마커 영역 주변에 사람이 있을 때
        elif (abs(px - x1) <= 30 and abs(py - y1) <= 30) or (abs(px - x2) <= 30 and abs(py - y2) <= 30):
            print(f"Person is near seat {seat_num}.")
            return seat_num  # 마커 근처에 사람이 있으면 해당 좌석으로 처리
    print("Person is not in any seat.")
    return None  # 좌석에 앉지 않으면 None 반환

# 최종 좌석 상태 추적
def get_seat_occupancy(people_positions, aruco_markers):
    occupancy = {}
    for pos in people_positions:
        seat_num = get_seat_number(pos, aruco_markers)
        if seat_num is not None:
            print(f"사람이 좌석 {seat_num}에 앉았습니다.")
            occupancy[seat_num] = True
        else:
            print("사람이 좌석에 앉지 않았습니다.")
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