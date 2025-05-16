import cv2
import io
import base64
import numpy as np
import time
from google.cloud import vision
from app.services.s3_service import upload_to_s3
from app.services.search_service import get_clothing_from_google_search
from app.services.remove_bg_service import remove_background
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

                # Encode original crop and upload to S3
                _, original_buf = cv2.imencode(".jpg", cropped)
                timestamp = int(time.time())
                base_name = f"{obj.name}_{x_min}_{y_min}_{timestamp}"

                original_url = upload_to_s3(original_buf.tobytes(), f"{base_name}_original.jpg")

                # Attempt remove.bg and upload
                try:
                    bg_removed_bytes = remove_background(original_buf.tobytes())
                    removed_url = upload_to_s3(bg_removed_bytes, f"{base_name}_removed.jpg")
                except Exception as e:
                    print(f"⚠️ Background removal failed: {e}")
                    removed_url = ""

                dominant_color = get_dominant_color(cropped)
                color_text = color_name(dominant_color)
                color_bgr = (dominant_color[2], dominant_color[1], dominant_color[0])

                # Draw on original image for annotation
                cv2.polylines(annotated_image, [np.array(vertices)], True, color_bgr, 2)
                cv2.putText(annotated_image, obj.name, (x_min, y_min - 10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, color_bgr, 2)

                # Search both versions and merge results (up to 10)
                items_original = get_clothing_from_google_search(original_url, obj.name, color_text)
                items_removed = get_clothing_from_google_search(removed_url, obj.name, color_text) if removed_url else []

                combined_items = (items_original + items_removed)[:10]

                components.append({
                    "name": obj.name,
                    "dominant_color": dominant_color,
                    "original_image_url": original_url,
                    "bg_removed_url": removed_url,
                    "clothing_items": combined_items
                })

            except Exception as e:
                print(f"⚠️ Component processing failed: {e}")
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

    except Exception as e:
        raise RuntimeError(f"❌ analyze_image failed: {e}")
