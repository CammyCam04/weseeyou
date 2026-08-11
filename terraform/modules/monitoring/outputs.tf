output "dashboard_name" {
  description = "Name of the operational CloudWatch dashboard."
  value       = aws_cloudwatch_dashboard.main.dashboard_name
}

output "ecs_cpu_alarm_arn" {
  description = "ARN of the ECS CPU high utilization alarm."
  value       = aws_cloudwatch_metric_alarm.ecs_cpu_high.arn
}

output "alb_5xx_alarm_arn" {
  description = "ARN of the ALB 5XX error spike alarm."
  value       = aws_cloudwatch_metric_alarm.alb_5xx_errors.arn
}
