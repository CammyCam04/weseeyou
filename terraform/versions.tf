terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Enterprise S3 Remote State Backend (Syncs state across GitHub Actions & local CLI)
  backend "s3" {
    bucket  = "weseeyou-tf-state-896725785929"
    key     = "production/terraform.tfstate"
    region  = "us-east-1"
    encrypt = true
  }
}
