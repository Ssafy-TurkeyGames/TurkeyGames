# # camera_test.py
# import cv2
# cap = cv2.VideoCapture(0)
# if not cap.isOpened():
#     print("카메라 열기 실패!")
# else:
#     print("카메라 정상 연결")
# cap.release()


# audio_test
import sounddevice as sd
# print("오디오 장치 목록:",sd.query_devices())
print("기본 오디오 장치:",sd.default.device)
print("인풋 장치",sd.query_devices(kind='input'))