import cv2
import os
import time

# --- [1] 캡처 이미지 저장 폴더 준비 ---
save_dir = os.path.join(os.path.dirname(__file__), '..', 'captures')
os.makedirs(save_dir, exist_ok=True)

cv2.namedWindow("Camera", cv2.WINDOW_NORMAL)
cv2.resizeWindow("Camera", 960, 540)

current_cam = 0
cap = cv2.VideoCapture(current_cam)
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 2592)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 1944)

capture_count = 0  # 촬영 파일 번호

while True:
    ret, frame = cap.read()
    if not ret:
        print("카메라 프레임을 읽을 수 없습니다.")
        break

    # --- [2] 해상도 표기 ---
    height, width = frame.shape[:2]
    resolution_text = f"{width} x {height}"
    cv2.putText(frame, resolution_text, (10, 30), 
                cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

    cv2.imshow('Camera', frame)
    key = cv2.waitKey(1) & 0xFF

    # --- [3] 카메라 전환 ---
    if key == ord('0'):
        cap.release()
        current_cam = 0
        cap = cv2.VideoCapture(current_cam)
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, 2592)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 1944)
        print("0번 카메라로 전환")
    elif key == ord('1'):
        cap.release()
        current_cam = 1
        cap = cv2.VideoCapture(current_cam)
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, 2592)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 1944)
        print("1번 카메라로 전환")

    # --- [4] 촬영 (c키) ---
    elif key == ord('c'):
        now = time.strftime('%Y%m%d_%H%M%S')
        filename = os.path.join(save_dir, f"capture_{now}_{capture_count}.png")
        cv2.imwrite(filename, frame)
        print(f"촬영 완료: {filename}")
        capture_count += 1

    # --- [5] 종료 (q키) ---
    elif key == ord('q'):
        print("프로그램을 종료합니다.")
        break

cap.release()
cv2.destroyAllWindows()
