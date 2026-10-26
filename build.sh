#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "==> Installing Python dependencies..."
pip install --upgrade pip
pip install -r backend/requirements.txt

echo "==> Building React Frontend..."
cd frontend
npm install
npm run build
cd ..

echo "==> Build complete!"
