# Quick Start

## First Run

### 1. Start PostgreSQL

```bash
cd docker/dev
docker compose up -d postgres
```

Wait for the database to start (check healthcheck):
```bash
docker compose ps
```

### 2. Apply Database Migration

```bash
cd scraper
npm run db:push
```

Or if you want to create a migration file:
```bash
npm run db:migrate
```

### 3. Run Category Scraper (first time)

```bash
npm run task:categories
```

This will create ~58 categories in the database.

### 4. Run Jobs Scraper

```bash
npm run task:jobs
```

This will load all jobs from active categories.

## Checking Results

### Via Prisma Studio

```bash
cd docker/dev
docker compose up -d prisma-studio
```

Open http://localhost:5555

### Via psql

```bash
docker exec -it dou-jobs-postgres psql -U postgres -d dou_jobs
```

```sql
-- Number of categories
SELECT COUNT(*) FROM "JobCategory";

-- Number of companies
SELECT COUNT(*) FROM "Company";

-- Number of jobs
SELECT COUNT(*) FROM "Job";

-- Last 10 jobs
SELECT j.title, c.name as company, jc.name as category, j."publishedAt"
FROM "Job" j
JOIN "Company" c ON j."companyId" = c.id
JOIN "JobCategory" jc ON j."categoryId" = jc.id
ORDER BY j."publishedAt" DESC
LIMIT 10;
```

## Automation

See [CRON_SETUP.md](docker/dev/CRON_SETUP.md) and [JOBS_SCRAPER_SETUP.md](docker/dev/JOBS_SCRAPER_SETUP.md)

## Troubleshooting

### Database Won't Start

```bash
# Check logs
docker logs dou-jobs-postgres

# Remove data and start fresh
cd docker/dev
docker compose down
rm -rf ../../db/*
docker compose up -d postgres
```

### Migration Error

Make sure that:
1. PostgreSQL is running
2. DATABASE_URL in .env is correct
3. Port is not occupied by another process

### Cannot Parse Jobs

Check:
1. Are there active categories: `SELECT * FROM "JobCategory" WHERE "isActive" = true;`
2. Is DOU website accessible: `curl https://jobs.dou.ua/vacancies/feeds/`
3. Scraper logs

## Useful Commands

```bash
# Stop all containers
docker compose down

# Restart database
docker compose restart postgres

# Clean Docker logs
docker system prune

# View logs
docker logs dou-jobs-postgres -f
docker logs dou-jobs-jobs-scraper -f

# Regenerate Prisma client
cd scraper
npm run db:generate
```
