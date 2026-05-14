#!/usr/bin/env bash
set -e

echo "🧹 Cleaning old temp container if exists..."
docker rm -f api_tmp 2>/dev/null || true

echo "🐳 Building Docker image..."
docker build -t api-build .

echo "📦 Creating temporary container..."
docker create --name api_tmp api-build >/dev/null

echo "📤 Copying binary from container..."
docker cp api_tmp:/app/server ./wafrs-server

echo "🧹 Removing temp container..."
docker rm api_tmp >/dev/null

echo "🚀 Uploading to WAFRS server..."
scp ./wafrs-server main@206.81.23.12:/home/main/wafrs-server

echo "✅ Done. Binary uploaded to server."