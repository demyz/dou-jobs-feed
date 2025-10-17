# Cron Setup for Category Scraper

## Description

The `category-scraper` service runs in a separate container that automatically stops after completing the task.

## Manual Run

To run manually:

```bash
cd docker/dev
./run-category-scraper.sh
```

Or directly via docker compose:

```bash
cd docker/dev
docker compose --profile cron run --rm category-scraper
```

## Cron Setup

### 1. Open the crontab editor:

```bash
crontab -e
```

### 2. Add a Job

For example, to run every day at 3:00 AM:

```cron
0 3 * * * /Users/demyz/we/dou-jobs-scraper/docker/dev/run-category-scraper.sh >> /var/log/category-scraper.log 2>&1
```

Or every 6 hours:

```cron
0 */6 * * * /Users/demyz/we/dou-jobs-scraper/docker/dev/run-category-scraper.sh >> /var/log/category-scraper.log 2>&1
```

### 3. Schedule Examples

```cron
# Every day at 3:00 AM
0 3 * * * /path/to/run-category-scraper.sh

# Every 12 hours
0 */12 * * * /path/to/run-category-scraper.sh

# Every Monday at 2:00 AM
0 2 * * 1 /path/to/run-category-scraper.sh

# Every day at 3:00 AM and 3:00 PM
0 3,15 * * * /path/to/run-category-scraper.sh
```

## Viewing Logs

Logs are saved to the file specified in crontab (e.g., `/var/log/category-scraper.log`).

To view:

```bash
tail -f /var/log/category-scraper.log
```

Or view container logs (if it's still running):

```bash
docker logs dou-jobs-category-scraper
```

## Verification

Check that cron is configured correctly:

```bash
crontab -l
```

## Important

- Make sure the script path is absolute
- Make sure Docker is running and accessible
- Make sure the user running cron has permission to execute Docker commands
