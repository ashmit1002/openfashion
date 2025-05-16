from fastapi import APIRouter, UploadFile, File, HTTPException, Form, Depends
from app.services.vision_service import analyze_image
from app.auth.dependencies import get_current_user_id
import os
import time
from app.storage import user_closets

router = APIRouter()

@router.post("/upload")
async def upload_image(
    image: UploadFile = File(...),
    is_owner: str = Form("false"),
    user_id: str = Depends(get_current_user_id)
):
    if not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Invalid file type")

    os.makedirs("uploads", exist_ok=True)
    filename = f"{int(time.time())}_{image.filename}"
    temp_path = f"uploads/{filename}"

    with open(temp_path, "wb") as f:
        f.write(await image.read())

    try:
        result = analyze_image(temp_path, filename)

        if is_owner.strip().lower() == "true":
            # Initialize user's closet as dict if it doesn't exist
            if user_id not in user_closets:
                user_closets[user_id] = {}

            for component in result.get("components", []):
                category = component.get("name", "Other")
                top_item = next(iter(component.get("clothing_items", [])), None)

                if not top_item:
                    continue

                # Create category list if missing
                user_closets[user_id].setdefault(category, [])

                # Check for duplicates (based on product link)
                existing_links = [item["link"] for item in user_closets[user_id][category]]
                if top_item["link"] not in existing_links and len(user_closets[user_id][category]) < 6:
                    user_closets[user_id][category].append({
                        "title": top_item["title"],
                        "thumbnail": top_item["thumbnail"],
                        "price": top_item["price"],
                        "link": top_item["link"]
                    })

            print(f"✅ Closet for user {user_id} updated:", user_closets[user_id])

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image processing failed: {str(e)}")
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

@router.post("/upload-thumbnail")
async def upload_thumbnail(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Invalid file type")

    os.makedirs("uploads", exist_ok=True)
    filename = f"{int(time.time())}_{file.filename}"
    file_path = os.path.join("uploads", filename)

    with open(file_path, "wb") as f:
        f.write(await file.read())

    return {"url": f"http://localhost:8000/uploads/{filename}"}