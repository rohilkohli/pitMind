<div align="center">

# 📖 PitMind Deployment Guide
**PitMind Documentation**

[![PitMind Platform](https://img.shields.io/badge/PitMind-Platform-e10600.svg?style=for-the-badge)](#)
[![Return to Home](https://img.shields.io/badge/Return_to_Home-15151e.svg?style=for-the-badge)](../README.md)

</div>

<br/>

> **Overview:** This document outlines the core concepts, configurations, and technical specifications for the **PitMind Deployment Guide** module within the PitMind AI ecosystem.

---

<details>
<summary><b>Quick Start with Docker</b></summary>
<br/>

### Prerequisites
- Docker and Docker Compose installed
- Environment variables configured (.env file)

### Local Development with Docker

```bash
# Build and start all services
docker-compose up --build

# Run in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

Services will be available at:
- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:8001
- **API Docs**: http://localhost:8001/docs

### Environment Variables

Create a `.env` file in the project root:

```env
# Firebase Configuration
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id

# Watsonx AI Configuration
WATSONX_API_KEY=your_watsonx_api_key
WATSONX_PROJECT_ID=your_project_id
WATSONX_SPACE_ID=your_space_id
WATSONX_URL=https://us-south.ml.cloud.ibm.com

# Frontend Configuration
VITE_API_BASE_URL=http://api:8000
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
VITE_FIREBASE_WEB_API_KEY=your_firebase_web_api_key
VITE_FIREBASE_DATABASE_URL=https://your_project.firebaseio.com

# CORS Configuration
BACKEND_CORS_ORIGINS=http://localhost:5173,http://localhost:8080,http://0.0.0.0:5173

# Rate Limiting
RATE_LIMIT_PER_MINUTE=60
```

</details>



<details>
<summary><b>Production Deployment</b></summary>
<br/>

### Docker Registry Push

```bash
# Tag image
docker tag pitmind-api your_registry/pitmind-api:latest
docker tag pitmind-web your_registry/pitmind-web:latest

# Push to registry
docker push your_registry/pitmind-api:latest
docker push your_registry/pitmind-web:latest
```

### Kubernetes Deployment

Create `kubernetes.yaml`:

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: pitmind

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: pitmind-api
  namespace: pitmind
spec:
  replicas: 2
  selector:
    matchLabels:
      app: pitmind-api
  template:
    metadata:
      labels:
        app: pitmind-api
    spec:
      containers:
      - name: api
        image: your_registry/pitmind-api:latest
        ports:
        - containerPort: 8000
        env:
        - name: WATSONX_API_KEY
          valueFrom:
            secretKeyRef:
              name: pitmind-secrets
              key: watsonx-api-key
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
          initialDelaySeconds: 10
          periodSeconds: 5

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: pitmind-web
  namespace: pitmind
spec:
  replicas: 2
  selector:
    matchLabels:
      app: pitmind-web
  template:
    metadata:
      labels:
        app: pitmind-web
    spec:
      containers:
      - name: web
        image: your_registry/pitmind-web:latest
        ports:
        - containerPort: 8080

---
apiVersion: v1
kind: Service
metadata:
  name: pitmind-api-service
  namespace: pitmind
spec:
  selector:
    app: pitmind-api
  ports:
  - protocol: TCP
    port: 8000
    targetPort: 8000

---
apiVersion: v1
kind: Service
metadata:
  name: pitmind-web-service
  namespace: pitmind
spec:
  type: LoadBalancer
  selector:
    app: pitmind-web
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8080
```

Deploy:

```bash
kubectl apply -f kubernetes.yaml
kubectl get services -n pitmind
```

</details>



<details>
<summary><b>Performance Optimization</b></summary>
<br/>

### Frontend (Vite)

The frontend is already optimized with:
- Code splitting by vendor (Firebase, Charts, UI, Icons)
- Lazy loading for heavy components (BranchingSimulator, DecisionLog, HealthConsole)
- CSS extraction and minification
- JavaScript minification and tree-shaking

Build output analysis:
```bash
cd frontend
npm run build
# Check dist/assets/ for chunk sizes
```

### Backend (FastAPI)

Optimizations in place:
- Rate limiting (60 req/min default)
- CORS middleware
- Security headers
- WebSocket streaming for real-time data
- Connection pooling for Firebase

### Caching Strategy

**Frontend:**
- Service Worker recommended for offline support
- Cache busting via Vite's asset versioning

**Backend:**
- Redis cache for health metrics (optional)
- In-memory cache for AI model responses

</details>



<details>
<summary><b>Monitoring & Logging</b></summary>
<br/>

### Health Checks

The docker-compose includes health checks:
```bash
# Check service health
curl http://localhost:8001/health
curl http://localhost:8001/api/v1/metrics/health
```

### Log Aggregation

View logs from all services:
```bash
docker-compose logs -f api web
```

For production, configure:
- ELK Stack (Elasticsearch, Logstash, Kibana)
- CloudWatch (AWS)
- Stackdriver (GCP)
- DataDog

### Metrics

Implement monitoring for:
- API response latency
- WebSocket connection count
- AI model inference time
- Error rates
- Database connection pool
- Memory and CPU usage

</details>



<details>
<summary><b>Troubleshooting</b></summary>
<br/>

### WebSocket Connection Fails

Check:
1. Firewall allows WebSocket connections (port 8001)
2. Backend CORS origins include frontend URL
3. Backend is healthy: `curl http://localhost:8001/health`

### Rate Limiting

If seeing 429 errors:
1. Increase `RATE_LIMIT_PER_MINUTE` in .env
2. Implement client-side request batching
3. Add exponential backoff in frontend

### AI Service Unavailable

Check:
1. Watsonx API credentials in .env
2. Project and space IDs correct
3. Network access to watsonx URL

</details>



<details>
<summary><b>Database Migrations</b></summary>
<br/>

For future database changes:
```bash
# In backend directory
alembic init migrations
alembic revision --autogenerate -m "migration_description"
alembic upgrade head
```

</details>



<details>
<summary><b>Backup Strategy</b></summary>
<br/>

For production:
1. **Firebase**: Google handles backups automatically
2. **Application Code**: Git repository with tags for releases
3. **Configuration**: Keep .env files in secure vault (HashiCorp Vault, AWS Secrets Manager)

</details>



<details>
<summary><b>Zero-Downtime Deployment</b></summary>
<br/>

1. Update docker-compose or Kubernetes manifests
2. Apply updates to secondary instance
3. Health check passes on secondary
4. Switch load balancer to secondary
5. Update primary instance
6. Monitor error rates during cutover

Example with docker-compose:

```bash
# Start new container
docker-compose up -d --scale api=2 --scale web=2

# Remove old containers when ready
docker-compose down
docker-compose up -d
```

</details>

---

<div align="center">
  <p>Built for the speed of Formula 1. Engineered for absolute transparency.</p>
  <p><a href="../README.md">🏠 Back to Main README</a></p>
</div>
