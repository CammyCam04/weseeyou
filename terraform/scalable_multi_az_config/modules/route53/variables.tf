variable "project_name" {
  description = "Project name prefix."
  type        = string
}

variable "environment" {
  description = "Deployment environment name (prod, dev)."
  type        = string
}

variable "domain_name" {
  description = "Apex domain name (e.g. weseeyou.app)."
  type        = string
  default     = ""
}

variable "cloudfront_domain_name" {
  description = "Domain name of the CloudFront distribution."
  type        = string
  default     = ""
}

variable "cloudfront_hosted_zone_id" {
  description = "Route 53 hosted zone ID for CloudFront (Z2FDTNDATAQYW2)."
  type        = string
  default     = "Z2FDTNDATAQYW2"
}
