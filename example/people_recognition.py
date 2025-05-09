import math
from ultralytics import YOLO

model = YOLO("yolov8n-pose.pt")

def calculate_distance(p1, p2):
    return math.sqrt((p2[0] - p1[0]) ** 2 + (p2[1] - p1[1]) ** 2)

def is_valid_person(shoulder_left, shoulder_right, elbow_left, elbow_right, min_distance=10):
    if any(p is None for p in [shoulder_left, shoulder_right, elbow_left, elbow_right]):
        return False
    if calculate_distance(shoulder_left, elbow_left) < min_distance:
        return False
    if calculate_distance(shoulder_right, elbow_right) < min_distance:
        return False
    return True

def extract_valid_persons(results):

    keypoints_list = results[0].keypoints.xy
    confidences = results[0].keypoints.conf

    valid_persons = []
    for kp, conf in zip(keypoints_list, confidences):
        if len(kp) < 9:
            continue

        s_left, s_right = kp[5], kp[6]
        e_left, e_right = kp[7], kp[8]

        if conf[5] < 0.5 or conf[6] < 0.5:
            continue

        if is_valid_person(s_left, s_right, e_left, e_right):
            valid_persons.append((kp[5]))  # 어깨 좌표만 반환

    return valid_persons

def filter_by_distance(persons, min_distance=100):
    result = []
    for i, p1 in enumerate(persons):
        if all(calculate_distance(p1, p2) >= min_distance for j, p2 in enumerate(persons) if i != j):
            result.append(p1)
    return result

def detect_people(frame):
    results = model(frame, verbose=False)
    keypoints = extract_valid_persons(results)
    filtered = filter_by_distance(keypoints)
    return filtered, keypoints
