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
                "value_history": deque(maxlen=10),  # 최근 10프레임 저장
                "last_update_time": 0,
                "callback": None
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

        # 주사위 인식
        dice_values, detections = self._detect_dice_in_frame(frame)

        # 미리보기 창 표시
        if self.show_preview:
            self._show_preview(display_frame, dice_values, detections)

        # 각 게임에 대해 처리
        for game_id, monitor in self.game_monitors.items():
            if not monitor["active"]:
                continue

            # 주사위 값 이력 업데이트
            monitor["value_history"].append({
                "values": dice_values,
                "timestamp": time.time()
            })

            # 안정적인 값 확인
            stable_values = self._check_stability(monitor["value_history"])

            if stable_values is not None:
                # 이전 값과 다른 경우에만 업데이트
                if stable_values != monitor["last_stable_values"]:
                    monitor["last_stable_values"] = stable_values
                    monitor["last_update_time"] = time.time()

                    # 콜백 실행
                    if monitor["callback"]:
                        try:
                            loop = asyncio.get_event_loop()
                            asyncio.run_coroutine_threadsafe(
                                monitor["callback"](game_id, stable_values),
                                loop
                            )
                        except RuntimeError:
                            # 이벤트 루프가 없는 경우 새로 생성
                            asyncio.run(monitor["callback"](game_id, stable_values))

    def _show_preview(self, display_frame, dice_values, detections):
        """미리보기 창 표시"""
        if detections is not None:
            # 박스와 레이블 시각화
            vis_util.visualize_boxes_and_labels_on_image_array(
                display_frame,
                detections['detection_boxes'],
                detections['detection_classes'],
                detections['detection_scores'],
                self.category_index,
                use_normalized_coordinates=True,
                max_boxes_to_draw=10,
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

            # 높은 신뢰도의 주사위 값만 추출
            dice_values = []
            dice_positions = []

            for i in range(num_detections):
                if detections['detection_scores'][i] > self.CONFIDENCE_THRESHOLD:
                    class_id = detections['detection_classes'][i]
                    if 1 <= class_id <= 6:  # 주사위 값 (1-6)
                        dice_values.append(class_id)
                        # 박스 중심점 계산
                        box = detections['detection_boxes'][i]
                        center_x = (box[1] + box[3]) / 2
                        dice_positions.append(center_x)

            # 주사위 개수가 정확히 맞는 경우만 처리
            if len(dice_values) >= self.MIN_DICE_COUNT and len(dice_values) <= self.MAX_DICE_COUNT:
                # 위치에 따라 정렬 (왼쪽에서 오른쪽으로)
                sorted_pairs = sorted(zip(dice_positions[:self.MAX_DICE_COUNT], dice_values[:self.MAX_DICE_COUNT]))
                sorted_values = [value for _, value in sorted_pairs]

                # 미리보기에 인식 개수 표시 (디버깅용)
                if self.show_preview:
                    total_detected = len(dice_values)
                    # if total_detected > self.MAX_DICE_COUNT:
                    #     print(f"인식된 주사위: {total_detected}개 (최대 {self.MAX_DICE_COUNT}개만 사용)")

                return sorted_values, detections

            # 개수가 맞지 않으면 미리보기에만 표시
            # if self.show_preview and len(dice_values) > 0:
            #     print(f"인식된 주사위: {len(dice_values)}개 (필요: {self.MIN_DICE_COUNT}-{self.MAX_DICE_COUNT}개)")

            return None, detections

        except Exception as e:
            print(f"주사위 인식 오류: {e}")
            import traceback
            traceback.print_exc()
            return None, None

    def _check_stability(self, history: deque) -> Optional[List[int]]:
        """주사위 값이 안정적인지 확인"""
        if len(history) < 5:  # 최소 5프레임 필요
            return None

        current_time = time.time()
        stable_values = None

        # 최근 프레임들 확인
        for i in range(len(history) - 1, -1, -1):
            frame_data = history[i]
            # 시간 체크
            if current_time - frame_data["timestamp"] > self.STABILITY_THRESHOLD:
                break

            # 주사위 값이 없으면 스킵
            if frame_data["values"] is None:
                return None

            # 첫 번째 유효한 값 저장
            if stable_values is None:
                stable_values = frame_data["values"]
            # 값이 다르면 불안정
            elif stable_values != frame_data["values"]:
                return None

        # 충분한 시간 동안 안정적이었는지 확인
        oldest_timestamp = history[0]["timestamp"]
        if current_time - oldest_timestamp >= self.STABILITY_THRESHOLD:
            return stable_values

        return None

    def get_current_values(self, game_id: str) -> Optional[List[int]]:
        """현재 안정적인 주사위 값 반환"""
        if game_id in self.game_monitors:
            return self.game_monitors[game_id]["last_stable_values"]
        return None


# 싱글톤 인스턴스
dice_monitor = DiceMonitor()