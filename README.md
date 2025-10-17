# DOU Jobs Scraper

A system for scraping job listings from [DOU.ua](https://jobs.dou.ua/) with subsequent notification delivery via Telegram bot.

## Architecture

The project consists of several modules:

- **Scraper** - parsing jobs and categories from DOU.ua
- **Bot** - Telegram bot for category subscriptions (in development)
- **Database** - PostgreSQL database

## Project Structure

```
dou-jobs-scraper/
├── scraper/              # Node.js scraper
│   ├── src/
│   │   ├── modules/
│   │   │   ├── job-categories/    # Category parsing
│   │   │   └── jobs/              # Job parsing
│   │   ├── tasks/                 # Tasks to run
│   │   └── core/                  # Common utilities
│   └── prisma/                    # Database schema
├── bot/                  # Telegram bot (in development)
├── docker/dev/          # Docker configuration for dev
└── db/                  # PostgreSQL data
```

## Scrapers

### 1. Category Scraper

Parses the list of categories from DOU.ua and saves them to the database.

**Run frequency**: Once a day (categories rarely change)

**Run**:
```bash
cd scraper
npm run task:categories
```

**Docker**:
```bash
cd docker/dev
./run-category-scraper.sh
```

Details: [CRON_SETUP.md](docker/dev/CRON_SETUP.md)

### 2. Jobs Scraper

Parses jobs from RSS feeds for all active categories.

**Run frequency**: Every hour (recommended)

**Run**:
```bash
cd scraper
npm run task:jobs
```

**Docker**:
```bash
cd docker/dev
./run-jobs-scraper.sh
```

Details: [JOBS_SCRAPER_SETUP.md](docker/dev/JOBS_SCRAPER_SETUP.md)

## Database

### Models

- **JobCategory** - job categories (Frontend, Backend, etc.)
- **Company** - companies posting jobs
- **Job** - job listings
- **User** - Telegram bot users
- **UserSubscription** - user subscriptions to categories

### Schema

```prisma
model JobCategory {
  id              String
  name            String
  slug            String @unique
  rssUrl          String
  isActive        Boolean
  jobs            Job[]
  subscriptions   UserSubscription[]
}

model Company {
  id        String
  slug      String @unique
  name      String
  jobs      Job[]
}

model Job {
  id          String
  douId       Int @unique
  title       String
  url         String
  companyId   String
  categoryId  String
  description String
  publishedAt DateTime
  closedAt    DateTime?
}
```

## Installation and Setup

### Requirements

- Node.js 20+
- Docker and Docker Compose
- PostgreSQL 16 (via Docker)

### Initial Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd dou-jobs-scraper
   ```

2. **Set up environment**
   ```bash
   cd scraper
   cp .env.example .env
   # Edit .env if necessary
   ```

3. **Start Docker containers**
   ```bash
   cd docker/dev
   docker compose up -d postgres
   ```

4. **Install dependencies**
   ```bash
   cd scraper
   npm install
   ```

5. **Apply database migrations**
   ```bash
   cd scraper
   npm run db:push
   # or
   npm run db:migrate
   ```

6. **Run Category Scraper (first time)**
   ```bash
   npm run task:categories
   ```

7. **Run Jobs Scraper**
   ```bash
   npm run task:jobs
   ```

### Development

**Run Prisma Studio** (database viewer):
```bash
cd docker/dev
docker compose up prisma-studio
```

Open http://localhost:5555

**Update database schema**:
```bash
cd scraper
# Edit prisma/schema.prisma
npm run db:generate
npm run db:push
```

## Automation (Cron)

### Setting up Automatic Execution

1. Open crontab:
   ```bash
   crontab -e
   ```

2. Add jobs:
   ```cron
   # Category Scraper - once a day at 3:00 AM
   0 3 * * * /Users/demyz/we/dou-jobs-scraper/docker/dev/run-category-scraper.sh >> /var/log/category-scraper.log 2>&1

   # Jobs Scraper - every hour
   0 * * * * /Users/demyz/we/dou-jobs-scraper/docker/dev/run-jobs-scraper.sh >> /var/log/jobs-scraper.log 2>&1
   ```

## Technologies

- **Node.js** + **TypeScript** - main language
- **Prisma** - ORM for database
- **PostgreSQL** - database
- **RSS Parser** - RSS feed parsing
- **Cheerio** - HTML parsing
- **Axios** - HTTP client
- **Pino** - logging
- **Docker** - containerization

## Roadmap

- [x] Category parsing
- [x] Job parsing
- [ ] Check for closed jobs (via Company API)
- [ ] Telegram bot for subscriptions
- [ ] Send notifications about new jobs
- [ ] Filter jobs by keywords
- [ ] Web UI for subscription management

## License

MIT
