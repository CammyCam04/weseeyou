output "alb_security_group_id" {
  description = "Security group ID for the Application Load Balancer."
  value       = aws_security_group.alb.id
}

output "ecs_security_group_id" {
  description = "Security group ID for the ECS Fargate tasks."
  value       = aws_security_group.ecs.id
}

output "lambda_security_group_id" {
  description = "Security group ID for the Lambda ETL workers."
  value       = aws_security_group.lambda.id
}

output "rds_security_group_id" {
  description = "Security group ID for the RDS PostgreSQL instance."
  value       = aws_security_group.rds.id
}
