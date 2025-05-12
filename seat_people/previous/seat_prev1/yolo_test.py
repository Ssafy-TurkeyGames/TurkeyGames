import cv2
from ultralytics import YOLO
import time

# YOLOv8 모델 불러오기
model = YOLO('yolov8n.pt')

# USB 웹캠 열기 (웹캠 번호는 시스템에 따라 다를 수 있습니다. 0번은 기본 웹캠이고, USB 웹캠은 1번 이상일 수 있습니다)
cap = cv2.VideoCapture(1)  # 웹캠 번호 1 (USB 웹캠)

# 웹캠이 정상적으로 열리면
if not cap.isOpened():
    print("웹캠을 열 수 없습니다.")
    exit()

# 최근 몇 초간의 사람 수를 추적하기 위한 변수
last_people_count = 0  # 마지막으로 서버로 전송한 사람 수
people_count_history = []  # 사람 수 기록을 위한 리스트
stable_count_duration = 5  # 사람 수 안정화 시간 (5초 동안 안정적인 사람 수가 계속 유지되어야 서버로 전송)

# 서버로 데이터 전송하는 함수 (예시)
def send_data_to_server(people_count):
    # 여기에 서버로 데이터를 보내는 로직을 추가
    print(f"Sending {people_count} people count to server")

# 실시간으로 비디오 스트림을 처리하면서 객체 감지 수행
while True:
    ret, frame = cap.read()  # 프레임 읽기
    
    if not ret:
        print("프레임을 읽을 수 없습니다.")
        break

    # YOLOv8 모델을 사용하여 객체 감지
    results = model(frame)

    # 결과에서 'person' 클래스를 필터링 (클래스 인덱스를 int로 변환)
    people = [result for result in results[0].boxes if results[0].names[int(result.cls[0])] == 'person']

    # 감지된 사람 수
    people_count = len(people)
    print(f"Detected people: {people_count}")

    # 사람 수 기록
    people_count_history.append(people_count)

    # 사람 수가 안정적이면 서버에 전송
    if len(people_count_history) > stable_count_duration:
        people_count_history.pop(0)  # 가장 오래된 값을 제거하여 리스트 크기를 유지

    # 최근 N초 동안 사람 수가 변화가 적으면 서버로 전송
    if len(set(people_count_history)) == 1:  # 모든 기록된 값이 동일하면
        if people_count != last_people_count:  # 마지막으로 보낸 사람 수와 다르면
            send_data_to_server(people_count)
            last_people_count = people_count  # 마지막 전송된 값 갱신

    # 감지된 객체들을 원본 영상에 표시
    frame = results[0].plot()  # 감지된 객체가 그려진 이미지를 반환
    
    # 사람 수를 영상에 텍스트로 표시
    cv2.putText(frame, f"People: {people_count}", (30, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2, cv2.LINE_AA)
    
    # 화면에 실시간 영상 출력
    cv2.imshow('Real-time Object Detection', frame)

    # 'q' 키를 눌러 종료
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# 웹캠 리소스 해제 및 종료
cap.release()
cv2.destroyAllWindows()
