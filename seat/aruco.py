import cv2
import numpy as np

def create_aruco_markers(board_type, marker_size, screen_width, screen_height, margin=20):
    # 아루코 딕셔너리 로드
    arucoDict = cv2.aruco.getPredefinedDictionary(board_type)
    
    # 4개의 마커 이미지 생성
    marker_img_0 = cv2.aruco.generateImageMarker(arucoDict, 0, marker_size)
    marker_img_1 = cv2.aruco.generateImageMarker(arucoDict, 1, marker_size)
    marker_img_2 = cv2.aruco.generateImageMarker(arucoDict, 2, marker_size)
    marker_img_3 = cv2.aruco.generateImageMarker(arucoDict, 3, marker_size)

    # 빈 이미지 생성 (흰색 배경)
    final_img = np.ones((screen_height, screen_width), dtype=np.uint8) * 255

    # 네 개의 마커를 각 모서리에 배치
    final_img[margin:marker_size+margin, margin:marker_size+margin] = marker_img_0  # 왼쪽 위
    final_img[margin:marker_size+margin, screen_width-marker_size-margin:screen_width-margin] = marker_img_1  # 오른쪽 위
    final_img[screen_height-marker_size-margin:screen_height-margin, margin:marker_size+margin] = marker_img_2  # 왼쪽 아래
    final_img[screen_height-marker_size-margin:screen_height-margin, screen_width-marker_size-margin:screen_width-margin] = marker_img_3  # 오른쪽 아래

    return final_img

if __name__ == "__main__":
    # 아루코 마커 크기 설정 (고정 크기)
    board_type = cv2.aruco.DICT_4X4_250
    marker_size = 50  # 고정된 마커 크기
    
    # 기본 화면 크기 설정
    screen_width = 800
    screen_height = 800
    
    # 윈도우 창 크기 설정
    cv2.namedWindow("Aruco Marker Board", cv2.WINDOW_NORMAL)
    cv2.resizeWindow("Aruco Marker Board", screen_width, screen_height)

    while True:
        # 아루코 마커들 생성
        final_img = create_aruco_markers(board_type, marker_size, screen_width, screen_height)

        # 창 크기를 동적으로 설정하여 아루코 마커 크기와 위치 조정
        cv2.imshow("Aruco Marker Board", final_img)

        # 사용자 키 입력 대기 ('q' 누르면 종료)
        key = cv2.waitKey(1)
        if key == ord('q'):  # 'q' 누르면 종료
            break

    cv2.destroyAllWindows()
