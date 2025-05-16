import boto3
from botocore.exceptions import NoCredentialsError

# Replace with your actual bucket name
S3_BUCKET_NAME = "fashionwebapp"

# Initialize S3 client (make sure your AWS credentials are configured)
s3_client = boto3.client("s3")

def upload_to_s3(image_bytes: bytes, filename: str) -> str:
    """
    Uploads an image (as bytes) to AWS S3 and returns the public URL.
    """
    try:
        s3_client.put_object(
            Bucket=S3_BUCKET_NAME,
            Key=filename,
            Body=image_bytes,
            ContentType="image/jpeg"
        )
        return f"https://{S3_BUCKET_NAME}.s3.amazonaws.com/{filename}"
    except NoCredentialsError as e:
        raise RuntimeError("AWS credentials not configured: " + str(e))