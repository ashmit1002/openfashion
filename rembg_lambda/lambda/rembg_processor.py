import boto3
import os
from rembg import remove

s3 = boto3.client("s3")

INPUT_BUCKET = os.environ.get("INPUT_BUCKET", "openfashion-images-db")
OUTPUT_BUCKET = os.environ.get("OUTPUT_BUCKET", "openfashion-processed-db")

def lambda_handler(event, context):
    for record in event["Records"]:
        key = record["s3"]["object"]["key"]
        input_bucket = record["s3"]["bucket"]["name"]

        print(f"Processing image: s3://{input_bucket}/{key}")

        response = s3.get_object(Bucket=input_bucket, Key=key)
        image_data = response["Body"].read()

        output_data = remove(image_data)

        output_key = key.replace("uploads/", "processed/").rsplit(".", 1)[0] + ".png"

        s3.put_object(
            Bucket=OUTPUT_BUCKET,
            Key=output_key,
            Body=output_data,
            ContentType="image/png"
        )

        print(f"Saved processed image to: s3://{OUTPUT_BUCKET}/{output_key}")
