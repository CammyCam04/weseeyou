variable "project_name" {
  description = "Project name prefix."
  type        = string
}

variable "environment" {
  description = "Deployment environment name."
  type        = string
}

variable "ecs_cluster_name" {
  description = "Name of the ECS Cluster."
  type        = string
}

variable "ecs_service_name" {
  description = "Name of the ECS Service."
  type        = string
}

variable "alb_arn_suffix" {
  description = "ARN suffix of the ALB for CloudWatch metrics."
  type        = string
}

variable "target_group_arn_suffix" {
  description = "ARN suffix of the Target Group for CloudWatch metrics."
  type        = string
}

variable "db_instance_id" {
  description = "RDS DB instance identifier."
  type        = string
}
