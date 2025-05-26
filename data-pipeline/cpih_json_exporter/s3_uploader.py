import os
import json
from io import BytesIO
import boto3

def upload_to_s3(json_str: str):
    # Load environment variables ---
    bucket_name = os.environ["S3_BUCKET"]  # e.g. "inflation-viz-data-bucket-135ruj"
    object_key = os.environ.get("S3_OBJECT_KEY")  # e.g. "cpih/latest.json"

    # Prepare the JSON file ---
    json_bytes = json.dumps(json_str).encode("utf-8")
    json_file = BytesIO(json_bytes)

    # Upload to S3 ---
    s3 = boto3.client("s3")
    s3.upload_fileobj(json_file, bucket_name, object_key, ExtraArgs={"ContentType": "application/json"})