output "db_instance_id" {
  description = "The RDS PostgreSQL instance identifier."
  value       = aws_db_instance.postgres.id
}

output "db_endpoint" {
  description = "The connection endpoint for the RDS PostgreSQL instance."
  value       = aws_db_instance.postgres.endpoint
}

output "db_address" {
  description = "The hostname address of the RDS PostgreSQL database."
  value       = aws_db_instance.postgres.address
}

output "db_port" {
  description = "The database connection port."
  value       = aws_db_instance.postgres.port
}

output "db_name" {
  description = "The database name."
  value       = aws_db_instance.postgres.db_name
}

output "db_username" {
  description = "The master username for the database."
  value       = aws_db_instance.postgres.username
}

output "db_password_ssm_name" {
  description = "SSM Parameter Store name containing the master DB password."
  value       = aws_ssm_parameter.db_password.name
}

output "db_password_ssm_arn" {
  description = "SSM Parameter Store ARN containing the master DB password."
  value       = aws_ssm_parameter.db_password.arn
}

output "db_url_ssm_name" {
  description = "SSM Parameter Store name containing the async SQLAlchemy DB connection URL."
  value       = aws_ssm_parameter.db_url.name
}

output "db_url_ssm_arn" {
  description = "SSM Parameter Store ARN containing the async SQLAlchemy DB connection URL."
  value       = aws_ssm_parameter.db_url.arn
}
