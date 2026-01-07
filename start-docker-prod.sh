#!/bin/bash

# SafeSpace Backend - Docker Production Startup Script
# This script builds and starts the microservices in Docker

set -e

echo "🚀 SafeSpace Backend - Docker Production Startup"
echo "================================================"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create a .env file based on .env.example"
    exit 1
fi

echo "✅ .env file found"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running!"
    echo "Please start Docker Desktop and try again"
    exit 1
fi

echo "✅ Docker is running"
echo ""

# Stop any running local services
echo "🛑 Stopping local services (if running)..."
pkill -f "tsx watch" || true
echo ""

# Build services
echo "🔨 Building Docker images..."
docker-compose -f docker-compose.prod.yml build
echo ""

# Start services
echo "🚀 Starting services..."
docker-compose -f docker-compose.prod.yml up -d
echo ""

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check service health
echo ""
echo "🏥 Checking service health..."
echo ""

check_service() {
    local service_name=$1
    local port=$2
    
    if curl -s http://localhost:$port/health > /dev/null 2>&1; then
        echo "✅ $service_name is healthy (port $port)"
    else
        echo "⚠️  $service_name is not responding yet (port $port)"
    fi
}

check_service "Auth Service" 3002
check_service "Content Service" 3004
check_service "Media Service" 3010

echo ""
echo "📊 Docker containers status:"
docker-compose -f docker-compose.prod.yml ps
echo ""

echo "================================================"
echo "✅ SafeSpace Backend is running in Docker!"
echo ""
echo "Services:"
echo "  - Auth Service:    http://localhost:3002"
echo "  - Content Service: http://localhost:3004"
echo "  - Media Service:   http://localhost:3010"
echo "  - PostgreSQL:      localhost:5432"
echo "  - Redis:           localhost:6379"
echo ""
echo "Useful commands:"
echo "  - View logs:       docker-compose -f docker-compose.prod.yml logs -f"
echo "  - Stop services:   docker-compose -f docker-compose.prod.yml down"
echo "  - Restart service: docker-compose -f docker-compose.prod.yml restart <service-name>"
echo ""
echo "================================================"

