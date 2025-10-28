#!/bin/bash
# Run jobs scraper followed by notification sender
# This is the main script to be scheduled in Cronicle for regular job updates

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "[$(date)] ===== Starting scrape and notify workflow ====="

# Step 1: Scrape new jobs
echo "[$(date)] Step 1: Scraping jobs..."
./run-jobs-scraper.sh

# Step 2: Send notifications for new jobs
echo "[$(date)] Step 2: Sending notifications..."
./run-notification-sender.sh

echo "[$(date)] ===== Scrape and notify workflow completed ====="

