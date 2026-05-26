<div align="center">

# 📖 Database Setup and Migration Guide
**PitMind Documentation**

[![PitMind Platform](https://img.shields.io/badge/PitMind-Platform-e10600.svg?style=for-the-badge)](#)
[![Return to Home](https://img.shields.io/badge/Return_to_Home-15151e.svg?style=for-the-badge)](../README.md)

</div>

<br/>

> **Overview:** This document outlines the core concepts, configurations, and technical specifications for the **Database Setup and Migration Guide** module within the PitMind AI ecosystem.

---

This guide covers setting up Redis and PostgreSQL for the pitMind project, including running migrations and troubleshooting.



<details>
<summary><b>Overview</b></summary>
<br/>

The pitMind project uses:
- **Redis** for caching, session management, and WebSocket connection tracking
- **PostgreSQL** for persistent storage of audit logs and race sessions
- **Alembic** for database migrations

Both services support **graceful degradation** - the application will continue to function with reduced capabilities if either service is unavailable.

</details>



<details>
<summary><b>Quick Start with Docker Compose</b></summary>
<br/>

The easiest way to run the full stack with Redis and PostgreSQL:

```bash
# Start all services (Redis, PostgreSQL, API, Frontend)
docker-compose up -d

# Check service health
docker-compose ps

# View logs
docker-compose logs -f api
```

</details>



<details>
<summary><b>Local Development Setup</b></summary>
<br/>

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Start Redis (Local)

**Option A: Using Docker**
```bash
docker run -d -p 6379:6379 --name pitmind-redis redis:7-alpine
```

**Option B: Using Local Redis**
```bash
# macOS
brew install redis
brew services start redis

# Ubuntu/Debian
sudo apt-get install redis-server
sudo systemctl start redis

# Windows
# Download from https://redis.io/download or use WSL
```

### 3. Start PostgreSQL (Local)

**Option A: Using Docker**
```bash
docker run -d \
  -p 5432:5432 \
  --name pitmind-postgres \
  -e POSTGRES_DB=pitmind \
  -e POSTGRES_USER=pitmind \
  -e POSTGRES_PASSWORD=pitmind \
  postgres:16-alpine
```

**Option B: Using Local PostgreSQL**
```bash
# macOS
brew install postgresql@16
brew services start postgresql@16
createdb pitmind

# Ubuntu/Debian
sudo apt-get install postgresql-16
sudo systemctl start postgresql
sudo -u postgres createdb pitmind
sudo -u postgres createuser pitmind
```

### 4. Configure Environment Variables

Create or update `.env` file in the project root:

```bash
# Redis Configuration
REDIS_URL=redis://localhost:6379/0
REDIS_MAX_CONNECTIONS=10
REDIS_SOCKET_TIMEOUT=5
REDIS_SOCKET_CONNECT_TIMEOUT=5

# PostgreSQL Configuration
DATABASE_URL=postgresql+asyncpg://pitmind:pitmind@localhost:5432/pitmind
DB_POOL_SIZE=5
DB_MAX_OVERFLOW=10
DB_POOL_TIMEOUT=30
DB_POOL_RECYCLE=3600

# Cache Configuration
CACHE_TTL_DEFAULT=300
CACHE_TTL_SESSION=3600
CACHE_TTL_HEALTH=60
```

### 5. Run Database Migrations

```bash
cd backend

# Initialize Alembic (already done, but for reference)
# alembic init alembic

# Run migrations to create tables
alembic upgrade head

# Verify tables were created
# Connect to PostgreSQL and check:
# psql -U pitmind -d pitmind -c "\dt"
```

</details>



<details>
<summary><b>Database Migrations</b></summary>
<br/>

### Creating a New Migration

When you modify database models, create a new migration:

```bash
cd backend

# Auto-generate migration from model changes
alembic revision --autogenerate -m "Description of changes"

# Review the generated migration file in backend/alembic/versions/
# Edit if necessary, then apply:
alembic upgrade head
```

### Common Migration Commands

```bash
# Show current migration version
alembic current

# Show migration history
alembic history

# Upgrade to latest version
alembic upgrade head

# Upgrade to specific version
alembic upgrade <revision_id>

# Downgrade one version
alembic downgrade -1

# Downgrade to specific version
alembic downgrade <revision_id>

# Downgrade to base (drop all tables)
alembic downgrade base
```

</details>



<details>
<summary><b>Verifying the Setup</b></summary>
<br/>

### Check Redis Connection

```bash
# Using redis-cli
redis-cli ping
# Should return: PONG

# Using Python
python -c "import redis; r = redis.Redis(host='localhost', port=6379); print(r.ping())"
```

### Check PostgreSQL Connection

```bash
# Using psql
psql -U pitmind -d pitmind -c "SELECT version();"

# Using Python
python -c "import asyncpg; import asyncio; asyncio.run(asyncpg.connect('postgresql://pitmind:pitmind@localhost:5432/pitmind'))"
```

### Check API Health

```bash
# Start the API
cd backend
uvicorn main:app --reload

# Check health endpoint (should show Redis and PostgreSQL status)
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "ok",
  "redis": {
    "status": "healthy",
    "connected": true,
    "message": "Redis connection successful"
  },
  "database": {
    "status": "healthy",
    "connected": true,
    "message": "Database connection successful"
  }
}
```

</details>



<details>
<summary><b>Graceful Degradation</b></summary>
<br/>

The application is designed to continue functioning even if Redis or PostgreSQL are unavailable:

### Redis Unavailable
- WebSocket connections tracked in-memory only
- No session state persistence across restarts
- Health metrics not cached
- Application continues to function normally

### PostgreSQL Unavailable
- Audit logs stored in-memory only (lost on restart)
- Strategy recommendations still generated
- Application continues to function normally

### Both Unavailable
- Application runs with in-memory storage only
- All data lost on restart
- Suitable for development/testing

</details>



<details>
<summary><b>Troubleshooting</b></summary>
<br/>

### Redis Connection Issues

```bash
# Check if Redis is running
docker ps | grep redis
# or
redis-cli ping

# Check Redis logs
docker logs pitmind-redis

# Restart Redis
docker restart pitmind-redis
```

### PostgreSQL Connection Issues

```bash
# Check if PostgreSQL is running
docker ps | grep postgres
# or
pg_isready -h localhost -p 5432

# Check PostgreSQL logs
docker logs pitmind-postgres

# Restart PostgreSQL
docker restart pitmind-postgres

# Connect to PostgreSQL shell
docker exec -it pitmind-postgres psql -U pitmind -d pitmind
```

### Migration Issues

```bash
# Check current migration state
alembic current

# If migrations are out of sync, stamp the current version
alembic stamp head

# If you need to reset the database
alembic downgrade base
alembic upgrade head

# If Alembic is confused about the state
# 1. Drop the alembic_version table
# 2. Re-run migrations
psql -U pitmind -d pitmind -c "DROP TABLE IF EXISTS alembic_version;"
alembic upgrade head
```

### Common Error Messages

**"Redis connection failed"**
- Check if Redis is running: `redis-cli ping`
- Verify REDIS_URL in .env
- Check firewall/network settings

**"Database connection failed"**
- Check if PostgreSQL is running: `pg_isready`
- Verify DATABASE_URL in .env
- Check database credentials
- Ensure database exists: `psql -U pitmind -l`

**"Table does not exist"**
- Run migrations: `alembic upgrade head`
- Check migration status: `alembic current`

</details>



<details>
<summary><b>Production Considerations</b></summary>
<br/>

### Security

1. **Change default passwords** in production
2. **Use environment variables** for sensitive data
3. **Enable SSL/TLS** for database connections
4. **Restrict network access** to Redis and PostgreSQL
5. **Use secrets management** (e.g., AWS Secrets Manager, HashiCorp Vault)

### Performance

1. **Connection pooling** is configured by default
2. **Adjust pool sizes** based on load:
   ```bash
   DB_POOL_SIZE=20
   DB_MAX_OVERFLOW=40
   REDIS_MAX_CONNECTIONS=50
   ```
3. **Monitor connection usage** via health endpoints
4. **Enable Redis persistence** for production:
   ```bash
   redis-server --appendonly yes --appendfsync everysec
   ```

### Backup and Recovery

**PostgreSQL Backup:**
```bash
# Backup
docker exec pitmind-postgres pg_dump -U pitmind pitmind > backup.sql

# Restore
docker exec -i pitmind-postgres psql -U pitmind pitmind < backup.sql
```

**Redis Backup:**
```bash
# Backup (RDB snapshot)
docker exec pitmind-redis redis-cli SAVE
docker cp pitmind-redis:/data/dump.rdb ./redis-backup.rdb

# Restore
docker cp ./redis-backup.rdb pitmind-redis:/data/dump.rdb
docker restart pitmind-redis
```

### Monitoring

Monitor these metrics in production:
- Connection pool utilization
- Query performance
- Cache hit rates
- Disk usage
- Memory usage

Use the `/api/v1/metrics/health` endpoint for real-time monitoring.

</details>



<details>
<summary><b>Additional Resources</b></summary>
<br/>

- [Redis Documentation](https://redis.io/documentation)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Alembic Documentation](https://alembic.sqlalchemy.org/)
- [SQLAlchemy Async Documentation](https://docs.sqlalchemy.org/en/20/orm/extensions/asyncio.html)

</details>

---

<div align="center">
  <p>Built for the speed of Formula 1. Engineered for absolute transparency.</p>
  <p><a href="../README.md">🏠 Back to Main README</a></p>
</div>
