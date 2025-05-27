terraform {
  backend "local" {}
}

provider "aws" {
  region = "eu-west-2"
}

locals {
  common_tags = {
    Name        = "terraform-bootstrap"
    Project     = "inflation-viz"
    Environment = "bootstrap"
    Terraform   = "true"
    Owner       = "mansoor"
  }
}

resource "aws_s3_bucket" "tf_state" {
  bucket = "inflation-viz-terraform-state"
  lifecycle {
    prevent_destroy = true
  }
  tags = local.common_tags
}

resource "aws_s3_bucket_versioning" "tf_state_versioning" {
  bucket = aws_s3_bucket.tf_state.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "tf_state_encryption" {
  bucket = aws_s3_bucket.tf_state.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}