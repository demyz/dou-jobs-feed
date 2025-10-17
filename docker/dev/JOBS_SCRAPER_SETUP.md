# Jobs Scraper Setup

## Description

The `jobs-scraper` service parses jobs from DOU.ua RSS feeds for all active categories and saves them to the database.

## How It Works

1. Gets all active categories from the database (`isActive = true`)
2. Parses RSS feed for each category
3. Extracts job information:
   - Job ID (douId) from URL
   - Company slug and name
   - Title, description, publication date
4. Saves jobs to the database (creates new or updates existing)
5. Automatically creates companies if they don't exist in the database

## Manual Run

### Via npm (locally)

```bash
cd scraper
npm run task:jobs
```

### Via Docker script

```bash
cd docker/dev
./run-jobs-scraper.sh
```

### Via docker compose directly

```bash
cd docker/dev
docker compose --profile cron run --rm jobs-scraper
```

## Cron Setup

### 1. Open the crontab editor:

```bash
crontab -e
```

### 2. Add a Job

For example, to run every hour:

```cron
0 * * * * /Users/demyz/we/dou-jobs-scraper/docker/dev/run-jobs-scraper.sh >> /var/log/jobs-scraper.log 2>&1
```

Or every 30 minutes:

```cron
*/30 * * * * /Users/demyz/we/dou-jobs-scraper/docker/dev/run-jobs-scraper.sh >> /var/log/jobs-scraper.log 2>&1
```

### 3. Schedule Examples

```cron
# Every hour
0 * * * * /path/to/run-jobs-scraper.sh

# Every 30 minutes
*/30 * * * * /path/to/run-jobs-scraper.sh

# Every 2 hours
0 */2 * * * /path/to/run-jobs-scraper.sh

# Every day at 9:00 AM, 12:00 PM, 3:00 PM, 6:00 PM
0 9,12,15,18 * * * /path/to/run-jobs-scraper.sh

# Every weekday at 10:00 AM
0 10 * * 1-5 /path/to/run-jobs-scraper.sh
```

## Viewing Logs

Logs are saved to the file specified in crontab (e.g., `/var/log/jobs-scraper.log`).

To view:

```bash
tail -f /var/log/jobs-scraper.log
```

Or view container logs (if it's still running):

```bash
docker logs dou-jobs-jobs-scraper
```

## Verification

Check that cron is configured correctly:

```bash
crontab -l
```

## Schedule Recommendations

- **Frequent parsing (every 30 minutes)**: To get new jobs as quickly as possible
- **Medium parsing (every hour)**: Balance between freshness and server load
- **Rare parsing (every 2-3 hours)**: To minimize load

**Recommended schedule**: Every hour (0 * * * *)

## Important

- Make sure the script path is absolute
- Make sure Docker is running and accessible
- Make sure the user running cron has permission to execute Docker commands
- Category scraper must be run at least once before jobs scraper (to create categories)

## Notes

- The script automatically handles errors and continues working, even if some jobs fail to process
- Duplicate jobs (by douId) are updated, not created again
- Companies are created automatically when adding the first job
