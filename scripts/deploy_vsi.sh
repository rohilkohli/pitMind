#!/bin/bash
# pitMind VSI Deployment Automation Script
# Run this script on your IBM Cloud VPC Virtual Server Instance (Ubuntu 22.04 LTS recommended)

set -e

# Harmonious F1 styling log outputs
RED='\033[0;31m'
NC='\033[0m' # No Color
GREEN='\033[0;32m'
YELLOW='\033[1;33m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 1. System Updates
log_info "Updating system packages..."
sudo apt-get update -y
sudo apt-get upgrade -y

# 2. Install Prerequisites
log_info "Installing prerequisites (curl, git, zip, unzip, apt-transport-https, ca-certificates)..."
sudo apt-get install -y curl git zip unzip apt-transport-https ca-certificates gnupg lsb-release

# 3. Install Docker Engine
if ! command -v docker &> /dev/null; then
    log_info "Docker not found. Installing Docker Engine..."
    sudo mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

    sudo apt-get update -y
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    
    # Add current user to docker group
    sudo usermod -aG docker $USER
    log_info "Docker Engine installed. Added $USER to 'docker' group."
else
    log_info "Docker Engine is already installed."
fi

# 4. Clone / Pull Repository
REPO_DIR="$HOME/pitMind"
if [ -d "$REPO_DIR/backend" ]; then
    log_info "pitMind application code already present in $REPO_DIR. Skipping git clone."
else
    if [ ! -d "$REPO_DIR" ]; then
        log_info "Cloning pitMind repository to $REPO_DIR..."
        git clone https://github.com/rohilG/pitMind.git "$REPO_DIR"
    else
        log_info "pitMind directory already exists. Pulling latest updates..."
        cd "$REPO_DIR"
        git pull
    fi
fi

cd "$REPO_DIR"

# 5. Environment configuration setup
if [ ! -f ".env" ]; then
    log_warn ".env file not found. Creating a template from .env.example..."
    cp .env.example .env
    log_warn "Please open $REPO_DIR/.env and populate it with your IBM Watsonx and Firebase API keys!"
else
    log_info ".env file is present."
fi

# 6. Run the production deployment
log_info "Starting production deployment with Docker Compose..."
sudo docker compose -f docker-compose.prod.yml up -d --build

log_info "Deployment completed successfully!"
log_info "Verify status using: sudo docker compose -f docker-compose.prod.yml ps"
log_info "Web application available on port 80, Backend API routed via reverse proxy."
log_warn "Remember to log out and log back in for docker group memberships to take effect if you ran docker for the first time."
