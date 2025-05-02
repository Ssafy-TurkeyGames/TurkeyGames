import cv2

cv2.namedWindow("Camera", cv2.WINDOW_NORMAL)  # 창 크기 조절 가능
cv2.resizeWindow("Camera", 960, 540)          # 창 크기 지정

# 카메라 초기화 (검색결과[2] 참조)
cap = cv2.VideoCapture(0)

while True:
    ret, frame = cap.read()
    if not ret:
        print("카메라를 찾을 수 없습니다!")  # 검색결과[1] 오류 처리 참조
        break
    
    # 화면 표시 (검색결과[4] 참조)
    cv2.imshow('Camera Test', frame)
    
    # 0번 카메라로 전환
    if key == ord('0'):
        cap.release()
        current_cam = 0
        cap = cv2.VideoCapture(current_cam)
    # 1번 카메라로 전환
    elif key == ord('1'):
        cap.release()
        current_cam = 1
        cap = cv2.VideoCapture(current_cam)
    # 종료
    elif key == ord('q'):
        break

# 자원 해제
cap.release()
cv2.destroyAllWindows()
