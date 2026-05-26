<div align="center">

# 📖 CI/CD Pipeline Documentation
**PitMind Documentation**

[![PitMind Platform](https://img.shields.io/badge/PitMind-Platform-e10600.svg?style=for-the-badge)](#)
[![Return to Home](https://img.shields.io/badge/Return_to_Home-15151e.svg?style=for-the-badge)](../README.md)

</div>

<br/>

> **Overview:** This document outlines the core concepts, configurations, and technical specifications for the **CI/CD Pipeline Documentation** module within the PitMind AI ecosystem.

---

<details>
<summary><b>Overview</b></summary>
<br/>

The pitMind project uses GitHub Actions for continuous integration and continuous deployment. This document describes the complete CI/CD pipeline architecture, workflows, and best practices.

</details>



<details>
<summary><b>Table of Contents</b></summary>
<br/>

- [Pipeline Architecture](#pipeline-architecture)
- [Workflows](#workflows)
- [Setup Instructions](#setup-instructions)
- [Deployment Process](#deployment-process)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

</details>



<details>
<summary><b>Pipeline Architecture</b></summary>
<br/>

```
┌─────────────────────────────────────────────────────────────────┐
│                         GitHub Repository                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      CI Pipeline (ci.yml)                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Lint Backend │  │ Lint Frontend│  │ Security Scan│          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  ┌──────────────┐  ┌──────────────┐                            │
│  │ Test Backend │  │ Test Frontend│                            │
│  └──────────────┘  └──────────────┘                            │
│  ┌──────────────┐  ┌──────────────┐                            │
│  │Build Backend │  │Build Frontend│                            │
│  └──────────────┘  └──────────────┘                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ (on main branch)
┌─────────────────────────────────────────────────────────────────┐
│                      CD Pipeline (cd.yml)                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐       │
│  │         Build & Push Docker Images to GHCR           │       │
│  └──────────────────────────────────────────────────────┘       │
│                              │                                   │
│                              ▼                                   │
│  ┌──────────────────────────────────────────────────────┐       │
│  │              Deploy to Staging                       │       │
│  │  • Update containers                                 │       │
│  │  • Run smoke tests                                   │       │
│  │  • Notify team                                       │       │
│  └──────────────────────────────────────────────────────┘       │
│                              │                                   │
│                              ▼ (manual approval)                 │
│  ┌──────────────────────────────────────────────────────┐       │
│  │            Deploy to Production                      │       │
│  │  • Blue-green deployment                             │       │
│  │  • Health checks                                     │       │
│  │  • Rollback on failure                               │       │
│  └──────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

</details>



<details>
<summary><b>Workflows</b></summary>
<br/>

### 1. CI Pipeline (`ci.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`
- Manual workflow dispatch

**Jobs:**

#### Backend Linting
- Runs on Python 3.11 and 3.12
- Tools: Ruff, Black, MyPy
- Checks code style and type hints

#### Frontend Linting
- Runs on Node.js 20.x
- Tools: ESLint, Prettier, TypeScript compiler
- Validates code formatting and types

#### Backend Testing
- Sets up PostgreSQL and Redis services
- Runs pytest with coverage
- Uploads coverage to Codecov
- Requires 80% coverage threshold

#### Frontend Testing
- Runs Vitest tests
- Generates coverage reports
- Uploads artifacts

#### Backend Build
- Builds Docker image
- Runs Trivy security scan
- Tests container startup

#### Frontend Build
- Builds production bundle
- Checks bundle size (max 10MB)
- Builds Docker image
- Runs Trivy security scan
- Tests nginx configuration

**Status Badges:**
```markdown
![CI Pipeline](https://github.com/USERNAME/pitMind/actions/workflows/ci.yml/badge.svg)
```

### 2. CD Pipeline (`cd.yml`)

**Triggers:**
- Push to `main` branch (automatic)
- Manual workflow dispatch with environment selection

**Jobs:**

#### Build and Push
- Builds multi-platform Docker images (amd64, arm64)
- Tags with: `latest`, `git-sha`, `semantic-version`
- Pushes to GitHub Container Registry (ghcr.io)

#### Deploy to Staging
- Automatic deployment on main branch
- Updates container images
- Runs smoke tests
- Sends notifications

#### Deploy to Production
- Requires manual approval
- Blue-green deployment strategy
- Comprehensive health checks
- Automatic rollback on failure

**Status Badges:**
```markdown
![CD Pipeline](https://github.com/USERNAME/pitMind/actions/workflows/cd.yml/badge.svg)
```

### 3. Security Scanning (`security.yml`)

**Triggers:**
- Daily schedule (2 AM UTC)
- Pull requests
- Push to main
- Manual workflow dispatch

**Jobs:**

#### Dependency Scanning
- Python: Safety, pip-audit
- Node.js: npm audit
- Creates issues for critical vulnerabilities

#### CodeQL Analysis
- Analyzes Python and JavaScript code
- Detects security vulnerabilities
- Uploads results to GitHub Security tab

#### Docker Image Scanning
- Scans backend and frontend images with Trivy
- Checks for OS and library vulnerabilities
- Uploads SARIF results

#### Secret Scanning
- Gitleaks: Detects hardcoded secrets
- TruffleHog: Finds leaked credentials

#### SAST Analysis
- Bandit: Python security linting
- ESLint security plugin: JavaScript security

**Status Badges:**
```markdown
![Security Scan](https://github.com/USERNAME/pitMind/actions/workflows/security.yml/badge.svg)
```

### 4. Dependency Updates (`dependency-update.yml`)

**Triggers:**
- Weekly schedule (Monday 9 AM UTC)
- Manual workflow dispatch

**Jobs:**
- Updates Python dependencies
- Updates Node.js dependencies
- Updates GitHub Actions versions
- Creates pull requests automatically

### 5. Release Pipeline (`release.yml`)

**Triggers:**
- Tag push matching `v*.*.*`
- Manual workflow dispatch

**Jobs:**
- Validates release version
- Builds release artifacts
- Generates changelog from commits
- Creates GitHub release
- Deploys to production (stable releases only)

**Creating a Release:**
```bash
# Create and push a tag
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0

# Or use GitHub CLI
gh release create v1.0.0 --generate-notes
```

### 6. Dependabot (`dependabot.yml`)

**Configuration:**
- Weekly updates for Python, Node.js, GitHub Actions, Docker
- Groups minor and patch updates
- Auto-assigns to maintainers
- Labels PRs appropriately

</details>



<details>
<summary><b>Setup Instructions</b></summary>
<br/>

### Prerequisites

1. **GitHub Repository Settings:**
   - Enable GitHub Actions
   - Configure branch protection rules
   - Set up environments (staging, production)

2. **Required Secrets:**
   ```
   GITHUB_TOKEN (automatically provided)
   SLACK_WEBHOOK_URL (optional, for notifications)
   CODECOV_TOKEN (optional, for coverage reports)
   ```

3. **Environment Variables:**
   - Configure in GitHub repository settings
   - Set per environment (staging, production)

### Initial Setup

1. **Enable Workflows:**
   ```bash
   # Workflows are automatically enabled when pushed to the repository
   git add .github/
   git commit -m "Add CI/CD workflows"
   git push origin main
   ```

2. **Configure Branch Protection:**
   - Go to Settings → Branches
   - Add rule for `main` branch:
     - Require pull request reviews
     - Require status checks to pass (CI Pipeline)
     - Require branches to be up to date
     - Include administrators

3. **Set Up Environments:**
   - Go to Settings → Environments
   - Create `staging` environment
   - Create `production` environment with required reviewers

4. **Configure Secrets:**
   ```bash
   # Using GitHub CLI
   gh secret set SLACK_WEBHOOK_URL --body "https://hooks.slack.com/..."
   gh secret set CODECOV_TOKEN --body "your-codecov-token"
   ```

### Container Registry Setup

1. **Enable GitHub Container Registry:**
   - Packages are automatically published to ghcr.io
   - Images are public by default (can be changed in package settings)

2. **Pull Images:**
   ```bash
   # Backend
   docker pull ghcr.io/USERNAME/pitmind/backend:latest
   
   # Frontend
   docker pull ghcr.io/USERNAME/pitmind/frontend:latest
   ```

</details>



<details>
<summary><b>Deployment Process</b></summary>
<br/>

### Staging Deployment

**Automatic:**
- Triggered on every push to `main` branch
- Runs after CI pipeline passes
- No manual approval required

**Process:**
1. CI pipeline completes successfully
2. Docker images built and pushed
3. Staging environment updated
4. Smoke tests executed
5. Team notified

### Production Deployment

**Manual:**
- Requires workflow dispatch or release tag
- Requires manual approval from designated reviewers
- Blue-green deployment strategy

**Process:**
1. Create release tag or trigger workflow
2. Build and push Docker images
3. Wait for manual approval
4. Create backup of current deployment
5. Deploy to "green" environment
6. Run health checks
7. Switch traffic to "green"
8. Keep "blue" for quick rollback

**Rollback:**
```bash
# Automatic rollback on failure
# Or manual rollback:
gh workflow run cd.yml -f environment=production -f version=v1.0.0
```

### Hotfix Deployment

For urgent fixes:

1. Create hotfix branch from main:
   ```bash
   git checkout -b hotfix/critical-bug main
   ```

2. Make fixes and test locally

3. Create PR to main (CI runs automatically)

4. After merge, tag for immediate release:
   ```bash
   git tag -a v1.0.1 -m "Hotfix: Critical bug"
   git push origin v1.0.1
   ```

5. Release workflow deploys to production

</details>



<details>
<summary><b>Troubleshooting</b></summary>
<br/>

### Common Issues

#### 1. CI Pipeline Fails

**Linting Errors:**
```bash
# Fix Python linting
cd backend
ruff check . --fix
black .

# Fix JavaScript linting
cd frontend
npm run lint -- --fix
npx prettier --write "src/**/*.{ts,tsx}"
```

**Test Failures:**
```bash
# Run tests locally
cd backend
pytest tests/ -v

cd frontend
npm run test
```

**Build Failures:**
```bash
# Check Docker build locally
docker build -t test-backend ./backend
docker build -t test-frontend ./frontend
```

#### 2. Deployment Fails

**Check Logs:**
```bash
# View workflow logs
gh run list --workflow=cd.yml
gh run view RUN_ID --log
```

**Verify Images:**
```bash
# Check if images were pushed
docker pull ghcr.io/USERNAME/pitmind/backend:latest
docker pull ghcr.io/USERNAME/pitmind/frontend:latest
```

**Manual Rollback:**
```bash
# Rollback to previous version
gh workflow run cd.yml -f environment=production -f version=v1.0.0
```

#### 3. Security Scan Failures

**View Security Alerts:**
- Go to Security → Code scanning alerts
- Review and fix vulnerabilities
- Update dependencies

**Update Dependencies:**
```bash
# Python
cd backend
pip install --upgrade package-name

# Node.js
cd frontend
npm update package-name
```

#### 4. Dependabot Issues

**Merge Conflicts:**
```bash
# Rebase Dependabot PR
gh pr checkout PR_NUMBER
git rebase main
git push --force-with-lease
```

**Failed Checks:**
- Review CI logs
- Update code if breaking changes
- Close PR if update not needed

### Debug Mode

Enable debug logging:

1. Go to Settings → Secrets
2. Add `ACTIONS_STEP_DEBUG` = `true`
3. Re-run workflow

</details>



<details>
<summary><b>Best Practices</b></summary>
<br/>

### 1. Commit Messages

Follow conventional commits:
```
feat: add new feature
fix: fix bug
docs: update documentation
chore: update dependencies
test: add tests
refactor: refactor code
perf: improve performance
ci: update CI/CD
```

### 2. Pull Requests

- Use the PR template
- Request reviews from code owners
- Ensure CI passes before merging
- Squash commits when merging

### 3. Testing

- Write tests for new features
- Maintain 80%+ code coverage
- Test locally before pushing
- Use feature flags for risky changes

### 4. Security

- Never commit secrets
- Use GitHub Secrets for sensitive data
- Review security scan results regularly
- Update dependencies promptly

### 5. Deployments

- Deploy to staging first
- Test thoroughly in staging
- Schedule production deployments during low-traffic periods
- Have rollback plan ready
- Monitor after deployment

### 6. Monitoring

- Check workflow status regularly
- Review security alerts
- Monitor deployment health
- Set up notifications

</details>



<details>
<summary><b>Workflow Status</b></summary>
<br/>

Check the status of all workflows:

```bash
# List recent workflow runs
gh run list

# View specific workflow
gh run view RUN_ID

# Re-run failed workflow
gh run rerun RUN_ID
```

</details>



<details>
<summary><b>Additional Resources</b></summary>
<br/>

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Documentation](https://docs.docker.com/)
- [Dependabot Documentation](https://docs.github.com/en/code-security/dependabot)
- [CodeQL Documentation](https://codeql.github.com/docs/)

</details>



<details>
<summary><b>Support</b></summary>
<br/>

For issues or questions:
- Create an issue in the repository
- Contact the development team
- Check workflow logs for details

---

**Last Updated:** 2026-05-20
**Maintained By:** pitMind Development Team

</details>

---

<div align="center">
  <p>Built for the speed of Formula 1. Engineered for absolute transparency.</p>
  <p><a href="../README.md">🏠 Back to Main README</a></p>
</div>
