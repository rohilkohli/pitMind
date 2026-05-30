# PitMind Production Monitoring Setup

## Key Metrics Dashboard

### Application Health Metrics

1. Response Time
   - p50 latency (target: < 200ms)
   - p95 latency (target: < 500ms)
   - p99 latency (target: < 1000ms)

2. Error Rates
   - 4xx errors (target: < 5%)
   - 5xx errors (target: < 1%)
   - Failed requests (target: < 0.5%)

3. Throughput
   - Requests per second
   - WebSocket connections (current/max)
   - Messages per second

### Database Metrics

1. Connection Pool
   - Active connections (alert if > 40)
   - Idle connections
   - Pool exhaustion events (alert if any)

2. Query Performance
   - Average query time (target: < 50ms)
   - Slow queries (> 1s)
   - Deadlocks (alert if any)

### Redis Metrics

1. Connection Pool
   - Connected clients (alert if > 100)
   - Blocked clients
   - Rejected connections (alert if any)

2. Performance
   - Hit rate (target: > 50%)
   - Memory usage (alert if > 80%)
   - Evicted keys

### Security Metrics

1. Authentication
   - Failed login attempts (alert if > 10/min)
   - Invalid tokens (alert if > 20/min)
   - Expired tokens

2. Rate Limiting
   - 429 responses (alert if > 20% of requests)
   - Blocked IPs
   - Rate limit violations by endpoint

3. Attack Detection
   - Prompt injection attempts (log all)
   - SQL injection attempts (log all)
   - Invalid WebSocket sessions (alert if > 5/min)

### WebSocket Metrics

1. Connections
   - Active connections by session
   - Connection duration
   - Disconnection reasons

2. Messages
   - Messages sent per second
   - Out-of-order messages (alert if > 5%)
   - Broadcast failures

## Alert Configuration

### Critical Alerts (Immediate Action)

1. Service Down
   - Health endpoint not responding
   - Database connection failed
   - Redis connection failed

2. Security Breach
   - Multiple failed auth attempts from same IP
   - SQL injection attempt detected
   - Rate limit severely exceeded (>200%)

3. Resource Exhaustion
   - Database pool exhausted
   - Redis memory full
   - CPU > 90% for 5 minutes

### Warning Alerts (Review Soon)

1. Performance Degradation
   - p95 latency > 1000ms
   - Error rate > 2%
   - Cache hit rate < 30%

2. Capacity Concerns
   - Database connections > 35
   - Redis connections > 80
   - WebSocket connections > 200

3. Security Concerns
   - Elevated 401 responses
   - Multiple rate limit violations
   - Prompt injection attempts

## Log Aggregation

### Important Log Entries

1. Security Events
   - Authentication failures
   - Rate limit violations
   - Prompt injection attempts
   - Invalid input patterns

2. Error Events
   - 5xx errors with stack traces
   - Database connection errors
   - Redis connection errors
   - WebSocket disconnections

3. Performance Events
   - Slow queries (> 1s)
   - High latency requests (> 2s)
   - Connection pool warnings

## Sample Prometheus Queries

### Response Time
rate(http_request_duration_seconds_sum[5m]) / rate(http_request_duration_seconds_count[5m])

### Error Rate
sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m])) * 100

### Database Pool Usage
pg_stat_activity_count / pg_settings_max_connections * 100

### Cache Hit Rate
redis_keyspace_hits_total / (redis_keyspace_hits_total + redis_keyspace_misses_total) * 100

## Quick Monitoring Commands

### Check Service Health
curl -s http://localhost:8000/health | jq

### Check Active Connections
docker-compose exec postgres psql -U pitmind -c "SELECT count(*) FROM pg_stat_activity;"

### Check Redis Stats
docker-compose exec redis redis-cli INFO stats

### Check Application Logs
docker-compose logs -f backend | grep ERROR

### Monitor Real-Time Metrics
watch -n 5 'curl -s http://localhost:8000/api/v1/metrics/health | jq'

## Grafana Dashboard JSON

Save as grafana-dashboard.json and import:

{
  "dashboard": {
    "title": "PitMind Production Metrics",
    "panels": [
      {
        "title": "Response Time",
        "targets": [{"expr": "rate(http_request_duration_seconds_sum[5m])"}]
      },
      {
        "title": "Error Rate",
        "targets": [{"expr": "sum(rate(http_requests_total{status=~\"5..\"}[5m]))"}]
      },
      {
        "title": "Database Pool",
        "targets": [{"expr": "pg_stat_activity_count"}]
      },
      {
        "title": "WebSocket Connections",
        "targets": [{"expr": "websocket_connections_active"}]
      }
    ]
  }
}

## Status Page Configuration

Public status page should show:
- API Status (green/yellow/red)
- Database Status
- Redis Status
- WebSocket Status
- Response Time (p95)
- Uptime percentage

Update every 60 seconds.
