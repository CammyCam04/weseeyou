variable "project_name" {
  description = "Project name prefix."
  type        = string
}

variable "environment" {
  description = "Deployment environment name."
  type        = string
}

variable "s3_bucket_id" {
  description = "ID of the frontend S3 bucket."
  type        = string
}

variable "s3_bucket_arn" {
  description = "ARN of the frontend S3 bucket."
  type        = string
}

variable "s3_bucket_regional_domain_name" {
  description = "Regional domain name of the S3 bucket."
  type        = string
}

variable "alb_dns_name" {
  description = "DNS name of the Application Load Balancer."
  type        = string
}

variable "domain_name" {
  description = "Optional custom domain name (e.g. weseeyou.org)."
  type        = string
  default     = ""
}
