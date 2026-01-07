#!/bin/bash

# SafeSpace Backend - Docker Startup Script
# Starts all microservices and infrastructure using Docker Compose

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Docker Compose file
COMPOSE_FILE="docker-compose.dev.yml"

# Function to print colored messages
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_message "$RED" "❌ Docker is not running. Please start Docker Desktop."
        exit 1
    fi
    print_message "$GREEN" "✅ Docker is running"
}

# Function to check if .env file exists
check_env() {
    if [ ! -f .env ]; then
        print_message "$YELLOW" "⚠️  .env file not found. Creating from .env.example..."
        if [ -f .env.example ]; then
            cp .env.example .env
            print_message "$GREEN" "✅ Created .env file. Please update it with your values."
        else
            print_message "$RED" "❌ .env.example not found. Please create .env manually."
            exit 1
        fi
    else
        print_message "$GREEN" "✅ .env file found"
    fi
}

# Function to start services
start_services() {
    print_message "$BLUE" "🐳 Starting SafeSpace microservices with Docker..."
    echo ""
    
    # Build and start services
    docker-compose -f $COMPOSE_FILE up -d --build
    
    echo ""
    print_message "$GREEN" "✅ Services started successfully!"
    echo ""
    
    # Show running containers
    print_message "$BLUE" "📦 Running containers:"
    docker-compose -f $COMPOSE_FILE ps
    
    echo ""
    print_message "$YELLOW" "⏳ Waiting for services to be healthy..."
    sleep 10
    
    # Check health endpoints
    echo ""
    print_message "$BLUE" "🏥 Health Check:"
    
    check_health "Auth Service" "http://localhost:3002/health"
    check_health "Content Service" "http://localhost:3004/health"
    check_health "Media Service" "http://localhost:3010/health"
    
    echo ""
    print_message "$GREEN" "🎉 All services are up and running!"
    echo ""
    print_message "$BLUE" "📊 View logs with: docker-compose -f $COMPOSE_FILE logs -f"
    print_message "$BLUE" "🛑 Stop services with: docker-compose -f $COMPOSE_FILE down"
    echo ""
}

# Function to check health endpoint
check_health() {
    local service_name=$1
    local url=$2
    
    if curl -s -f "$url" > /dev/null 2>&1; then
        print_message "$GREEN" "  ✅ $service_name: Healthy"
    else
        print_message "$YELLOW" "  ⚠️  $service_name: Not ready yet (may need more time)"
    fi
}

# Function to stop services
stop_services() {
    print_message "$YELLOW" "🛑 Stopping SafeSpace microservices..."
    docker-compose -f $COMPOSE_FILE down
    print_message "$GREEN" "✅ Services stopped"
}

# Function to show logs
show_logs() {
    print_message "$BLUE" "📊 Showing logs (Ctrl+C to exit)..."
    docker-compose -f $COMPOSE_FILE logs -f
}

# Function to show status
show_status() {
    print_message "$BLUE" "📊 Service Status:"
    docker-compose -f $COMPOSE_FILE ps
}

# Main script
echo ""
print_message "$BLUE" "╔════════════════════════════════════════╗"
print_message "$BLUE" "║  SafeSpace Backend - Docker Manager   ║"
print_message "$BLUE" "╚════════════════════════════════════════╝"
echo ""

# Parse command
case "${1:-start}" in
    start)
        check_docker
        check_env
        start_services
        ;;
    stop)
        stop_services
        ;;
    restart)
        stop_services
        sleep 2
        check_docker
        check_env
        start_services
        ;;
    logs)
        show_logs
        ;;
    status)
        show_status
        ;;
    clean)
        print_message "$YELLOW" "🧹 Cleaning up (removing volumes)..."
        docker-compose -f $COMPOSE_FILE down -v
        print_message "$GREEN" "✅ Cleanup complete"
        ;;
    rebuild)
        print_message "$YELLOW" "🔨 Rebuilding services..."
        docker-compose -f $COMPOSE_FILE down
        docker-compose -f $COMPOSE_FILE up -d --build
        print_message "$GREEN" "✅ Rebuild complete"
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|logs|status|clean|rebuild}"
        echo ""
        echo "Commands:"
        echo "  start   - Start all services (default)"
        echo "  stop    - Stop all services"
        echo "  restart - Restart all services"
        echo "  logs    - Show service logs"
        echo "  status  - Show service status"
        echo "  clean   - Stop services and remove volumes"
        echo "  rebuild - Rebuild and restart services"
        exit 1
        ;;
esac

