import cv2
import numpy as np

# 저장한 카메라 파라미터 불러오기
camera_matrix = np.load('camera_matrix.npy')
dist_coeffs = np.load('dist_coeffs.npy')

def undistort_frame(frame):
    # 왜곡 보정
    undistorted_frame = cv2.undistort(frame, camera_matrix, dist_coeffs)
    return undistorted_frame

# # 영상 캡처 (예: 카메라로부터 영상 입력 받기)
# cap = cv2.VideoCapture(1)

# if not cap.isOpened():
#     print("웹캠을 열 수 없습니다.")
#     exit()

# while True:
#     ret, frame = cap.read()

#     if not ret:
#         print("프레임을 읽을 수 없습니다.")
#         break

#     # 왜곡 보정된 이미지 얻기
#     undistorted_frame = undistort_frame(frame)

#     # 왜곡 보정된 이미지로 추가 작업 (예: 사람 추적 등)
#     cv2.imshow('Undistorted Frame', undistorted_frame)

#     if cv2.waitKey(1) & 0xFF == ord('q'):
#         break

# cap.release()
# cv2.destroyAllWindows()
