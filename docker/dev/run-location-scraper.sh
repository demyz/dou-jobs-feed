#!/bin/bash

# Script to run location scraper in Docker
# This script is designed to be called by cron

# Change to the directory where docker-compose.yml is located
cd "$(dirname "$0")"

# Run the location scraper (container will stop after completion)
docker compose --profile cron run --rm location-scraper

# Log the completion
echo "Location scraper completed at $(date)"

