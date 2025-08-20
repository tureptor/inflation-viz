variable "region" {
  default = "eu-west-2"
}

variable "environment" {
  type    = string
  default = "prod"
}

variable "owner" {
  type    = string
  default = "mansoor"
}

variable "domain_name" {
  description = "Custom domain name for the site"
  type        = string
  default     = "whathappenedtoprices.org"
}