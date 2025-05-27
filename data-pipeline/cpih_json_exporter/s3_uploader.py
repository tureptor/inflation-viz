import boto3


def upload_to_s3(json_str: str):
    bucket_name = get_s3_bucket_by_tag("Name", "inflation-viz-s3")
    object_key = "data/cpih.json"

    s3 = boto3.client("s3")

    s3.put_object(
        Bucket=bucket_name,
        Key=object_key,
        Body=json_str.encode("utf-8"),
        ContentType="application/json",
    )


def get_s3_bucket_by_tag(key, value):
    client = boto3.client("resourcegroupstaggingapi", region_name="eu-west-2")

    response = client.get_resources(
        TagFilters=[{"Key": key, "Values": [value]}], ResourceTypeFilters=["s3"]
    )

    if not response["ResourceTagMappingList"]:
        raise Exception(f"No S3 bucket found with tag {key}={value}")

    arn = response["ResourceTagMappingList"][0]["ResourceARN"]
    return arn.split(":::")[1]
