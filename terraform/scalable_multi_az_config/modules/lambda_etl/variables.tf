variable "project_name" {
  description = "Project name prefix."
  type        = string
}

variable "environment" {
  description = "Deployment environment name."
  type        = string
}

variable "private_app_subnet_ids" {
  description = "Private subnets for Lambda VPC access to RDS."
  type        = list(string)
}

variable "lambda_security_group_id" {
  description = "Security group ID for Lambda."
  type        = string
}

variable "db_url_ssm_arn" {
  description = "SSM Parameter Store ARN for the database connection string."
  type        = string
}

variable "cron_schedule" {
  description = "EventBridge cron expression for weekly sync (Default: Every Sunday at 6 AM UTC)."
  type        = string
  default     = "cron(0 6 ? * SUN *)"
}
