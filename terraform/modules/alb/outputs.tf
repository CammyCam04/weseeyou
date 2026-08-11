output "alb_arn" {
  description = "The ARN of the Application Load Balancer."
  value       = aws_lb.main.arn
}

output "alb_dns_name" {
  description = "The public DNS name of the Application Load Balancer."
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "The canonical hosted zone ID of the ALB (for Route 53 aliases)."
  value       = aws_lb.main.zone_id
}

output "alb_arn_suffix" {
  description = "The ARN suffix of the Application Load Balancer for CloudWatch metrics."
  value       = aws_lb.main.arn_suffix
}

output "target_group_arn" {
  description = "The ARN of the ECS backend target group."
  value       = aws_lb_target_group.backend.arn
}

output "target_group_arn_suffix" {
  description = "The ARN suffix of the target group for CloudWatch metrics."
  value       = aws_lb_target_group.backend.arn_suffix
}
