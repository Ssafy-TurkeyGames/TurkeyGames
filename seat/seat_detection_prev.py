import cv2
from config import ARUCO_MARKERS

seat_state = {seat: False for seat in ARUCO_MARKERS}

def get_seat_number(person_pos):
    px, py = person_pos
    for seat_num, (x1, y1, x2, y2) in ARUCO_MARKERS.items():
        if x1 <= px <= x2 and y1 <= py <= y2:
            return seat_num
    return None

def get_seat_occupancy(people_positions):
    occupancy = {}
    for pos in people_positions:
        seat_num = get_seat_number(pos)
        if seat_num is not None:
            occupancy[seat_num] = True
    return occupancy

def update_seat_status(current_occupancy):
    for seat_num in seat_state:
        occupied = current_occupancy.get(seat_num, False)
        if occupied and not seat_state[seat_num]:
            print(f"좌석 {seat_num}에 사람이 앉아 있습니다.")
            seat_state[seat_num] = True
        elif not occupied and seat_state[seat_num]:
            print(f"좌석 {seat_num}은 비어 있습니다.")
            seat_state[seat_num] = False

def draw_aruco_markers(frame):
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    aruco_dict = cv2.aruco.getPredefinedDictionary(cv2.aruco.DICT_4X4_250)
    parameters = cv2.aruco.DetectorParameters()
    corners, ids, _ = cv2.aruco.detectMarkers(gray, aruco_dict, parameters=parameters)
    if ids is not None:
        cv2.aruco.drawDetectedMarkers(frame, corners, ids)
