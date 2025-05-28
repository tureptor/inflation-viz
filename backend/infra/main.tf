provider "aws" {
  region = var.region
}

provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1" # ACM for CloudFront
}

locals {
  project_name = "inflation-viz"

  common_tags = {
    Project     = local.project_name
    Environment = var.environment
    Owner       = var.owner
  }
}

data "aws_caller_identity" "current" {}

