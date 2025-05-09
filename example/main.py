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

    # 실시간 영상 왜곡 보정
    undistorted = undistort_frame(frame, camera_matrix, dist_coeffs)

    # 왜곡 보정해서 어깨를 기반으로 사람 검출
    keypoints = detect_people(undistorted)

    # 검출된 사람에 따른 자리 추적
    seat_occupancy = get_seat_occupancy(keypoints)
    update_seat_status(seat_occupancy)

    # 아루코 마커 그리기 (필요있나?)
    draw_aruco_markers(undistorted)

    # 디버깅: 사람 위치 출력
    for person in keypoints:
        pos = person
        pos = person
        shoulder_x, shoulder_y = int(pos[0]), int(pos[1])  # 어깨 좌표 사용

        # 사람 위치에 초록색 점으로 표시
        cv2.circle(undistorted, (shoulder_x, shoulder_y), 10, (0, 255, 0), -1)

        # 사람 박스 그리기 (어깨 기준으로 간단한 사각형 예시)
        cv2.rectangle(undistorted, (shoulder_x - 20, shoulder_y - 20), (shoulder_x + 20, shoulder_y + 20), (0, 255, 0), 2)

    # 왼쪽 상단에 "people: X" 텍스트 표시
    people_count = len(keypoints)
    cv2.putText(undistorted, f'people: {people_count}', (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2, cv2.LINE_AA)

    # 최종 화면을 표시
    cv2.imshow("People and Seat Detection", undistorted)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
