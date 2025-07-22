import logging
import cv2
import io
import base64
import numpy as np
import time
from google.cloud import vision
from app.services.s3_service import upload_to_s3
from app.services.search_service import get_clothing_from_google_search
from app.services.remove_bg_service import remove_background
from app.config.settings import settings

client = vision.ImageAnnotatorClient()

logger = logging.getLogger(__name__)

# 🔁 Synonym normalization map
CATEGORY_SYNONYMS = {
    "footwear": "Shoe",
    "shoes": "Shoe",
    "sneaker": "Shoe",
    "sneakers": "Shoe",
    "handbag": "Bag",
    "purse": "Bag",
    "bag": "Bag",
    "trousers": "Pants",
    "pants": "Pants",
    "denim": "Jeans",
    "jacket": "Outerwear",
    "coat": "Outerwear",
    "hoodie": "Outerwear",
    "t-shirt": "Top",
    "tee": "Top",
    "top": "Top",
    "shirt": "Top"
}

def normalize_category(name: str) -> str:
    return CATEGORY_SYNONYMS.get(name.lower(), name.title())

def get_dominant_color(image):
    """Extract the dominant color from an image."""
    # Convert to RGB
    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    
    # Reshape the image to be a list of pixels
    pixels = image.reshape(-1, 3)
    
    # Convert to float32
    pixels = np.float32(pixels)
    
    # Define criteria and apply kmeans()
    criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 200, .1)
    flags = cv2.KMEANS_RANDOM_CENTERS
    _, labels, palette = cv2.kmeans(pixels, 1, None, criteria, 10, flags)
    
    # Get the dominant color
    dominant_color = palette[0].astype(int)
    
    # Convert to hex
    hex_color = '#{:02x}{:02x}{:02x}'.format(*dominant_color)
    
    return hex_color

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

                # Get dominant color
                dominant_color = get_dominant_color(cropped)

                # Encode original crop and upload to S3 (use posts bucket)
                _, original_buf = cv2.imencode(".jpg", cropped)
                timestamp = int(time.time())
                base_name = f"{obj.name}_{x_min}_{y_min}_{timestamp}"

                original_url = upload_to_s3(
                    original_buf.tobytes(),
                    f"{base_name}_original.jpg",
                    bucket_name=settings.POSTS_S3_BUCKET_NAME
                )

                # Attempt remove.bg and upload (use posts bucket)
                try:
                    bg_removed_bytes = remove_background(original_buf.tobytes())
                    removed_url = upload_to_s3(
                        bg_removed_bytes,
                        f"{base_name}_removed.jpg",
                        bucket_name=settings.POSTS_S3_BUCKET_NAME
                    )
                except Exception as e:
                    logger.warning("\u26a0\ufe0f Background removal failed: %s", e)
                    removed_url = ""

                # Draw on original image for annotation
                cv2.polylines(annotated_image, [np.array(vertices)], True, (0, 255, 0), 2)
                cv2.putText(annotated_image, obj.name, (x_min, y_min - 10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

                # Search both versions and merge results (up to 10)
                items_original = get_clothing_from_google_search(original_url, obj.name, dominant_color)
                items_removed = get_clothing_from_google_search(removed_url, obj.name, dominant_color) if removed_url else []

                combined_items = (items_original + items_removed)[:10]

                # 🔀 Normalize the detected label
                category = normalize_category(obj.name)

                components.append({
                    "name": category,
                    "original_image_url": original_url,
                    "bg_removed_url": removed_url,
                    "image_url": original_url,  # For frontend compatibility
                    "dominant_color": dominant_color,
                    "clothing_items": combined_items
                })

            except Exception as e:
                logger.warning("\u26a0\ufe0f Component processing failed: %s", e)
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
