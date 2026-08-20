output "zone_id" {
  description = "The ID of the Route 53 hosted zone."
  value       = try(aws_route53_zone.main[0].zone_id, "")
}

output "name_servers" {
  description = "Authoritative Name Servers for the domain to configure in registrar (Porkbun)."
  value       = try(aws_route53_zone.main[0].name_servers, [])
}

output "acm_certificate_arn" {
  description = "ARN of the validated ACM SSL Certificate."
  value       = try(aws_acm_certificate_validation.cert[0].certificate_arn, "")
}
