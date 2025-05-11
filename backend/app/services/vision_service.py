import cv2
import io
import base64
import numpy as np
import time
from google.cloud import vision
from app.services.s3_service import upload_to_s3
from app.services.search_service import get_clothing_from_google_search
from app.utils.image_utils import get_dominant_color

client = vision.ImageAnnotatorClient()

def color_name(rgb):
    r, g, b = rgb
    if r > 200 and g > 200 and b > 200:
        return "white"
    if r < 50 and g < 50 and b < 50:
        return "black"
    if r > g and r > b:
        return "red"
    if g > r and g > b:
        return "green"
    if b > r and b > g:
        return "blue"
    return "multicolor"

def analyze_image(filepath: str, filename: str):
    try:
        img = cv2.imread(filepath)
        if img is None:
            raise ValueError(f"Failed to read image from {filepath}")

        with io.open(filepath, 'rb') as f:
            content = f.read()

        image = vision.Image(content=content)
        response = client.object_localization(image=image)
        objects = response.localized_object_annotations

        annotated_image = img.copy()
        components = []

        for obj in objects:
            try:
                box = obj.bounding_poly.normalized_vertices
                vertices = [(int(v.x * img.shape[1]), int(v.y * img.shape[0])) for v in box]

                x_min, y_min = vertices[0]
                x_max, y_max = vertices[2]

                padding = 10
                x_min = max(0, x_min - padding)
                y_min = max(0, y_min - padding)
                x_max = min(img.shape[1], x_max + padding)
                y_max = min(img.shape[0], y_max + padding)

                if x_min >= x_max or y_min >= y_max:
                    continue

                cropped = img[y_min:y_max, x_min:x_max]
                if cropped.size == 0:
                    continue

                dominant_color = get_dominant_color(cropped)
                color_bgr = (dominant_color[2], dominant_color[1], dominant_color[0])
                color_text = color_name(dominant_color)

                cv2.polylines(annotated_image, [np.array(vertices)], True, color_bgr, 2)
                cv2.putText(annotated_image, obj.name, (x_min, y_min - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color_bgr, 2)

                _, buf = cv2.imencode(".jpg", cropped)
                s3_url = upload_to_s3(buf.tobytes(), f"{obj.name}_{x_min}_{y_min}_{int(time.time())}.jpg")

                clothing_items = get_clothing_from_google_search(
                    image_url=s3_url,
                    category_hint=obj.name,
                    color=color_text
                )

                components.append({
                    "name": obj.name,
                    "dominant_color": dominant_color,
                    "image_url": s3_url,
                    "clothing_items": clothing_items
                })

            except Exception:
                continue

        try:
            _, buffer = cv2.imencode(".jpg", annotated_image)
            base64_image = base64.b64encode(buffer).decode("utf-8")
        except Exception:
            base64_image = ""

        return {
            "annotated_image_base64": base64_image,
            "components": components
        }

    except Exception:
        raise
