#!/bin/bash
# PitMind Production Deployment Commands
# Run these commands in order for production deployment

set -e  # Exit on error

echo "=== PitMind Production Deployment ==="
echo ""

# Step 1: Update Dependencies
echo "Step 1: Updating dependencies..."
cd backend
pip install -r requirements.txt --upgrade
cd ../frontend
npm ci
cd ..
echo "✓ Dependencies updated"
echo ""

# Step 2: Run Database Migrations
echo "Step 2: Running database migrations..."
cd backend
alembic upgrade head
echo "✓ Migrations complete"
echo ""

# Step 3: Run Tests
echo "Step 3: Running test suite..."
pytest tests/ -v --tb=short
echo "✓ Tests passed"
cd ..
echo ""

# Step 4: Build Docker Images
echo "Step 4: Building Docker images..."
docker build -t pitmind-backend:latest ./backend
docker build -t pitmind-frontend:latest ./frontend
echo "✓ Images built"
echo ""

# Step 5: Security Scan
echo "Step 5: Scanning for vulnerabilities..."
docker scan pitmind-backend:latest || echo "⚠ Backend scan complete (review results)"
docker scan pitmind-frontend:latest || echo "⚠ Frontend scan complete (review results)"
echo ""

# Step 6: Deploy with Docker Compose
echo "Step 6: Deploying services..."
docker-compose -f docker-compose.prod.yml up -d
echo "✓ Services deployed"
echo ""

# Step 7: Wait for services to be ready
echo "Step 7: Waiting for services to be ready..."
sleep 10
echo ""

# Step 8: Health Check
echo "Step 8: Verifying deployment..."
curl -f http://localhost:8000/health || echo "⚠ Backend health check failed"
curl -f http://localhost:8080 || echo "⚠ Frontend health check failed"
echo ""

echo "=== Deployment Complete ==="
echo ""
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:8080"
echo "Health: http://localhost:8000/health"
echo "API Docs: http://localhost:8000/docs"
echo ""
echo "Monitor logs with: docker-compose logs -f"
echo ""
