<div align="center">

# 📖 Troubleshooting Guide
**PitMind Documentation**

[![PitMind Platform](https://img.shields.io/badge/PitMind-Platform-e10600.svg?style=for-the-badge)](#)
[![Return to Home](https://img.shields.io/badge/Return_to_Home-15151e.svg?style=for-the-badge)](../README.md)

</div>

<br/>

> **Overview:** This document outlines the core concepts, configurations, and technical specifications for the **Troubleshooting Guide** module within the PitMind AI ecosystem.

---

Comprehensive troubleshooting guide for pitMind deployment and operation issues.



<details>
<summary><b>Table of Contents</b></summary>
<br/>

- [Common Issues](#common-issues)
- [Debugging Guide](#debugging-guide)
- [Performance Troubleshooting](#performance-troubleshooting)
- [Error Message Reference](#error-message-reference)
- [Support Escalation](#support-escalation)

<br/>

### Escalation Path

```mermaid
graph TD
    A[Issue Detected] --> B{Check Error Code}
    B -->|Database| C[Check PostgreSQL Logs]
    B -->|Cache| D[Check Redis Stats]
    B -->|AI Provider| E[Check Watsonx Key/Quota]
    B -->|Unknown| F[View Backend Logs]
    
    C --> G{Resolved?}
    D --> G
    E --> G
    F --> G
    
    G -- Yes --> H((Success))
    G -- No --> I[Generate Support Bundle]
    I --> J[Escalate to Level 2]
    
    style A fill:#0a0a0b,stroke:#EF3340,stroke-width:2px,color:#fff
    style H fill:#121214,stroke:#4ade80,color:#fff
    style J fill:#EF3340,stroke:#EF3340,color:#fff
```

</details>



<details>
<summary><b>Common Issues</b></summary>
<br/>

### 1. Application Won't Start

#### Symptom
```
Error: Cannot connect to database
Error: Redis connection failed
```

#### Diagnosis
```bash
# Check service status
docker-compose ps

# Check logs
docker-compose logs backend
docker-compose logs postgres
docker-compose logs redis

# Verify environment variables
docker-compose exec backend env | grep -E "DATABASE|REDIS"
```

#### Solutions

**Database Connection Issues:**
```bash
# Verify PostgreSQL is running
docker-compose ps postgres

# Check PostgreSQL logs
docker-compose logs postgres | tail -50

# Test connection manually
docker-compose exec postgres psql -U pitmind_user -d pitmind -c "SELECT 1;"

# Verify DATABASE_URL format
# Correct: postgresql://user:pass@postgres:5432/pitmind
# Check for special characters in password (URL encode if needed)
```

**Redis Connection Issues:**
```bash
# Verify Redis is running
docker-compose ps redis

# Test Redis connection
docker-compose exec redis redis-cli ping

# Check Redis authentication
docker-compose exec redis redis-cli -a <password> ping

# Verify REDIS_URL format
# Correct: redis://:password@redis:6379/0
```

### 2. WebSocket Connection Failures

#### Symptom
```
WebSocket connection failed
Error: Connection closed before receiving a handshake response
```

#### Diagnosis
```bash
# Check WebSocket endpoint
wscat -c ws://localhost:8000/api/v1/stream/telemetry?session_id=test

# Check Nginx WebSocket configuration
docker-compose exec nginx cat /etc/nginx/conf.d/default.conf | grep -A 10 "websocket"

# Check backend logs for WebSocket errors
docker-compose logs backend | grep -i websocket
```

#### Solutions

**Nginx Configuration:**
```nginx
# Ensure these headers are set in Nginx config
location /api/v1/stream/ {
    proxy_pass http://backend:8000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_read_timeout 86400;  # 24 hours
}
```

**Backend Configuration:**
```python
# Verify CORS settings allow WebSocket origin
CORS_ORIGINS=https://your-domain.com
```

**Firewall Issues:**
```bash
# Ensure WebSocket ports are open
sudo ufw allow 8000/tcp
sudo ufw status
```

### 3. AI Provider Failures

#### Symptom
```
All AI providers unavailable; using local fallback
Watsonx provider failed: 401 Unauthorized
HuggingFace provider failed: timeout
```

#### Diagnosis
```bash
# Check AI provider configuration
docker-compose exec backend python -c "
from config import get_settings
s = get_settings()
print(f'Watsonx: {bool(s.watsonx_api_key)}')
print(f'HF: {bool(s.hf_api_token)}')
"

# Test AI provider manually
docker-compose exec backend python backend/scripts/verify_granite.py

# Check logs for AI errors
docker-compose logs backend | grep -i "watsonx\|huggingface\|granite"
```

#### Solutions

**API Key Issues:**
```bash
# Verify API keys are set correctly
docker-compose exec backend env | grep -E "WATSONX|HF_API"

# Test Watsonx authentication
curl -X POST "https://iam.cloud.ibm.com/identity/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=YOUR_KEY"

# Test HuggingFace token
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://huggingface.co/api/whoami
```

**Timeout Issues:**
```python
# Increase timeout in granite.py
async with httpx.AsyncClient(timeout=120.0) as client:
    # ... provider calls
```

**Rate Limiting:**
```bash
# Check if rate limited
docker-compose logs backend | grep -i "rate limit\|429"

# Wait and retry, or upgrade API tier
```

### 4. Cache Performance Issues

#### Symptom
```
Low cache hit rate (<30%)
Redis memory usage high
Cache operations slow
```

#### Diagnosis
```bash
# Check cache statistics
curl http://localhost:8000/health | jq '.cache'

# Check Redis memory usage
docker-compose exec redis redis-cli INFO memory

# Check Redis slow log
docker-compose exec redis redis-cli SLOWLOG GET 10

# Monitor cache operations
docker-compose logs backend | grep -i "cache"
```

#### Solutions

**Low Hit Rate:**
```bash
# Increase TTL values in .env
CACHE_TTL_STRATEGY=7200  # 2 hours
CACHE_TTL_TELEMETRY=600  # 10 minutes

# Verify cache keys are consistent
docker-compose exec redis redis-cli KEYS "pitmind:*" | head -20

# Clear and rebuild cache
docker-compose exec redis redis-cli FLUSHDB
```

**High Memory Usage:**
```bash
# Check Redis maxmemory policy
docker-compose exec redis redis-cli CONFIG GET maxmemory-policy

# Set eviction policy
docker-compose exec redis redis-cli CONFIG SET maxmemory-policy allkeys-lru

# Set memory limit
docker-compose exec redis redis-cli CONFIG SET maxmemory 2gb
```

**Slow Operations:**
```bash
# Check for large keys
docker-compose exec redis redis-cli --bigkeys

# Monitor operations in real-time
docker-compose exec redis redis-cli MONITOR

# Optimize data structures
# Use hashes instead of strings for complex objects
```

### 5. Database Performance Issues

#### Symptom
```
Slow query performance
High database CPU usage
Connection pool exhausted
```

#### Diagnosis
```bash
# Check slow queries
docker-compose exec postgres psql -U pitmind_user -d pitmind -c "
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
"

# Check active connections
docker-compose exec postgres psql -U pitmind_user -d pitmind -c "
SELECT count(*) FROM pg_stat_activity;
"

# Check table sizes
docker-compose exec postgres psql -U pitmind_user -d pitmind -c "
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
"
```

#### Solutions

**Missing Indexes:**
```sql
-- Add indexes for frequently queried columns
CREATE INDEX CONCURRENTLY idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX CONCURRENTLY idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX CONCURRENTLY idx_sessions_expires_at ON sessions(expires_at);

-- Verify index usage
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;
```

**Connection Pool Issues:**
```python
# Increase pool size in config
DATABASE_POOL_SIZE=30
DATABASE_MAX_OVERFLOW=20
```

**Query Optimization:**
```python
# Ensure queries are optimized with appropriate indexes and batching
# Use SQLAlchemy's selectinload for eager loading
from sqlalchemy.orm import selectinload

stmt = select(Model).options(selectinload(Model.relationship1))
```

### 6. High Memory Usage

#### Symptom
```
Container OOM killed
High memory usage warnings
Application crashes
```

#### Diagnosis
```bash
# Check container memory usage
docker stats

# Check application memory
docker-compose exec backend python -c "
import psutil
print(f'Memory: {psutil.virtual_memory().percent}%')
print(f'Available: {psutil.virtual_memory().available / 1024**3:.2f} GB')
"

# Check for memory leaks
docker-compose exec backend python -m memory_profiler backend/main.py
```

#### Solutions

**Increase Container Memory:**
```yaml
# docker-compose.yml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 4G
        reservations:
          memory: 2G
```

**Optimize Application:**
```python
# Use generators instead of lists
def process_large_dataset():
    for item in large_query:  # Generator
        yield process(item)

# Clear caches periodically
from backend.services.cache_manager import clear_expired_cache
await clear_expired_cache()

# Limit query result sizes
stmt = stmt.limit(1000)
```

**Monitor and Alert:**
```yaml
# prometheus-alerts.yml
- alert: HighMemoryUsage
  expr: container_memory_usage_bytes / container_spec_memory_limit_bytes > 0.9
  for: 5m
```

### 7. SSL/TLS Certificate Issues

#### Symptom
```
SSL certificate expired
Certificate validation failed
Mixed content warnings
```

#### Diagnosis
```bash
# Check certificate expiration
openssl x509 -in /etc/letsencrypt/live/domain/cert.pem -noout -dates

# Test SSL configuration
curl -vI https://your-domain.com 2>&1 | grep -i "SSL\|certificate"

# Check certificate chain
openssl s_client -connect your-domain.com:443 -showcerts
```

#### Solutions

**Renew Certificate:**
```bash
# Manual renewal
sudo certbot renew --force-renewal

# Test renewal
sudo certbot renew --dry-run

# Check auto-renewal timer
sudo systemctl status certbot.timer
```

**Fix Certificate Chain:**
```bash
# Ensure fullchain.pem is used, not cert.pem
ssl_certificate /etc/letsencrypt/live/domain/fullchain.pem;
```

**Mixed Content:**
```javascript
// Frontend: Use relative URLs or match protocol
const API_URL = window.location.protocol === 'https:' 
  ? 'https://api.domain.com'
  : 'http://localhost:8000';
```

</details>



<details>
<summary><b>Debugging Guide</b></summary>
<br/>

### Enable Debug Logging

```bash
# Set log level to DEBUG
LOG_LEVEL=DEBUG docker-compose up -d

# View debug logs
docker-compose logs -f backend | grep DEBUG
```

### Interactive Debugging

```bash
# Access backend container
docker-compose exec backend bash

# Start Python REPL
python

# Test components
>>> from backend.services import redis_client
>>> import asyncio
>>> asyncio.run(redis_client.check_redis_health())
```

### Network Debugging

```bash
# Check network connectivity
docker-compose exec backend ping postgres
docker-compose exec backend ping redis

# Check DNS resolution
docker-compose exec backend nslookup postgres

# Check port connectivity
docker-compose exec backend nc -zv postgres 5432
docker-compose exec backend nc -zv redis 6379
```

### Database Debugging

```bash
# Connect to database
docker-compose exec postgres psql -U pitmind_user -d pitmind

# Check active queries
SELECT pid, query, state, query_start
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY query_start;

# Kill long-running query
SELECT pg_terminate_backend(pid);

# Check locks
SELECT * FROM pg_locks WHERE NOT granted;
```

</details>



<details>
<summary><b>Performance Troubleshooting</b></summary>
<br/>

### Identify Bottlenecks

```bash
# Profile application
docker-compose exec backend python -m cProfile -o profile.stats backend/main.py

# Analyze profile
docker-compose exec backend python -c "
import pstats
p = pstats.Stats('profile.stats')
p.sort_stats('cumulative').print_stats(20)
"

# Monitor in real-time
docker-compose exec backend py-spy top --pid 1
```

### Load Testing

```bash
# Install locust
pip install locust

# Run load test
locust -f tests/load/locustfile.py --host=http://localhost:8000

# Apache Bench
ab -n 1000 -c 10 http://localhost:8000/health
```

### Database Query Analysis

```sql
-- Enable query timing
\timing on

-- Explain query plan
EXPLAIN ANALYZE SELECT * FROM audit_logs WHERE user_id = 'user123';

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
WHERE idx_scan = 0;
```

</details>



<details>
<summary><b>Error Message Reference</b></summary>
<br/>

### Backend Errors

| Error Code | Message | Cause | Solution |
|------------|---------|-------|----------|
| `DATABASE_ERROR` | Database operation failed | Connection lost, query timeout | Check database connectivity, optimize query |
| `CACHE_ERROR` | Cache operation failed | Redis unavailable | Verify Redis is running, check connection |
| `AI_PROVIDER_ERROR` | AI provider request failed | API key invalid, rate limit | Verify credentials, check quota |
| `RATE_LIMIT_EXCEEDED` | Rate limit exceeded | Too many requests | Wait and retry, increase limit |
| `VALIDATION_ERROR` | Request validation failed | Invalid input data | Check request format, fix validation |
| `AUTHENTICATION_ERROR` | Authentication failed | Invalid credentials | Verify auth token, re-authenticate |
| `AUTHORIZATION_ERROR` | Access denied | Insufficient permissions | Check user permissions |
| `RESOURCE_NOT_FOUND` | Resource not found | Invalid ID or deleted | Verify resource exists |

### HTTP Status Codes

| Code | Meaning | Common Causes |
|------|---------|---------------|
| 400 | Bad Request | Invalid JSON, missing required fields |
| 401 | Unauthorized | Missing or invalid auth token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Invalid endpoint or resource ID |
| 422 | Unprocessable Entity | Validation failed |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unhandled exception |
| 502 | Bad Gateway | Backend unavailable |
| 503 | Service Unavailable | Database or cache down |
| 504 | Gateway Timeout | Request timeout |

</details>



<details>
<summary><b>Support Escalation</b></summary>
<br/>

### Level 1: Self-Service

1. Check this troubleshooting guide
2. Review application logs
3. Check health endpoints
4. Verify configuration

### Level 2: Team Support

1. Gather diagnostic information:
```bash
# Create support bundle
./scripts/create-support-bundle.sh

# Includes:
# - Application logs (last 1000 lines)
# - Configuration (sanitized)
# - Health check results
# - System metrics
# - Recent errors
```

2. Open issue on GitHub with:
   - Error message and stack trace
   - Steps to reproduce
   - Environment details
   - Support bundle

### Level 3: Emergency Escalation

For production outages:

1. **Immediate Actions:**
   - Check health dashboard
   - Review recent deployments
   - Check monitoring alerts
   - Verify external dependencies

2. **Rollback if Needed:**
```bash
# Rollback to last stable version
./scripts/rollback.sh --version=v1.2.3
```

3. **Contact On-Call:**
   - PagerDuty: [Your PagerDuty link]
   - Slack: #pitmind-incidents
   - Email: oncall@example.com

4. **Incident Response:**
   - Create incident ticket
   - Update status page
   - Communicate with stakeholders
   - Document timeline

### Diagnostic Information to Collect

```bash
# System information
uname -a
docker version
docker-compose version

# Service status
docker-compose ps
docker-compose logs --tail=100 backend
docker-compose logs --tail=100 postgres
docker-compose logs --tail=100 redis

# Health checks
curl http://localhost:8000/health
curl http://localhost:8000/api/v1/metrics/health

# Resource usage
docker stats --no-stream
df -h
free -h

# Network connectivity
ping -c 3 postgres
ping -c 3 redis
netstat -tulpn | grep -E "8000|5432|6379"

# Recent errors
docker-compose logs backend | grep -i error | tail -50
```

</details>



<details>
<summary><b>Additional Resources</b></summary>
<br/>

- [Production Deployment Guide](./PRODUCTION_DEPLOYMENT.md)
- [HTTPS/TLS Configuration](./HTTPS_TLS.md)
- [Testing Guide](./TESTING.md)
- [API Documentation](./API.md)

</details>



<details>
<summary><b>Getting Help</b></summary>
<br/>

- **Documentation**: Check all docs in `/docs` directory
- **GitHub Issues**: https://github.com/your-org/pitmind/issues
- **Community**: Join our Discord/Slack
- **Email**: support@example.com

</details>

---

<div align="center">
  <p>Built for the speed of Formula 1. Engineered for absolute transparency.</p>
  <p><a href="../README.md">🏠 Back to Main README</a></p>
</div>
