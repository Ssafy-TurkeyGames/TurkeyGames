import math
from ultralytics import YOLO

model = YOLO("yolov8n-pose.pt")

# 사람 1명의 두 관절 간 유클리드 거리 계산. 너무 멀면 사람 1명 아님
def calculate_distance(p1, p2):
    return math.sqrt((p2[0] - p1[0]) ** 2 + (p2[1] - p1[1]) ** 2)

# 어깨와 팔꿈치가 존재하는지 확인
def is_valid_person(shoulder_left, shoulder_right, elbow_left, elbow_right, min_distance=10):
    if any(p is None for p in [shoulder_left, shoulder_right, elbow_left, elbow_right]):
        return False
    if calculate_distance(shoulder_left, elbow_left) < min_distance:
        return False
    if calculate_distance(shoulder_right, elbow_right) < min_distance:
        return False
    return True

# keypoints로 사람을 구별
def extract_valid_persons(results):
    persons = []

    # keypoints 데이터 자체가 없는 경우 처리
    if not results or not hasattr(results[0], 'keypoints'):
        return []

    keypoints_list = results[0].keypoints.xy  # shape: [N, 17, 2]
    confidences = results[0].keypoints.conf

    if keypoints_list is None or confidences is None or len(keypoints_list) == 0:
        return []

    for i in range(len(keypoints_list)):
        kp = keypoints_list[i] # 관절 좌표
        conf = confidences[i] # 각 관절의 신뢰도

        # 관절이 2개 이하로 검출된다면 사람으로 인지x
        if len(kp) < 3:
            continue

        s_left, s_right = kp[5], kp[6] # 양쪽 어깨
        e_left, e_right = kp[7], kp[8] # 양쪽 팔꿈치

        # 각 관절의 신뢰도가 낮으면 다시 검사
        if conf[5] < 0.5 or conf[6] < 0.5:
            continue

        if is_valid_person(s_left, s_right, e_left, e_right):
            persons.append(kp[5])  # 어깨 좌표만 저장

    return persons

def detect_people(frame):
    results = model(frame, verbose=False)
    keypoints = extract_valid_persons(results)

    return keypoints

# 사람 여러명이 너무 가까이 붙어있다면 그중 한 사람은 제거
def filter_by_distance(persons, min_distance=100):
    result = []
    for i, p1 in enumerate(persons):
        if all(calculate_distance(p1, p2) >= min_distance for j, p2 in enumerate(persons) if i != j):
            result.append(p1)
    return result
