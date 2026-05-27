<div align="center">

# 🚢 PitMind Deployment Guide
**Moving to Production on IBM Cloud**

[![PitMind Platform](https://img.shields.io/badge/PitMind-Platform-e10600.svg?style=for-the-badge)](#)
[![Return to Home](https://img.shields.io/badge/Return_to_Home-15151e.svg?style=for-the-badge)](../README.md)

</div>

<br/>

> [!NOTE]
> This guide details how to securely deploy PitMind for production traffic, specifically focusing on serverless environments like **IBM Cloud Code Engine**.

---

## 🏗️ 1. IBM Cloud Code Engine (Recommended)

PitMind is optimized for IBM Cloud Code Engine, allowing seamless auto-scaling of both the Vite frontend and FastAPI backend without managing Kubernetes clusters.

<details open>
<summary><b>Deploying the Backend</b></summary>
<br/>

```bash
ibmcloud ce app update \
  --name pitmind-backend \
  --build-source https://github.com/rohilkohli/pitMind.git \
  --build-context-dir backend \
  --build-size xxlarge \
  --build-timeout 1800 \
  --env ENVIRONMENT="development"
```

> [!WARNING]
> Machine learning libraries (like `torch` and `docling`) require a large build environment. You **must** specify `--build-size xxlarge` and a generous timeout (e.g., 30 minutes) to prevent OOM kills during the build.
</details>

<details>
<summary><b>Deploying the Frontend</b></summary>
<br/>

```bash
ibmcloud ce app update \
  --name pitmind-frontend \
  --build-source https://github.com/rohilkohli/pitMind.git \
  --build-context-dir frontend \
  --build-size medium \
  --build-timeout 1800
```

> [!TIP]
> The frontend deployment is lightweight. Ensure your `.env.production` contains your correct `VITE_API_BASE_URL` pointing to the live backend.
</details>

---

## 🐋 2. Standard Docker / Kubernetes

If you prefer to host PitMind on your own hardware or standard Kubernetes, use the provided Dockerfiles.

<details>
<summary><b>Building Docker Images Locally</b></summary>
<br/>

```bash
# Backend Image
docker build -t pitmind-backend ./backend

# Frontend Image
docker build -t pitmind-frontend ./frontend
```
</details>

<details>
<summary><b>Sample Kubernetes Deployment Manifest</b></summary>
<br/>

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: pitmind-api
spec:
  replicas: 2
  template:
    spec:
      containers:
      - name: api
        image: your_registry/pitmind-backend:latest
        ports:
        - containerPort: 8000
        envFrom:
        - secretRef:
            name: pitmind-secrets
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
```
</details>

---

## 🔒 3. Production Environment Checklist

Before making your application public, ensure the following keys are correctly configured in your deployment environment:

| Service | Environment Variable | Purpose |
|---------|---------------------|---------|
| **IBM Watsonx.ai** | `WATSONX_API_KEY` | Authenticates backend to the LLM |
| **IBM Watsonx.ai** | `WATSONX_PROJECT_ID` | Ties your requests to an IBM Project |
| **Firebase** | `FIREBASE_WEB_API_KEY` | Allows frontend login |
| **Firebase** | `FIREBASE_PROJECT_ID` | Ties backend validation to Firebase |
| **Security** | `BACKEND_CORS_ORIGINS` | Protects API from unauthorized websites |

> [!CAUTION]
> Never commit `.env` files to GitHub. Always inject them securely using IBM Cloud Secrets, Kubernetes Secrets, or GitHub Actions Secrets!

---

## 🚀 4. Performance Optimization

<details>
<summary><b>Frontend Caching & Assets</b></summary>
<br/>

The frontend is built using Vite and is automatically optimized for production:
- **Code splitting**: External vendor libraries (React, Charts) are chunked separately from app code.
- **Lazy loading**: Heavy components (`BranchingSimulator`, `HealthConsole`) are only loaded when navigated to.
- **Minification**: JavaScript and CSS are aggressively minified and tree-shaken.
</details>

<details>
<summary><b>Backend AI Caching</b></summary>
<br/>

The FastAPI backend uses an intelligent in-memory cache to reduce latency on repeated AI requests. Ensure that your scaling strategy accounts for cache synchronization if running multiple backend pods (e.g., using Redis instead of the local cache).
</details>

---

<div align="center">
  <p>Built for the speed of Formula 1. Engineered for absolute transparency.</p>
  <p><a href="../README.md">🏠 Back to Main README</a></p>
</div>
