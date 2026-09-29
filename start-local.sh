#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
if [ ! -f .env.local ]; then
  echo "ERROR: .env.local is missing. Copy .env.example to .env.local and add Supabase keys first."
  exit 1
fi
if [ ! -d node_modules ]; then
  npm install
fi
npm run dev
