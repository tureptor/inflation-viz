terraform {
  backend "s3" {
    bucket       = "inflation-viz-terraform-state"
    key          = "env/prod/terraform.tfstate"
    region       = "eu-west-2"
    encrypt      = true
    use_lockfile = true
  }
}