import cv2
import numpy as np

# 아루코 딕셔너리 및 파라미터 준비
aruco_dict = cv2.aruco.Dictionary_get(cv2.aruco.DICT_6X6_250)
parameters = cv2.aruco.DetectorParameters_create()

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
    corners, ids, _ = cv2.aruco.detectMarkers(frame, aruco_dict, parameters=parameters)

    # 마커가 하나라도 인식되면 메시지 표시
    if ids is not None and len(ids) > 0:
        cv2.putText(frame, "아루코 마커 인식 완료!", (30, 60),
                    cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 255, 0), 3)
        # 마커 테두리도 그려줌
        cv2.aruco.drawDetectedMarkers(frame, corners, ids)

    cv2.imshow('Camera', frame)
    key = cv2.waitKey(1) & 0xFF
    if key == ord('q'):
        print("프로그램을 종료합니다.")
        break

cap.release()
cv2.destroyAllWindows()
