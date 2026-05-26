<div align="center">

# 📖 Production Deployment Guide
**PitMind Documentation**

[![PitMind Platform](https://img.shields.io/badge/PitMind-Platform-e10600.svg?style=for-the-badge)](#)
[![Return to Home](https://img.shields.io/badge/Return_to_Home-15151e.svg?style=for-the-badge)](../README.md)

</div>

<br/>

> **Overview:** This document outlines the core concepts, configurations, and technical specifications for the **Production Deployment Guide** module within the PitMind AI ecosystem.

---

Complete guide for deploying pitMind to production environments.



<details>
<summary><b>Table of Contents</b></summary>
<br/>

- [Overview](#overview)
- [Infrastructure Requirements](#infrastructure-requirements)
- [Pre-Deployment Checklist](#pre-deployment-checklist)
- [Deployment Methods](#deployment-methods)
- [Environment Configuration](#environment-configuration)
- [Database Setup](#database-setup)
- [Monitoring and Alerting](#monitoring-and-alerting)
- [Backup and Disaster Recovery](#backup-and-disaster-recovery)
- [Scaling Strategies](#scaling-strategies)
- [Security Hardening](#security-hardening)
- [Post-Deployment Verification](#post-deployment-verification)

</details>



<details>
<summary><b>Overview</b></summary>
<br/>

This guide covers production deployment of pitMind with high availability, security, and performance considerations.

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Load Balancer (HTTPS)                    │
└─────────────────────┬───────────────────────────────────────┘
                      │
        ┌─────────────┴─────────────┐
        │                           │
┌───────▼────────┐         ┌────────▼───────┐
│  Nginx (SSL)   │         │  Nginx (SSL)   │
│   + Frontend   │         │   + Frontend   │
└───────┬────────┘         └────────┬───────┘
        │                           │
┌───────▼────────┐         ┌────────▼───────┐
│  Backend API   │         │  Backend API   │
│   (FastAPI)    │         │   (FastAPI)    │
└───────┬────────┘         └────────┬───────┘
        │                           │
        └─────────────┬─────────────┘
                      │
        ┌─────────────┴─────────────┐
        │                           │
┌───────▼────────┐         ┌────────▼───────┐
│   PostgreSQL   │         │     Redis      │
│   (Primary)    │         │    (Cache)     │
└────────────────┘         └────────────────┘
```

</details>



<details>
<summary><b>Infrastructure Requirements</b></summary>
<br/>

### Minimum Requirements

**Application Servers** (2+ instances for HA):
- CPU: 2 vCPUs
- RAM: 4 GB
- Storage: 20 GB SSD
- OS: Ubuntu 22.04 LTS or similar

**Database Server**:
- CPU: 2 vCPUs
- RAM: 8 GB
- Storage: 100 GB SSD (with IOPS provisioning)
- PostgreSQL 15+

**Cache Server**:
- CPU: 1 vCPU
- RAM: 2 GB
- Storage: 10 GB SSD
- Redis 7+

**Load Balancer**:
- Managed service (AWS ALB, GCP Load Balancer) or
- Nginx/HAProxy on dedicated instance

### Recommended Production Setup

**Application Servers** (3+ instances):
- CPU: 4 vCPUs
- RAM: 8 GB
- Storage: 50 GB SSD
- Auto-scaling enabled

**Database**:
- CPU: 4 vCPUs
- RAM: 16 GB
- Storage: 500 GB SSD with provisioned IOPS
- Read replicas for scaling
- Automated backups enabled

**Cache**:
- CPU: 2 vCPUs
- RAM: 4 GB
- Redis Cluster or managed service (AWS ElastiCache)

**CDN**: CloudFlare, AWS CloudFront, or similar

</details>



<details>
<summary><b>Pre-Deployment Checklist</b></summary>
<br/>

### Security

- [ ] SSL/TLS certificates obtained and configured
- [ ] Firewall rules configured (only necessary ports open)
- [ ] Secrets management configured (AWS Secrets Manager, HashiCorp Vault)
- [ ] Database credentials rotated and secured
- [ ] API keys for external services configured
- [ ] CORS origins properly configured
- [ ] Rate limiting enabled
- [ ] Security headers configured

### Infrastructure

- [ ] DNS records configured
- [ ] Load balancer configured
- [ ] Auto-scaling policies defined
- [ ] Backup strategy implemented
- [ ] Monitoring and alerting configured
- [ ] Log aggregation setup
- [ ] CDN configured for static assets

### Application

- [ ] Environment variables configured
- [ ] Database migrations tested
- [ ] Redis connection tested
- [ ] AI provider credentials configured
- [ ] Health check endpoints verified
- [ ] Performance testing completed
- [ ] Load testing completed

### Documentation

- [ ] Deployment runbook created
- [ ] Rollback procedure documented
- [ ] Incident response plan defined
- [ ] On-call rotation established

</details>



<details>
<summary><b>Deployment Methods</b></summary>
<br/>

### Method 1: Docker Compose (Small to Medium Scale)

#### 1. Prepare Environment

```bash
# Clone repository
git clone https://github.com/your-org/pitmind.git
cd pitmind

# Create production environment file
cp .env.example .env.prod
nano .env.prod  # Configure all variables
```

#### 2. Configure Production Environment

```bash
# .env.prod
NODE_ENV=production
ENVIRONMENT=production

# Database
DATABASE_URL=postgresql://user:password@postgres:5432/pitmind
POSTGRES_DB=pitmind
POSTGRES_USER=pitmind_user
POSTGRES_PASSWORD=<strong-password>

# Redis
REDIS_URL=redis://:password@redis:6379/0
REDIS_PASSWORD=<strong-password>

# Security
SECRET_KEY=<generate-strong-secret>
SECURE_COOKIES=true
CORS_ORIGINS=https://pitmind.example.com

# AI Providers
WATSONX_API_KEY=<your-key>
WATSONX_PROJECT_ID=<your-project>
HF_API_TOKEN=<your-token>

# Monitoring
SENTRY_DSN=<your-sentry-dsn>
```

#### 3. Deploy with Docker Compose

```bash
# Build images
docker-compose -f docker-compose.prod.yml build

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Run database migrations
docker-compose -f docker-compose.prod.yml exec backend alembic upgrade head

# Verify deployment
docker-compose -f docker-compose.prod.yml ps
curl https://pitmind.example.com/health
```

### Method 2: Kubernetes (Large Scale)

#### 1. Prepare Kubernetes Manifests

Create `k8s/` directory with manifests:

```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: pitmind-prod

---
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: pitmind-config
  namespace: pitmind-prod
data:
  ENVIRONMENT: "production"
  REDIS_URL: "redis://redis-service:6379/0"
  DATABASE_URL: "postgresql://postgres-service:5432/pitmind"

---
# k8s/secrets.yaml (use sealed-secrets or external secrets)
apiVersion: v1
kind: Secret
metadata:
  name: pitmind-secrets
  namespace: pitmind-prod
type: Opaque
stringData:
  POSTGRES_PASSWORD: "<base64-encoded>"
  REDIS_PASSWORD: "<base64-encoded>"
  SECRET_KEY: "<base64-encoded>"
  WATSONX_API_KEY: "<base64-encoded>"

---
# k8s/backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: pitmind-backend
  namespace: pitmind-prod
spec:
  replicas: 3
  selector:
    matchLabels:
      app: pitmind-backend
  template:
    metadata:
      labels:
        app: pitmind-backend
    spec:
      containers:
      - name: backend
        image: your-registry/pitmind-backend:latest
        ports:
        - containerPort: 8000
        envFrom:
        - configMapRef:
            name: pitmind-config
        - secretRef:
            name: pitmind-secrets
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "2000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 5
          periodSeconds: 5

---
# k8s/backend-service.yaml
apiVersion: v1
kind: Service
metadata:
  name: backend-service
  namespace: pitmind-prod
spec:
  selector:
    app: pitmind-backend
  ports:
  - protocol: TCP
    port: 8000
    targetPort: 8000
  type: ClusterIP

---
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: pitmind-ingress
  namespace: pitmind-prod
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - pitmind.example.com
    secretName: pitmind-tls
  rules:
  - host: pitmind.example.com
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: backend-service
            port:
              number: 8000
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend-service
            port:
              number: 80
```

#### 2. Deploy to Kubernetes

```bash
# Apply manifests
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/backend-service.yaml
kubectl apply -f k8s/ingress.yaml

# Verify deployment
kubectl get pods -n pitmind-prod
kubectl get services -n pitmind-prod
kubectl get ingress -n pitmind-prod

# Check logs
kubectl logs -f deployment/pitmind-backend -n pitmind-prod
```

### Method 3: Cloud Platform (AWS Example)

#### Using AWS Elastic Beanstalk

```bash
# Install EB CLI
pip install awsebcli

# Initialize EB application
eb init -p docker pitmind-prod --region us-east-1

# Create environment
eb create pitmind-prod-env \
  --instance-type t3.medium \
  --scale 2 \
  --envvars DATABASE_URL=<url>,REDIS_URL=<url>

# Deploy
eb deploy

# Check status
eb status
eb health
```

</details>



<details>
<summary><b>Environment Configuration</b></summary>
<br/>

### Production Environment Variables

```bash
# Application
NODE_ENV=production
ENVIRONMENT=production
LOG_LEVEL=info

# Server
HOST=0.0.0.0
PORT=8000
WORKERS=4

# Database
DATABASE_URL=postgresql://user:pass@host:5432/pitmind
DATABASE_POOL_SIZE=20
DATABASE_MAX_OVERFLOW=10
DATABASE_POOL_TIMEOUT=30

# Redis
REDIS_URL=redis://:pass@host:6379/0
REDIS_MAX_CONNECTIONS=50
REDIS_SOCKET_TIMEOUT=5

# Caching
CACHE_ENABLED=true
CACHE_TTL_STRATEGY=3600
CACHE_TTL_TELEMETRY=300
CACHE_TTL_SESSION=1800

# Security
SECRET_KEY=<64-char-random-string>
SECURE_COOKIES=true
CORS_ORIGINS=https://pitmind.example.com,https://www.pitmind.example.com
RATE_LIMIT_PER_MINUTE=60

# AI Providers
WATSONX_API_KEY=<key>
WATSONX_PROJECT_ID=<id>
WATSONX_URL=https://us-south.ml.cloud.ibm.com
HF_API_TOKEN=<token>
HF_MODEL_ID=ibm-granite/granite-3.0-8b-instruct

# Firebase
FIREBASE_PROJECT_ID=<project-id>
FIREBASE_CREDENTIALS_PATH=/app/firebase-credentials.json

# Monitoring
SENTRY_DSN=<sentry-dsn>
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1

# Logging
LOG_FORMAT=json
LOG_FILE=/var/log/pitmind/app.log
```

</details>



<details>
<summary><b>Database Setup</b></summary>
<br/>

### Initial Setup

```bash
# Connect to database
psql -h <host> -U <user> -d pitmind

# Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

# Run migrations
docker-compose exec backend alembic upgrade head

# Verify schema
docker-compose exec backend alembic current
```

### Database Optimization

```sql
-- Create indexes for performance
CREATE INDEX CONCURRENTLY idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX CONCURRENTLY idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX CONCURRENTLY idx_sessions_user_id ON sessions(user_id);
CREATE INDEX CONCURRENTLY idx_sessions_expires_at ON sessions(expires_at);

-- Configure connection pooling
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_buffers = '2GB';
ALTER SYSTEM SET effective_cache_size = '6GB';
ALTER SYSTEM SET maintenance_work_mem = '512MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;
ALTER SYSTEM SET random_page_cost = 1.1;
ALTER SYSTEM SET effective_io_concurrency = 200;

-- Reload configuration
SELECT pg_reload_conf();
```

</details>



<details>
<summary><b>Monitoring and Alerting</b></summary>
<br/>

### Health Check Endpoints

```bash
# Application health
curl https://pitmind.example.com/health

# Detailed metrics
curl https://pitmind.example.com/api/v1/metrics/health
```

### Prometheus Metrics

Add to `docker-compose.prod.yml`:

```yaml
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    ports:
      - "9090:9090"
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    volumes:
      - grafana-data:/var/lib/grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=<secure-password>
    restart: unless-stopped
```

### Alert Configuration

```yaml
# prometheus-alerts.yml
groups:
  - name: pitmind_alerts
    interval: 30s
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          
      - alert: DatabaseDown
        expr: up{job="postgres"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Database is down"
          
      - alert: HighMemoryUsage
        expr: (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes > 0.9
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage"
```

</details>



<details>
<summary><b>Backup and Disaster Recovery</b></summary>
<br/>

### Database Backups

```bash
# Automated backup script
#!/bin/bash
# /usr/local/bin/backup-pitmind-db.sh

BACKUP_DIR="/backups/pitmind"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/pitmind_$DATE.sql.gz"

# Create backup
pg_dump -h localhost -U pitmind_user pitmind | gzip > "$BACKUP_FILE"

# Upload to S3
aws s3 cp "$BACKUP_FILE" s3://pitmind-backups/database/

# Keep only last 30 days locally
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +30 -delete

# Verify backup
if [ -f "$BACKUP_FILE" ]; then
    echo "Backup successful: $BACKUP_FILE"
else
    echo "Backup failed!" >&2
    exit 1
fi
```

```bash
# Add to crontab
0 2 * * * /usr/local/bin/backup-pitmind-db.sh
```

### Disaster Recovery Plan

1. **Database Restore**:
```bash
# Download latest backup
aws s3 cp s3://pitmind-backups/database/latest.sql.gz /tmp/

# Restore database
gunzip < /tmp/latest.sql.gz | psql -h localhost -U pitmind_user pitmind
```

2. **Application Restore**:
```bash
# Pull latest stable image
docker pull your-registry/pitmind-backend:stable

# Restart services
docker-compose -f docker-compose.prod.yml up -d
```

3. **Verify Recovery**:
```bash
# Check health
curl https://pitmind.example.com/health

# Verify data integrity
docker-compose exec backend python -m scripts.verify_data
```

</details>



<details>
<summary><b>Scaling Strategies</b></summary>
<br/>

### Horizontal Scaling

```yaml
# docker-compose.scale.yml
services:
  backend:
    deploy:
      replicas: 5
      resources:
        limits:
          cpus: '2'
          memory: 4G
        reservations:
          cpus: '1'
          memory: 2G
```

```bash
# Scale services
docker-compose -f docker-compose.prod.yml up -d --scale backend=5
```

### Vertical Scaling

```bash
# Increase resources
docker-compose -f docker-compose.prod.yml up -d \
  --scale backend=3 \
  --memory=8g \
  --cpus=4
```

### Auto-Scaling (Kubernetes)

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: pitmind-backend-hpa
  namespace: pitmind-prod
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: pitmind-backend
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

</details>



<details>
<summary><b>Security Hardening</b></summary>
<br/>

### 1. Network Security

```bash
# Configure firewall (UFW example)
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### 2. Application Security

```python
# backend/config.py - Production settings
class ProductionConfig:
    SECURE_COOKIES = True
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    PERMANENT_SESSION_LIFETIME = 3600
    
    # Rate limiting
    RATELIMIT_ENABLED = True
    RATELIMIT_STORAGE_URL = os.getenv('REDIS_URL')
    
    # CORS
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', '').split(',')
    CORS_SUPPORTS_CREDENTIALS = True
```

### 3. Secrets Management

```bash
# Use AWS Secrets Manager
aws secretsmanager create-secret \
  --name pitmind/prod/database \
  --secret-string '{"username":"user","password":"pass"}'

# Retrieve in application
aws secretsmanager get-secret-value \
  --secret-id pitmind/prod/database \
  --query SecretString \
  --output text
```

</details>



<details>
<summary><b>Post-Deployment Verification</b></summary>
<br/>

### Verification Checklist

```bash
# 1. Health checks
curl https://pitmind.example.com/health
curl https://pitmind.example.com/api/health

# 2. SSL/TLS
curl -vI https://pitmind.example.com 2>&1 | grep -i "SSL\|TLS"

# 3. Security headers
curl -I https://pitmind.example.com | grep -i "strict-transport\|x-frame\|x-content"

# 4. Database connectivity
docker-compose exec backend python -c "from models.database import check_db_health; import asyncio; print(asyncio.run(check_db_health()))"

# 5. Redis connectivity
docker-compose exec backend python -c "from services.redis_client import check_redis_health; import asyncio; print(asyncio.run(check_redis_health()))"

# 6. AI providers
curl -X POST https://pitmind.example.com/api/v1/strategy/recommend \
  -H "Content-Type: application/json" \
  -d '{"context":"test"}'

# 7. WebSocket
wscat -c wss://pitmind.example.com/api/v1/stream/telemetry?session_id=test

# 8. Performance
ab -n 1000 -c 10 https://pitmind.example.com/health
```

### Smoke Tests

```bash
# Run automated smoke tests
docker-compose exec backend pytest tests/smoke/ -v

# Load test
locust -f tests/load/locustfile.py --host=https://pitmind.example.com
```

</details>



<details>
<summary><b>Rollback Procedure</b></summary>
<br/>

```bash
# 1. Identify last stable version
docker images | grep pitmind-backend

# 2. Rollback to previous version
docker-compose -f docker-compose.prod.yml down
docker tag your-registry/pitmind-backend:v1.2.3 your-registry/pitmind-backend:latest
docker-compose -f docker-compose.prod.yml up -d

# 3. Verify rollback
curl https://pitmind.example.com/health

# 4. Rollback database if needed
gunzip < /backups/pitmind/pitmind_20240520.sql.gz | psql -h localhost -U pitmind_user pitmind
```

</details>



<details>
<summary><b>Maintenance Windows</b></summary>
<br/>

### Planned Maintenance

```bash
# 1. Notify users (set maintenance mode)
docker-compose exec backend python -m scripts.set_maintenance_mode --enable

# 2. Perform maintenance
docker-compose -f docker-compose.prod.yml down
# ... perform updates ...
docker-compose -f docker-compose.prod.yml up -d

# 3. Verify and disable maintenance mode
curl https://pitmind.example.com/health
docker-compose exec backend python -m scripts.set_maintenance_mode --disable
```

</details>



<details>
<summary><b>Support and Troubleshooting</b></summary>
<br/>

For troubleshooting common issues, see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md).

For HTTPS/TLS configuration, see [HTTPS_TLS.md](./HTTPS_TLS.md).

</details>



<details>
<summary><b>Additional Resources</b></summary>
<br/>

- [Docker Documentation](https://docs.docker.com/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [PostgreSQL Performance Tuning](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [Redis Best Practices](https://redis.io/docs/manual/patterns/)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)

</details>

---

<div align="center">
  <p>Built for the speed of Formula 1. Engineered for absolute transparency.</p>
  <p><a href="../README.md">🏠 Back to Main README</a></p>
</div>
