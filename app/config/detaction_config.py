class Settings:
    # 주사위 인식 설정
    AUTO_DICE_DETECTION_ENABLED = True  # True로 설정하면 항상 자동 인식 사용
    DICE_CAMERA_INDEX = 0
    # 주사위 검출 시간 초
    DICE_STABILITY_THRESHOLD = 0.65
    DICE_CONFIDENCE_THRESHOLD = 0.98
    DICE_SHOW_PREVIEW = True
    # 모델 경로 설정
    DICE_MODEL_PATH = r"C:\your\full\path\to\dice detection\exported_model\saved_model"
    DICE_LABEL_PATH = r"C:\your\full\path\to\dice detection\exported_model\dice_label_map.pbtxt"
    # 0.033 = 30 FPS
    DICE_FPS_DELAY = 0.033

    # 주사위 개수 제한
    DICE_MIN_COUNT = 5
    DICE_MAX_COUNT = 5
settings = Settings()