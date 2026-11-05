#!/usr/bin/env bash
# BoardTrack launcher for Mac/Linux. Run:  bash start.sh
# It runs the same steps as the README: npm install, create .env, npm start.
cd "$(dirname "$0")" || exit 1

command -v node >/dev/null 2>&1 || { echo "Node.js was not found. Install it from https://nodejs.org and run this again."; exit 1; }

if [ ! -d node_modules ]; then
  echo "Installing packages, please wait..."
  npm install || { echo "npm install failed. See docs/troubleshooting.md"; exit 1; }
fi

if [ ! -f .env ]; then
  cp .env.example .env
  echo "A settings file named .env was just created."
  echo "Edit the DATABASE_URL line with your PostgreSQL username and password, save, then run this again."
  exit 0
fi

echo "Starting BoardTrack at http://localhost:3000 (press Ctrl+C to stop)"
npm start
