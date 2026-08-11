# -----------------------------------------------------------------------------
# Generate Secure Random Master Password
# -----------------------------------------------------------------------------
resource "random_password" "db_password" {
  length           = 24
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

# -----------------------------------------------------------------------------
# Store Credentials in AWS Systems Manager (SSM) Parameter Store
# -----------------------------------------------------------------------------
resource "aws_ssm_parameter" "db_password" {
  name        = "/${var.project_name}/${var.environment}/database/password"
  description = "Master database password for ${var.project_name} PostgreSQL RDS"
  type        = "SecureString"
  value       = random_password.db_password.result

  tags = {
    Name        = "${var.project_name}-${var.environment}-db-password"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# -----------------------------------------------------------------------------
# Custom Parameter Group for PostgreSQL 16
# -----------------------------------------------------------------------------
resource "aws_db_parameter_group" "postgres" {
  name        = "${var.project_name}-${var.environment}-pg16-params"
  family      = "postgres16"
  description = "Custom parameter group for ${var.project_name} PostgreSQL 16"

  parameter {
    name  = "client_encoding"
    value = "UTF8"
  }

  parameter {
    name  = "rds.force_ssl"
    value = "1"
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-pg16-params"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# -----------------------------------------------------------------------------
# Amazon RDS PostgreSQL Instance
# -----------------------------------------------------------------------------
resource "aws_db_instance" "postgres" {
  identifier            = "${var.project_name}-${var.environment}-postgres"
  engine                = "postgres"
  engine_version        = "16.3"
  instance_class        = var.db_instance_class
  allocated_storage     = var.db_allocated_storage
  max_allocated_storage = 100
  storage_type          = "gp3"
  storage_encrypted     = true

  db_name  = var.db_name
  username = var.db_username
  password = random_password.db_password.result
  port     = 5432

  db_subnet_group_name   = var.db_subnet_group_name
  vpc_security_group_ids = [var.rds_security_group_id]
  parameter_group_name   = aws_db_parameter_group.postgres.name

  multi_az                    = var.multi_az
  publicly_accessible         = false
  auto_minor_version_upgrade  = true
  allow_major_version_upgrade = false
  apply_immediately           = true

  backup_retention_period   = var.backup_retention_period
  backup_window             = "03:00-04:00"
  maintenance_window        = "Mon:04:00-Mon:05:00"
  copy_tags_to_snapshot     = true
  skip_final_snapshot       = var.environment != "prod"
  final_snapshot_identifier = "${var.project_name}-${var.environment}-postgres-final-snapshot"
  deletion_protection       = var.environment == "prod"

  tags = {
    Name        = "${var.project_name}-${var.environment}-postgres"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# Store Async Database Connection URL in SSM for FastAPI Backend
resource "aws_ssm_parameter" "db_url" {
  name        = "/${var.project_name}/${var.environment}/database/url"
  description = "AsyncPG SQLAlchemy connection URL for ${var.project_name}"
  type        = "SecureString"
  value       = "postgresql+asyncpg://${var.db_username}:${random_password.db_password.result}@${aws_db_instance.postgres.endpoint}/${var.db_name}"

  tags = {
    Name        = "${var.project_name}-${var.environment}-db-url"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}
