# Production Enterprise Multi-AZ Architecture (AWS)

> **Purpose**: This directory contains the complete, enterprise-grade, multi-AZ cloud infrastructure for **We See You (WSY)**. It showcases high availability, automated microservice deployment, serverless ETL pipelines, CDN edge routing, and monitoring.

---

## 🏗 Architecture Overview

```mermaid
flowchart TD
    USERS["Client Applications / End Users"] --> R53["Amazon Route 53 (Global DNS)"]
    R53 --> CF["CloudFront CDN (Global Edge Caching & SSL)"]
    
    subgraph Multi-AZ Virtual Private Cloud (VPC)
        subgraph Public Subnets (AZ-a & AZ-b)
            ALB["Application Load Balancer (Public Ingress)"]
        end
        
        subgraph Private Application Subnets (AZ-a & AZ-b)
            ECS["AWS ECS Fargate Cluster (FastAPI Backend Tasks)"]
            LAMBDA["AWS Lambda ETL Worker (Weekly Data Ingestion)"]
        end
        
        subgraph Private Database Subnets (Multi-AZ Failover)
            RDS[("Amazon RDS PostgreSQL (db.t4g.micro)")]
        end
    end

    CF -->|Static Assets| S3["Amazon S3 Bucket (Next.js Build)"]
    CF -->|API Traffic| ALB
    ALB --> ECS
    ECS --> RDS
    LAMBDA --> RDS
    
    subgraph Operations & Monitoring
        CW["CloudWatch Operational Dashboard & Alarms"]
    end
```

---

## 🛠 Included Terraform Modules (`modules/`)

1. **`vpc/`**: Multi-AZ VPC across 2 Availability Zones with Public, Private App, and Private DB subnets.
2. **`security/`**: Isolated Security Groups for ALB ingress, ECS task least-privilege egress, and RDS DB access.
3. **`rds/`**: Amazon RDS PostgreSQL instance with automated backups and encrypted storage.
4. **`alb/`**: Application Load Balancer with HTTP/HTTPS listeners, target groups, and health checks.
5. **`ecs/`**: ECS Fargate cluster and task definitions for running containerized microservices.
6. **`frontend/`**: Amazon S3 static website hosting bucket configured with Origin Access Control (OAC).
7. **`route53/`**: DNS hosted zone management and AWS Certificate Manager (ACM) SSL certificates.
8. **`cloudfront/`**: Global CDN distribution routing frontend requests to S3 and backend API calls to ALB.
9. **`lambda_etl/`**: Scheduled Lambda ingestion worker running weekly data synchronization jobs.
10. **`monitoring/`**: Centralized CloudWatch dashboards, metric alarms, and performance telemetry.

---

## 💰 Cost Optimization Note

* **Enterprise Stack Projected Cost**: ~$50 – $60 / month (due to NAT Gateways, ALB baseline fees, and multi-AZ RDS).
* **Current Active Stack**: To maximize runway under AWS Free Credit programs ($200 credit), the project actively deploys via the root `terraform/` directory using an optimized single-instance setup (< $10/month).
* **Migration Plan**: This configuration remains 100% intact and ready to deploy with `terraform apply` when traffic scales up.
