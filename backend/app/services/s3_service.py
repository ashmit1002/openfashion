import boto3
from botocore.exceptions import NoCredentialsError
from app.config.settings import settings

# Initialize S3 client (make sure your AWS credentials are configured)
s3_client = boto3.client("s3")

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