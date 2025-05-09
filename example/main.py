import cv2
from people_recognition import detect_people
from seat_detection import update_seat_status, draw_aruco_markers, get_seat_occupancy
from utils import undistort_frame
from config import CAMERA_MATRIX_PATH, DIST_COEFFS_PATH

import numpy as np
import time

# 카메라 보정 파라미터 로드
camera_matrix = np.load(CAMERA_MATRIX_PATH)
dist_coeffs = np.load(DIST_COEFFS_PATH)

cap = cv2.VideoCapture(1)
if not cap.isOpened():
    print("웹캠을 열 수 없습니다.")
    exit()

last_log_time = time.time()

while True:
    ret, frame = cap.read()
    if not ret:
        continue

    undistorted = undistort_frame(frame, camera_matrix, dist_coeffs)
    people, keypoints = detect_people(undistorted)

    seat_occupancy = get_seat_occupancy(people)
    update_seat_status(seat_occupancy)

    draw_aruco_markers(undistorted)

    # 디버깅: 사람 위치 출력
    for person in keypoints:
        pos = person
        cv2.circle(undistorted, (int(pos[0]), int(pos[1])), 5, (0, 255, 0), -1)

    cv2.imshow("People and Seat Detection", undistorted)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
