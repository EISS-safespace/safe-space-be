#!/bin/bash

# SafeSpace Microservices - Test Runner Script
# Runs all tests for Auth, Content, and Media services

set -e  # Exit on error

echo "🧪 SafeSpace Microservices - Running All Tests"
echo "================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track test results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to run tests for a service
run_service_tests() {
    local service_name=$1
    local service_path=$2
    
    echo -e "${YELLOW}📦 Testing ${service_name}...${NC}"
    echo "-------------------------------------------"
    
    cd "$service_path"
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        echo "📥 Installing dependencies for ${service_name}..."
        npm install --silent
    fi
    
    # Run tests
    if npm test; then
        echo -e "${GREEN}✅ ${service_name} tests passed!${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}❌ ${service_name} tests failed!${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    
    echo ""
    cd - > /dev/null
}

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Run tests for each service
echo "Starting test execution..."
echo ""

run_service_tests "Auth Service" "$SCRIPT_DIR/services/auth-service"
run_service_tests "Content Service" "$SCRIPT_DIR/services/content-service"
run_service_tests "Media Service" "$SCRIPT_DIR/services/media-service"

# Summary
echo "================================================"
echo "🎯 Test Summary"
echo "================================================"
TOTAL_TESTS=$((PASSED_TESTS + FAILED_TESTS))

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed! (${PASSED_TESTS}/${TOTAL_TESTS})${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed! (${PASSED_TESTS}/${TOTAL_TESTS} passed, ${FAILED_TESTS}/${TOTAL_TESTS} failed)${NC}"
    exit 1
fi

