resource "random_id" "suffix" {
  byte_length = 4
}

resource "aws_s3_bucket" "frontend-data" {
  bucket        = "inflation-viz-frontend-data-${random_id.suffix.hex}"
  force_destroy = true

  tags = merge(
    local.common_tags,
    {
      Name    = "inflation-viz-s3"
      Purpose = "Store frontend data"
    }
  )
}

resource "aws_s3_bucket_public_access_block" "frontend-data" {
  bucket = aws_s3_bucket.frontend-data.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "allow_cloudfront" {
  bucket = aws_s3_bucket.frontend-data.id
  policy = data.aws_iam_policy_document.cloudfront_s3_policy.json
}

data "aws_iam_policy_document" "cloudfront_s3_policy" {
  statement {
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.frontend-data.arn}/*"]
    principals {
      type        = "AWS"
      identifiers = [aws_cloudfront_origin_access_identity.oai.iam_arn]
    }
  }
}