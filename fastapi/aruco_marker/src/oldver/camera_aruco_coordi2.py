import cv2
import numpy as np

# 아루코 마커 설정
aruco_dict = cv2.aruco.getPredefinedDictionary(cv2.aruco.DICT_6X6_250)
parameters = cv2.aruco.DetectorParameters()
detector = cv2.aruco.ArucoDetector(aruco_dict, parameters)

# 마우스 좌표 변수
mouse_x, mouse_y = -1, -1

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

def mouse_callback(event, x, y, flags, param):
    """마우스 콜백 함수"""
    global mouse_x, mouse_y
    if event == cv2.EVENT_MOUSEMOVE:
        mouse_x, mouse_y = x, y

def point_in_rectangle(point, rect):
    """점이 사각형 내부에 있는지 확인 (근사적 방법)"""
    x, y = point
    # 사각형을 다각형으로 간주하고 점이 내부에 있는지 확인
    return cv2.pointPolygonTest(rect, (x, y), False) >= 0

# 카메라 초기화
cap = cv2.VideoCapture(0)
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)

cv2.namedWindow("Camera", cv2.WINDOW_NORMAL)
cv2.resizeWindow("Camera", 960, 540)
cv2.setMouseCallback("Camera", mouse_callback)

while True:
    ret, frame = cap.read()
    if not ret:
        print("카메라 프레임을 읽을 수 없습니다.")
        break
    
    # 상단 메시지용 반투명 배경
    overlay = frame.copy()
    cv2.rectangle(overlay, (0, 0), (frame.shape[1], 100), (0, 0, 0), -1)
    alpha = 0.4
    frame = cv2.addWeighted(overlay, alpha, frame, 1 - alpha, 0)
    
    # 아루코 마커 검출
    corners, ids, rejected = detector.detectMarkers(frame)
    
    # 마커가 인식된 경우
    if ids is not None and len(ids) > 0:
        # 마커 테두리 표시
        cv2.aruco.drawDetectedMarkers(frame, corners, ids)
        
        # 마커 중심점 계산
        centers = []
        for i, corner in enumerate(corners):
            pts = corner[0].astype(int)
            center_x = int(pts[:, 0].mean())
            center_y = int(pts[:, 1].mean())
            marker_id = int(ids[i][0])
            centers.append([center_x, center_y])
            
            # 마커 ID 표시
            cv2.putText(frame, f"ID:{marker_id}", (center_x-20, center_y),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0,255,255), 2)
        
        # 인식된 마커 개수 표시
        cv2.putText(frame, f"{len(ids)}개 마커 인식", (50, 70),
                    cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 255, 0), 3)
        
        # 4개 마커가 인식된 경우 직사각형 그리기
        if len(ids) == 4:
            rect = order_points(centers)
            
            # 직사각형 그리기
            rect_np = np.array(rect, dtype=np.int32).reshape((-1,1,2))
            cv2.polylines(frame, [rect_np], isClosed=True, color=(0,255,0), thickness=3)
            
            # 직사각형 완성 메시지 표시
            cv2.putText(frame, "직사각형을 만듭니다!", (50, 130),
                        cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 0, 255), 4, cv2.LINE_AA)
            
            # 마우스 위치 표시
            if mouse_x >= 0 and mouse_y >= 0:
                # 마우스가 직사각형 내부에 있는지 확인 (태스크 2 추가)
                is_inside = point_in_rectangle((mouse_x, mouse_y), rect_np)
                
                # 마우스 위치에 점 표시 (내부/외부에 따라 색상 변경)
                color = (0, 0, 255) if is_inside else (255, 0, 0)
                cv2.circle(frame, (mouse_x, mouse_y), 5, color, -1)
                
                # 마우스 좌표 및 내부/외부 상태 표시
                status = "내부" if is_inside else "외부"
                cv2.putText(frame, f"마우스: ({mouse_x}, {mouse_y}) - {status}", 
                            (mouse_x+10, mouse_y-10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1)
                
                # 콘솔에도 출력
                if is_inside:
                    print(f"마우스가 직사각형 내부에 있습니다: ({mouse_x}, {mouse_y})")
    else:
        # 마커가 없을 때 메시지
        cv2.putText(frame, "마커가 인식되지 않았습니다.", (50, 70),
                    cv2.FONT_HERSHEY_SIMPLEX, 1.2, (128, 128, 128), 3)
    
    cv2.imshow('Camera', frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
