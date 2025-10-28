# Production Docker Configuration

This directory contains production-ready Docker configuration for deploying DOU Jobs Scraper.

## 📁 Files Overview

### Docker Configuration

- **`Dockerfile.bot`** - Production Dockerfile for bot service (includes API server and Web App)
- **`Dockerfile.scraper`** - Production Dockerfile for scraper tasks
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

```bash
# Run Prisma migrations
docker compose run --rm bot npm run -w @repo/database db:push

# Scrape initial data
./run-category-scraper.sh
./run-location-scraper.sh
./run-jobs-scraper.sh
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
| `bot` | 3000 | Telegram bot + API + Web App |

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

# Create backup
docker compose exec postgres pg_dump -U postgres dou_jobs > backup.sql

# Restore from backup
docker compose exec -T postgres psql -U postgres dou_jobs < backup.sql
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

