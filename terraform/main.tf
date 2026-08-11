# =============================================================================
# We See You (WSY) - Production Infrastructure Deployment
# =============================================================================

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# -----------------------------------------------------------------------------
# 1. Multi-AZ Virtual Private Cloud (VPC) Module
# -----------------------------------------------------------------------------
module "vpc" {
  source = "./modules/vpc"

  project_name       = var.project_name
  environment        = var.environment
  vpc_cidr           = var.vpc_cidr
  availability_zones = var.availability_zones
}

# -----------------------------------------------------------------------------
# 2. Security Groups Module (Least-Privilege Isolation)
# -----------------------------------------------------------------------------
module "security" {
  source = "./modules/security"

  project_name = var.project_name
  environment  = var.environment
  vpc_id       = module.vpc.vpc_id
}

# -----------------------------------------------------------------------------
# 3. Amazon RDS PostgreSQL Database Module
# -----------------------------------------------------------------------------
module "rds" {
  source = "./modules/rds"

  project_name            = var.project_name
  environment             = var.environment
  db_name                 = var.db_name
  db_username             = var.db_username
  db_instance_class       = var.db_instance_class
  db_allocated_storage    = var.db_allocated_storage
  multi_az                = var.multi_az
  backup_retention_period = var.backup_retention_period
  db_subnet_group_name    = module.vpc.db_subnet_group_name
  rds_security_group_id   = module.security.rds_security_group_id
}

# -----------------------------------------------------------------------------
# 4. Application Load Balancer Module (Public Ingress & Health Checks)
# -----------------------------------------------------------------------------
module "alb" {
  source = "./modules/alb"

  project_name          = var.project_name
  environment           = var.environment
  vpc_id                = module.vpc.vpc_id
  public_subnet_ids     = module.vpc.public_subnet_ids
  alb_security_group_id = module.security.alb_security_group_id
}

# -----------------------------------------------------------------------------
# 5. Amazon ECS Fargate Module (Containerized FastAPI Backend)
# -----------------------------------------------------------------------------
module "ecs" {
  source = "./modules/ecs"

  project_name           = var.project_name
  environment            = var.environment
  private_app_subnet_ids = module.vpc.private_app_subnet_ids
  ecs_security_group_id  = module.security.ecs_security_group_id
  target_group_arn       = module.alb.target_group_arn
  db_url_ssm_arn         = module.rds.db_url_ssm_arn
  desired_count          = 1
}

# -----------------------------------------------------------------------------
# 6. S3 Static Frontend Hosting Module
# -----------------------------------------------------------------------------
module "frontend" {
  source = "./modules/frontend"

  project_name = var.project_name
  environment  = var.environment
}

# -----------------------------------------------------------------------------
# 7. Route 53 DNS Zone & ACM SSL Certificate Module
# -----------------------------------------------------------------------------
module "route53" {
  source = "./modules/route53"

  project_name = var.project_name
  environment  = var.environment
  domain_name  = var.domain_name
}

# -----------------------------------------------------------------------------
# 8. CloudFront Global CDN Module (S3 OAC + ALB Backend Routing)
# -----------------------------------------------------------------------------
module "cloudfront" {
  source = "./modules/cloudfront"

  project_name                   = var.project_name
  environment                    = var.environment
  s3_bucket_id                   = module.frontend.bucket_id
  s3_bucket_arn                  = module.frontend.bucket_arn
  s3_bucket_regional_domain_name = module.frontend.bucket_regional_domain_name
  alb_dns_name                   = module.alb.alb_dns_name
  domain_name                    = var.domain_name
  acm_certificate_arn            = module.route53.acm_certificate_arn
}

# -----------------------------------------------------------------------------
# 9. Route 53 CloudFront Apex & Subdomain Alias Records
# -----------------------------------------------------------------------------
resource "aws_route53_record" "apex_ipv4" {
  count   = var.domain_name != "" ? 1 : 0
  zone_id = module.route53.zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = module.cloudfront.distribution_domain_name
    zone_id                = module.cloudfront.distribution_hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "apex_ipv6" {
  count   = var.domain_name != "" ? 1 : 0
  zone_id = module.route53.zone_id
  name    = var.domain_name
  type    = "AAAA"

  alias {
    name                   = module.cloudfront.distribution_domain_name
    zone_id                = module.cloudfront.distribution_hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "www_ipv4" {
  count   = var.domain_name != "" ? 1 : 0
  zone_id = module.route53.zone_id
  name    = "www.${var.domain_name}"
  type    = "A"

  alias {
    name                   = module.cloudfront.distribution_domain_name
    zone_id                = module.cloudfront.distribution_hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "www_ipv6" {
  count   = var.domain_name != "" ? 1 : 0
  zone_id = module.route53.zone_id
  name    = "www.${var.domain_name}"
  type    = "AAAA"

  alias {
    name                   = module.cloudfront.distribution_domain_name
    zone_id                = module.cloudfront.distribution_hosted_zone_id
    evaluate_target_health = false
  }
}

# -----------------------------------------------------------------------------
# 8. AWS Lambda ETL Ingestion Worker Module (Scheduled Weekly Sync)
# -----------------------------------------------------------------------------
module "lambda_etl" {
  source = "./modules/lambda_etl"

  project_name             = var.project_name
  environment              = var.environment
  private_app_subnet_ids   = module.vpc.private_app_subnet_ids
  lambda_security_group_id = module.security.lambda_security_group_id
  db_url_ssm_arn           = module.rds.db_url_ssm_arn
}

# -----------------------------------------------------------------------------
# 9. CloudWatch Monitoring & Operational Dashboard Module
# -----------------------------------------------------------------------------
module "monitoring" {
  source = "./modules/monitoring"

  project_name            = var.project_name
  environment             = var.environment
  ecs_cluster_name        = module.ecs.ecs_cluster_name
  ecs_service_name        = module.ecs.ecs_service_name
  alb_arn_suffix          = module.alb.alb_arn_suffix
  target_group_arn_suffix = module.alb.target_group_arn_suffix
  db_instance_id          = module.rds.db_instance_id
}
