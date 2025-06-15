from fastapi import APIRouter, UploadFile, File, HTTPException, Form, Depends
from app.services.vision_service import analyze_image
from app.auth.dependencies import get_current_user_id
import os
import time

# Temporary in-memory closet store
user_closets = {}

router = APIRouter()

@router.post("/")
async def upload_image(
    image: UploadFile = File(...),
    is_owner: str = Form("false"),
    user_id: str = Depends(get_current_user_id)
):
    print(f"📸 Upload endpoint hit. is_owner={is_owner}, user_id={user_id}")
    
    if not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Invalid file type")

    os.makedirs("uploads", exist_ok=True)
    filename = f"{int(time.time())}_{image.filename}"
    temp_path = os.path.join("uploads", filename)

    print(f"📥 Saving image to {temp_path}")

    with open(temp_path, "wb") as f:
        f.write(await image.read())

    try:
        print("🔍 Calling analyze_image()")
        result = analyze_image(temp_path, filename)
        print("✅ analyze_image() returned successfully")

        return result

    except Exception as e:
        print(f"❌ Error during processing: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Image processing failed: {str(e)}")

    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)
            print(f"🧹 Temp file {temp_path} removed")


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
