import cv2
from ultralytics import YOLO
import time
import math

# YOLOv8 pose 모델 불러오기
model = YOLO('yolov8n-pose.pt')  # Pose 모델 사용

cap = cv2.VideoCapture(1)

if not cap.isOpened():
    print("웹캠을 열 수 없습니다.")
    exit()

# 사람 수 기록을 위한 변수
last_people_count = 0
people_count_history = []
stable_count_duration = 5

# 사람 수를 서버에 전송함. 추후 전송 데이터 추가
def send_data_to_server(people_count):
    print(f"Sending {people_count} people count to server")

# 사람으로 인식하여 전달받은 두 관절 간 유클리드 거리 계산
# 한쪽 어깨 - 한쪽 팔꿈치 간 거리가 너무 멀다면 그건 신체 1개가 아님
def calculate_distance(point1, point2):
    x1, y1 = point1
    x2, y2 = point2
    return math.sqrt((x2 - x1)**2 + (y2 - y1)**2)

# 결과에서 'person' 클래스를 필터링하는 대신 keypoints로 사람을 구별
def extract_persons_from_pose(detections):
    persons = []
    for result in detections:
        keypoints = result.xy  # 관절 좌표
        confidences = result.conf  # 각 관절의 신뢰도

        if keypoints is not None and keypoints.shape[1] > 0:  # keypoints가 비어있지 않으면
            # print(f"Detected keypoints: {keypoints}")  # 디버깅 keypoints 출력

              # 신뢰도(confidence)가 0.5 이상인 좌표만 사용
            valid_keypoints = []
            for i in range(keypoints.shape[1]):
                # 좌표가 (0.0, 0.0) 이거나 신뢰도가 너무 낮은 경우를 제외
                if keypoints[0][i][0] != 0.0 and keypoints[0][i][1] != 0.0 and confidences[0][i] > 0.5:
                    valid_keypoints.append(keypoints[0][i][:2])  # (x, y) 좌표만 저장

            # 어깨 2개와 팔꿈치 2개만 있으면 사람으로 인정
            if len(valid_keypoints) >= 4:  # 어깨 2개, 팔꿈치 2개
                # 유효한 좌표만 있을 때 어깨와 팔꿈치 좌표 추출
                shoulder_left = valid_keypoints[5] if len(valid_keypoints) > 5 else None  # 어깨 왼쪽 (xy[5])
                shoulder_right = valid_keypoints[6] if len(valid_keypoints) > 6 else None  # 어깨 오른쪽 (xy[6])
                elbow_left = valid_keypoints[7] if len(valid_keypoints) > 7 else None  # 팔꿈치 왼쪽 (xy[7])
                elbow_right = valid_keypoints[8] if len(valid_keypoints) > 8 else None  # 팔꿈치 오른쪽 (xy[8])

                # 만약 필요한 좌표가 하나라도 없으면 사람으로 인식하지 않음
                # if None not in [shoulder_left, shoulder_right, elbow_left, elbow_right]:
                if (shoulder_left is not None and shoulder_right is not None and
                    (elbow_left is not None or elbow_right is not None)):
                    # 사람인지 판별하는 함수로 전송
                    if is_valid_person(shoulder_left, shoulder_right, elbow_left, elbow_right):
                        persons.append(result)
                else:
                    print("Missing keypoints for shoulders or elbows.")
            else:
                print("Not enough valid keypoints detected.")
        else:
            print("No valid keypoints detected")
    return persons

def is_valid_person(shoulder_left, shoulder_right, elbow_left, elbow_right):
    # 어깨와 팔꿈치가 모두 존재하는지 확인
    if shoulder_left is None or shoulder_right is None or elbow_left is None or elbow_right is None:
        return False  # 어깨나 팔꿈치가 없으면 유효한 사람이 아님

    # 팔꿈치와 어깨 간의 거리를 계산하여 너무 가까우면 사람으로 인정하지 않음
    min_distance = 10  # 최소 거리 설정 (이 값은 조정이 필요할 수 있습니다)
    
    # 왼쪽 어깨와 왼쪽 팔꿈치 간의 거리 계산
    distance_left = calculate_distance(shoulder_left, elbow_left)
    # 오른쪽 어깨와 오른쪽 팔꿈치 간의 거리 계산
    distance_right = calculate_distance(shoulder_right, elbow_right)
    
    # 팔꿈치와 어깨 간의 거리가 너무 가까우면 유효하지 않음
    if distance_left < min_distance or distance_right < min_distance:
        return False

    return True

def filter_by_distance(detections, min_distance=100):
    valid_detections = []
    for i, bbox1 in enumerate(detections):
        too_close = False
        bbox1_coords = bbox1.xy[0][5][:2]  # shoulder_left (xy[5]) 예시

        for j, bbox2 in enumerate(detections):
            if i != j:
                bbox2_coords = bbox2.xy[0][5][:2]  # shoulder_left (xy[5]) 예시
                distance = calculate_distance(bbox1_coords, bbox2_coords)
                if distance < min_distance:
                    too_close = True
                    break
        if not too_close:
            valid_detections.append(bbox1)
    return valid_detections

while True:
    ret, frame = cap.read()
    
    if not ret:
        print("프레임을 읽을 수 없습니다.")
        break

    # 원본영상 디버깅
    # cv2.imshow('Input Frame', frame)

    results = model(frame)

    # print(f"Results: {results}")  # 전체 결과 출력
    # print(f"Keypoints: {results[0].keypoints}")  # keypoints 값 확인

    # Pose 모델을 사용해 사람 구분
    filtered_people = extract_persons_from_pose(results[0].keypoints)

    # 최소 거리 기준으로 필터링
    filtered_people = filter_by_distance(filtered_people)

    people_count_history.append(len(filtered_people))
    if len(people_count_history) > stable_count_duration:
        people_count_history.pop(0)

    if len(set(people_count_history)) == 1:
        if len(filtered_people) != last_people_count:
            send_data_to_server(len(filtered_people))
            last_people_count = len(filtered_people)

    frame = results[0].plot()

    cv2.putText(frame, f"People: {len(filtered_people)}", (30, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2, cv2.LINE_AA)
    
    cv2.imshow('Real-time Object Detection', frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()