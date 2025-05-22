import cv2
import numpy as np
import time
import os

# 설정 변수
CAMERA_INDEX = 1
CAMERA_WIDTH = 1280
CAMERA_HEIGHT = 720
ARUCO_DICT = cv2.aruco.DICT_6X6_250
SAVE_FOLDER = "captures"
SHOW_DEBUG_WINDOW = True  # 디버그용 창 표시 여부

# 폴더 생성
os.makedirs(SAVE_FOLDER, exist_ok=True)

# 아루코 마커 설정
aruco_dict = cv2.aruco.getPredefinedDictionary(ARUCO_DICT)
parameters = cv2.aruco.DetectorParameters()
detector = cv2.aruco.ArucoDetector(aruco_dict, parameters)

# 마커 ID별 위치 매핑 (0-좌상, 1-우상, 2-우하, 3-좌하)
id_to_corner = {0: 0, 1: 1, 2: 2, 3: 3}

# 마우스 좌표 변수
mouse_x, mouse_y = -1, -1
capture_count = 0

# 주사위 검출 임계값
DICE_MIN_AREA = 1000
DICE_THRESHOLD = 60

def order_points(pts):
    """네 점을 좌상-우상-우하-좌하 순서로 정렬"""
    pts = np.array(pts)
    s = pts.sum(axis=1)
    diff = np.diff(pts, axis=1)
    ordered = np.zeros((4,2), dtype=np.float32)
    ordered[0] = pts[np.argmin(s)]      # 좌상
    ordered[2] = pts[np.argmax(s)]      # 우하
    ordered[1] = pts[np.argmin(diff)]   # 우상
    ordered[3] = pts[np.argmax(diff)]   # 좌하
    return ordered

def order_points_by_id(centers, ids):
    """ID 기반으로 중심점 정렬"""
    full_rect = [None, None, None, None]
    for pt, id_ in zip(centers, ids):
        idx = id_to_corner.get(int(id_[0]), -1)
        if idx >= 0:
            full_rect[idx] = pt
    return full_rect

def estimate_missing_point(rect):
    """빠진 꼭짓점 추정"""
    idx_missing = rect.index(None)
    if idx_missing == 0:  # 좌상
        pt = np.array(rect[1]) + np.array(rect[3]) - np.array(rect[2])
    elif idx_missing == 1:  # 우상
        pt = np.array(rect[0]) + np.array(rect[2]) - np.array(rect[3])
    elif idx_missing == 2:  # 우하
        pt = np.array(rect[1]) + np.array(rect[3]) - np.array(rect[0])
    elif idx_missing == 3:  # 좌하
        pt = np.array(rect[0]) + np.array(rect[2]) - np.array(rect[1])
    return pt.astype(int)

def find_dice_in_frame(frame):
    """주사위 검출 함수"""
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (5, 5), 0)
    _, thresh = cv2.threshold(blur, DICE_THRESHOLD, 255, cv2.THRESH_BINARY_INV)
    
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    dice_positions = []
    for cnt in contours:
        area = cv2.contourArea(cnt)
        if area > DICE_MIN_AREA:
            approx = cv2.approxPolyDP(cnt, 0.02 * cv2.arcLength(cnt, True), True)
            if len(approx) == 4:  # 사각형 형태 필터
                M = cv2.moments(cnt)
                if M["m00"] != 0:
                    cx = int(M["m10"] / M["m00"])
                    cy = int(M["m01"] / M["m00"])
                    dice_positions.append((cx, cy))
                    
    return dice_positions

def mouse_callback(event, x, y, flags, param):
    """마우스 콜백 함수"""
    global mouse_x, mouse_y
    if event == cv2.EVENT_MOUSEMOVE:
        mouse_x, mouse_y = x, y

def main():
    global capture_count
    
    # 카메라 초기화
    cap = cv2.VideoCapture(CAMERA_INDEX)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, CAMERA_WIDTH)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, CAMERA_HEIGHT)
    
    if not cap.isOpened():
        print("[ERROR] 카메라를 열 수 없습니다.")
        return
    
    print("[INFO] 카메라 초기화 완료")
    print("[INFO] 'q'키: 종료, 'c'키: 캡처")
    
    # 창 설정 및 마우스 콜백 등록
    cv2.namedWindow("Camera", cv2.WINDOW_NORMAL)
    cv2.resizeWindow("Camera", 960, 540)
    cv2.setMouseCallback("Camera", mouse_callback)
    
    if SHOW_DEBUG_WINDOW:
        cv2.namedWindow("Rectangle Only", cv2.WINDOW_NORMAL)
        cv2.resizeWindow("Rectangle Only", 400, 400)
    
    while True:
        ret, frame = cap.read()
        if not ret:
            print("[ERROR] 카메라 프레임을 읽을 수 없습니다.")
            break
        
        # 아루코 마커 검출
        corners, ids, rejected = detector.detectMarkers(frame)
        
        # 결과 표시용 프레임 (최소한의 정보만 표시)
        display_frame = frame.copy()
        
        # 마커가 인식된 경우
        if ids is not None and len(ids) > 0:
            # 마커 테두리 표시
            cv2.aruco.drawDetectedMarkers(display_frame, corners, ids)
            
            centers = []
            for i, corner in enumerate(corners):
                pts = corner[0].astype(int)
                center_x = int(pts[:, 0].mean())
                center_y = int(pts[:, 1].mean())
                marker_id = int(ids[i][0])
                centers.append([center_x, center_y])
            
            # 터미널에 마커 정보 출력
            print(f"[INFO] 인식된 마커: {len(ids)}개, IDs: {[id[0] for id in ids]}")
            
            # 3개 이상 마커가 인식된 경우 직사각형 처리
            if len(ids) >= 3:
                rect = order_points_by_id(centers, ids)
                
                # 하나의 꼭짓점이 빠진 경우 추정
                if None in rect and rect.count(None) == 1:
                    missing_pt = estimate_missing_point(rect)
                    idx_missing = rect.index(None)
                    rect[idx_missing] = missing_pt
                    print(f"[INFO] 3개 마커로 직사각형 추정 (빠진 꼭짓점: {idx_missing})")
                
                # 직사각형 그리기 (모든 꼭짓점이 있는 경우)
                if all(x is not None for x in rect):  # 수정된 부분
                    rect_np = np.array(rect, dtype=np.int32).reshape((-1,1,2))
                    cv2.polylines(display_frame, [rect_np], isClosed=True, color=(0,255,0), thickness=3)
                    
                    # 직사각형 영역 추출 (별도 창)
                    if SHOW_DEBUG_WINDOW:
                        W, H = 400, 400
                        dst_pts = np.array([[0,0], [W-1,0], [W-1,H-1], [0,H-1]], dtype=np.float32)
                        M = cv2.getPerspectiveTransform(np.array(rect, dtype=np.float32), dst_pts)
                        rectangle_img = cv2.warpPerspective(frame, M, (W, H))
                        cv2.imshow("Rectangle Only", rectangle_img)
                    
                    # 마우스가 직사각형 내부에 있는지 확인
                    if mouse_x >= 0 and mouse_y >= 0:
                        dst_pts = np.array([[0,0], [1,0], [1,1], [0,1]], dtype=np.float32)
                        Minv = cv2.getPerspectiveTransform(np.array(rect, dtype=np.float32), dst_pts)
                        src_pt = np.array([[[mouse_x, mouse_y]]], dtype=np.float32)
                        dst_pt = cv2.perspectiveTransform(src_pt, Minv)[0][0]
                        x_norm, y_norm = dst_pt[0], dst_pt[1]
                        
                        if 0 <= x_norm <= 1 and 0 <= y_norm <= 1:
                            print(f"[INFO] 직사각형 내 마우스 좌표: x={x_norm:.3f}, y={y_norm:.3f}")
        else:
            print("[INFO] 마커가 인식되지 않았습니다.")
            if SHOW_DEBUG_WINDOW:
                blank = np.ones((400, 400, 3), dtype=np.uint8) * 128
                cv2.imshow("Rectangle Only", blank)
        
        # 주사위 q
        dice_positions = find_dice_in_frame(frame)
        if dice_positions:
            print(f"[INFO] 주사위 {len(dice_positions)}개 검출: {dice_positions}")
            for pos in dice_positions:
                cv2.circle(display_frame, pos, 10, (0, 0, 255), -1)
        
        # 화면 표시
        cv2.imshow('Camera', display_frame)
        
        # 키 입력 처리
        key = cv2.waitKey(1) & 0xFF
        if key == ord('q'):
            print("[INFO] 프로그램을 종료합니다.")
            break
        elif key == ord('c'):
            # 캡처 저장
            filename = f"{SAVE_FOLDER}/capture_{time.strftime('%Y%m%d_%H%M%S')}_{capture_count}.png"
            cv2.imwrite(filename, frame)
            print(f"[INFO] 캡처 완료: {filename}")
            capture_count += 1
    
    # 자원 해제
    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()
