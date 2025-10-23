#!/bin/bash
set -e

echo "========================================="
echo "Starting Jobs Scraper..."
echo "========================================="

# Run jobs scraper
docker compose --profile cron run --rm jobs-scraper

echo ""
echo "========================================="
echo "Jobs scraper completed successfully!"
echo "Starting Notification Sender..."
echo "========================================="

# Run notification sender (only after jobs scraper completes)
docker compose --profile cron run --rm notification-sender

echo ""
echo "========================================="
echo "All done! ✓"
echo "========================================="


