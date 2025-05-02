import cv2
import numpy as np

# 아루코 딕셔너리 및 detector 준비 (최신 방식)
aruco_dict = cv2.aruco.getPredefinedDictionary(cv2.aruco.DICT_6X6_250)
parameters = cv2.aruco.DetectorParameters()
detector = cv2.aruco.ArucoDetector(aruco_dict, parameters)

cv2.namedWindow("Camera", cv2.WINDOW_NORMAL)
cv2.resizeWindow("Camera", 960, 540)

cap = cv2.VideoCapture(0)
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)

while True:
    ret, frame = cap.read()
    if not ret:
        print("카메라 프레임을 읽을 수 없습니다.")
        break

    # 아루코 마커 인식
    corners, ids, rejected = detector.detectMarkers(frame)

    if ids is not None and len(ids) > 0:
        # 마커 테두리 그리기
        cv2.aruco.drawDetectedMarkers(frame, corners, ids)

        # 각 마커의 중심에 ID 표시
        for i, corner in enumerate(corners):
            # corners[i][0]은 4개의 꼭짓점 좌표 (x, y)
            pts = corner[0]
            center_x = int(pts[:, 0].mean())
            center_y = int(pts[:, 1].mean())
            marker_id = int(ids[i][0])
            cv2.putText(frame, f"ID:{marker_id}", (center_x - 20, center_y),
                        cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 3)

    cv2.imshow('Camera', frame)
    key = cv2.waitKey(1) & 0xFF
    if key == ord('q'):
        print("프로그램을 종료합니다.")
        break

cap.release()
cv2.destroyAllWindows()
