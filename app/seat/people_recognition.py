import math
from ultralytics import YOLO
import cv2
import numpy as np
import torch

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
        kp = keypoints_list[i]  # 관절 좌표
        conf = confidences[i]  # 각 관절의 신뢰도

        # 관절이 2개 이하로 검출된다면 사람으로 인지x
        if len(kp) < 3:
            continue

        s_left, s_right = kp[5], kp[6]  # 양쪽 어깨
        e_left, e_right = kp[7], kp[8]  # 양쪽 팔꿈치

        # 각 관절의 신뢰도가 낮으면 다시 검사
        if conf[5] < 0.5 or conf[6] < 0.5:
            continue

        if is_valid_person(s_left, s_right, e_left, e_right):
            persons.append(kp[5])  # 어깨 좌표만 저장

    return persons

def rotate_image(image, angle):
    h, w = image.shape[:2]
    center = (w // 2, h // 2)
    rot_mat = cv2.getRotationMatrix2D(center, angle, 1.0)
    rotated = cv2.warpAffine(image, rot_mat, (w, h), flags=cv2.INTER_LINEAR)
    return rotated

def rotate_point(x, y, w, h, angle):
    if angle == 0:
        return x, y
    elif angle == 90:
        return y, w - x
    elif angle == 270:
        return h - y, x
    else:
        raise ValueError("Angle must be 0, 90, or 270")


def detect_people(frame):
    angles = [0, 90, 270]
    h, w = frame.shape[:2]
    best_keypoints = None
    best_score = -float('inf')

    for angle in angles:
        rotated_frame = rotate_image(frame, angle)  # 프레임 자체를 회전 (아루코는 건드리지 말 것)
        results = model(rotated_frame, verbose=False)
        keypoints = extract_valid_persons(results)

        if not keypoints:
            continue

        # 신뢰도 계산 (예: keypoints 개수 * 평균 confidence)
        confs = results[0].keypoints.conf if results and hasattr(results[0], 'keypoints') else []
        if len(confs) == 0:
            continue

        # torch.Tensor인지 확인 후 numpy 변환
        conf_means = []
        for conf in confs:
            if isinstance(conf, torch.Tensor):
                conf_np = conf.cpu().numpy()
            else:
                conf_np = np.array(conf)
            conf_means.append(np.mean(conf_np))

        avg_conf = np.mean(conf_means)
        score = len(keypoints) * avg_conf

        if score > best_score:
            best_score = score
            # keypoints 좌표 원본 프레임 기준으로 역변환
            corrected_keypoints = []
            for kp in keypoints:
                x_corr, y_corr = rotate_point(kp[0], kp[1], w, h, (360 - angle) % 360)
                corrected_keypoints.append((x_corr, y_corr))
            best_keypoints = corrected_keypoints

    if best_keypoints is None:
        return []

    return best_keypoints



