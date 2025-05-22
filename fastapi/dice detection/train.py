import os
# os.environ["TF_USE_LEGACY_KERAS"] = "1" 
import tensorflow as tf
from object_detection.utils import config_util
from object_detection.builders import model_builder
from object_detection.utils import visualization_utils as viz_utils
import numpy as np
import cv2

# 1. GPU 설정
gpus = tf.config.list_physical_devices('GPU')
if gpus:
    try:
        # TensorFlow가 볼 수 있는 GPU 목록 중 첫 번째(논리적 0번) GPU를 사용
        tf.config.set_visible_devices(gpus[0], 'GPU')
        tf.config.experimental.set_memory_growth(gpus[0], True)
        print(f"Using GPU: {gpus[0]}")
    except RuntimeError as e:
        # 가상 장치는 초기화된 후에 설정할 수 없습니다.
        print(e)
    except IndexError:
        print("No GPU available to TensorFlow, even after setting CUDA_VISIBLE_DEVICES.")
        exit()
else:
    print("No GPUs detected by TensorFlow.")
    exit()

# 2. 모델 구성
config_path = 'ssd_mobilenet_v2/pipeline.config'
configs = config_util.get_configs_from_pipeline_file(config_path)
model_config = configs['model']
model_config.ssd.num_classes = 6  # 주사위 클래스 수 (1~6)

# 3. 모델 빌드
detection_model = model_builder.build(model_config=model_config, is_training=False)

# # 4. 체크포인트 복원
# checkpoint_path = 'ssd_mobilenet_v2/checkpoint/ckpt-0'
# ckpt = tf.train.Checkpoint(model=detection_model)
# ckpt.restore(checkpoint_path).expect_partial()

# # 5. 추론 실행
# def detect(image_path):
#     # 이미지 로드 및 전처리
#     image_np = cv2.imread(image_path)
#     input_tensor = tf.convert_to_tensor(image_np)
#     input_tensor = input_tensor[tf.newaxis, ...]

#     # 추론
#     detections = detection_model(input_tensor)

#     # 결과 시각화
#     viz_utils.visualize_boxes_and_labels_on_image_array(
#         image_np,
#         detections['detection_boxes'][0].numpy(),
#         detections['detection_classes'][0].numpy().astype(np.int32),
#         detections['detection_scores'][0].numpy(),
#         category_index={1: 'dice_1', 2: 'dice_2', 3: 'dice_3', 4: 'dice_4', 5: 'dice_5', 6: 'dice_6'},
#         use_normalized_coordinates=True,
#         max_boxes_to_draw=5,
#         min_score_thresh=0.5
#     )
    
#     cv2.imshow('Result', image_np)
#     cv2.waitKey(0)

# # 6. 실행
# detect('dice_test.jpg')
