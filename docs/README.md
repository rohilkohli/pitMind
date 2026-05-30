# 📚 **PitMind Documentation Hub**

Welcome to the comprehensive documentation for **PitMind** — your AI-powered race strategy copilot.

---

## 🚀 **Quick Navigation**

<table>
<tr>
<td width="50%">

### **Getting Started**
New to PitMind? Start here:

- 🏁 [**Quickstart Guide**](./QUICKSTART.md)  
  Get running in 5 minutes
  
- 🐳 [**Docker Setup**](./DEPLOYMENT.md)  
  Container-based deployment
  
- 🏭 [**Production Deployment**](../PRODUCTION_READY.md)  
  Enterprise deployment guide
  
- 🔧 [**Database Setup**](./DATABASE_SETUP.md)  
  PostgreSQL configuration

</td>
<td width="50%">

### **Technical Reference**
Deep dives into the system:

- 🏗️ [**Architecture**](./architecture.md)  
  System design & data flow
  
- 🔌 [**API Reference**](./API.md)  
  REST & WebSocket endpoints
  
- 💾 [**Caching Strategy**](./CACHING.md)  
  Multi-tier cache design
  
- 🧪 [**Testing Guide**](./TESTING.md)  
  Test suites & CI/CD

</td>
</tr>
</table>

---

## 📖 **Documentation Sections**

### **1. Setup & Installation**

Get PitMind running on your machine:

| Document | Description | Time |
|----------|-------------|------|
| [Quickstart](./QUICKSTART.md) | Fast local development setup | 5 min |
| [Docker Deployment](./DEPLOYMENT.md) | Production Docker configuration | 10 min |
| [Database Setup](./DATABASE_SETUP.md) | PostgreSQL schema & migrations | 15 min |
| [Environment Config](./guides/DEPLOYMENT_CHECKLIST.md) | All environment variables explained | 10 min |

---

### **2. Architecture & Design**

Understand how PitMind works under the hood:

| Document | Description | Audience |
|----------|-------------|----------|
| [Architecture Overview](./architecture.md) | High-level system design | All developers |
| [API Reference](./API.md) | REST & WebSocket API docs | Frontend/Backend |
| [Caching Strategy](./CACHING.md) | Redis multi-tier caching | Backend |
| [F1 Styling Guide](./F1_STYLING.md) | UI design system | Frontend |

---

### **3. Operations & Deployment**

Run PitMind in production:

| Document | Description | Stage |
|----------|-------------|-------|
| [Production Deployment](../PRODUCTION_READY.md) | Complete deployment guide | Production |
| [Monitoring Setup](./guides/MONITORING_SETUP.md) | Metrics, alerts, dashboards | Production |
| [Deployment Checklist](./guides/DEPLOYMENT_CHECKLIST.md) | Pre-flight verification | Production |
| [CI/CD Pipeline](./CI_CD.md) | GitHub Actions workflow | DevOps |
| [HTTPS/TLS Setup](./HTTPS_TLS.md) | SSL certificate configuration | Security |

---

### **4. Development & Testing**

Build and test PitMind features:

| Document | Description | Type |
|----------|-------------|------|
| [Testing Guide](./TESTING.md) | Unit, integration, E2E tests | All tests |
| [Troubleshooting](./TROUBLESHOOTING.md) | Common issues & solutions | Debugging |
| [API Types](../frontend/docs/API_TYPES.md) | TypeScript type definitions | Frontend |

---

### **5. Security**

Security features and audits:

| Document | Description | Severity |
|----------|-------------|----------|
| [Backend Security Fixes](./technical/SECURITY_FIXES.md) | Critical security patches | High |
| [Frontend Security Audit](./technical/FRONTEND_SECURITY_AUDIT.md) | Frontend vulnerability report | High |
| [Frontend Bug Fixes](./technical/FRONTEND_BUGS_RESOLVED.md) | UI/UX bug resolutions | Medium |

---

### **6. Project Management**

Planning and tracking documents:

| Document | Description | Audience |
|----------|-------------|----------|
| [Changelog](../CHANGELOG.md) | Version history | All |
| [Project Summary](./PROJECT_SUMMARY.md) | High-level overview | Stakeholders |
| [Audit Report](./AUDIT_REPORT.md) | Security & quality audit | Management |
| [Video Script](./VIDEO_SCRIPT.md) | Demo presentation script | Marketing |

---

## 🎯 **Documentation by Role**

### **For Frontend Developers**
1. [Quickstart Guide](./QUICKSTART.md)
2. [F1 Styling Guide](./F1_STYLING.md)
3. [API Reference](./API.md)
4. [API Types](../frontend/docs/API_TYPES.md)
5. [Frontend Security Audit](./technical/FRONTEND_SECURITY_AUDIT.md)

### **For Backend Developers**
1. [Architecture Overview](./architecture.md)
2. [API Reference](./API.md)
3. [Caching Strategy](./CACHING.md)
4. [Database Setup](./DATABASE_SETUP.md)
5. [Backend Security Fixes](./technical/SECURITY_FIXES.md)

### **For DevOps Engineers**
1. [Production Deployment](../PRODUCTION_READY.md)
2. [Docker Setup](./DEPLOYMENT.md)
3. [Monitoring Setup](./guides/MONITORING_SETUP.md)
4. [CI/CD Pipeline](./CI_CD.md)
5. [HTTPS/TLS Setup](./HTTPS_TLS.md)

### **For QA Engineers**
1. [Testing Guide](./TESTING.md)
2. [Deployment Checklist](./guides/DEPLOYMENT_CHECKLIST.md)
3. [Troubleshooting](./TROUBLESHOOTING.md)

---

## 🔍 **Find What You Need**

### **Common Questions**

<details>
<summary><b>How do I set up PitMind locally?</b></summary>

See the [Quickstart Guide](./QUICKSTART.md) — 5 minute setup with Docker or local development.

</details>

<details>
<summary><b>What API endpoints are available?</b></summary>

Full endpoint documentation in [API Reference](./API.md) — includes REST, WebSocket, and authentication.

</details>

<details>
<summary><b>How does caching work?</b></summary>

Multi-tier caching strategy explained in [Caching Strategy](./CACHING.md) — covers Redis, TTLs, and invalidation.

</details>

<details>
<summary><b>How do I deploy to production?</b></summary>

Complete guide in [Production Deployment](../PRODUCTION_READY.md) — includes Docker, IBM Cloud Engine, and environment config.

</details>

<details>
<summary><b>What security measures are in place?</b></summary>

See [Backend Security Fixes](./technical/SECURITY_FIXES.md) and [Frontend Security Audit](./technical/FRONTEND_SECURITY_AUDIT.md) for full security details.

</details>

---

## 📝 **Documentation Standards**

All PitMind documentation follows these principles:

✅ **Clear** — No jargon without explanation  
✅ **Concise** — Get to the point quickly  
✅ **Complete** — Cover all necessary details  
✅ **Current** — Updated with code changes  
✅ **Correct** — Tested and verified

---

## 🤝 **Contributing to Docs**

Found a documentation issue? We'd love your help!

1. **Typos & Errors** — Submit a PR with fixes
2. **Missing Info** — Open an issue describing what's unclear
3. **New Features** — Update docs in the same PR as code changes

---

## 📬 **Need Help?**

- 🐛 **Bug Reports** — [GitHub Issues](https://github.com/rohilkohli/pitMind/issues)
- 💬 **Questions** — Check [Troubleshooting](./TROUBLESHOOTING.md) first
- 📧 **Contact** — See main README for contact info

---

<div align="center">

**[← Back to Main README](../README.md)**

Built with ❤️ for Formula 1  
*Making race strategy transparent and accessible*

</div>
