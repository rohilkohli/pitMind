#!/bin/bash
set -euo pipefail

###############################################################################
# PitMind — IBM Cloud Code Engine Deployment Script
# Region: eu-de (Frankfurt)
# Registry: de.icr.io
# Resource Group: Default
# Code Engine Project: pitmind
# Container Registry Namespace: pitmind
###############################################################################

REGION="eu-de"
REGISTRY="de.icr.io"
RG="Default"
CE_PROJECT="pitmind"
ICR_NS="pitmind"
BACKEND_IMAGE="${REGISTRY}/${ICR_NS}/pitmind-backend:latest"
FRONTEND_IMAGE="${REGISTRY}/${ICR_NS}/pitmind-frontend:latest"

# Backend env vars
WATSONX_URL="https://us-south.ml.cloud.ibm.com"
WATSONX_PROJECT_ID="e789fe82-1589-4560-a62e-bcf040fefb73"
WATSONX_MODEL_ID="ibm/granite-3-1-8b-instruct"
HF_MODEL_ID="ibm-granite/granite-3.1-8b-instruct"
RATE_LIMIT_PER_MINUTE="120"

# Firebase vars (for frontend build)
VITE_FIREBASE_API_KEY="AIzaSyDZcrYfZkK2cgExm50CPy_msZLU4msqg64"
VITE_FIREBASE_AUTH_DOMAIN="pitminds-ibm.firebaseapp.com"
VITE_FIREBASE_DATABASE_URL="https://pitminds-ibm-default-rtdb.firebaseio.com"
VITE_FIREBASE_PROJECT_ID="pitminds-ibm"
VITE_FIREBASE_STORAGE_BUCKET="pitminds-ibm.firebasestorage.app"
VITE_FIREBASE_MESSAGING_SENDER_ID="957707571161"
VITE_FIREBASE_APP_ID="1:957707571161:web:38f19bd536e344c4d6d3c8"
VITE_FIREBASE_WEB_API_KEY="AIzaSyDZcrYfZkK2cgExm50CPy_msZLU4msqg64"

echo "═══════════════════════════════════════════════════════"
echo "  PitMind Deployment — IBM Cloud Code Engine (eu-de)"
echo "═══════════════════════════════════════════════════════"

###############################################################################
# STEP 1: Target region + resource group
###############################################################################
echo ""
echo "▸ Step 1: Targeting region ${REGION} and resource group ${RG}..."
ibmcloud target -r "$REGION" -g "$RG"

###############################################################################
# STEP 2: Create or verify ICR namespace
###############################################################################
echo ""
echo "▸ Step 2: Creating Container Registry namespace '${ICR_NS}'..."
ibmcloud cr region-set "$REGION"
ibmcloud cr namespace-add "$ICR_NS" -g "$RG" 2>/dev/null || echo "  Namespace '${ICR_NS}' already exists, reusing."
echo "  ✔ ICR namespace ready."

###############################################################################
# STEP 3: Log in to Container Registry
###############################################################################
echo ""
echo "▸ Step 3: Logging in to Container Registry..."
ibmcloud cr login
echo "  ✔ Logged in to ${REGISTRY}."

###############################################################################
# STEP 4: Clone repo (if not present) and build backend image
###############################################################################
echo ""
echo "▸ Step 4: Building backend image..."
if [ ! -d "$HOME/pitMind" ]; then
  echo "  Cloning repository..."
  cd "$HOME"
  git clone https://github.com/rohilkohli/pitMind.git
fi
cd "$HOME/pitMind/backend"

docker build -t "$BACKEND_IMAGE" .
echo "  ✔ Backend image built: ${BACKEND_IMAGE}"

###############################################################################
# STEP 5: Push backend image
###############################################################################
echo ""
echo "▸ Step 5: Pushing backend image to ICR..."
docker push "$BACKEND_IMAGE"
echo "  ✔ Backend image pushed."

###############################################################################
# STEP 6: Create or verify Code Engine project
###############################################################################
echo ""
echo "▸ Step 6: Setting up Code Engine project '${CE_PROJECT}'..."
ibmcloud ce project create --name "$CE_PROJECT" 2>/dev/null || echo "  Project '${CE_PROJECT}' already exists."
ibmcloud ce project select --name "$CE_PROJECT"
echo "  ✔ Code Engine project '${CE_PROJECT}' selected."

###############################################################################
# STEP 7: Create registry secret for pulling images
###############################################################################
echo ""
echo "▸ Step 7: Creating registry access secret..."
IAM_TOKEN=$(ibmcloud iam oauth-tokens --output json | jq -r '.iam_token' | awk '{print $2}')
ibmcloud ce registry create \
  --name icr-secret \
  --server "$REGISTRY" \
  --username iamapikey \
  --password "$IAM_TOKEN" \
  2>/dev/null || echo "  Registry secret 'icr-secret' already exists, updating..."

# If it already existed, update it
ibmcloud ce registry update \
  --name icr-secret \
  --server "$REGISTRY" \
  --username iamapikey \
  --password "$IAM_TOKEN" \
  2>/dev/null || true

echo "  ✔ Registry secret ready."

###############################################################################
# STEP 8: Deploy backend app
###############################################################################
echo ""
echo "▸ Step 8: Deploying backend application..."

# Check if app already exists
if ibmcloud ce app get --name pitmind-backend &>/dev/null; then
  echo "  App exists, updating..."
  ibmcloud ce app update \
    --name pitmind-backend \
    --image "$BACKEND_IMAGE" \
    --registry-secret icr-secret \
    --port 8000 \
    --cpu 0.5 \
    --memory 1G \
    --min-scale 1 \
    --max-scale 3 \
    --env WATSONX_URL="$WATSONX_URL" \
    --env WATSONX_PROJECT_ID="$WATSONX_PROJECT_ID" \
    --env WATSONX_MODEL_ID="$WATSONX_MODEL_ID" \
    --env HF_MODEL_ID="$HF_MODEL_ID" \
    --env RATE_LIMIT_PER_MINUTE="$RATE_LIMIT_PER_MINUTE" \
    --env ENVIRONMENT="production" \
    --env BACKEND_CORS_ORIGINS="*"
else
  echo "  Creating new app..."
  ibmcloud ce app create \
    --name pitmind-backend \
    --image "$BACKEND_IMAGE" \
    --registry-secret icr-secret \
    --port 8000 \
    --cpu 0.5 \
    --memory 1G \
    --min-scale 1 \
    --max-scale 3 \
    --env WATSONX_URL="$WATSONX_URL" \
    --env WATSONX_PROJECT_ID="$WATSONX_PROJECT_ID" \
    --env WATSONX_MODEL_ID="$WATSONX_MODEL_ID" \
    --env HF_MODEL_ID="$HF_MODEL_ID" \
    --env RATE_LIMIT_PER_MINUTE="$RATE_LIMIT_PER_MINUTE" \
    --env ENVIRONMENT="production" \
    --env BACKEND_CORS_ORIGINS="*"
fi
echo "  ✔ Backend app deployed."

###############################################################################
# STEP 9: Read back backend URL
###############################################################################
echo ""
echo "▸ Step 9: Reading backend URL..."
BACKEND_URL=$(ibmcloud ce app get --name pitmind-backend --output json | jq -r '.status.url')
echo "  ✔ Backend URL: ${BACKEND_URL}"

###############################################################################
# STEP 10: Build frontend image with backend URL baked in
###############################################################################
echo ""
echo "▸ Step 10: Building frontend image..."
cd "$HOME/pitMind/frontend"

docker build \
  --build-arg VITE_API_BASE_URL="$BACKEND_URL" \
  --build-arg VITE_FIREBASE_API_KEY="$VITE_FIREBASE_API_KEY" \
  --build-arg VITE_FIREBASE_AUTH_DOMAIN="$VITE_FIREBASE_AUTH_DOMAIN" \
  --build-arg VITE_FIREBASE_DATABASE_URL="$VITE_FIREBASE_DATABASE_URL" \
  --build-arg VITE_FIREBASE_PROJECT_ID="$VITE_FIREBASE_PROJECT_ID" \
  --build-arg VITE_FIREBASE_STORAGE_BUCKET="$VITE_FIREBASE_STORAGE_BUCKET" \
  --build-arg VITE_FIREBASE_MESSAGING_SENDER_ID="$VITE_FIREBASE_MESSAGING_SENDER_ID" \
  --build-arg VITE_FIREBASE_APP_ID="$VITE_FIREBASE_APP_ID" \
  --build-arg VITE_FIREBASE_WEB_API_KEY="$VITE_FIREBASE_WEB_API_KEY" \
  -t "$FRONTEND_IMAGE" .

echo "  ✔ Frontend image built: ${FRONTEND_IMAGE}"

###############################################################################
# STEP 11: Push frontend image
###############################################################################
echo ""
echo "▸ Step 11: Pushing frontend image to ICR..."
docker push "$FRONTEND_IMAGE"
echo "  ✔ Frontend image pushed."

###############################################################################
# STEP 12: Deploy frontend app
###############################################################################
echo ""
echo "▸ Step 12: Deploying frontend application..."

if ibmcloud ce app get --name pitmind-frontend &>/dev/null; then
  echo "  App exists, updating..."
  ibmcloud ce app update \
    --name pitmind-frontend \
    --image "$FRONTEND_IMAGE" \
    --registry-secret icr-secret \
    --port 8080 \
    --cpu 0.25 \
    --memory 0.5G \
    --min-scale 1 \
    --max-scale 3
else
  echo "  Creating new app..."
  ibmcloud ce app create \
    --name pitmind-frontend \
    --image "$FRONTEND_IMAGE" \
    --registry-secret icr-secret \
    --port 8080 \
    --cpu 0.25 \
    --memory 0.5G \
    --min-scale 1 \
    --max-scale 3
fi
echo "  ✔ Frontend app deployed."

###############################################################################
# STEP 13: Read back frontend URL
###############################################################################
echo ""
echo "▸ Step 13: Reading frontend URL..."
FRONTEND_URL=$(ibmcloud ce app get --name pitmind-frontend --output json | jq -r '.status.url')
echo "  ✔ Frontend URL: ${FRONTEND_URL}"

###############################################################################
# STEP 14: Update backend CORS with frontend URL
###############################################################################
echo ""
echo "▸ Step 14: Updating backend CORS to allow frontend..."
ibmcloud ce app update \
  --name pitmind-backend \
  --env BACKEND_CORS_ORIGINS="${FRONTEND_URL},http://localhost:5173,http://localhost:8080"
echo "  ✔ Backend CORS updated."

###############################################################################
# STEP 15: Verify both apps
###############################################################################
echo ""
echo "▸ Step 15: Verifying deployments..."
echo ""
echo "  Testing backend health..."
sleep 10
HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "${BACKEND_URL}/health" 2>/dev/null || echo "000")
if [ "$HEALTH" = "200" ]; then
  echo "  ✔ Backend is healthy (HTTP 200)"
else
  echo "  ⚠ Backend returned HTTP ${HEALTH} — may still be starting up"
fi

echo ""
echo "  Testing frontend..."
FE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${FRONTEND_URL}" 2>/dev/null || echo "000")
if [ "$FE_STATUS" = "200" ]; then
  echo "  ✔ Frontend is reachable (HTTP 200)"
else
  echo "  ⚠ Frontend returned HTTP ${FE_STATUS} — may still be starting up"
fi

###############################################################################
# STEP 16: Final Summary
###############################################################################
echo ""
echo "═══════════════════════════════════════════════════════"
echo "  ✅ PitMind Deployment Complete!"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "  🔌 Backend API:  ${BACKEND_URL}"
echo "  🌐 Frontend UI:  ${FRONTEND_URL}"
echo "  📊 API Docs:     ${BACKEND_URL}/docs"
echo "  💚 Health Check: ${BACKEND_URL}/health"
echo ""
echo "  Region:    ${REGION}"
echo "  Registry:  ${REGISTRY}/${ICR_NS}"
echo "  Project:   ${CE_PROJECT}"
echo ""
echo "═══════════════════════════════════════════════════════"
