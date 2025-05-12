import torch
import cv2
import numpy as np

# YOLOv5 모델 불러오기 (사전 학습된 모델 사용)
model = torch.hub.load('ultralytics/yolov5', 'yolov5s')  # 'yolov5s'는 작은 모델, 다른 버전도 사용 가능

# 웹캠 열기
cap = cv2.VideoCapture(1)

while True:
    # 웹캠에서 프레임 읽기
    ret, frame = cap.read()
    if not ret:
        print("웹캠을 열 수 없습니다.")
        break

    # YOLOv5 모델로 프레임에서 객체 감지
    results = model(frame)

    # 감지된 객체 렌더링 (경계 상자 그리기)
    results.render()  # 이미지에 경계 상자 표시

    # 감지된 각 객체에 대해 회전된 바운딩 박스를 처리
    labels = results.names
    for i, label in enumerate(results.xyxy[0][:, -1].tolist()):
        if labels[int(label)] == 'tvmonitor':  # tvmonitor만 필터링
            # 감지된 바운딩 박스 좌표 추출
            x1, y1, x2, y2 = results.xyxy[0][i].cpu().numpy()
            
            # 감지된 사각형의 크기 계산
            width = int(x2 - x1)
            height = int(y2 - y1)

            # 회전된 직사각형을 찾기 위해 각도를 계산
            rect_points = np.array([[x1, y1], [x2, y1], [x2, y2], [x1, y2]], dtype=np.float32)
            rect_center = np.mean(rect_points, axis=0)
            angle = np.arctan2(y2 - y1, x2 - x1) * 180 / np.pi  # 기울기 계산

            # 회전된 사각형을 표시 (각도를 이용해 회전 처리)
            M = cv2.getRotationMatrix2D((rect_center[0], rect_center[1]), angle, 1)
            rotated_frame = cv2.warpAffine(frame, M, (frame.shape[1], frame.shape[0]))

            # 회전된 이미지에 대해 바운딩 박스를 그린 후 회전 보정된 이미지를 표시
            cv2.imshow("Rotated Object Detected", rotated_frame)

    # 결과 화면에 출력
    cv2.imshow("Webcam - Press 'q' to Quit", frame)

    # 'q' 키를 누르면 종료
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break
        
# 웹캠 해제
cap.release()
cv2.destroyAllWindows()
