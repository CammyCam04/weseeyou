# -----------------------------------------------------------------------------
# VPC & Networking Outputs
# -----------------------------------------------------------------------------
output "vpc_id" {
  description = "The ID of the provisioned VPC."
  value       = module.vpc.vpc_id
}

output "public_subnet_ids" {
  description = "List of public subnet IDs for the ALB."
  value       = module.vpc.public_subnet_ids
}

output "private_app_subnet_ids" {
  description = "List of private application subnet IDs for ECS Fargate."
  value       = module.vpc.private_app_subnet_ids
}

# -----------------------------------------------------------------------------
# Security Outputs
# -----------------------------------------------------------------------------
output "alb_security_group_id" {
  description = "Security group ID for the Application Load Balancer."
  value       = module.security.alb_security_group_id
}

output "ecs_security_group_id" {
  description = "Security group ID for the ECS backend tasks."
  value       = module.security.ecs_security_group_id
}

output "rds_security_group_id" {
  description = "Security group ID for the RDS PostgreSQL database."
  value       = module.security.rds_security_group_id
}

# -----------------------------------------------------------------------------
# Database Outputs
# -----------------------------------------------------------------------------
output "rds_endpoint" {
  description = "Connection endpoint for the RDS PostgreSQL database."
  value       = module.rds.db_endpoint
}

output "rds_database_name" {
  description = "The PostgreSQL database name."
  value       = module.rds.db_name
}

output "rds_db_url_ssm_name" {
  description = "SSM Parameter Store key for the async SQLAlchemy database URL."
  value       = module.rds.db_url_ssm_name
}

# -----------------------------------------------------------------------------
# Application & Compute Outputs
# -----------------------------------------------------------------------------
output "ecr_repository_url" {
  description = "ECR Docker registry URL for building and pushing the backend image."
  value       = module.ecs.ecr_repository_url
}

output "ecs_cluster_name" {
  description = "Name of the ECS Fargate cluster."
  value       = module.ecs.ecs_cluster_name
}

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer."
  value       = module.alb.alb_dns_name
}

# -----------------------------------------------------------------------------
# Frontend & CDN Outputs
# -----------------------------------------------------------------------------
output "frontend_s3_bucket" {
  description = "Name of the frontend S3 static hosting bucket."
  value       = module.frontend.bucket_id
}

output "cloudfront_domain_name" {
  description = "Public domain name of the CloudFront distribution (e.g. d123.cloudfront.net)."
  value       = module.cloudfront.distribution_domain_name
}

output "cloudfront_distribution_id" {
  description = "ID of the CloudFront distribution."
  value       = module.cloudfront.distribution_id
}

# -----------------------------------------------------------------------------
# Lambda ETL & Monitoring Outputs
# -----------------------------------------------------------------------------
output "lambda_etl_function_name" {
  description = "Name of the scheduled data ingestion Lambda function."
  value       = module.lambda_etl.lambda_function_name
}

output "cloudwatch_dashboard_name" {
  description = "Name of the operational CloudWatch dashboard."
  value       = module.monitoring.dashboard_name
}
