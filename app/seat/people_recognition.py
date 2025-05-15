import math
from ultralytics import YOLO
import cv2
import numpy as np
import torch

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
    persons = []
    if not results or not hasattr(results[0], 'keypoints'):
        return []

    keypoints_list = results[0].keypoints.xy  # [N, 17, 2]
    confidences = results[0].keypoints.conf

    if keypoints_list is None or confidences is None or len(keypoints_list) == 0:
        return []

    for i in range(len(keypoints_list)):
        kp = keypoints_list[i]
        conf = confidences[i]

        if len(kp) < 3:
            continue

        s_left, s_right = kp[5], kp[6]  # 양쪽 어깨
        e_left, e_right = kp[7], kp[8]  # 양쪽 팔꿈치

        if conf[5] < 0.5 or conf[6] < 0.5:
            continue

        if is_valid_person(s_left, s_right, e_left, e_right):
            persons.append(kp)

    return persons

def get_shoulder_angle(s_left, s_right):
    # 어깨 두 점으로 이루어진 선분 각도 계산 (도 단위)
    dx = s_right[0] - s_left[0]
    dy = s_right[1] - s_left[1]
    angle_rad = math.atan2(dy, dx)
    angle_deg = math.degrees(angle_rad)
    return angle_deg

def rotate_point_around_center(pt, center, angle_deg):
    angle_rad = math.radians(angle_deg)
    x, y = pt[0] - center[0], pt[1] - center[1]
    x_rot = x * math.cos(angle_rad) - y * math.sin(angle_rad)
    y_rot = x * math.sin(angle_rad) + y * math.cos(angle_rad)
    return (x_rot + center[0], y_rot + center[1])

def rotate_keypoints(keypoints, angle_deg):
    # 키포인트 중심 (어깨 중간) 기준 회전
    s_left, s_right = keypoints[5], keypoints[6]
    center = ((s_left[0] + s_right[0]) / 2, (s_left[1] + s_right[1]) / 2)
    rotated_kps = []
    for kp in keypoints:
        rotated_kps.append(rotate_point_around_center(kp, center, angle_deg))
    return rotated_kps

def detect_people(frame):
    results = model(frame, verbose=False)
    raw_persons = extract_valid_persons(results)

    corrected_persons = []

    for kp in raw_persons:
        s_left, s_right = kp[5], kp[6]
        angle = -get_shoulder_angle(s_left, s_right)  # 어깨 선이 수평이 되도록 각도 보정
        rotated_kp = rotate_keypoints(kp, angle)
        # 여기서 기준점(어깨 중간) 위치도 얻어둠(선택적)
        center = ((rotated_kp[5][0] + rotated_kp[6][0]) / 2, (rotated_kp[5][1] + rotated_kp[6][1]) / 2)
        # 좌석 매핑용으로 중심 좌표를 사용하거나 키포인트 전체를 전달
        corrected_persons.append(center)

    return corrected_persons
