variable "project_name" {
  description = "Project name prefix."
  type        = string
}

variable "environment" {
  description = "Deployment environment name."
  type        = string
}

variable "private_app_subnet_ids" {
  description = "List of private application subnet IDs for ECS tasks."
  type        = list(string)
}

variable "ecs_security_group_id" {
  description = "Security group ID for the ECS service."
  type        = string
}

variable "target_group_arn" {
  description = "ARN of the ALB target group."
  type        = string
}

variable "db_url_ssm_arn" {
  description = "SSM Parameter Store ARN containing the database connection URL."
  type        = string
}

variable "cpu" {
  description = "Fargate CPU units (256 = 0.25 vCPU)."
  type        = number
  default     = 256
}

variable "memory" {
  description = "Fargate Memory in MB (512 = 0.5 GB RAM)."
  type        = number
  default     = 512
}

variable "desired_count" {
  description = "Desired number of running ECS backend task instances."
  type        = number
  default     = 1
}
