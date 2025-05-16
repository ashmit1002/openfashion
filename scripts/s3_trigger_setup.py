import boto3

s3 = boto3.client("s3")
lambda_client = boto3.client("lambda")

bucket_name = "openfashion-images-db"
lambda_function_arn = "arn:aws:lambda:us-east-2:485797250564:function:rembg-processor"

lambda_client.add_permission(
    FunctionName="rembg-processor",
    StatementId="AllowExecutionFromS3",
    Action="lambda:InvokeFunction",
    Principal="s3.amazonaws.com",
    SourceArn=f"arn:aws:s3:::{bucket_name}"
)

s3.put_bucket_notification_configuration(
    Bucket=bucket_name,
    NotificationConfiguration={
        "LambdaFunctionConfigurations": [
            {
                "LambdaFunctionArn": lambda_function_arn,
                "Events": ["s3:ObjectCreated:*"],
                "Filter": {
                    "Key": {
                        "FilterRules": [{"Name": "prefix", "Value": "uploads/"}]
                    }
                }
            }
        ]
    }
)

print("S3 trigger setup complete.")
