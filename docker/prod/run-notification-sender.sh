#!/bin/bash
# Run notification sender as a one-off task
# This script should be executed by Cronicle after jobs scraper

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "[$(date)] Starting notification sender..."

# Run the notification-sender service with the cron profile
docker compose --profile cron run --rm notification-sender

echo "[$(date)] Notification sender completed successfully"

