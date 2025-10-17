#!/bin/bash

# Script to run jobs scraper in Docker
# This script is designed to be called by cron

# Change to the directory where docker-compose.yml is located
cd "$(dirname "$0")"

# Run the jobs scraper (container will stop after completion)
docker compose --profile cron run --rm jobs-scraper

# Log the completion
echo "Jobs scraper completed at $(date)"

