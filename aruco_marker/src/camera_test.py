import cv2

# 카메라 초기화 (검색결과[2] 참조)
cap = cv2.VideoCapture(0)

while True:
    ret, frame = cap.read()
    if not ret:
        print("카메라를 찾을 수 없습니다!")  # 검색결과[1] 오류 처리 참조
        break
    
    # 화면 표시 (검색결과[4] 참조)
    cv2.imshow('Camera Test', frame)
    
    # 'q' 키로 종료
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# 자원 해제
cap.release()
cv2.destroyAllWindows()
