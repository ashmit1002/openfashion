#!/usr/bin/env python3
"""
Script to configure S3 bucket CORS settings for image cropping functionality.
Run this script to fix the CORS issues that prevent image cropping.
"""

import boto3
import json
from botocore.exceptions import ClientError

def configure_s3_cors(bucket_name):
    """Configure CORS settings for S3 bucket to allow image cropping."""
    
    # CORS configuration that allows cross-origin requests for image loading
    cors_configuration = {
        'CORSRules': [
            {
                'AllowedHeaders': ['*'],
                'AllowedMethods': ['GET', 'HEAD'],
                'AllowedOrigins': [
                    'https://www.openfashionapp.com',
                    'http://localhost:3000',
                    'http://localhost:3001'
                ],
                'ExposeHeaders': ['ETag'],
                'MaxAgeSeconds': 3000
            }
        ]
    }
    
    try:
        s3_client = boto3.client('s3')
        
        # Apply CORS configuration
        s3_client.put_bucket_cors(
            Bucket=bucket_name,
            CORSConfiguration=cors_configuration
        )
        
        print(f"✅ Successfully configured CORS for bucket: {bucket_name}")
        print("CORS configuration applied:")
        print(json.dumps(cors_configuration, indent=2))
        
    except ClientError as e:
        print(f"❌ Error configuring CORS for bucket {bucket_name}: {e}")
        return False
    
    return True

def main():
    """Main function to configure CORS for both S3 buckets."""
    
    # Configure both buckets
    buckets = [
        "openfashion-user-closets",  # Main closet bucket (note the 's' at the end)
        "openfashion-user-posts"    # Posts bucket
    ]
    
    print("🔧 Configuring S3 bucket CORS settings...")
    print("This will allow image cropping functionality to work properly.\n")
    
    for bucket in buckets:
        print(f"Configuring bucket: {bucket}")
        success = configure_s3_cors(bucket)
        if success:
            print(f"✅ {bucket} configured successfully\n")
        else:
            print(f"❌ Failed to configure {bucket}\n")
    
    print("🎉 CORS configuration complete!")
    print("Your image cropping functionality should now work properly.")

if __name__ == "__main__":
    main() 