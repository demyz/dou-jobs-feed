# Telegram Bot Setup Guide

This guide will help you set up and configure the DOU Jobs Telegram Bot.

## Prerequisites

- Docker and Docker Compose installed
- Telegram account
- HTTPS domain (for production) or ngrok (for local development)

## Step 1: Create Telegram Bot

1. Open Telegram and find [@BotFather](https://t.me/BotFather)

2. Send `/newbot` command

3. Follow the instructions:
   - Choose a name for your bot (e.g., "DOU Jobs Bot")
   - Choose a username for your bot (must end with "bot", e.g., "dou_jobs_bot")

4. You'll receive a **Bot Token** - save it securely. It looks like:
   ```
   1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
   ```

## Step 2: Configure Bot Commands

Send these commands to @BotFather to set up bot commands:

1. `/setcommands`
2. Select your bot
3. Send this text:
   ```
   start - Start the bot
   settings - Manage subscriptions
   ```

## Step 3: Configure Web App Menu Button

1. Send `/setmenubutton` to @BotFather
2. Select your bot
3. Choose "Edit menu button URL"
4. Enter your Web App URL:
   - **Production**: `https://your-domain.com`
   - **Local with ngrok**: `https://your-ngrok-subdomain.ngrok.io`
5. When asked for button text, enter: `⚙️ Settings`

## Step 4: Configure Environment Variables

Create a `.env` file in the project root:

```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/dou_jobs?schema=public

# Telegram Bot
TELEGRAM_BOT_TOKEN=your_bot_token_here

# API Server & Web App
API_PORT=3000
WEBAPP_URL=https://your-domain.com  # or ngrok URL for development

# Environment
NODE_ENV=development
```

## Step 5: Setup HTTPS for Local Development (Optional)

Telegram Web Apps require HTTPS. For local development, use ngrok:

1. Install ngrok: https://ngrok.com/download

2. Start ngrok:
   ```bash
   ngrok http 3000
   ```

3. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)

4. Update `WEBAPP_URL` in `.env` file

5. Update Web App URL in BotFather (Step 3)

## Step 6: Generate Prisma Client & Start Services

```bash
# Generate Prisma client
npm run db:generate

# Start services with Docker Compose
cd docker/dev
docker compose up -d

# Or start bot locally for development
npm run -w bot dev
```

## Step 7: Initialize Database

If this is the first time running, you need to scrape categories and locations:

```bash
# Run category scraper (one-time setup)
docker compose --profile cron run --rm category-scraper

# Run location scraper (one-time setup)
docker compose --profile cron run --rm location-scraper
```

## Step 8: Test the Bot

1. Find your bot in Telegram (search for the username you created)
2. Send `/start` command
3. Click "⚙️ Manage Subscriptions" button
4. Select categories and locations
5. Save subscriptions

## Running Scrapers & Notifications

### Manual Run

```bash
# Run jobs scraper and send notifications
cd docker/dev
./run-scrape-and-notify.sh
```

### Setup Cron Job (Production)

Add to your crontab:

```bash
# Run every hour
0 * * * * cd /path/to/dou-jobs-scraper/docker/dev && ./run-scrape-and-notify.sh >> /var/log/dou-jobs-cron.log 2>&1
```

## Troubleshooting

### Bot doesn't respond
- Check if bot service is running: `docker compose ps`
- Check logs: `docker compose logs bot`
- Verify `TELEGRAM_BOT_TOKEN` in `.env` is correct

### Web App doesn't open
- Verify `WEBAPP_URL` is HTTPS
- Check if API server is accessible: `curl https://your-domain.com/health`
- Verify Web App URL in BotFather is correct

### Notifications not sending
- Check if users have subscriptions: Use Prisma Studio (`docker compose up prisma-studio`)
- Check notification sender logs: `docker compose logs notification-sender`
- Verify bot has permission to send messages to users

## Production Deployment

1. **Setup HTTPS**: Use nginx/caddy as reverse proxy with Let's Encrypt SSL
2. **Environment**: Set `NODE_ENV=production` in `.env`
3. **Bot Token**: Use production bot token
4. **Database**: Use managed PostgreSQL (e.g., AWS RDS, DigitalOcean)
5. **Monitoring**: Setup logging and monitoring (e.g., PM2, DataDog)
6. **Backup**: Schedule database backups
7. **Cron**: Setup reliable cron job or use service like GitHub Actions

## Additional Configuration

### Bot Description

Set bot description in @BotFather:

```
/setdescription
```

Then enter:
```
I help you stay updated with the latest tech job postings from jobs.dou.ua.

Subscribe to your favorite categories and locations, and I'll notify you about new opportunities!
```

### Bot About

```
/setabouttext
```

Then enter:
```
DOU Jobs Bot - Get notified about new tech jobs from jobs.dou.ua
```

### Bot Profile Picture

```
/setuserpic
```

Upload a profile picture for your bot.

## Support

For issues and questions, check the main README.md or create an issue on GitHub.


