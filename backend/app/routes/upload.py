import logging
import os
import time

from fastapi import APIRouter, UploadFile, File, HTTPException, Form, Depends
from app.services.vision_service import analyze_image
from app.auth.dependencies import get_current_user_id

# Temporary in-memory closet store
user_closets = {}

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/")
async def upload_image(
    image: UploadFile = File(...),
    is_owner: str = Form("false"),
    user_id: str = Depends(get_current_user_id)
):
    logger.info("\ud83d\udcf8 Upload endpoint hit. is_owner=%s, user_id=%s", is_owner, user_id)
    
    if not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Invalid file type")

    os.makedirs("uploads", exist_ok=True)
    filename = f"{int(time.time())}_{image.filename}"
    temp_path = os.path.join("uploads", filename)

    logger.info("\ud83d\udce5 Saving image to %s", temp_path)

    with open(temp_path, "wb") as f:
        f.write(await image.read())

    try:
        logger.info("\ud83d\udd0d Calling analyze_image()")
        result = analyze_image(temp_path, filename)
        logger.info("\u2705 analyze_image() returned successfully")

        return result

    except Exception as e:
        logger.error("\u274c Error during processing: %s", str(e))
        raise HTTPException(status_code=500, detail=f"Image processing failed: {str(e)}")

    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)
            logger.info("\ud83e\uddf9 Temp file %s removed", temp_path)


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

