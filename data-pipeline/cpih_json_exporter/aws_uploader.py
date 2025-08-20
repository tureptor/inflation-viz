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
        CacheControl="no-cache"
    )


def invalidate_cloudfront_cache():
    distribution_id = get_cloudfront_distribution_id_by_tag("Name",
                                                            "inflation-viz-cloudfront-distribution")
    object_key = "/data/cpih.json"
    paths = [object_key]

    client = boto3.client("cloudfront", region_name="us-east-1")
    client.create_invalidation(
        DistributionId=distribution_id,
        InvalidationBatch={
            "Paths": {"Quantity": len(paths), "Items": paths},
            "CallerReference": str(hash(f"{distribution_id}{paths}")),
        },
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


def get_cloudfront_distribution_id_by_tag(key, value):
    client = boto3.client("resourcegroupstaggingapi", region_name="us-east-1")
    
    response = client.get_resources(
        TagFilters=[{"Key": key, "Values": [value]}],
        ResourceTypeFilters=["cloudfront:distribution"],
    )

    if not response["ResourceTagMappingList"]:
        raise Exception(f"No CloudFront distribution found with tag {key}={value}")

    arn = response["ResourceTagMappingList"][0]["ResourceARN"]
    return arn.split("/")[-1]
