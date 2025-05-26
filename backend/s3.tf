resource "aws_s3_bucket" "frontend-data" {
  bucket        = "inflation-viz-frontend-data-${random_id.suffix.hex}"
  force_destroy = true
}

resource "random_id" "suffix" {
  byte_length = 4
}

# Disable "Block Public Access"
resource "aws_s3_bucket_public_access_block" "frontend-data" {
  bucket = aws_s3_bucket.frontend-data.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

# Public read policy
resource "aws_s3_bucket_policy" "public_read" {
  bucket = aws_s3_bucket.frontend-data.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid       = "PublicReadGetObject",
        Effect    = "Allow",
        Principal = "*",
        Action    = [
          "s3:GetObject"
        ],
        Resource  = "${aws_s3_bucket.frontend-data.arn}/*"
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.frontend-data]
}