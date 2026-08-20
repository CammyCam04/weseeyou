# -----------------------------------------------------------------------------
# Package Lambda Function Source Code
# -----------------------------------------------------------------------------
data "archive_file" "lambda_zip" {
  type        = "zip"
  source_dir  = "${path.module}/src"
  output_path = "${path.module}/lambda_function_payload.zip"
}

# -----------------------------------------------------------------------------
# CloudWatch Log Group for Lambda
# -----------------------------------------------------------------------------
resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/${var.project_name}-${var.environment}-etl-worker"
  retention_in_days = 7

  tags = {
    Name        = "${var.project_name}-${var.environment}-lambda-logs"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# -----------------------------------------------------------------------------
# IAM Role for Lambda (VPC Access & Secrets Read)
# -----------------------------------------------------------------------------
data "aws_iam_policy_document" "lambda_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "lambda" {
  name               = "${var.project_name}-${var.environment}-lambda-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json

  tags = {
    Name        = "${var.project_name}-${var.environment}-lambda-role"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# Standard VPC Execution Role (allows Lambda to attach ENI in private subnets)
resource "aws_iam_role_policy_attachment" "lambda_vpc" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

# SSM Parameter Read Policy
resource "aws_iam_policy" "lambda_ssm" {
  name        = "${var.project_name}-${var.environment}-lambda-ssm"
  description = "Allows Lambda to read DB connection URL from SSM"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["ssm:GetParameter", "ssm:GetParameters"]
        Resource = [var.db_url_ssm_arn]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_ssm" {
  role       = aws_iam_role.lambda.name
  policy_arn = aws_iam_policy.lambda_ssm.arn
}

# -----------------------------------------------------------------------------
# AWS Lambda Function (ETL Worker)
# -----------------------------------------------------------------------------
resource "aws_lambda_function" "etl_worker" {
  function_name    = "${var.project_name}-${var.environment}-etl-worker"
  filename         = data.archive_file.lambda_zip.output_path
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  role             = aws_iam_role.lambda.arn
  handler          = "lambda_handler.lambda_handler"
  runtime          = "python3.12"
  timeout          = 300 # 5 minutes
  memory_size      = 512

  vpc_config {
    subnet_ids         = var.private_app_subnet_ids
    security_group_ids = [var.lambda_security_group_id]
  }

  environment {
    variables = {
      ENVIRONMENT = var.environment
    }
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-etl-worker"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }

  depends_on = [aws_cloudwatch_log_group.lambda]
}

# -----------------------------------------------------------------------------
# EventBridge Cron Schedule (Weekly Sync Trigger)
# -----------------------------------------------------------------------------
resource "aws_cloudwatch_event_rule" "weekly_sync" {
  name                = "${var.project_name}-${var.environment}-weekly-sync"
  description         = "Triggers Lambda ETL ingestion on a scheduled cron cadence"
  schedule_expression = var.cron_schedule

  tags = {
    Name        = "${var.project_name}-${var.environment}-weekly-sync-rule"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

resource "aws_cloudwatch_event_target" "lambda_target" {
  rule      = aws_cloudwatch_event_rule.weekly_sync.name
  target_id = "TriggerLambdaETL"
  arn       = aws_lambda_function.etl_worker.arn
}

resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.etl_worker.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.weekly_sync.arn
}
