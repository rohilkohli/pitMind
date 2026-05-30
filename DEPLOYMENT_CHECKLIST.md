# PitMind Production Deployment Checklist

Date: 2026-05-30
Status: READY FOR DEPLOYMENT

## Pre-Deployment (Do First)

### 1. Environment Configuration
- [ ] Set ENVIRONMENT=production
- [ ] Update BACKEND_CORS_ORIGINS with production domain
- [ ] Update DATABASE_URL with production credentials
- [ ] Update REDIS_URL with production credentials
- [ ] Set DB_POOL_SIZE=20
- [ ] Set DB_MAX_OVERFLOW=30
- [ ] Set REDIS_MAX_CONNECTIONS=50

### 2. Rotate Credentials (CRITICAL)
- [ ] Rotate IBM Watsonx API key
- [ ] Rotate HuggingFace token
- [ ] Rotate Firebase credentials
- [ ] Generate new JWT secret key

### 3. Update Dependencies
- [ ] Run: pip install -r backend/requirements.txt --upgrade
- [ ] Verify firebase-admin==6.7.0
- [ ] Verify PyJWT==2.9.0
- [ ] Run: npm ci in frontend

### 4. Database Migrations
- [ ] Run: alembic current (check status)
- [ ] Run: alembic upgrade head
- [ ] Verify composite index created

### 5. Run Tests
- [ ] Backend tests: pytest tests/ -v
- [ ] All tests pass
- [ ] Coverage > 80%

### 6. Build Docker Images
- [ ] docker build -t pitmind-backend:latest ./backend
- [ ] docker build -t pitmind-frontend:latest ./frontend
- [ ] docker scan pitmind-backend:latest
- [ ] docker scan pitmind-frontend:latest

## Deployment

### 7. Deploy Backend
- [ ] Deploy backend service
- [ ] Health check responds: /health
- [ ] Database connected
- [ ] Redis connected

### 8. Deploy Frontend
- [ ] Deploy frontend service
- [ ] Can access login page
- [ ] Can connect to backend API

### 9. Configure HTTPS
- [ ] SSL certificate installed
- [ ] HTTPS enabled
- [ ] HSTS header present

## Post-Deployment Verification

### 10. Test Authentication
- [ ] Can login with Firebase
- [ ] Invalid tokens rejected (401)
- [ ] Token expiration works

### 11. Test Security
- [ ] CSP header present
- [ ] HSTS header present (if HTTPS)
- [ ] CORS only allows production domain
- [ ] Rate limiting works (429 after limit)

### 12. Test Core Features
- [ ] Strategy recommendations work
- [ ] Chat functionality works
- [ ] WebSocket telemetry streams
- [ ] Sequence numbers incrementing
- [ ] PDF upload works

### 13. Monitor Metrics
- [ ] Response time < 500ms (p95)
- [ ] Error rate < 1%
- [ ] Database pool < 40 connections
- [ ] Redis pool < 100 connections
- [ ] Cache hit rate > 50%

### 14. Set Up Alerts
- [ ] Database pool exhaustion alert
- [ ] Redis connection alert
- [ ] High error rate alert
- [ ] Rate limit hit alert
- [ ] Failed authentication alert

## Quick Tests

### Health Check
curl https://your-backend.com/health

Expected: {"status": "ok", "redis": {"connected": true}, "database": {"connected": true}}

### Test Auth
curl -X GET https://your-backend.com/api/v1/strategy/recommend \
  -H "Authorization: Bearer invalid_token"

Expected: 401 Unauthorized

### Test Rate Limit
# Run 15 times quickly
curl -X POST https://your-backend.com/api/v1/chat/explain \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"messages": [{"role": "user", "content": "test"}]}'

Expected: 429 after 10 requests

### Test WebSocket
const ws = new WebSocket('wss://your-backend.com/api/v1/stream/telemetry?session_id=test');
ws.onmessage = (e) => console.log(JSON.parse(e.data));

Expected: Messages with sequence numbers

## Rollback Plan

If issues occur:

1. Docker: docker-compose down && git checkout <previous-commit> && docker-compose up -d
2. Database: alembic downgrade -1
3. Code Engine: ibmcloud ce application update --name pitmind-backend --image <previous-tag>

## Success Criteria

- [ ] All health checks passing
- [ ] All features working
- [ ] No critical errors in logs
- [ ] Response times acceptable
- [ ] Security headers present
- [ ] Rate limiting working
- [ ] Monitoring alerts configured

## Deployment Complete

Date Deployed: ________________
Deployed By: ________________
Backend URL: ________________
Frontend URL: ________________
Database: ________________
Redis: ________________

Status: SUCCESS / ROLLBACK NEEDED

Notes:
_________________________________
_________________________________
_________________________________
