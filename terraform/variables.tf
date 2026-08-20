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

variable "instance_type" {
  description = "EC2 ARM instance type (t4g.micro = ~$4.20/mo, t4g.small = ~$8.40/mo)."
  type        = string
  default     = "t4g.micro"
}

variable "allowed_ssh_cidr" {
  description = "CIDR block permitted for SSH access (default: 0.0.0.0/0, recommend locking to your IP)."
  type        = string
  default     = "0.0.0.0/0"
}

variable "ssh_key_name" {
  description = "Optional AWS EC2 KeyPair name for SSH access."
  type        = string
  default     = ""
}

variable "domain_name" {
  description = "Custom apex domain name (e.g. weseeyou.org)."
  type        = string
  default     = ""
}
