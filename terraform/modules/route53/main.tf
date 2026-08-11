# -----------------------------------------------------------------------------
# 1. Route 53 Public Hosted Zone
# -----------------------------------------------------------------------------
resource "aws_route53_zone" "main" {
  count   = var.domain_name != "" ? 1 : 0
  name    = var.domain_name
  comment = "Public hosted zone for ${var.project_name} (${var.environment})"

  tags = {
    Name        = "${var.project_name}-${var.environment}-r53-zone"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# -----------------------------------------------------------------------------
# 2. ACM SSL Certificate (CloudFront requires us-east-1)
# -----------------------------------------------------------------------------
resource "aws_acm_certificate" "cert" {
  count             = var.domain_name != "" ? 1 : 0
  domain_name       = var.domain_name
  validation_method = "DNS"

  subject_alternative_names = [
    "*.${var.domain_name}"
  ]

  tags = {
    Name        = "${var.project_name}-${var.environment}-acm-cert"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# -----------------------------------------------------------------------------
# 3. DNS Validation Record in Route 53
# -----------------------------------------------------------------------------
resource "aws_route53_record" "cert_validation" {
  for_each = var.domain_name != "" ? {
    for dvo in aws_acm_certificate.cert[0].domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  } : {}

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = aws_route53_zone.main[0].zone_id
}

# -----------------------------------------------------------------------------
# 4. ACM Certificate Validation Waiter
# -----------------------------------------------------------------------------
resource "aws_acm_certificate_validation" "cert" {
  count                   = var.domain_name != "" ? 1 : 0
  certificate_arn         = aws_acm_certificate.cert[0].arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]
}
