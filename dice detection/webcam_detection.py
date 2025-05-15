import os
import cv2
import numpy as np
import tensorflow as tf
from object_detection.utils import label_map_util
from object_detection.utils import visualization_utils as vis_util

# Path to the exported model and label map
PATH_TO_SAVED_MODEL = os.path.join('exported_model', 'saved_model')
PATH_TO_LABELS = os.path.join('exported_model', 'dice_label_map.pbtxt')

# Load the model
print('Loading model...')
detect_fn = tf.saved_model.load(PATH_TO_SAVED_MODEL)
print('Model loaded.')

# Load the label map
category_index = label_map_util.create_category_index_from_labelmap(PATH_TO_LABELS, use_display_name=True)

# Open webcam
cap = cv2.VideoCapture(1)

if not cap.isOpened():
    print("Error: Could not open webcam.")
    exit()

print('Running inference...')
while True:
    ret, image_np = cap.read()
    if not ret:
        print("Error: Failed to capture frame.")
        break

    # Convert to RGB
    image_np_rgb = cv2.cvtColor(image_np, cv2.COLOR_BGR2RGB)
    # Add a dimension to the image to make it a batch of size 1
    input_tensor = tf.convert_to_tensor(image_np_rgb, dtype=tf.uint8)
    input_tensor = input_tensor[tf.newaxis, ...]

    # Perform inference
    detections = detect_fn(input_tensor)

    # Get detection results
    num_detections = int(detections.pop('num_detections'))
    detections = {key: value[0, :num_detections].numpy()
                  for key, value in detections.items()}
    detections['num_detections'] = num_detections

    # detection_classes should be ints.
    detections['detection_classes'] = detections['detection_classes'].astype(np.int64)

    # Visualize detections
    image_np_with_detections = image_np.copy()
    vis_util.visualize_boxes_and_labels_on_image_array(
        image_np_with_detections,
        detections['detection_boxes'],
        detections['detection_classes'],
        detections['detection_scores'],
        category_index,
        use_normalized_coordinates=True,
        max_boxes_to_draw=5,
        min_score_thresh=.98,
        agnostic_mode=False)

    # Display the output
    cv2.imshow('Dice Detection', image_np_with_detections)

    # Press 'q' to exit
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# Release the webcam and close windows
cap.release()
cv2.destroyAllWindows()
