import requests
import io

REMOVE_BG_API_KEY = "nHBhSzQcTGoUExYq53VooKEE"

def remove_background(image_bytes: bytes) -> bytes:
    response = requests.post(
        "https://api.remove.bg/v1.0/removebg",
        files={"image_file": ("image.jpg", image_bytes)},
        data={"size": "auto"},
        headers={"X-Api-Key": REMOVE_BG_API_KEY}
    )

    if response.status_code == 200:
        return response.content
    else:
        raise Exception(f"remove.bg failed: {response.status_code}, {response.text}")
