variable "project_name" {
  description = "Project name prefix for tags and resource naming."
  type        = string
}

variable "environment" {
  description = "Deployment environment name (prod, dev, staging)."
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC."
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "Availability Zones to distribute subnets across."
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]
}
