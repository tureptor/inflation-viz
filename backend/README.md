
## Purpose of this directory:
 - Spin up hosting AWS infrastructure for the project using Terraform
 - Populate GitHub secrets automatically with AWS IDs so that GitHub Actions can push stuff to/use the AWS infrastructure

## Requirements:
 - `make`
 - `terraform`
 - `gh`

## Usage:
1. `cd backend`  
2. `make`