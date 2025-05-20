import os
import cv2
import numpy as np
import tensorflow as tf
import asyncio
import time
from typing import List, Optional, Dict
from object_detection.utils import label_map_util
from object_detection.utils import visualization_utils as vis_util
from collections import deque
import threading
from app.config.detaction_config import settings
from app.video.camera_manager import camera_manager  # 추가

# object_detection 호환 패치
tf.gfile = tf.io.gfile

# ArUco 마커 설정
ARUCO_DICT = cv2.aruco.DICT_6X6_250  # 아루코 마커 사전
RECT_SHAPE = (400, 400)  # 정사각형 변환 크기

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


class DiceMonitor:
    def __init__(self):
        # 모델 경로
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        self.PATH_TO_SAVED_MODEL = os.path.join(base_dir, 'dice detection', 'exported_model', 'saved_model')
        self.PATH_TO_LABELS = os.path.join(base_dir, 'dice detection', 'exported_model', 'dice_label_map.pbtxt')

        # 경로 확인
        print(f"Model path: {self.PATH_TO_SAVED_MODEL}")
        print(f"Model exists: {os.path.exists(self.PATH_TO_SAVED_MODEL)}")
        print(f"Label path: {self.PATH_TO_LABELS}")
        print(f"Label exists: {os.path.exists(self.PATH_TO_LABELS)}")

        # 모델 로드
        print('Loading dice detection model...')
        self.detect_fn = tf.saved_model.load(self.PATH_TO_SAVED_MODEL)
        self.category_index = label_map_util.create_category_index_from_labelmap(
            self.PATH_TO_LABELS,
            use_display_name=True
        )
        print('Model loaded.')

        # 카메라 관련 변수 제거 (CameraManager가 관리)
        # self.cap = None  # 제거
        # self.monitoring_thread = None  # 제거
        self.is_monitoring = False

        # 게임별 모니터링 상태
        self.game_monitors: Dict[str, dict] = {}

        # 안정화 설정
        self.STABILITY_THRESHOLD = settings.DICE_STABILITY_THRESHOLD
        self.CONFIDENCE_THRESHOLD = settings.DICE_CONFIDENCE_THRESHOLD

        # 프레임 속도 설정
        self.FPS_DELAY = settings.DICE_FPS_DELAY if hasattr(settings, 'DICE_FPS_DELAY') else 0.05

        # 인식 개수 제한
        self.MIN_DICE_COUNT = settings.DICE_MIN_COUNT if hasattr(settings, 'DICE_MIN_COUNT') else 5
        self.MAX_DICE_COUNT = settings.DICE_MAX_COUNT if hasattr(settings, 'DICE_MAX_COUNT') else 5

        # 미리보기 설정
        self.show_preview = True

        # 프레임 처리를 위한 변수
        self.last_process_time = 0
        self.processing_lock = threading.Lock()

        # ArUco 관련 변수
        self.aruco_dict = cv2.aruco.getPredefinedDictionary(ARUCO_DICT)
        self.aruco_parameters = cv2.aruco.DetectorParameters()
        self.aruco_detector = cv2.aruco.ArucoDetector(self.aruco_dict, self.aruco_parameters)
        self.aruco_square_corners: Optional[List[List[int]]] = None # 검출된 정사각형 코너 좌표
        self.perspective_matrix: Optional[np.ndarray] = None # 원근 변환 행렬
        self.inverse_perspective_matrix: Optional[np.ndarray] = None # 역 원근 변환 행렬

        # ArUco 관련 변수
        self.aruco_dict = cv2.aruco.getPredefinedDictionary(ARUCO_DICT)
        self.aruco_parameters = cv2.aruco.DetectorParameters()
        self.aruco_detector = cv2.aruco.ArucoDetector(self.aruco_dict, self.aruco_parameters)
        self.aruco_square_corners: Optional[List[List[int]]] = None # 검출된 정사각형 코너 좌표
        self.perspective_matrix: Optional[np.ndarray] = None # 원근 변환 행렬
        self.inverse_perspective_matrix: Optional[np.ndarray] = None # 역 원근 변환 행렬

    def set_preview(self, show: bool):
        """미리보기 창 표시 설정"""
        self.show_preview = show
        if not show:
            cv2.destroyAllWindows()

    def start_monitoring(self, game_id: str):
        """특정 게임의 주사위 모니터링 시작"""
        if game_id not in self.game_monitors:
            self.game_monitors[game_id] = {
                "active": True,
                "last_stable_values": None,
                "value_history": deque(maxlen=10),
                "last_update_time": 0,
                "callback": None,
                "waiting_for_roll": False,  # 리롤 요청 후 값 전송 대기 상태
                "detection_window": {
                    "active": False,
                    "start_time": 0,
                    "duration": 0,
                    "found_stable": False
                }
            }

        # 카메라 매니저에 구독
        if not self.is_monitoring:
            camera_manager.subscribe("dice_monitor", self._on_frame_received)
            self.is_monitoring = True
            print(f"주사위 모니터링 시작: 게임 {game_id}")

    def stop_monitoring(self, game_id: str):
        """특정 게임의 모니터링 중지"""
        if game_id in self.game_monitors:
            self.game_monitors[game_id]["active"] = False

        # 활성 게임이 없으면 카메라 매니저 구독 해제
        if not any(monitor["active"] for monitor in self.game_monitors.values()):
            self.is_monitoring = False
            camera_manager.unsubscribe("dice_monitor")
            cv2.destroyAllWindows()
            print(f"주사위 모니터링 중지: 게임 {game_id}")

    def set_callback(self, game_id: str, callback):
        """주사위 값이 변경될 때 호출될 콜백 설정"""
        if game_id in self.game_monitors:
            self.game_monitors[game_id]["callback"] = callback

    def _on_frame_received(self, frame):
        """카메라 매니저로부터 프레임 받기"""
        if not self.is_monitoring:
            return

        # FPS 제어
        current_time = time.time()
        if current_time - self.last_process_time < self.FPS_DELAY:
            return

        self.last_process_time = current_time

        # 프레임 처리 (비블로킹)
        if self.processing_lock.acquire(blocking=False):
            try:
                self._process_frame(frame)
            finally:
                self.processing_lock.release()

    def _process_frame(self, frame):
        """프레임 처리"""
        # 복사본 생성 (미리보기용)
        display_frame = frame.copy()

        # ArUco 마커 검출
        corners, ids, _ = self.aruco_detector.detectMarkers(frame)

        # 정사각형 변수 초기화
        self.aruco_square_corners = None
        self.perspective_matrix = None
        self.inverse_perspective_matrix = None

        # 마커가 인식된 경우
        if ids is not None and len(ids) > 0:
            # 마커 중심점 계산
            centers = []
            for i, corner in enumerate(corners):
                pts = corner[0].astype(int)
                center_x = int(pts[:, 0].mean())
                center_y = int(pts[:, 1].mean())
                centers.append([center_x, center_y])

            # 마커 개수에 따른 처리
            if len(ids) == 3:
                # 3개 마커로 직각삼각형 만들고 정사각형 생성
                self.aruco_square_corners = create_square_from_three_markers(centers)
                # if self.aruco_square_corners:
                #     print("[INFO] 3개 마커로 정사각형 생성 (직각삼각형 이용)")

            elif len(ids) >= 4:
                # 4개 이상 마커로 정사각형 생성 (처음 4개만 사용)
                self.aruco_square_corners = create_square_from_four_markers(centers[:4])
                # print("[INFO] 4개 마커로 정사각형 생성")

            # 원근 변환 행렬 계산
            if self.aruco_square_corners is not None:
                W, H = RECT_SHAPE
                dst_pts = np.array([[0, 0], [W-1, 0], [W-1, H-1], [0, H-1]], dtype=np.float32)
                self.perspective_matrix = cv2.getPerspectiveTransform(np.array(self.aruco_square_corners, dtype=np.float32), dst_pts)
                self.inverse_perspective_matrix = cv2.getPerspectiveTransform(dst_pts, np.array(self.aruco_square_corners, dtype=np.float32))


        # 주사위 인식 (정사각형 영역이 검출된 경우에만)
        dice_values, dice_coords, detections = self._detect_dice_in_frame(frame)

        # 미리보기 창 표시
        if self.show_preview:
            self._show_preview(display_frame, dice_values, detections, corners, ids) # ArUco 정보 추가

        # 각 게임에 대해 처리
        for game_id, monitor in self.game_monitors.items():
            if not monitor["active"]:
                continue

            # 주사위 값 이력 업데이트
            monitor["value_history"].append({
                "values": dice_values,
                "coords": dice_coords,
                "timestamp": time.time()
            })

            # 안정적인 값 확인
            stable_values = self._check_stability(game_id, monitor["value_history"])

<<<<<<< Updated upstream
                if stable_values is not None:
                    # 이전 값과 다른 경우만 처리
                    # if stable_values != monitor["last_stable_values"]:
                    if monitor["last_stable_values"] is None or not np.array_equal(stable_values, monitor["last_stable_values"]):
                        monitor["last_stable_values"] = stable_values
                        monitor["last_update_time"] = time.time()
=======
            if stable_values is not None:
                # 이전 값과 다른 경우만 처리
                if stable_values != monitor["last_stable_values"]:
                    monitor["last_stable_values"] = stable_values
                    monitor["last_update_time"] = time.time()
>>>>>>> Stashed changes

                    # waiting_for_roll이 True일 때만 콜백 실행
                    if monitor["waiting_for_roll"] and monitor["callback"]:
                        print(f"콜백 호출 전 → game_id: {game_id}, stable_values: {stable_values}")
                        try:
                            loop = asyncio.get_event_loop()
                            asyncio.run_coroutine_threadsafe(
                                monitor["callback"](game_id, stable_values),
                                loop
                            )
                        except RuntimeError:
                            # 이벤트 루프가 없는 경우 새로 생성
                            asyncio.run(monitor["callback"](game_id, stable_values))

                        # 콜백을 실행한 후에는 플래그를 False로 설정하여 중복 전송 방지
                        monitor["waiting_for_roll"] = False

    def _show_preview(self, display_frame, dice_values, detections, aruco_corners, aruco_ids):
        """미리보기 창 표시"""
        # ArUco 마커 및 정사각형 표시
        if aruco_ids is not None and len(aruco_ids) > 0:
            cv2.aruco.drawDetectedMarkers(display_frame, aruco_corners, aruco_ids)
            if self.aruco_square_corners is not None:
                rect_np = np.array(self.aruco_square_corners, dtype=np.int32).reshape((-1, 1, 2))
                cv2.polylines(display_frame, [rect_np], isClosed=True, color=(0, 255, 0), thickness=3)

        if detections is not None:
            # 박스와 레이블 시각화
            vis_util.visualize_boxes_and_labels_on_image_array(
                display_frame,
                detections['detection_boxes'],
                detections['detection_classes'],
                detections['detection_scores'],
                self.category_index,
                use_normalized_coordinates=True,
                max_boxes_to_draw=self.MAX_DICE_COUNT, # 최대 인식 개수 제한 적용
                min_score_thresh=self.CONFIDENCE_THRESHOLD,
                agnostic_mode=False)

        # 현재 인식된 주사위 값 표시
        if dice_values:
            cv2.putText(display_frame, f"Dice: {dice_values}",
                        (10, 30), cv2.FONT_HERSHEY_SIMPLEX,
                        1, (0, 255, 0), 2)
        else:
            cv2.putText(display_frame, f"Detecting... (Need {self.MIN_DICE_COUNT} dice)",
                        (10, 30), cv2.FONT_HERSHEY_SIMPLEX,
                        1, (0, 0, 255), 2)

        # FPS 정보 표시
        cv2.putText(display_frame, f"FPS: {int(1 / self.FPS_DELAY)}",
                    (display_frame.shape[1] - 100, 30), cv2.FONT_HERSHEY_SIMPLEX,
                    0.7, (255, 255, 255), 2)

        # 안정화 상태 표시
        y_offset = 60
        for i, (game_id, monitor) in enumerate(self.game_monitors.items()):
            if monitor["active"]:
                status = "Stable" if monitor["last_stable_values"] else "Detecting..."
                cv2.putText(display_frame, f"Game {game_id}: {status}",
                            (10, y_offset + 30 * i),
                            cv2.FONT_HERSHEY_SIMPLEX,
                            0.7, (0, 255, 255), 2)

        cv2.imshow('Dice Detection Monitor', display_frame)

        # 'q' 키로 종료
        if cv2.waitKey(1) & 0xFF == ord('q'):
            self.show_preview = False
            cv2.destroyWindow('Dice Detection Monitor')

    def _detect_dice_in_frame(self, frame) -> tuple[Optional[List[int]], Optional[dict]]:
        """프레임에서 주사위 인식"""
        # ArUco 정사각형이 검출되지 않았으면 주사위 인식 안 함
        if self.aruco_square_corners is None or self.perspective_matrix is None:
            return None, None, None

        try:
            # RGB 변환
            image_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            input_tensor = tf.convert_to_tensor(image_rgb, dtype=tf.uint8)
            input_tensor = input_tensor[tf.newaxis, ...]

            # 인식 수행
            detections = self.detect_fn(input_tensor)

            # 결과 추출
            num_detections = int(detections.pop('num_detections'))
            detections = {key: value[0, :num_detections].numpy()
                          for key, value in detections.items()}
            detections['detection_classes'] = detections['detection_classes'].astype(np.int64)

            # 프레임 크기
            h, w, _ = frame.shape

            # 1. 주사위 클래스(1-6)만 필터링하고 신뢰도 점수 획득 및 정사각형 내 포함 여부 확인
            dice_indices = []
            valid_detections = {
                'detection_boxes': [],
                'detection_classes': [],
                'detection_scores': []
            }

            for i in range(num_detections):
                score = detections['detection_scores'][i]
                class_id = detections['detection_classes'][i]
                box = detections['detection_boxes'][i] # normalized coordinates

                if (1 <= class_id <= 6 and score > self.CONFIDENCE_THRESHOLD):
                    # 바운딩 박스 중심점 (픽셀 좌표)
                    ymin, xmin, ymax, xmax = box
                    cx = int((xmin + xmax) / 2 * w)
                    cy = int((ymin + ymax) / 2 * h)

                    # 중심점이 ArUco 정사각형 내부에 있는지 확인
                    # pointPolygonTest를 사용하기 위해 numpy 배열로 변환
                    square_pts = np.array(self.aruco_square_corners, dtype=np.int32)
                    if cv2.pointPolygonTest(square_pts, (cx, cy), measureDist=False) >= 0:
                        dice_indices.append(i)
                        valid_detections['detection_boxes'].append(box)
                        valid_detections['detection_classes'].append(class_id)
                        valid_detections['detection_scores'].append(score)

            # 유효한 감지 결과가 없으면 반환
            if not dice_indices:
                return None, None

            # 유효한 감지 결과 numpy 배열로 변환
            valid_detections['detection_boxes'] = np.array(valid_detections['detection_boxes'])
            valid_detections['detection_classes'] = np.array(valid_detections['detection_classes'])
            valid_detections['detection_scores'] = np.array(valid_detections['detection_scores'])


            # 2. 신뢰도 순으로 정렬 (유효한 감지 결과 내에서)
            sorted_valid_indices = np.argsort(-valid_detections['detection_scores'])

            # 3. 상위 N개(MIN_DICE_COUNT)만 선택
            top_indices_in_valid = sorted_valid_indices[:self.MIN_DICE_COUNT]

            # 정확히 필요한 개수만큼 발견되었는지 확인
            if len(top_indices_in_valid) != self.MIN_DICE_COUNT:
                return None, None, valid_detections # 필요한 개수만큼 없으면 None 반환

            # 4. 값과 위치 추출
            dice_results = [] # Store tuples of (value, normalized_x, normalized_y)

            for i in top_indices_in_valid:
                class_id = valid_detections['detection_classes'][i]
                box = valid_detections['detection_boxes'][i] # normalized coordinates

                # 바운딩 박스 중심점 (픽셀 좌표)
                ymin, xmin, ymax, xmax = box
                cx = int((xmin + xmax) / 2 * w)
                cy = int((ymin + ymax) / 2 * h)

                # 중심점의 정사각형 내 상대좌표 계산
                src_pt = np.array([[[cx, cy]]], dtype=np.float32)
                dst_pt = cv2.perspectiveTransform(src_pt, self.perspective_matrix)[0][0]
                x_norm, y_norm = dst_pt[0] / RECT_SHAPE[0], dst_pt[1] / RECT_SHAPE[1]

                dice_results.append((class_id, x_norm, y_norm))

            # 5. x 위치에 따라 정렬 (왼쪽에서 오른쪽으로)
            sorted_results = sorted(dice_results, key=lambda item: item[1])
            sorted_values = [item[0] for item in sorted_results] # Extract just values for stability check
            sorted_coords = [(item[1], item[2]) for item in sorted_results] # Extract just coords

            # 시각화를 위해 전체 detections 객체 반환 (필터링된 결과만 포함)
            # detections 객체의 구조를 유지하기 위해 필요한 키만 포함
            final_detections = {
                'detection_boxes': valid_detections['detection_boxes'][top_indices_in_valid],
                'detection_classes': valid_detections['detection_classes'][top_indices_in_valid],
                'detection_scores': valid_detections['detection_scores'][top_indices_in_valid],
                'num_detections': len(top_indices_in_valid) # 실제 감지된 주사위 개수
            }

            # Return sorted values and sorted coordinates
            return sorted_values, sorted_coords, final_detections

        except Exception as e:
            print(f"주사위 인식 오류: {e}")
            import traceback
            traceback.print_exc()
            return None, None, None # Return None for all three if error

    def _check_stability(self, game_id: str, history: deque) -> Optional[List[tuple[int, tuple[float, float]]]]:
        """주사위 값이 안정적인지 확인"""
        monitor = self.game_monitors.get(game_id)
        if not monitor:
            return None

        # 기존 안정성 확인 로직
        stable_results = self._check_normal_stability(history)

        # 검출 윈도우가 활성화된 경우
        if "detection_window" in monitor and monitor["detection_window"]["active"]:
            window = monitor["detection_window"]
            current_time = time.time()

            # 안정적인 값을 찾았거나 시간이 초과된 경우
            if stable_results is not None or (current_time - window["start_time"] >= window["duration"]):
                window["active"] = False
                window["found_stable"] = stable_results is not None

                # 결과 알림 (타임아웃 또는 검출 성공)
                if window["found_stable"]:
                    print(f"게임 {game_id}: 안정적인 주사위 값 검출 - {stable_results}")
                else:
                    print(f"게임 {game_id}: 주사위 인식 시간 초과")

                    # 타임아웃 시 WebSocket 알림 (waiting_for_roll이 True일 때만)
                    if monitor["waiting_for_roll"] and monitor["callback"]:
                        try:
                            loop = asyncio.get_event_loop()
                            asyncio.run_coroutine_threadsafe(
                                monitor["callback"](game_id, None, True),  # timeout=True
                                loop
                            )
                        except RuntimeError:
                            asyncio.run(monitor["callback"](game_id, None, True))

                        # 콜백을 실행한 후 플래그 비활성화
                        monitor["waiting_for_roll"] = False

        return stable_results

    def _check_normal_stability(self, history: deque) -> Optional[List[tuple[int, tuple[float, float]]]]:
        """주사위 값과 좌표가 안정적인지 확인"""
        if len(history) < 5:  # 최소 5프레임 필요
            return None

        current_time = time.time()
        stable_results = None

        # 최근 프레임들 확인
        for i in range(len(history) - 1, -1, -1):
            frame_data = history[i]
            # 시간 체크
            if current_time - frame_data["timestamp"] > self.STABILITY_THRESHOLD:
                break

            # 주사위 결과가 없으면 스킵
            if frame_data["values"] is None or frame_data["coords"] is None:
                return None

            # 첫 번째 유효한 결과 저장
            if stable_results is None:
                # Combine values and coords into a list of tuples (value, (x, y))
                stable_results = list(zip(frame_data["values"], frame_data["coords"]))
            # 결과가 다르면 불안정
            elif list(zip(frame_data["values"], frame_data["coords"])) != stable_results:
                return None

        # 충분한 시간 동안 안정적이었는지 확인
        oldest_timestamp = history[0]["timestamp"]
        if current_time - oldest_timestamp >= self.STABILITY_THRESHOLD:
            return stable_results

        return None

    def get_current_values(self, game_id: str) -> Optional[List[tuple[int, tuple[float, float]]]]:
        """현재 안정적인 주사위 값과 좌표 반환"""
        if game_id in self.game_monitors:
            return self.game_monitors[game_id]["last_stable_values"]
        return None


# 싱글톤 인스턴스
dice_monitor = DiceMonitor()
