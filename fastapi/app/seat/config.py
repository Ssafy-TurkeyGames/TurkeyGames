import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

CAMERA_MATRIX_PATH = os.path.join(BASE_DIR, 'seat', 'camera_matrix.npy')
DIST_COEFFS_PATH = os.path.join(BASE_DIR, 'seat', 'dist_coeffs.npy')
