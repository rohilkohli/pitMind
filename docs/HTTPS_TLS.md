# HTTPS/TLS Configuration Guide

Complete guide for configuring HTTPS/TLS for pitMind in production environments.

## Table of Contents

- [Overview](#overview)
- [Certificate Management](#certificate-management)
- [Nginx SSL Configuration](#nginx-ssl-configuration)
- [Docker Compose SSL Setup](#docker-compose-ssl-setup)
- [Load Balancer SSL Termination](#load-balancer-ssl-termination)
- [Security Best Practices](#security-best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

HTTPS/TLS is essential for production deployments to:
- Encrypt data in transit
- Authenticate server identity
- Meet compliance requirements
- Enable modern web features (WebSockets over WSS, HTTP/2)

### Recommended Approach

**For Production**: Use Let's Encrypt with automatic renewal
**For Development**: Use self-signed certificates
**For Enterprise**: Use your organization's CA-signed certificates

## Certificate Management

### Option 1: Let's Encrypt (Recommended)

Let's Encrypt provides free, automated SSL certificates.

#### Using Certbot

```bash
# Install Certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate (interactive)
sudo certbot --nginx -d pitmind.example.com -d www.pitmind.example.com

# Test automatic renewal
sudo certbot renew --dry-run
```

#### Using Docker Certbot

```yaml
# docker-compose.certbot.yml
version: '3.8'

services:
  certbot:
    image: certbot/certbot:latest
    volumes:
      - ./certbot/conf:/etc/letsencrypt
      - ./certbot/www:/var/www/certbot
    entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h & wait $${!}; done;'"
```

#### Initial Certificate Acquisition

```bash
# Create directories
mkdir -p certbot/conf certbot/www

# Get certificate
docker-compose -f docker-compose.certbot.yml run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email admin@example.com \
  --agree-tos \
  --no-eff-email \
  -d pitmind.example.com
```

### Option 2: Self-Signed Certificates (Development)

```bash
# Generate self-signed certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ./certs/privkey.pem \
  -out ./certs/fullchain.pem \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

# Create dhparam for additional security
openssl dhparam -out ./certs/dhparam.pem 2048
```

### Option 3: CA-Signed Certificates (Enterprise)

```bash
# Generate CSR
openssl req -new -newkey rsa:2048 -nodes \
  -keyout ./certs/privkey.pem \
  -out ./certs/request.csr \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=pitmind.example.com"

# Submit request.csr to your CA
# Receive fullchain.pem from CA
# Place in ./certs/ directory
```

## Nginx SSL Configuration

### Basic SSL Configuration

Create `nginx-ssl.conf`:

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name pitmind.example.com;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS Server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name pitmind.example.com;
    
    # SSL Certificate Configuration
    ssl_certificate /etc/letsencrypt/live/pitmind.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/pitmind.example.com/privkey.pem;
    
    # SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;
    
    # SSL Session Configuration
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_session_tickets off;
    
    # OCSP Stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    ssl_trusted_certificate /etc/letsencrypt/live/pitmind.example.com/chain.pem;
    resolver 8.8.8.8 8.8.4.4 valid=300s;
    resolver_timeout 5s;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer" always;
    
    # Frontend
    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://backend:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # WebSocket Support
    location /api/v1/stream/ {
        proxy_pass http://backend:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }
}
```

### Advanced SSL Configuration

For enhanced security, add to your Nginx configuration:

```nginx
# Diffie-Hellman parameter for DHE ciphersuites
ssl_dhparam /etc/nginx/dhparam.pem;

# Enable HTTP/2
http2_max_field_size 16k;
http2_max_header_size 32k;

# Rate limiting for SSL handshakes
limit_req_zone $binary_remote_addr zone=ssl_limit:10m rate=10r/s;
limit_req zone=ssl_limit burst=20 nodelay;
```

## Docker Compose SSL Setup

### Production Docker Compose with SSL

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx-ssl.conf:/etc/nginx/conf.d/default.conf:ro
      - ./frontend/dist:/usr/share/nginx/html:ro
      - ./certbot/conf:/etc/letsencrypt:ro
      - ./certbot/www:/var/www/certbot:ro
      - ./certs/dhparam.pem:/etc/nginx/dhparam.pem:ro
    depends_on:
      - backend
    restart: unless-stopped
    networks:
      - pitmind-network

  certbot:
    image: certbot/certbot:latest
    volumes:
      - ./certbot/conf:/etc/letsencrypt
      - ./certbot/www:/var/www/certbot
    entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h & wait $${!}; done;'"
    networks:
      - pitmind-network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - SECURE_COOKIES=true
      - CORS_ORIGINS=https://pitmind.example.com
    expose:
      - "8000"
    restart: unless-stopped
    networks:
      - pitmind-network

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=${POSTGRES_DB}
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - postgres-data:/var/lib/postgresql/data
    restart: unless-stopped
    networks:
      - pitmind-network

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis-data:/data
    restart: unless-stopped
    networks:
      - pitmind-network

volumes:
  postgres-data:
  redis-data:

networks:
  pitmind-network:
    driver: bridge
```

### Environment Variables for SSL

Create `.env.prod`:

```bash
# Database
DATABASE_URL=postgresql://user:password@postgres:5432/pitmind
POSTGRES_DB=pitmind
POSTGRES_USER=pitmind_user
POSTGRES_PASSWORD=secure_password_here

# Redis
REDIS_URL=redis://:redis_password@redis:6379/0
REDIS_PASSWORD=secure_redis_password

# SSL/Security
SECURE_COOKIES=true
CORS_ORIGINS=https://pitmind.example.com,https://www.pitmind.example.com

# Domain
DOMAIN=pitmind.example.com
EMAIL=admin@example.com
```

## Load Balancer SSL Termination

### AWS Application Load Balancer

```yaml
# ALB Configuration (Terraform example)
resource "aws_lb" "pitmind" {
  name               = "pitmind-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = var.public_subnet_ids

  enable_deletion_protection = true
  enable_http2              = true
}

resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.pitmind.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01"
  certificate_arn   = aws_acm_certificate.pitmind.arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.pitmind.arn
  }
}

resource "aws_lb_listener" "http_redirect" {
  load_balancer_arn = aws_lb.pitmind.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type = "redirect"
    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}
```

### Nginx as Reverse Proxy with SSL Termination

```nginx
# External Nginx (SSL termination)
upstream pitmind_backend {
    least_conn;
    server backend1:8000 max_fails=3 fail_timeout=30s;
    server backend2:8000 max_fails=3 fail_timeout=30s;
    keepalive 32;
}

server {
    listen 443 ssl http2;
    server_name pitmind.example.com;
    
    ssl_certificate /etc/letsencrypt/live/pitmind.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/pitmind.example.com/privkey.pem;
    
    location / {
        proxy_pass http://pitmind_backend;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header Host $host;
    }
}
```

## Security Best Practices

### 1. Certificate Security

- **Store private keys securely**: Use restrictive file permissions (600)
- **Rotate certificates**: Set up automatic renewal
- **Use strong key sizes**: Minimum 2048-bit RSA or 256-bit ECDSA
- **Monitor expiration**: Set up alerts 30 days before expiry

```bash
# Set proper permissions
chmod 600 /etc/letsencrypt/live/*/privkey.pem
chmod 644 /etc/letsencrypt/live/*/fullchain.pem
```

### 2. TLS Configuration

- **Use TLS 1.2 and 1.3 only**: Disable older protocols
- **Strong cipher suites**: Prioritize forward secrecy
- **Enable HSTS**: Force HTTPS for all connections
- **OCSP Stapling**: Improve performance and privacy

### 3. Security Headers

```nginx
# Comprehensive security headers
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';" always;
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
```

### 4. Certificate Pinning (Advanced)

For mobile apps or high-security requirements:

```python
# Backend: Add HPKP header (use with caution)
response.headers["Public-Key-Pins"] = (
    'pin-sha256="base64+primary=="; '
    'pin-sha256="base64+backup=="; '
    'max-age=5184000; includeSubDomains'
)
```

### 5. Monitoring and Alerts

```bash
# Check certificate expiration
openssl x509 -in /etc/letsencrypt/live/pitmind.example.com/cert.pem -noout -dates

# Monitor SSL/TLS configuration
curl -I https://pitmind.example.com

# Use SSL Labs for comprehensive testing
# https://www.ssllabs.com/ssltest/
```

## Troubleshooting

### Common Issues

#### 1. Certificate Not Found

```bash
# Check certificate location
ls -la /etc/letsencrypt/live/pitmind.example.com/

# Verify Nginx can read certificates
sudo nginx -t
```

#### 2. Mixed Content Warnings

Ensure all resources use HTTPS:

```javascript
// Frontend: Use relative URLs or HTTPS
const API_URL = window.location.protocol === 'https:' 
  ? 'https://api.pitmind.example.com'
  : 'http://localhost:8000';
```

#### 3. WebSocket Connection Fails

```nginx
# Ensure WebSocket upgrade headers are set
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
proxy_read_timeout 86400;
```

#### 4. Certificate Renewal Fails

```bash
# Check Certbot logs
sudo tail -f /var/log/letsencrypt/letsencrypt.log

# Manually renew
sudo certbot renew --force-renewal

# Test renewal process
sudo certbot renew --dry-run
```

#### 5. SSL Handshake Errors

```bash
# Test SSL connection
openssl s_client -connect pitmind.example.com:443 -servername pitmind.example.com

# Check cipher compatibility
nmap --script ssl-enum-ciphers -p 443 pitmind.example.com
```

### Testing SSL Configuration

```bash
# Test with curl
curl -vI https://pitmind.example.com

# Test with openssl
echo | openssl s_client -connect pitmind.example.com:443 -servername pitmind.example.com 2>/dev/null | openssl x509 -noout -dates

# Check security headers
curl -I https://pitmind.example.com | grep -i "strict-transport-security\|x-frame-options\|x-content-type"
```

### Performance Optimization

```nginx
# Enable SSL session caching
ssl_session_cache shared:SSL:50m;
ssl_session_timeout 1d;

# Enable OCSP stapling
ssl_stapling on;
ssl_stapling_verify on;

# Optimize buffer sizes
ssl_buffer_size 4k;
```

## Additional Resources

- [Mozilla SSL Configuration Generator](https://ssl-config.mozilla.org/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [SSL Labs Server Test](https://www.ssllabs.com/ssltest/)
- [OWASP TLS Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Transport_Layer_Protection_Cheat_Sheet.html)

## Next Steps

1. Choose certificate management approach
2. Configure Nginx with SSL
3. Update Docker Compose for production
4. Test SSL configuration
5. Set up monitoring and alerts
6. Document certificate renewal process

For production deployment, see [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md).