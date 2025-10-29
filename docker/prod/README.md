# Production Docker Configuration

This directory contains production-ready Docker configuration for deploying DOU Jobs Scraper.

## 📁 Files Overview

### Docker Configuration

- **`Dockerfile.bot`** - Production Dockerfile for bot service (includes API server and Web App)
- **`Dockerfile.scraper`** - Production Dockerfile for scraper tasks
- **`Dockerfile.migrate`** - Dockerfile for running database migrations
- **`docker-compose.yml`** - Production docker-compose configuration with all services

### Cronicle Scripts

These scripts are meant to be executed by Cronicle or cron:

- **`run-jobs-scraper.sh`** - Scrape new jobs from DOU.ua (schedule: hourly)
- **`run-notification-sender.sh`** - Send notifications to users (run after jobs scraper)
- **`run-scrape-and-notify.sh`** - Combined workflow: scrape jobs + send notifications (recommended)
- **`run-category-scraper.sh`** - Update job categories (schedule: rarely, manual)
- **`run-location-scraper.sh`** - Update locations (schedule: rarely, manual)

## 🚀 Quick Start

### 1. Configure Environment Variables

Copy the environment template and fill in the values:

```bash
cp ../../env.example ../../.env
# Edit .env with your values
```

### 2. Start Services

```bash
# Start main services (postgres, bot)
docker compose up -d

# Check status
docker compose ps
```

### 3. Initialize Database

✨ **Migrations run automatically!** The `migrate` service will handle database setup.

```bash
# Scrape initial data
./run-category-scraper.sh
./run-location-scraper.sh
./run-jobs-scraper.sh
```

If you need to run migrations manually:

```bash
docker compose run --rm migrate
```

### 4. Make Scripts Executable

```bash
chmod +x *.sh
```

## 📋 Service Details

### Long-Running Services

These services run continuously:

| Service | Port | Description |
|---------|------|-------------|
| `postgres` | 5432 | PostgreSQL database |
| `migrate` | - | Database migrations (runs once on startup) |
| `bot` | 3000 | Telegram bot + API + Web App |

**Note:** The `migrate` service runs automatically on each deployment, applies Prisma schema changes, and exits. The `bot` service waits for migrations to complete successfully before starting.

### One-Off Services (Cron Profile)

These services are triggered by Cronicle:

| Service | Command | Frequency |
|---------|---------|-----------|
| `jobs-scraper` | `./run-jobs-scraper.sh` | Hourly |
| `notification-sender` | `./run-notification-sender.sh` | After jobs-scraper |
| `category-scraper` | `./run-category-scraper.sh` | Rarely/Manual |
| `location-scraper` | `./run-location-scraper.sh` | Rarely/Manual |

## 🔧 Common Commands

### View Logs

```bash
# Follow bot logs
docker compose logs -f bot

# View last 100 lines
docker compose logs --tail=100 bot

# View all services
docker compose logs -f
```

### Restart Services

```bash
# Restart bot
docker compose restart bot

# Restart all services
docker compose restart
```

### Update and Rebuild

```bash
# Pull latest changes (if using git on server)
git pull

# Rebuild images
docker compose build

# Restart with new images
docker compose up -d
```

### Run One-Off Tasks Manually

```bash
# Using scripts (recommended)
./run-jobs-scraper.sh

# Or directly with docker compose
docker compose --profile cron run --rm jobs-scraper
```

### Database Operations

```bash
# Connect to database
docker compose exec postgres psql -U postgres -d dou_jobs

# Run migrations manually (if needed)
docker compose run --rm migrate

# Create backup
docker compose exec postgres pg_dump -U postgres dou_jobs > backup.sql

# Restore from backup
docker compose exec -T postgres psql -U postgres dou_jobs < backup.sql
```

### Automatic Migrations

✨ **Database migrations happen automatically on every deployment!**

**How it works:**
1. Coolify detects a push to your repository
2. Docker Compose starts `postgres` service
3. `migrate` service runs after postgres is healthy
4. Prisma applies all schema changes via `db:push`
5. After migrations complete, `bot` service starts
6. Your app is ready with the latest schema

**Benefits:**
- 🚀 No manual intervention needed
- 🔒 Bot won't start with outdated schema
- ✅ Guaranteed consistency between code and database
- 📝 Check `docker compose logs migrate` for migration logs

**Finding Your Project Path in Coolify:**

Coolify typically stores projects in `/data/coolify/applications/YOUR_APP_ID/`

To find your exact path:
```bash
# Option 1: List running containers
docker ps | grep dou-jobs

# Option 2: Inspect a container to find its source path
docker inspect dou-jobs-bot-prod | grep Source

# Option 3: Check Coolify UI → Your App → Settings → Project Root
```

## 🔍 Monitoring

### Check Service Health

```bash
# Check if services are running
docker compose ps

# Test bot health endpoint
curl http://localhost:3000/health
# Expected: {"status":"ok"}

# Check database health
docker compose exec postgres pg_isready -U postgres
```

### Resource Usage

```bash
# View resource usage
docker stats

# Check disk usage
docker system df
```

## 🛠 Troubleshooting

### Bot Won't Start

1. Check logs: `docker compose logs bot`
2. Verify environment variables: `docker compose config`
3. Ensure database is healthy: `docker compose ps postgres`

### Database Connection Issues

1. Verify DATABASE_URL format: `postgresql://user:password@postgres:5432/database`
2. Check postgres health: `docker compose exec postgres pg_isready`
3. Ensure postgres service is running: `docker compose ps postgres`

### Scraper Fails

1. Run manually to see errors: `./run-jobs-scraper.sh`
2. Check logs in Cronicle
3. Verify database connection

## 📚 Additional Documentation

- [Complete Deployment Guide](../../DEPLOYMENT.md) - Full production deployment instructions
- [Main README](../../README.md) - Project overview and architecture
- [Development Setup](../dev/) - Local development environment

## 🔐 Security Notes

- Never commit `.env` file to git
- Use strong passwords for database
- Limit exposed ports (only 3000 for API if needed)
- Keep Docker and system packages updated
- Regular database backups recommended

---

For detailed deployment instructions, see [DEPLOYMENT.md](../../DEPLOYMENT.md).

