provider "aws" {
  region = var.region
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

