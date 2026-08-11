output "lambda_function_name" {
  description = "The name of the Lambda ETL function."
  value       = aws_lambda_function.etl_worker.function_name
}

output "lambda_function_arn" {
  description = "The ARN of the Lambda ETL function."
  value       = aws_lambda_function.etl_worker.arn
}

output "eventbridge_rule_arn" {
  description = "The ARN of the EventBridge cron schedule rule."
  value       = aws_cloudwatch_event_rule.weekly_sync.arn
}
