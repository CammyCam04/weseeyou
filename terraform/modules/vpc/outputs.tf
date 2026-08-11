output "vpc_id" {
  description = "The ID of the provisioned VPC."
  value       = aws_vpc.main.id
}

output "vpc_cidr_block" {
  description = "The primary CIDR block of the VPC."
  value       = aws_vpc.main.cidr_block
}

output "public_subnet_ids" {
  description = "List of public subnet IDs for the ALB."
  value       = aws_subnet.public[*].id
}

output "private_app_subnet_ids" {
  description = "List of private application subnet IDs for ECS Fargate."
  value       = aws_subnet.private_app[*].id
}

output "private_db_subnet_ids" {
  description = "List of isolated private database subnet IDs for RDS."
  value       = aws_subnet.private_db[*].id
}

output "db_subnet_group_name" {
  description = "The name of the RDS DB Subnet Group."
  value       = aws_db_subnet_group.main.name
}
