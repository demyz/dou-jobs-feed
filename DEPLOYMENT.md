# Production Deployment Guide

This guide covers deploying DOU Jobs Scraper to your VPS using Coolify with GitHub integration.

## 🚀 TL;DR (Quick Overview)

1. **Coolify** handles auto-deployment from GitHub
2. **Database migrations** run automatically on every deployment - no manual intervention needed!
3. **Cronicle** manages scheduled scraping tasks (hourly job scraper)
4. Just push to GitHub, Coolify deploys, migrations run, bot starts 🎉

## Table of Contents

- [Prerequisites](#prerequisites)
- [Architecture Overview](#architecture-overview)
- [Initial Setup](#initial-setup)
- [Coolify Configuration](#coolify-configuration)
- [Environment Variables](#environment-variables)
- [Database Migration](#database-migration)
- [Cronicle Setup](#cronicle-setup)
- [Monitoring & Logs](#monitoring--logs)
- [Troubleshooting](#troubleshooting)
- [Updating the Application](#updating-the-application)

## Prerequisites

Before deploying, ensure you have:

- ✅ VPS with Docker and Docker Compose installed
- ✅ [Coolify](https://coolify.io/) installed and running on your VPS
- ✅ GitHub repository with your code
- ✅ Domain name (optional, but recommended for Telegram Web App)
- ✅ Telegram Bot Token from [@BotFather](https://t.me/BotFather)
- ✅ [Cronicle](https://github.com/jhuckaby/Cronicle) installed for cron jobs (optional)

### System Requirements

- **CPU**: 2+ cores recommended
- **RAM**: 2GB minimum, 4GB recommended
- **Storage**: 10GB+ (for Docker images and database)
- **OS**: Ubuntu 20.04+ or any Linux with Docker support

## Architecture Overview

The production deployment consists of:

1. **PostgreSQL Database** - Runs in Docker container with persistent volume
2. **Bot Service** - Telegram bot + Express API server + Web App
3. **Scraper Services** - One-off containers triggered by Cronicle:
   - Jobs scraper (hourly)
   - Category scraper (rarely, manual)
   - Location scraper (rarely, manual)
   - Notification sender (after jobs scraper)

```
┌─────────────┐
│   GitHub    │
│ Repository  │
└──────┬──────┘
       │ Webhook
       ▼
┌─────────────┐
│   Coolify   │
│   (Auto     │
│   Deploy)   │
└──────┬──────┘
       │
       ▼
┌──────────────────────────────────┐
│          VPS Server              │
│                                  │
│  ┌──────────┐    ┌───────────┐  │
│  │ Postgres │    │    Bot    │  │
│  │   :5432  │◄───│  :3000    │  │
│  └──────────┘    └───────────┘  │
│                                  │
│  ┌────────────────────────────┐ │
│  │       Cronicle             │ │
│  │  ┌──────────────────────┐  │ │
│  │  │ Hourly Jobs Scraper  │  │ │
│  │  │ + Notifications      │  │ │
│  │  └──────────────────────┘  │ │
│  └────────────────────────────┘ │
└──────────────────────────────────┘
```

## Initial Setup

### 1. Prepare Your Repository

Ensure your code is pushed to GitHub with the production configuration:

```bash
# From your local machine
git add .
git commit -m "Add production deployment configuration"
git push origin main
```

### 2. Configure Telegram Bot

If not already done:

1. Create a bot via [@BotFather](https://t.me/BotFather)
2. Get the bot token (format: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`)
3. Set up the Web App:
   - Use `/newapp` in BotFather
   - Set the Web App URL to your domain (e.g., `https://yourdomain.com`)

### 3. Domain Setup (Optional but Recommended)

For Telegram Web App to work properly, you need HTTPS:

1. Point your domain to your VPS IP address
2. Configure Coolify to use your domain
3. Coolify will automatically set up SSL with Let's Encrypt

## Coolify Configuration

### 1. Add New Resource

1. Log in to your Coolify dashboard
2. Click **"+ New Resource"**
3. Select **"Docker Compose"**

### 2. Configure Repository

1. **Source**: Select your GitHub repository
2. **Branch**: `main` (or your production branch)
3. **Docker Compose Location**: `docker/prod/docker-compose.yml`
4. **Auto Deploy**: Enable (deploys on every push to main)

### 3. Configure Services

Coolify will detect services from `docker-compose.yml`:

#### Enable These Services:
- ✅ **postgres** - Always running (database)
- ✅ **migrate** - Runs once on each deployment (automatic migrations)
- ✅ **bot** - Always running (Telegram bot + API + Web App)

#### Disable These Services (run via Cronicle):
- ❌ **category-scraper** - One-off task
- ❌ **location-scraper** - One-off task
- ❌ **jobs-scraper** - One-off task
- ❌ **notification-sender** - One-off task

**Note:** The `migrate` service automatically runs before `bot` starts, so your database schema is always up-to-date.

### 4. Configure Networking

For the **bot** service:

1. **Port Mapping**: `3000:3000`
2. **Domain**: Add your domain (e.g., `jobs.yourdomain.com`)
3. **HTTPS**: Enable (Coolify handles SSL automatically)

## Environment Variables

In Coolify, add these environment variables to your resource:

### Required Variables

```env
# Database
DATABASE_URL=postgresql://postgres:STRONG_PASSWORD_HERE@postgres:5432/dou_jobs?schema=public
POSTGRES_USER=postgres
POSTGRES_PASSWORD=STRONG_PASSWORD_HERE
POSTGRES_DB=dou_jobs
POSTGRES_PORT=5432

# Telegram
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz

# API
API_PORT=3000
WEBAPP_URL=https://yourdomain.com

# Environment
NODE_ENV=production
```

### Security Notes

- ⚠️ **Never commit secrets to git**
- ⚠️ Use strong passwords for `POSTGRES_PASSWORD`
- ⚠️ Keep your `TELEGRAM_BOT_TOKEN` secret

## Database Migration

### Automatic Migrations

✨ **Good news!** Migrations now run automatically on every deployment.

The `docker-compose.yml` includes a `migrate` service that:
- Runs automatically when you deploy
- Executes before the bot starts
- Applies Prisma schema changes to the database
- Exits after completion (doesn't keep running)

**No manual action needed!** Just deploy, and migrations happen automatically.

### How It Works

1. Coolify pulls your latest code
2. `postgres` container starts and becomes healthy
3. `migrate` service runs `prisma db push`
4. After migration succeeds, `bot` service starts
5. Your app is ready with the latest database schema

### Manual Migration (if needed)

If you ever need to run migrations manually:

```bash
# SSH into your VPS
ssh user@your-vps-ip

# Navigate to your project (Coolify stores projects in /data/coolify/)
cd /data/coolify/applications/YOUR_APP_ID

# Run migration
docker compose run --rm migrate
```

**Finding Your App Path in Coolify:**
- Option 1: Check Coolify UI → Your App → Settings → Project Root
- Option 2: Run `docker ps` to see container names, then use `docker inspect` to find the path
- Option 3: Migrations run automatically anyway, so you usually don't need this!

### Initial Data Setup

After first deployment, populate initial data using Cronicle jobs or manually:

```bash
cd /data/coolify/applications/YOUR_APP_ID/docker/prod

# Scrape categories (run once)
./run-category-scraper.sh

# Scrape locations (run once)
./run-location-scraper.sh

# Scrape initial jobs (run once, or wait for cron)
./run-jobs-scraper.sh
```

Or simply set up Cronicle jobs (see below) and let them run on schedule.

## Cronicle Setup

Cronicle will manage scheduled tasks for scraping and notifications.

### 1. Install Cronicle (if not already installed)

Follow the [official installation guide](https://github.com/jhuckaby/Cronicle#installation).

### 2. Add Server to Cronicle

1. Open Cronicle web interface
2. Go to **Servers** → **Add Server**
3. Add your VPS server

### 3. Create Plugin

Create a Shell Script plugin for running Docker commands.

### 4. Configure Jobs

#### Job 1: Scrape Jobs & Send Notifications (Hourly)

- **Title**: DOU Jobs Scraper + Notifications
- **Plugin**: Shell Script
- **Schedule**: Every hour (e.g., `0 * * * *`)
- **Command**:
  ```bash
  cd /path/to/your/app/docker/prod && ./run-scrape-and-notify.sh
  ```

#### Job 2: Update Categories (Manual/Rare)

- **Title**: Update Categories
- **Plugin**: Shell Script
- **Schedule**: Manual or monthly
- **Command**:
  ```bash
  cd /path/to/your/app/docker/prod && ./run-category-scraper.sh
  ```

#### Job 3: Update Locations (Manual/Rare)

- **Title**: Update Locations
- **Plugin**: Shell Script
- **Schedule**: Manual or monthly
- **Command**:
  ```bash
  cd /path/to/your/app/docker/prod && ./run-location-scraper.sh
  ```

### 5. Make Scripts Executable

```bash
cd /path/to/your/app/docker/prod
chmod +x *.sh
```

## Monitoring & Logs

### View Service Logs

```bash
cd /path/to/coolify/deployments/your-app/docker/prod

# View bot logs
docker compose logs -f bot

# View postgres logs
docker compose logs -f postgres

# View last 100 lines
docker compose logs --tail=100 bot
```

### Check Service Health

```bash
# Check running containers
docker compose ps

# Check bot health endpoint
curl http://localhost:3000/health
```

### Database Backup

```bash
# Create backup
docker compose exec postgres pg_dump -U postgres dou_jobs > backup_$(date +%Y%m%d).sql

# Restore from backup
docker compose exec -T postgres psql -U postgres dou_jobs < backup_20240101.sql
```

### Monitor Disk Usage

```bash
# Check Docker disk usage
docker system df

# Check database size
docker compose exec postgres psql -U postgres -c "SELECT pg_size_pretty(pg_database_size('dou_jobs'));"
```

## Troubleshooting

### Bot Not Starting

1. Check logs: `docker compose logs bot`
2. Verify environment variables are set
3. Check database connection: `docker compose exec bot node -e "console.log(process.env.DATABASE_URL)"`

### Database Connection Issues

1. Verify postgres is running: `docker compose ps postgres`
2. Check healthcheck: `docker compose exec postgres pg_isready -U postgres`
3. Verify DATABASE_URL format

### Web App Not Loading

1. Check WEBAPP_URL matches your domain
2. Verify HTTPS is enabled in Coolify
3. Check bot is serving static files: `curl https://yourdomain.com`

### Scraper Fails

1. Check logs in Cronicle
2. Verify database connection
3. Test manually: `cd docker/prod && ./run-jobs-scraper.sh`

## Updating the Application

Coolify auto-deploys when you push to GitHub:

```bash
# Make your changes
git add .
git commit -m "Update feature X"
git push origin main
```

Coolify will:
1. Detect the push via webhook
2. Pull latest code
3. Rebuild Docker images
4. Restart services with zero-downtime

### Manual Deployment

If you need to deploy manually:

1. Go to Coolify dashboard
2. Find your resource
3. Click **"Deploy"**

### Rolling Back

If something goes wrong:

1. In Coolify, go to **Deployments**
2. Select a previous deployment
3. Click **"Redeploy"**

## Post-Deployment Checklist

- ✅ Services are running (`docker compose ps`)
- ✅ Bot responds to `/start` command in Telegram
- ✅ Web App opens from bot
- ✅ Database is populated (categories, locations)
- ✅ Cronicle jobs are scheduled
- ✅ HTTPS is working
- ✅ Logs are accessible
- ✅ Backups are configured

## Security Best Practices

1. **Firewall**: Only expose necessary ports (80, 443, 22)
2. **SSH**: Use key-based authentication, disable password auth
3. **Updates**: Keep system and Docker updated
4. **Secrets**: Use Coolify's environment variables (never commit to git)
5. **Database**: Use strong passwords, don't expose port 5432 to internet
6. **Backups**: Set up automated database backups

## Need Help?

- Check [main README](README.md) for architecture details
- Review logs for specific errors
- Check Coolify documentation: https://coolify.io/docs
- Check Cronicle documentation: https://github.com/jhuckaby/Cronicle#documentation

---

**Happy Deploying! 🚀**

