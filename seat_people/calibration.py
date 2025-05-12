import cv2
import numpy as np
import os
import glob

# 체커보드 패턴 크기 (가로 8, 세로 6)  # 실제 체스보드 내부 코너 수로 수정
checkerboard_size = (9, 6)

# 3D 좌표와 2D 이미지 좌표 저장할 리스트
obj_points = []  # 3D 좌표
img_points = []  # 2D 이미지 좌표

# 체스보드 이미지 파일 경로
images = glob.glob('./images/*.jpg')  # 체커보드 사진 넣을 경로

print(f"총 {len(images)}개의 이미지가 있습니다.")

# 첫 번째 이미지를 읽어 크기 얻기
if len(images) == 0:
    print("이미지 파일을 찾을 수 없습니다. 폴더에 체커보드 이미지를 넣어주세요.")
    exit()

img = cv2.imread(images[0])
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

# 체스보드 이미지에서 코너 찾기
for image in images:
    img = cv2.imread(image)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)  # 이미지를 그레이스케일로 변환

    # 체스보드 코너 찾기
    ret, corners = cv2.findChessboardCorners(gray, checkerboard_size, None)

    if ret:
        print(f"체스보드 코너를 찾은 이미지: {image}")
        # 체스보드 3D 좌표 생성 (0,0,0부터 시작해서 일정 간격으로 증가)
        obj_p = np.zeros((checkerboard_size[0] * checkerboard_size[1], 3), np.float32)
        obj_p[:, :2] = np.mgrid[0:checkerboard_size[0], 0:checkerboard_size[1]].T.reshape(-1, 2)
        obj_points.append(obj_p)  # 3D 좌표 추가
        img_points.append(corners)  # 2D 좌표 추가
    else:
        print(f"체스보드 코너를 찾지 못한 이미지: {image}")

# 코너를 찾은 이미지가 없으면 종료
if len(obj_points) == 0:
    print("체스보드 코너를 찾은 이미지가 하나도 없습니다. 다시 시도하세요.")
    exit()

# 카메라 캘리브레이션 수행
ret, camera_matrix, dist_coeffs, rvecs, tvecs = cv2.calibrateCamera(obj_points, img_points, gray.shape[::-1], None, None)

# 결과 출력
print("Camera matrix : \n")
print(camera_matrix)
print("\ndist : \n")
print(dist_coeffs)

# 카메라 매트릭스와 왜곡 계수를 .npy 파일로 저장
np.save('camera_matrix.npy', camera_matrix)
np.save('dist_coeffs.npy', dist_coeffs)

print("카메라 매트릭스와 왜곡 계수가 저장되었습니다.")
