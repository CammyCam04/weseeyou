output "ecr_repository_url" {
  description = "The URL of the Amazon ECR repository for backend Docker images."
  value       = aws_ecr_repository.backend.repository_url
}

output "ecs_cluster_name" {
  description = "The name of the ECS cluster."
  value       = aws_ecs_cluster.main.name
}

output "ecs_cluster_arn" {
  description = "The ARN of the ECS cluster."
  value       = aws_ecs_cluster.main.arn
}

output "ecs_service_name" {
  description = "The name of the ECS Fargate service."
  value       = aws_ecs_service.backend.name
}

output "ecs_task_execution_role_arn" {
  description = "The ARN of the ECS task execution role."
  value       = aws_iam_role.ecs_execution_role.arn
}
