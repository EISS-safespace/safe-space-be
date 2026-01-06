#!/bin/bash

# SafeSpace Microservices Startup Script
# This script starts all microservices in development mode

echo "🚀 Starting SafeSpace Microservices..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if running in Docker or local
if [ "$1" == "docker" ]; then
    echo "${BLUE}Starting services with Docker Compose...${NC}"
    docker-compose up -d
    echo ""
    echo "${GREEN}✅ All services started!${NC}"
    echo ""
    echo "Services running:"
    echo "  - API Gateway:      http://localhost:3001"
    echo "  - Auth Service:     http://localhost:3002"
    echo "  - Content Service:  http://localhost:3004"
    echo "  - Media Service:    http://localhost:3010"
    echo "  - PostgreSQL:       localhost:5432"
    echo "  - Redis:            localhost:6379"
    echo ""
    echo "View logs: docker-compose logs -f"
    echo "Stop services: docker-compose down"
else
    echo "${BLUE}Starting services in development mode...${NC}"
    echo ""
    
    # Check if node_modules exist
    if [ ! -d "services/auth-service/node_modules" ]; then
        echo "Installing Auth Service dependencies..."
        cd services/auth-service && npm install && cd ../..
    fi
    
    if [ ! -d "services/content-service/node_modules" ]; then
        echo "Installing Content Service dependencies..."
        cd services/content-service && npm install && cd ../..
    fi
    
    if [ ! -d "services/media-service/node_modules" ]; then
        echo "Installing Media Service dependencies..."
        cd services/media-service && npm install && cd ../..
    fi
    
    if [ ! -d "api-gateway/node_modules" ]; then
        echo "Installing API Gateway dependencies..."
        cd api-gateway && npm install && cd ..
    fi
    
    echo ""
    echo "${GREEN}✅ Dependencies installed!${NC}"
    echo ""
    echo "To start services, open 4 terminal windows and run:"
    echo ""
    echo "Terminal 1: cd services/auth-service && npm run dev"
    echo "Terminal 2: cd services/content-service && npm run dev"
    echo "Terminal 3: cd services/media-service && npm run dev"
    echo "Terminal 4: cd api-gateway && npm run dev"
    echo ""
    echo "Or use Docker: ./start-microservices.sh docker"
fi

