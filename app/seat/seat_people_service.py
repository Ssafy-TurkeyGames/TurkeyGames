import cv2
import numpy as np
import time
from app.seat.people_recognition import detect_people  # 사람 인식
from app.seat.seat_detection import update_seat_status, draw_aruco_markers, get_seat_occupancy
from app.seat.utils import undistort_frame
from app.seat.config import CAMERA_MATRIX_PATH, DIST_COEFFS_PATH

# 카메라 보정 파라미터 로드
camera_matrix = np.load(CAMERA_MATRIX_PATH)
dist_coeffs = np.load(DIST_COEFFS_PATH)

cap = cv2.VideoCapture(1)
if not cap.isOpened():
    raise Exception("웹캠을 열 수 없습니다.")

# 좌석 상태 추적 및 감지
def detect_seat_status():
    seat_status = {}
    last_log_time = time.time()

    while True:
        ret, frame = cap.read()
        if not ret:
            continue

        # 실시간 영상 왜곡 보정
        undistorted = undistort_frame(frame, camera_matrix, dist_coeffs)

        # 사람 인식
        keypoints = detect_people(undistorted)

        # 아루코 마커 감지 및 동적 좌석 매핑
        aruco_markers = draw_aruco_markers(undistorted)

        # 좌석 상태 추적
        seat_occupancy = get_seat_occupancy(keypoints, aruco_markers)
        update_seat_status(seat_occupancy)

        for seat_num, occupied in seat_occupancy.items():
            seat_status[seat_num] = "Occupied" if occupied else "Empty"

        return seat_status  # 실시간 상태를 API로 반환

def video_stream():
    while True:
        ret, frame = cap.read()
        if not ret:
            continue
        # 실시간 영상 왜곡 보정
        undistorted = undistort_frame(frame, camera_matrix, dist_coeffs)

        # 사람 인식
        keypoints = detect_people(undistorted)

        # 아루코 마커 감지 및 그리기
        aruco_markers = draw_aruco_markers(undistorted)
        if aruco_markers is None:
            aruco_markers = {}

        # 좌석 상태 추적
        seat_occupancy = get_seat_occupancy(keypoints, aruco_markers)
        update_seat_status(seat_occupancy)

        # 인식 결과 시각화
        for person in keypoints:
            x, y = int(person[0]), int(person[1])
            cv2.circle(undistorted, (x, y), 10, (0, 255, 0), -1)
            cv2.rectangle(undistorted, (x - 20, y - 20), (x + 20, y + 20), (0, 255, 0), 2)

        for seat_num, occupied in seat_occupancy.items():
            color = (0, 0, 255) if occupied else (0, 255, 0)
            if seat_num in aruco_markers:
                cx, cy, r = aruco_markers[seat_num]
                cv2.circle(undistorted, (cx, cy), r, color, 3)
                cv2.putText(undistorted,
                            f"Seat {seat_num}: {'Occupied' if occupied else 'Empty'}",
                            (cx - 30, cy - r - 10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)

        # 왼쪽 상단에 사람 수 표시
        cv2.putText(undistorted, f'people: {len(keypoints)}', (10, 30),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)


        ret, jpeg = cv2.imencode('.jpg', undistorted)
        if not ret:
            continue

        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + jpeg.tobytes() + b'\r\n')
