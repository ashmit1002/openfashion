import boto3
import logging
from botocore.exceptions import NoCredentialsError, ClientError
from app.config.settings import settings

# Initialize S3 client (make sure your AWS credentials are configured)
s3_client = boto3.client("s3")
logger = logging.getLogger(__name__)

def upload_to_s3(image_bytes: bytes, filename: str, bucket_name: str = None) -> str:
    """
    Uploads an image (as bytes) to AWS S3 and returns the public URL.
    If bucket_name is not provided, defaults to the closet bucket.
    """
    bucket = bucket_name or settings.S3_BUCKET_NAME
    try:
        s3_client.put_object(
            Bucket=bucket,
            Key=filename,
            Body=image_bytes,
            ContentType="image/jpeg"
        )
        return f"https://{bucket}.s3.amazonaws.com/{filename}"
    except NoCredentialsError as e:
        raise RuntimeError("AWS credentials not configured: " + str(e))

def delete_user_closet_from_s3(user_id: str):
    """
    Delete all closet items for a user from S3.
    """
    try:
        # List all objects with user_id prefix in closet bucket
        paginator = s3_client.get_paginator('list_objects_v2')
        pages = paginator.paginate(
            Bucket=settings.S3_BUCKET_NAME,
            Prefix=f"{user_id}/"
        )
        
        for page in pages:
            if 'Contents' in page:
                objects_to_delete = [{'Key': obj['Key']} for obj in page['Contents']]
                if objects_to_delete:
                    s3_client.delete_objects(
                        Bucket=settings.S3_BUCKET_NAME,
                        Delete={'Objects': objects_to_delete}
                    )
        
        logger.info(f"Deleted closet items for user {user_id} from S3")
    except ClientError as e:
        logger.error(f"Failed to delete closet items from S3 for user {user_id}: {e}")
        raise

def delete_user_wishlist_from_s3(user_id: str):
    """
    Delete all wishlist items for a user from S3.
    """
    try:
        # List all objects with user_id prefix in wishlist bucket
        paginator = s3_client.get_paginator('list_objects_v2')
        pages = paginator.paginate(
            Bucket=settings.WISHLIST_S3_BUCKET_NAME,
            Prefix=f"{user_id}/"
        )
        
        for page in pages:
            if 'Contents' in page:
                objects_to_delete = [{'Key': obj['Key']} for obj in page['Contents']]
                if objects_to_delete:
                    s3_client.delete_objects(
                        Bucket=settings.WISHLIST_S3_BUCKET_NAME,
                        Delete={'Objects': objects_to_delete}
                    )
        
        logger.info(f"Deleted wishlist items for user {user_id} from S3")
    except ClientError as e:
        logger.error(f"Failed to delete wishlist items from S3 for user {user_id}: {e}")
        raise

def delete_user_uploads_from_s3(user_id: str):
    """
    Delete all uploaded files for a user from S3.
    """
    try:
        # List all objects with user_id prefix in posts bucket
        paginator = s3_client.get_paginator('list_objects_v2')
        pages = paginator.paginate(
            Bucket=settings.POSTS_S3_BUCKET_NAME,
            Prefix=f"{user_id}/"
        )
        
        for page in pages:
            if 'Contents' in page:
                objects_to_delete = [{'Key': obj['Key']} for obj in page['Contents']]
                if objects_to_delete:
                    s3_client.delete_objects(
                        Bucket=settings.POSTS_S3_BUCKET_NAME,
                        Delete={'Objects': objects_to_delete}
                    )
        
        logger.info(f"Deleted uploaded files for user {user_id} from S3")
    except ClientError as e:
        logger.error(f"Failed to delete uploaded files from S3 for user {user_id}: {e}")
        raise