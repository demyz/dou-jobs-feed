#!/bin/bash

# Script to run category scraper in Docker
# This script is designed to be called by cron

# Change to the directory where docker-compose.yml is located
cd "$(dirname "$0")"

# Run the category scraper (container will stop after completion)
docker compose --profile cron run --rm category-scraper

# Log the completion
echo "Category scraper completed at $(date)"

