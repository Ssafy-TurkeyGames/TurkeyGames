import cv2

cv2.namedWindow("Camera", cv2.WINDOW_NORMAL)  # 창 크기 조절 가능
cv2.resizeWindow("Camera", 960, 540)          # 창 크기 지정 

# 카메라 초기화 (검색결과[2] 참조)
current_cam = 0
cap = cv2.VideoCapture(current_cam)

# HD
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)

# FHD
# cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1920)
# cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 1080)

# QHD
# cap.set(cv2.CAP_PROP_FRAME_WIDTH, 2560)
# cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 1440)

while True:
    ret, frame = cap.read()
    if not ret:
        print("카메라를 찾을 수 없습니다!")  # 검색결과[1] 오류 처리 참조
        break

    # 현재 프레임의 해상도 구하기
    height, width = frame.shape[:2]  # (세로, 가로)
    resolution_text = f"{width} x {height}"

    # 해상도 텍스트를 영상 좌측 상단에 표시
    cv2.putText(frame, resolution_text, (10, 30), 
                cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
    
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
    elif key == ord('c'):
        # 파일명에 시간과 번호를 넣어서 저장
        filename = f"capture_{time.strftime('%Y%m%d_%H%M%S')}_{capture_count}.png"
        cv2.imwrite(filename, frame)
        print(f"촬영 완료: {filename}")
        capture_count += 1
    # 종료
    elif key == ord('q'):
        break

# 자원 해제
cap.release()
cv2.destroyAllWindows()
