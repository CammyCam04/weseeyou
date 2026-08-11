# -----------------------------------------------------------------------------
# CloudWatch Metric Alarms (Proactive Health & SRE Alerts)
# -----------------------------------------------------------------------------

# 1. ECS CPU High Utilization Alarm (> 80%)
resource "aws_cloudwatch_metric_alarm" "ecs_cpu_high" {
  alarm_name          = "${var.project_name}-${var.environment}-ecs-cpu-high"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "Triggered when ECS backend CPU utilization exceeds 80% for 10 minutes"

  dimensions = {
    ClusterName = var.ecs_cluster_name
    ServiceName = var.ecs_service_name
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-ecs-cpu-alarm"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# 2. ALB HTTP 5XX Spikes Alarm
resource "aws_cloudwatch_metric_alarm" "alb_5xx_errors" {
  alarm_name          = "${var.project_name}-${var.environment}-alb-5xx-spikes"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "Triggered when ALB backend targets produce > 10 5XX errors in 1 minute"

  dimensions = {
    LoadBalancer = var.alb_arn_suffix
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-alb-5xx-alarm"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# 3. RDS Low Free Storage Alarm (< 3 GB remaining)
resource "aws_cloudwatch_metric_alarm" "rds_low_storage" {
  alarm_name          = "${var.project_name}-${var.environment}-rds-low-storage"
  comparison_operator = "LessThanOrEqualToThreshold"
  evaluation_periods  = 1
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 3000000000 # 3 GB in bytes
  alarm_description   = "Triggered when RDS PostgreSQL free storage space drops below 3 GB"

  dimensions = {
    DBInstanceIdentifier = var.db_instance_id
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-rds-storage-alarm"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# -----------------------------------------------------------------------------
# CloudWatch Consolidated Operational Dashboard
# -----------------------------------------------------------------------------
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.project_name}-${var.environment}-operations"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/ApplicationELB", "RequestCount", "LoadBalancer", var.alb_arn_suffix, { "stat" : "Sum", "label" : "Total Requests" }],
            [".", "HTTPCode_Target_2XX_Count", ".", ".", { "stat" : "Sum", "label" : "2XX Success" }],
            [".", "HTTPCode_Target_5XX_Count", ".", ".", { "stat" : "Sum", "label" : "5XX Errors" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = "us-east-1"
          title   = "ALB Request Volume & HTTP Status"
          period  = 300
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/ApplicationELB", "TargetResponseTime", "LoadBalancer", var.alb_arn_suffix, { "stat" : "p95", "label" : "P95 Latency (s)" }],
            [".", "TargetResponseTime", ".", ".", { "stat" : "Average", "label" : "Avg Latency (s)" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = "us-east-1"
          title   = "API Response Latency"
          period  = 300
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/ECS", "CPUUtilization", "ClusterName", var.ecs_cluster_name, "ServiceName", var.ecs_service_name, { "stat" : "Average", "label" : "CPU %" }],
            [".", "MemoryUtilization", ".", ".", ".", ".", { "stat" : "Average", "label" : "Memory %" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = "us-east-1"
          title   = "ECS Fargate Resource Utilization"
          period  = 300
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 6
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/RDS", "CPUUtilization", "DBInstanceIdentifier", var.db_instance_id, { "stat" : "Average", "label" : "DB CPU %" }],
            [".", "DatabaseConnections", ".", ".", { "stat" : "Average", "label" : "Active Connections" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = "us-east-1"
          title   = "RDS PostgreSQL Utilization"
          period  = 300
        }
      }
    ]
  })
}
