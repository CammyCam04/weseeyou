# =============================================================================
# We See You (WSY) - Low-Cost Single EC2 Production Infrastructure 
# =============================================================================


provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# -----------------------------------------------------------------------------
# 1. Ubuntu 24.04 LTS ARM64 AMI (AWS Graviton Optimized)
# -----------------------------------------------------------------------------
data "aws_ami" "ubuntu_arm64" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-arm64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# -----------------------------------------------------------------------------
# 2. Production Security Group (Least Privilege & Hardened Ingress)
# -----------------------------------------------------------------------------
resource "aws_security_group" "web_sg" {
  name_prefix = "${var.project_name}-${var.environment}-sg-"
  description = "Security group for low-cost single-instance web host"

  lifecycle {
    create_before_destroy = true
  }

  ingress {
    description = "HTTP Traffic (Redirects to HTTPS)"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS Secured Web Traffic"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Restricted SSH Access"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.allowed_ssh_cidr]
  }

  egress {
    description = "Allow All Outbound Traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# -----------------------------------------------------------------------------
# 3. AWS Graviton ARM Compute Instance (t4g.micro / t4g.small)
# -----------------------------------------------------------------------------
resource "aws_instance" "app_server" {
  ami                    = data.aws_ami.ubuntu_arm64.id
  instance_type          = var.instance_type
  key_name               = var.ssh_key_name != "" ? var.ssh_key_name : null
  vpc_security_group_ids = [aws_security_group.web_sg.id]

  # Hardware Security: Enforce IMDSv2
  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
  }

  # Storage: Encrypted 20 GB GP3 EBS SSD Volume (~$1.60/month)
  root_block_device {
    volume_size           = 20
    volume_type           = "gp3"
    encrypted             = true
    delete_on_termination = true
  }

  # Automated User Data Bootstrapping Script
  user_data = <<-EOF
              #!/bin/bash
              set -e
              apt-get update -y
              apt-get install -y docker.io docker-compose-v2 git curl
              systemctl enable --now docker
              EOF

  tags = {
    Name = "${var.project_name}-${var.environment}-server"
  }
}

# -----------------------------------------------------------------------------
# 4. Elastic IP (Static IPv4 Address for Persistent Domain DNS)
# -----------------------------------------------------------------------------
resource "aws_eip" "app_eip" {
  instance = aws_instance.app_server.id
  domain   = "vpc"

  tags = {
    Name = "${var.project_name}-${var.environment}-eip"
  }
}
