variable "project_name" {
  description = "Project name prefix."
  type        = string
}

variable "environment" {
  description = "Deployment environment name."
  type        = string
}

variable "db_name" {
  description = "Database name."
  type        = string
  default     = "weseeyou"
}

variable "db_username" {
  description = "Master username for PostgreSQL."
  type        = string
  default     = "wsy_admin"
}

variable "db_instance_class" {
  description = "Instance type for PostgreSQL (db.t4g.micro is Free Tier eligible)."
  type        = string
  default     = "db.t4g.micro"
}

variable "db_allocated_storage" {
  description = "Allocated storage in GB."
  type        = number
  default     = 20
}

variable "multi_az" {
  description = "Enable Multi-AZ failover for production high availability."
  type        = bool
  default     = false
}

variable "db_subnet_group_name" {
  description = "Subnet group name where RDS instance will be provisioned."
  type        = string
}

variable "rds_security_group_id" {
  description = "Security group ID for RDS instance."
  type        = string
}

variable "backup_retention_period" {
  description = "Days of automated backups to retain (AWS Free Tier limit is 1 day)."
  type        = number
  default     = 1
}
