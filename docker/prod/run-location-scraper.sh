#!/bin/bash
# Run location scraper as a one-off task
# This script should be executed manually or by Cronicle when locations need updating

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "[$(date)] Starting location scraper..."

# Run the location-scraper service with the cron profile
docker compose --profile cron run --rm location-scraper

echo "[$(date)] Location scraper completed successfully"

