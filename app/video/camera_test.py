# camera_test.py
import cv2
cap = cv2.VideoCapture(0)
if not cap.isOpened():
    print("카메라 열기 실패!")
else:
    print("카메라 정상 연결")
cap.release()
