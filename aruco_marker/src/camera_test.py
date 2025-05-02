import cv2

cv2.namedWindow("Camera", cv2.WINDOW_NORMAL)
# cv2.resizeWindow("Camera", 960, 540)

cap = cv2.VideoCapture(0)  # 0: 기본 카메라, 1: 외장 카메라

while True:
    ret, frame = cap.read()
    if not ret:
        print("카메라를 찾을 수 없습니다!")
        break

    cv2.imshow('Camera', frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
