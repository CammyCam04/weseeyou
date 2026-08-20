variable "aws_region" {
  description = "The AWS Region where resources will be provisioned."
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Deployment environment name (e.g. prod, staging, dev)."
  type        = string
  default     = "prod"
}

variable "project_name" {
  description = "Name prefix for all project infrastructure resources."
  type        = string
  default     = "weseeyou"
}

variable "vpc_cidr" {
  description = "CIDR block for the multi-AZ Virtual Private Cloud."
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of AWS Availability Zones for multi-AZ high availability."
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]
}

variable "db_name" {
  description = "Name of the initial PostgreSQL database."
  type        = string
  default     = "weseeyou"
}

variable "db_username" {
  description = "Master username for the RDS PostgreSQL instance."
  type        = string
  default     = "wsy_admin"
}

variable "db_instance_class" {
  description = "RDS PostgreSQL compute instance type (db.t4g.micro is AWS Free Tier eligible)."
  type        = string
  default     = "db.t4g.micro"
}

variable "db_allocated_storage" {
  description = "Allocated storage size in gigabytes for RDS PostgreSQL."
  type        = number
  default     = 20
}

variable "multi_az" {
  description = "Enable Multi-AZ failover for high availability in production."
  type        = bool
  default     = false
}

variable "backup_retention_period" {
  description = "Days of automated backups to retain (AWS Free Tier limit is 1 day)."
  type        = number
  default     = 1
}

variable "domain_name" {
  description = "Custom apex domain name (e.g. weseeyou.org) for Route 53 and CloudFront SSL."
  type        = string
  default     = ""
}
