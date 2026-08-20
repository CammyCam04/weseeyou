output "instance_id" {
  description = "The EC2 Instance ID."
  value       = aws_instance.app_server.id
}

output "public_ip" {
  description = "Static Public IPv4 address of the server (Elastic IP)."
  value       = aws_eip.app_eip.public_ip
}

output "ssh_command" {
  description = "SSH connection string."
  value       = "ssh ubuntu@${aws_eip.app_eip.public_ip}"
}

output "security_group_id" {
  description = "ID of the web server security group."
  value       = aws_security_group.web_sg.id
}

output "estimated_monthly_cost" {
  description = "Estimated base monthly AWS spending for this architecture."
  value       = "~$9.40 / month ($4.20 t4g.micro + $3.60 EIP + $1.60 20GB EBS GP3)"
}
