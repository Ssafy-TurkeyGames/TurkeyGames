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

        if len(corners) == 4:  # 아루코 마커 4개가 모두 감지되었을 경우
            markers = [corners[i][0] for i in range(len(corners))]
            
            # 마커들을 정렬하여 각 마커의 좌석 번호를 결정
            unique_markers = []
            for marker in markers:
                unique_markers.extend([tuple(marker[i]) for i in range(4)])

            unique_markers = list(set(unique_markers))  # 중복 제거

            # 마커들을 정렬하여 각 마커의 좌석 번호를 결정

            sorted_markers = sort_markers_based_on_position(unique_markers)

            # 각 좌석 번호에 맞는 좌석 범위 매핑
            top_left = sorted_markers[0]  # 0번 좌석 (왼쪽 위)
            top_right = sorted_markers[1]  # 1번 좌석 (오른쪽 위)
            bottom_left = sorted_markers[2]  # 2번 좌석 (왼쪽 아래)
            bottom_right = sorted_markers[3]  # 3번 좌석 (오른쪽 아래)

            # 각 마커에 좌석 번호 표시
            for i, corner in enumerate(corners):
                
                # 마커의 중앙 좌표 계산
                center_x = int(np.mean(corner[0][:, 0]))
                center_y = int(np.mean(corner[0][:, 1]))

                # 원 반지름 계산 (적절한 반지름을 설정할 필요 있음)
                radius = int(np.linalg.norm(np.array(corner[0][0]) - np.array(corner[0][1])) / 2)

                # 원 그리기
                cv2.circle(frame, (center_x, center_y), radius, (0, 255, 0), 2)

                # 좌석 번호 텍스트로 표시
                cv2.putText(frame, f"Seat {i}", (center_x, center_y), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

                # 마커 정보 저장
                aruco_markers[i] = (center_x, center_y, radius)  # (중심 x, 중심 y, 반지름)

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
def get_seat_number(person_pos, aruco_markers, seat_threshold=20):
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