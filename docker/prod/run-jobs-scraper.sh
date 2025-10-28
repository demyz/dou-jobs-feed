#!/bin/bash
# Run jobs scraper as a one-off task
# This script should be executed by Cronicle or cron

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "[$(date)] Starting jobs scraper..."

# Run the jobs-scraper service with the cron profile
docker compose --profile cron run --rm jobs-scraper

echo "[$(date)] Jobs scraper completed successfully"

