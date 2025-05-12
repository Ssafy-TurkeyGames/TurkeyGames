import cv2
import os

# 카메라 열기 (기본 카메라는 0번)
cap = cv2.VideoCapture(1)

# 카메라가 정상적으로 열렸는지 확인
if not cap.isOpened():
    print("카메라를 열 수 없습니다.")
    exit()

photo_count = 0  # 찍은 사진 수

while True:
    # 카메라에서 프레임을 읽기
    ret, frame = cap.read()

    if not ret:
        print("프레임을 읽을 수 없습니다.")
        break

    # 프레임을 화면에 표시
    cv2.imshow('Camera', frame)

    # 's' 키를 누르면 사진을 찍고 저장
    key = cv2.waitKey(1) & 0xFF
    if key == ord('s'):  # 's' 키를 눌렀을 때
        photo_count += 1
        filename = f'./images/photo_{photo_count}.jpg'  # 사진 파일명 생성
        cv2.imwrite(filename, frame)  # 사진 저장
        print(f"{filename} 저장되었습니다.")

    # 'q' 키를 누르면 종료
    if key == ord('q'):  # 'q' 키를 눌렀을 때
        break

# 카메라 해제
cap.release()

# 모든 OpenCV 창을 닫기
cv2.destroyAllWindows()
