#!/bin/bash
# Run category scraper as a one-off task
# This script should be executed manually or by Cronicle when categories need updating

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "[$(date)] Starting category scraper..."

# Run the category-scraper service with the cron profile
docker compose --profile cron run --rm category-scraper

echo "[$(date)] Category scraper completed successfully"

