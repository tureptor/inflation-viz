output "s3_bucket_name" {
  value = aws_s3_bucket.frontend-data.bucket
}

output "ecr_repo_url" {
  value = aws_ecr_repository.data-pipeline.repository_url
}

output "route53_nameservers" {
  value       = aws_route53_zone.zone.name_servers
  description = "Nameservers to configure at domain provider"
}