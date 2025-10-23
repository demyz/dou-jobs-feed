# DOU Jobs Scraper & Telegram Bot

A complete system for scraping job listings from [DOU.ua](https://jobs.dou.ua/) and delivering notifications via Telegram bot with Web App interface.

## 🏗 Architecture

The project is built as a **monorepo** consisting of three main services:

```
/
├── packages/
│   └── database/           # Shared Prisma database package
│       └── prisma/
├── scraper/                # Job scraping service
│   └── src/
├── bot/                    # Telegram Bot + API service
│   ├── src/
│   │   ├── bot/           # Grammy bot logic
│   │   ├── api/           # Express REST API
│   │   ├── notifications/ # Notification sender
│   │   └── shared/        # Config, logger
│   └── public/            # Built webapp (served by API)
├── webapp/                 # Telegram Web App (Svelte)
│   └── src/
│       ├── pages/         # Settings & JobDetails
│       ├── components/    # CategoryItem, etc.
│       └── lib/           # API client, Telegram SDK
└── docker/dev/            # Docker configuration
```

## 🚀 Features

- **Job Scraping**: Automatic parsing of jobs from DOU.ua RSS feeds
- **Category & Location Scraping**: Parse available categories and locations
- **Telegram Bot**: Interactive bot with `/start` and `/settings` commands
- **Web App Interface**: Modern Svelte-based UI for managing subscriptions
- **Smart Subscriptions**: Subscribe to categories with optional location filters
- **Notifications**: Receive new job postings based on your subscriptions
- **Database**: PostgreSQL with Prisma ORM
- **Docker Support**: Full containerization for easy deployment

## 📦 Services

### 1. Database Package (`packages/database`)

Shared Prisma schema and client used by both scraper and bot services.

**Models**:
- `User` - Telegram users
- `UserSettings` - User preferences
- `UserSubscription` - Category subscriptions
- `UserLocationSubscription` - Location filters for subscriptions
- `JobCategory` - Job categories (Frontend, Backend, etc.)
- `Location` - Job locations (cities)
- `Company` - Companies
- `Job` - Job listings
- `JobLocation` - Job-location relationships

### 2. Scraper Service (`scraper`)

Parses jobs, categories, and locations from DOU.ua.

**Tasks**:
- `task:categories` - Scrape categories (run once or when categories change)
- `task:locations` - Scrape locations (run once or when locations change)
- `task:jobs` - Scrape jobs from RSS feeds (run hourly)

### 3. Bot Service (`bot`)

Telegram bot with integrated API server for Web App.

**Components**:
- **Grammy Bot**: Long polling Telegram bot
- **Express API**: REST API for Web App
- **Notification Service**: Sends job notifications to subscribed users
- **Web App**: Served as static files from `/public`

### 4. Web App (`webapp`)

Svelte-based Telegram Mini App for subscription management.

**Pages**:
- **Settings**: Manage category and location subscriptions
- **Job Details**: View full job description

## 🛠 Installation

### Prerequisites

- Node.js 20+
- Docker and Docker Compose
- Telegram Bot Token (from [@BotFather](https://t.me/BotFather))

### Step 1: Clone & Setup

```bash
git clone <repository-url>
cd dou-jobs-scraper

# Install dependencies for all workspaces
npm install
```

### Step 2: Configure Environment

Create `.env` file in the project root:

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/dou_jobs?schema=public

# Telegram Bot
TELEGRAM_BOT_TOKEN=your_bot_token_here

# API Server
API_PORT=3000
WEBAPP_URL=https://your-domain.com

# Environment
NODE_ENV=development
```

**For local development**, use [ngrok](https://ngrok.com/) for HTTPS:
```bash
ngrok http 3000
# Copy the HTTPS URL to WEBAPP_URL
```

See [TELEGRAM_BOT_SETUP.md](docker/dev/TELEGRAM_BOT_SETUP.md) for detailed bot configuration.

### Step 3: Generate Prisma Client

```bash
npm run db:generate
```

### Step 4: Start Services

```bash
cd docker/dev
docker compose up -d
```

This starts:
- `postgres` - PostgreSQL database
- `bot` - Telegram bot + API server
- `prisma-studio` - Database UI (http://localhost:5555)

### Step 5: Initialize Data

First time only - scrape categories and locations:

```bash
cd docker/dev

# Scrape categories
docker compose --profile cron run --rm category-scraper

# Scrape locations
docker compose --profile cron run --rm location-scraper
```

### Step 6: Test the Bot

1. Open your bot in Telegram
2. Send `/start`
3. Click "⚙️ Manage Subscriptions"
4. Select categories and locations
5. Save subscriptions

## 🔄 Running Scrapers & Notifications

### Manual Execution

```bash
cd docker/dev

# Run jobs scraper + send notifications
./run-scrape-and-notify.sh
```

This script:
1. Scrapes new jobs from DOU.ua
2. Sends notifications to subscribed users

### Automated Execution (Cron)

Add to your crontab:

```cron
# Run every hour
0 * * * * cd /path/to/dou-jobs-scraper/docker/dev && ./run-scrape-and-notify.sh >> /var/log/dou-jobs.log 2>&1
```

## 🔧 Development

### Workspace Commands

```bash
# Generate Prisma client
npm run db:generate

# Push schema changes to database
npm run db:push

# Create migration
npm run db:migrate

# Run bot locally
npm run -w bot dev

# Run scraper task
npm run -w scraper task:jobs

# Build webapp
npm run -w webapp build
```

### Docker Commands

```bash
cd docker/dev

# Start all services
docker compose up -d

# View logs
docker compose logs -f bot
docker compose logs -f postgres

# Stop services
docker compose down

# Rebuild services
docker compose build bot
docker compose up -d bot
```

### Database Viewer

Prisma Studio is automatically started and available at:
```
http://localhost:5555
```

## 📚 API Endpoints

All endpoints require Telegram Web App `initData` authentication.

```
GET  /health                - Health check
GET  /api/categories        - Get all active categories
GET  /api/locations         - Get all active locations
GET  /api/subscriptions     - Get user's subscriptions
POST /api/subscriptions     - Save user's subscriptions
GET  /api/jobs/:id          - Get job details
```

## 🎨 Tech Stack

### Backend
- **Node.js** + **TypeScript**
- **Prisma** - Database ORM
- **PostgreSQL** - Database
- **Grammy** - Telegram Bot framework
- **Express** - REST API
- **Pino** - Logging

### Frontend (Web App)
- **Svelte 4** - UI framework
- **Vite** - Build tool
- **Telegram Web App SDK** - Telegram integration

### Infrastructure
- **Docker** + **Docker Compose**
- **npm Workspaces** - Monorepo management

## 📖 Documentation

- [Telegram Bot Setup Guide](docker/dev/TELEGRAM_BOT_SETUP.md) - Detailed bot configuration
- [Cron Setup](docker/dev/CRON_SETUP.md) - Scraper automation
- [Jobs Scraper Setup](docker/dev/JOBS_SCRAPER_SETUP.md) - Scraper details

## 🎯 Roadmap

- [x] Category scraping
- [x] Location scraping
- [x] Job scraping from RSS
- [x] Full description parsing from job pages
- [x] Telegram bot with Web App
- [x] Subscription management UI
- [x] Smart notifications with filters
- [ ] Check for closed jobs
- [ ] Keyword filtering
- [ ] Salary range filtering
- [ ] Analytics dashboard

## 📝 License

MIT

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request.
