# test_gpu.py
import tensorflow as tf

print(f"TensorFlow 버전: {tf.__version__}")
print(f"GPU 목록: {tf.config.list_physical_devices('GPU')}")
print(f"cuDNN 버전: {tf.sysconfig.get_build_info().get('cudnn_version')}")
