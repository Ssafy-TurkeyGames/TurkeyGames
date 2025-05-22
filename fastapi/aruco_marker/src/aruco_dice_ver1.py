import cv2
import numpy as np
import tensorflow as tf
import time
import os

# ================== 설정 영역 ==================
MODEL_PATH = './exported_model3_2_2'  # 주사위 탐지 모델 경로
CAMERA_INDEX = 0  # 카메라 인덱스 (필요시 변경)
CAMERA_WIDTH = 1280
CAMERA_HEIGHT = 720
ARUCO_DICT = cv2.aruco.DICT_6X6_250  # 아루코 마커 사전
RECT_SHAPE = (400, 400)  # 정사각형 변환 크기
MIN_SCORE_THRESH = 0.3  # 주사위 탐지 임계값 (초기값)

# 주사위 클래스 인덱스
CATEGORY_INDEX = {
    1: {'id': 1, 'name': '1'},
    2: {'id': 2, 'name': '2'},
    3: {'id': 3, 'name': '3'},
    4: {'id': 4, 'name': '4'},
    5: {'id': 5, 'name': '5'},
    6: {'id': 6, 'name': '6'}
}

# ================== 아루코 마커 함수 ==================
def create_square_from_three_markers(centers):
    """세 개의 마커로 직각삼각형을 만들고 네 번째 점 추정"""
    # 세 점 사이의 거리 계산
    dist01 = np.linalg.norm(np.array(centers[0]) - np.array(centers[1]))
    dist12 = np.linalg.norm(np.array(centers[1]) - np.array(centers[2]))
    dist20 = np.linalg.norm(np.array(centers[2]) - np.array(centers[0]))
    
    # 거리 기준으로 정렬
    distances = [(dist01, 0, 1), (dist12, 1, 2), (dist20, 2, 0)]
    distances.sort()  # 거리 오름차순 정렬
    
    # 가장 긴 변이 빗변, 나머지 두 변이 직각삼각형의 두 변
    _, i1, i2 = distances[0]  # 첫 번째 짧은 변
    _, i3, i4 = distances[1]  # 두 번째 짧은 변
    
    # 직각을 이루는 점 찾기 (두 짧은 변에 공통으로 포함된 점)
    common_point = None
    if i1 == i3 or i1 == i4:
        common_point = i1
    elif i2 == i3 or i2 == i4:
        common_point = i2
    
    if common_point is None:
        print("[ERROR] 직각삼각형을 구성할 수 없습니다.")
        return None
    
    # 직각을 이루는 점과 다른 두 점
    other_points = [i for i in range(3) if i != common_point]
    
    # 직각 위치의 점
    right_angle_point = centers[common_point]
    
    # 다른 두 점
    p1 = centers[other_points[0]]
    p2 = centers[other_points[1]]
    
    # 네 번째 점 계산 (직각삼각형의 나머지 한 점)
    # p4 = p1 + p2 - p_right_angle
    p4 = [p1[0] + p2[0] - right_angle_point[0], 
          p1[1] + p2[1] - right_angle_point[1]]
    
    # 정사각형의 네 점 (직각점, 다른 두 점, 새로 계산한 점)
    square = [right_angle_point, p1, p4, p2]
    
    # 좌상-우상-우하-좌하 순서로 정렬
    return order_points_by_position(square)

def create_square_from_four_markers(centers):
    """네 개의 마커로 정사각형 만들기"""
    # 모든 점 쌍 간의 거리 계산
    distances = []
    for i in range(4):
        for j in range(i+1, 4):
            dist = np.linalg.norm(np.array(centers[i]) - np.array(centers[j]))
            distances.append((dist, i, j))
    
    # 거리 기준으로 정렬
    distances.sort(reverse=True)  # 거리 내림차순 정렬
    
    # 가장 긴 두 변이 대각선
    diagonals = distances[:2]
    
    # 대각선 교차점 확인 (정사각형이면 대각선이 교차해야 함)
    _, d1_p1, d1_p2 = diagonals[0]
    _, d2_p1, d2_p2 = diagonals[1]
    
    # 네 점을 정사각형 순서로 정렬
    corners = []
    for i in range(4):
        corners.append(centers[i])
    
    # 좌표 기준으로 정렬
    return order_points_by_position(corners)

def order_points_by_position(pts):
    """네 점을 좌상-우상-우하-좌하 순서로 정렬 (기하학적 위치 기준)"""
    # 배열로 변환
    pts = np.array(pts)
    
    # x+y 값이 가장 작은 점이 좌상단
    # x+y 값이 가장 큰 점이 우하단
    s = pts.sum(axis=1)
    tl_index = np.argmin(s)
    br_index = np.argmax(s)
    
    tl = pts[tl_index]
    br = pts[br_index]
    
    # 나머지 두 점 찾기 (좌상단, 우하단 제외)
    remaining = np.delete(pts, [tl_index, br_index], axis=0)
    
    # y-x 값으로 우상단과 좌하단 구분
    diff = np.diff(remaining, axis=1)[:, 0]  # y-x 계산
    tr_index = np.argmin(diff)
    bl_index = np.argmax(diff)
    
    tr = remaining[tr_index]
    bl = remaining[bl_index]
    
    # 좌상-우상-우하-좌하 순서로 반환
    return [tl.tolist(), tr.tolist(), br.tolist(), bl.tolist()]

# ================== 주사위 탐지 함수 ==================
def detect_dice(frame, detect_fn, min_score_thresh=0.3):
    """TensorFlow 모델을 사용하여 주사위 탐지"""
    image_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    input_tensor = tf.convert_to_tensor(np.expand_dims(image_rgb, 0), dtype=tf.uint8)
    
    try:
        detections = detect_fn(input_tensor)
        
        boxes = detections['detection_boxes'][0].numpy()
        classes = detections['detection_classes'][0].numpy()
        scores = detections['detection_scores'][0].numpy()
        
        h, w, _ = frame.shape
        results = []
        
        for i in range(len(scores)):
            if scores[i] >= min_score_thresh and 1 <= int(classes[i]) <= 6:
                # 바운딩 박스 좌표
                ymin, xmin, ymax, xmax = boxes[i]
                left = int(xmin * w)
                top = int(ymin * h)
                right = int(xmax * w)
                bottom = int(ymax * h)
                
                # 중심점 계산
                cx = int((xmin + xmax) / 2 * w)
                cy = int((ymin + ymax) / 2 * h)
                
                # 결과 저장
                results.append({
                    'class_id': int(classes[i]),
                    'score': float(scores[i]),
                    'center': (cx, cy),
                    'bbox': (left, top, right, bottom)
                })
        
        return results
    except Exception as e:
        print(f"[ERROR] 주사위 탐지 중 오류 발생: {e}")
        return []

# ================== 쓰레시홀드 조절 콜백 함수 ==================
def on_threshold_trackbar(val):
    global MIN_SCORE_THRESH
    MIN_SCORE_THRESH = val / 100.0  # 0-100 슬라이더 값을 0.0-1.0 범위로 변환

# ================== 메인 함수 ==================
def main():
    global MIN_SCORE_THRESH
    
    # 모델 로드
    print("[INFO] 주사위 탐지 모델 로드 중...")
    try:
        detect_fn = tf.saved_model.load(MODEL_PATH)
        print("[INFO] 모델 로드 완료!")
    except Exception as e:
        print(f"[ERROR] 모델 로드 실패: {e}")
        return
    
    # 아루코 마커 설정
    aruco_dict = cv2.aruco.getPredefinedDictionary(ARUCO_DICT)
    parameters = cv2.aruco.DetectorParameters()
    detector = cv2.aruco.ArucoDetector(aruco_dict, parameters)
    
    # 카메라 초기화
    print(f"[INFO] 카메라 {CAMERA_INDEX} 초기화 중...")
    cap = cv2.VideoCapture(CAMERA_INDEX)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, CAMERA_WIDTH)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, CAMERA_HEIGHT)
    
    if not cap.isOpened():
        print(f"[ERROR] 카메라 {CAMERA_INDEX}를 열 수 없습니다.")
        return
    
    print("[INFO] 카메라 초기화 완료")
    print("[INFO] 'q'키: 종료")
    
    # 창 설정
    cv2.namedWindow("Camera", cv2.WINDOW_NORMAL)
    cv2.resizeWindow("Camera", 960, 540)
    cv2.namedWindow("Square", cv2.WINDOW_NORMAL)
    cv2.resizeWindow("Square", RECT_SHAPE[0], RECT_SHAPE[1])
    
    # 쓰레시홀드 조절 트랙바 추가
    cv2.createTrackbar("Threshold", "Camera", int(MIN_SCORE_THRESH * 100), 100, on_threshold_trackbar)
    
    # 메인 루프
    while True:
        # 프레임 읽기
        ret, frame = cap.read()
        if not ret:
            print("[ERROR] 프레임을 읽을 수 없습니다.")
            break
        
        display_frame = frame.copy()
        
        # 아루코 마커 검출
        corners, ids, _ = detector.detectMarkers(frame)
        
        # 정사각형 변수 초기화
        rect = None
        square_img = np.ones(RECT_SHAPE + (3,), dtype=np.uint8) * 128  # 기본 회색 이미지
        
        # 마커가 인식된 경우
        if ids is not None and len(ids) > 0:
            # 마커 테두리 표시
            cv2.aruco.drawDetectedMarkers(display_frame, corners, ids)
            
            # 마커 중심점 계산
            centers = []
            for i, corner in enumerate(corners):
                pts = corner[0].astype(int)
                center_x = int(pts[:, 0].mean())
                center_y = int(pts[:, 1].mean())
                centers.append([center_x, center_y])
                
                # 마커 ID와 중심점 표시
                cv2.putText(display_frame, f"ID:{ids[i][0]}", (center_x, center_y), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 0, 0), 2)
            
            # 마커 개수에 따른 처리
            if len(ids) == 3:
                # 3개 마커로 직각삼각형 만들고 정사각형 생성
                rect = create_square_from_three_markers(centers)
                if rect:
                    print("[INFO] 3개 마커로 정사각형 생성 (직각삼각형 이용)")
            
            elif len(ids) >= 4:
                # 4개 이상 마커로 정사각형 생성 (처음 4개만 사용)
                rect = create_square_from_four_markers(centers[:4])
                print("[INFO] 4개 마커로 정사각형 생성")
            
            # 정사각형 그리기
            if rect is not None:
                rect_np = np.array(rect, dtype=np.int32).reshape((-1, 1, 2))
                cv2.polylines(display_frame, [rect_np], isClosed=True, color=(0, 255, 0), thickness=3)
                
                # 코너 번호 표시 (디버깅용)
                for i, pt in enumerate(rect):
                    cv2.circle(display_frame, (int(pt[0]), int(pt[1])), 10, (255, 0, 0), -1)
                    cv2.putText(display_frame, str(i), (int(pt[0])+10, int(pt[1])), 
                               cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 0, 0), 2)
                
                # 정사각형 영역 추출 (별도 창)
                W, H = RECT_SHAPE
                dst_pts = np.array([[0, 0], [W-1, 0], [W-1, H-1], [0, H-1]], dtype=np.float32)
                M = cv2.getPerspectiveTransform(np.array(rect, dtype=np.float32), dst_pts)
                square_img = cv2.warpPerspective(frame, M, (W, H))
        
        # 주사위 탐지 (원본 프레임에서)
        dice_list = detect_dice(frame, detect_fn, MIN_SCORE_THRESH)
        
        # 정사각형이 인식된 경우에만 주사위 처리
        dice_results = []  # 한 줄로 출력할 결과 저장
        
        if rect is not None:
            W, H = RECT_SHAPE
            dst_pts = np.array([[0, 0], [W-1, 0], [W-1, H-1], [0, H-1]], dtype=np.float32)
            M = cv2.getPerspectiveTransform(np.array(rect, dtype=np.float32), dst_pts)
            
            for dice in dice_list:
                cx, cy = dice['center']
                
                # 정사각형 내 상대좌표 계산
                src_pt = np.array([[[cx, cy]]], dtype=np.float32)
                dst_pt = cv2.perspectiveTransform(src_pt, M)[0][0]
                x_norm, y_norm = dst_pt[0] / W, dst_pt[1] / H
                
                # 정사각형 내부에 있는 경우만 처리
                if 0 <= x_norm <= 1 and 0 <= y_norm <= 1:
                    # 화면 표시
                    cv2.circle(display_frame, (cx, cy), 10, (0, 0, 255), -1)
                    msg = f"[{dice['class_id']}, ({x_norm:.3f}, {y_norm:.3f})]"
                    cv2.putText(display_frame, msg, (cx+10, cy), 
                               cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
                    
                    # 정사각형 창에도 표시
                    square_x, square_y = int(dst_pt[0]), int(dst_pt[1])
                    cv2.circle(square_img, (square_x, square_y), 5, (0, 0, 255), -1)
                    cv2.putText(square_img, str(dice['class_id']), (square_x+5, square_y+5), 
                               cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
                    
                    # 결과 저장
                    dice_results.append(f"[{dice['class_id']}, ({x_norm:.3f}, {y_norm:.3f})]")
        
        # 콘솔에 한 줄로 출력
        if dice_results:
            print(f"주사위: {', '.join(dice_results)}")
        
        # 쓰레시홀드 값 표시
        cv2.putText(display_frame, f"Threshold: {MIN_SCORE_THRESH:.2f}", (10, 30), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
        
        # 화면 표시
        cv2.imshow("Camera", display_frame)
        cv2.imshow("Square", square_img)
        
        # 키 입력 처리
        key = cv2.waitKey(1) & 0xFF
        if key == ord('q'):
            print("[INFO] 프로그램을 종료합니다.")
            break
        elif key == ord('+'):
            MIN_SCORE_THRESH = min(0.95, MIN_SCORE_THRESH + 0.05)
            cv2.setTrackbarPos("Threshold", "Camera", int(MIN_SCORE_THRESH * 100))
        elif key == ord('-'):
            MIN_SCORE_THRESH = max(0.05, MIN_SCORE_THRESH - 0.05)
            cv2.setTrackbarPos("Threshold", "Camera", int(MIN_SCORE_THRESH * 100))
    
    # 자원 해제
    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()
