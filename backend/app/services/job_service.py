import logging
import uuid
from datetime import datetime
from typing import Optional, Dict, Any
from fastapi import BackgroundTasks
from app.database import analysis_jobs_collection
from app.services.vision_service import analyze_image
from app.services.similar_service import generate_similar_item_queries
from app.services.subscription_service import increment_upload_count

logger = logging.getLogger(__name__)

class JobStatus:
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

def create_analysis_job(user_id: str, image_path: str, filename: str) -> str:
    """Create a new analysis job and return the job ID"""
    job_id = str(uuid.uuid4())
    
    job = {
        "job_id": job_id,
        "user_id": user_id,
        "status": JobStatus.PENDING,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "image_path": image_path,
        "filename": filename,
        "result": None,
        "error": None
    }
    
    analysis_jobs_collection.insert_one(job)
    logger.info(f"Created analysis job {job_id} for user {user_id}")
    return job_id

def get_job_status(job_id: str) -> Optional[Dict[str, Any]]:
    """Get the status of a job by ID"""
    job = analysis_jobs_collection.find_one({"job_id": job_id})
    if job:
        # Convert ObjectId to string for JSON serialization
        job["_id"] = str(job["_id"])
        return job
    return None

def update_job_status(job_id: str, status: str, result: Optional[Dict] = None, error: Optional[str] = None):
    """Update the status of a job"""
    update_data = {
        "status": status,
        "updated_at": datetime.utcnow()
    }
    
    if result is not None:
        update_data["result"] = result
    
    if error is not None:
        update_data["error"] = error
    
    analysis_jobs_collection.update_one(
        {"job_id": job_id},
        {"$set": update_data}
    )
    logger.info(f"Updated job {job_id} status to {status}")

async def process_analysis_job(job_id: str, user_id: str):
    """Background task to process an analysis job"""
    try:
        logger.info(f"Starting analysis job {job_id}")
        update_job_status(job_id, JobStatus.PROCESSING)
        
        # Get job details
        job = analysis_jobs_collection.find_one({"job_id": job_id})
        if not job:
            logger.error(f"Job {job_id} not found")
            return
        
        image_path = job["image_path"]
        filename = job["filename"]
        
        # Perform the analysis
        logger.info(f"Analyzing image for job {job_id}")
        result = analyze_image(image_path, filename)
        
        # Generate similar queries for each component
        for component in result.get("components", []):
            clothing_items = component.get("clothing_items", [])
            queries = await generate_similar_item_queries(
                component_name=component["name"],
                color=component.get("dominant_color", ""),
                clothing_items=clothing_items,
                user_id=user_id
            )
            component["similar_queries"] = queries[:5]
        
        # Increment upload count for free users
        increment_upload_count(user_id)
        
        # Update job as completed
        update_job_status(job_id, JobStatus.COMPLETED, result=result)
        logger.info(f"Analysis job {job_id} completed successfully")
        
    except Exception as e:
        logger.error(f"Analysis job {job_id} failed: {str(e)}")
        update_job_status(job_id, JobStatus.FAILED, error=str(e))

def get_user_jobs(user_id: str, limit: int = 10) -> list:
    """Get recent jobs for a user"""
    jobs = list(analysis_jobs_collection.find(
        {"user_id": user_id}
    ).sort("created_at", -1).limit(limit))
    
    # Convert ObjectIds to strings
    for job in jobs:
        job["_id"] = str(job["_id"])
    
    return jobs 

def delete_analysis_job(job_id: str, user_id: str) -> bool:
    """Delete an analysis job by job_id and user_id. Returns True if deleted, False otherwise."""
    result = analysis_jobs_collection.delete_one({"job_id": job_id, "user_id": user_id})
    return result.deleted_count > 0 