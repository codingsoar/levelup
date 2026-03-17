#!/usr/bin/env bash
set -euo pipefail

APP_ROOT="/var/www/starquest"
SERVER_DIR="$APP_ROOT/server"

cd "$APP_ROOT"
npm ci
npm run build

cd "$SERVER_DIR"
npm ci

pm2 reload ecosystem.config.js --env production
pm2 save
