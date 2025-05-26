# Config
TF_OUTPUT_S3= s3_bucket_name
GITHUB_SECRET_S3 = S3_BUCKET_NAME

TF_OUTPUT_ECR = ecr_repo_url
GITHUB_SECRET_ECR = ECR_REPO_URL

all: apply gh-auth update-secrets

# Terraform apply
apply:
	terraform init
	terraform apply -auto-approve

# Ensure GH auth is valid before updating secrets
gh-auth:
	@gh auth status > /dev/null 2>&1 || \
	( echo "ⓘ GitHub CLI not authenticated. Running 'gh auth login'..."; \
	  gh auth login )

# Update GitHub secrets
update-secrets:
	@echo "ⓘ Updating GitHub secrets..."

	@S3_BUCKET=$$(terraform output -raw $(TF_OUTPUT_S3)) && \
	gh secret set $(GITHUB_SECRET_S3) --body "$$S3_BUCKET" && \
	echo "✅ GitHub secret $(GITHUB_SECRET_S3) set to $$S3_BUCKET"

	@ECR_REPO=$$(terraform output -raw $(TF_OUTPUT_ECR)) && \
	gh secret set $(GITHUB_SECRET_ECR) --body "$$ECR_REPO" && \
	echo "✅ GitHub secret $(GITHUB_SECRET_ECR) set to $$ECR_REPO"

