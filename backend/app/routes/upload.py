import logging
import os
import time

from fastapi import APIRouter, UploadFile, File, HTTPException, Form, Depends, BackgroundTasks
from app.services.vision_service import analyze_image
from app.auth.dependencies import get_current_user_id
from app.services.similar_service import generate_similar_item_queries
from app.services.search_service import get_shopping_results_from_serpapi
from app.services.subscription_service import check_upload_limit, increment_upload_count
from app.config.settings import settings
from app.services.s3_service import upload_to_s3
from app.services.job_service import create_analysis_job, process_analysis_job
from app.services.job_service import delete_analysis_job

# Temporary in-memory closet store
user_closets = {}

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/")
async def upload_image(
    image: UploadFile = File(...),
    is_owner: str = Form("false"),
    user_id: str = Depends(get_current_user_id),
    background_tasks: BackgroundTasks = None
):
    logger.info("📸 Upload endpoint hit. is_owner=%s, user_id=%s", is_owner, user_id)
    
    # Check upload limits
    upload_check = check_upload_limit(user_id)
    if not upload_check['can_upload']:
        raise HTTPException(
            status_code=403, 
            detail={
                "message": upload_check['reason'],
                "uploads_used": upload_check.get('uploads_used', 0),
                "uploads_limit": upload_check.get('uploads_limit', 0)
            }
        )
    
    if not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Invalid file type")

    os.makedirs("uploads", exist_ok=True)
    filename = f"{int(time.time())}_{image.filename}"
    temp_path = os.path.join("uploads", filename)

    logger.info("💾 Saving image to %s", temp_path)

    with open(temp_path, "wb") as f:
        f.write(await image.read())

    try:
        # Create analysis job
        job_id = create_analysis_job(user_id, temp_path, filename)
        
        # Start background processing
        if background_tasks:
            background_tasks.add_task(process_analysis_job, job_id, user_id)
        
        logger.info("✅ Analysis job created: %s", job_id)
        
        return {
            "job_id": job_id,
            "status": "pending",
            "message": "Image uploaded successfully. Analysis in progress."
        }

    except Exception as e:
        logger.error("❌ Error during job creation: %s", str(e))
        # Clean up temp file
        if os.path.exists(temp_path):
            os.remove(temp_path)
        raise HTTPException(status_code=500, detail=f"Job creation failed: {str(e)}")

@router.get("/job/{job_id}")
async def get_job_status(job_id: str, user_id: str = Depends(get_current_user_id)):
    """Get the status of an analysis job"""
    from app.services.job_service import get_job_status
    
    job = get_job_status(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Ensure user can only access their own jobs
    if job["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return job

@router.get("/jobs")
async def get_user_jobs(user_id: str = Depends(get_current_user_id), limit: int = 10):
    """Get recent analysis jobs for the user"""
    from app.services.job_service import get_user_jobs
    
    jobs = get_user_jobs(user_id, limit)
    return {"jobs": jobs}

@router.delete("/job/{job_id}")
async def delete_job(job_id: str, user_id: str = Depends(get_current_user_id)):
    """Delete an analysis job by job_id for the current user"""
    deleted = delete_analysis_job(job_id, user_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Job not found or not authorized to delete")
    return {"message": "Job deleted"}

@router.post("/upload-thumbnail")
async def upload_thumbnail(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Invalid file type")

    # Upload to S3 closet bucket instead of saving locally
    image_bytes = await file.read()
    filename = f"{int(time.time())}_{file.filename}"
    s3_url = upload_to_s3(image_bytes, filename, bucket_name=settings.S3_BUCKET_NAME)
    return {"url": s3_url}

