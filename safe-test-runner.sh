#!/bin/bash

# Safe test runner script that avoids common crash issues

set -e

echo "=== SAFE TEST RUNNER ==="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKEND_URL="http://localhost:8000"
API_BASE_URL="${BACKEND_URL}/api/v1"
BACKEND_START_SCRIPT="$HOME/dev/manna_cloud/dev/start-server.sh"

# Function to check if port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to kill process on port
kill_port() {
    if check_port $1; then
        echo -e "${YELLOW}Killing process on port $1${NC}"
        lsof -ti:$1 | xargs kill -9 2>/dev/null || true
        sleep 2
    fi
}

# Function to check if backend is available
check_backend() {
    if curl -s -f -o /dev/null "${BACKEND_URL}/docs"; then
        return 0
    else
        return 1
    fi
}

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}Cleaning up...${NC}"

    # Kill dev server if we started it
    if [ ! -z "$DEV_PID" ]; then
        echo "Stopping dev server (PID: $DEV_PID)"
        kill $DEV_PID 2>/dev/null || true
    fi

    # Kill backend server if we started it
    if [ ! -z "$BACKEND_PID" ]; then
        echo "Stopping backend server (PID: $BACKEND_PID)"
        kill $BACKEND_PID 2>/dev/null || true
    fi

    # Clean up any hanging processes
    pkill -f "nuxt dev" 2>/dev/null || true
    pkill -f "next dev" 2>/dev/null || true
    pkill -f "vite" 2>/dev/null || true
    pkill -f "webpack-dev-server" 2>/dev/null || true

    # Clean up frontend ports (3000-3009)
    for port in {3000..3009}; do
        kill_port $port
    done
    kill_port 9229

    echo -e "${GREEN}Cleanup complete${NC}"
}

# Set trap for cleanup on exit
trap cleanup EXIT INT TERM

# Parse arguments
TEST_TYPE=${1:-"all"}
USE_SAFE_CONFIG=${2:-"yes"}

echo "Test type: $TEST_TYPE"
echo "Use safe config: $USE_SAFE_CONFIG"
echo ""

# 1. Pre-flight checks
echo -e "${YELLOW}1. Running pre-flight checks...${NC}"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${RED}node_modules not found. Running npm install...${NC}"
    npm install
fi

# Check if .nuxt exists
if [ ! -d ".nuxt" ]; then
    echo -e "${YELLOW}.nuxt not found. Running nuxt prepare...${NC}"
    npm run postinstall
fi

# 2. Clean up any existing processes
echo -e "${YELLOW}2. Cleaning up existing processes...${NC}"
pkill -f "nuxt dev" 2>/dev/null || true
pkill -f "next dev" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
pkill -f "webpack-dev-server" 2>/dev/null || true
sleep 2

# 3. Check and free up frontend ports (3000-3009)
echo -e "${YELLOW}3. Checking and freeing frontend ports (3000-3009)...${NC}"
for port in {3000..3009}; do
    if check_port $port; then
        echo -e "${YELLOW}Port $port is in use. Freeing it up...${NC}"
        kill_port $port
    fi
done

# 4. Check and start backend server if needed
echo -e "${YELLOW}4. Checking backend server at ${BACKEND_URL}...${NC}"
if check_backend; then
    echo -e "${GREEN}Backend server is already running${NC}"
else
    echo -e "${YELLOW}Backend server not available. Starting it...${NC}"
    if [ -f "$BACKEND_START_SCRIPT" ]; then
        # Copy script to current directory and run it
        cp "$BACKEND_START_SCRIPT" ./temp_start_server.sh
        chmod +x ./temp_start_server.sh
        ./temp_start_server.sh > /tmp/backend-server.log 2>&1 &
        BACKEND_PID=$!

        # Wait for backend to be ready
        echo "Waiting for backend server to start (PID: $BACKEND_PID)..."
        for i in {1..30}; do
            if check_backend; then
                echo -e "${GREEN}Backend server is ready${NC}"
                break
            fi
            echo -n "."
            sleep 2
        done

        if ! check_backend; then
            echo -e "${RED}Backend server failed to start. Check /tmp/backend-server.log${NC}"
            tail -20 /tmp/backend-server.log
            exit 1
        fi

        # Clean up temp script
        rm -f ./temp_start_server.sh
    else
        echo -e "${RED}Backend start script not found at $BACKEND_START_SCRIPT${NC}"
        echo -e "${YELLOW}Continuing without backend server...${NC}"
    fi
fi

# 5. Set environment variables for frontend
export NUXT_PUBLIC_API_BASE_URL="$API_BASE_URL"
export NEXT_PUBLIC_API_BASE_URL="$API_BASE_URL"
export VITE_API_BASE_URL="$API_BASE_URL"
export REACT_APP_API_BASE_URL="$API_BASE_URL"
export VUE_APP_API_BASE_URL="$API_BASE_URL"
echo -e "${BLUE}API URL set to: $API_BASE_URL${NC}"

# 6. Run tests based on type
case $TEST_TYPE in
    "unit")
        echo -e "${GREEN}Running unit tests only...${NC}"
        npx vitest run --no-coverage
        ;;

    "e2e")
        echo -e "${GREEN}Running E2E tests...${NC}"

        # Start dev server manually
        echo -e "${YELLOW}Starting dev server...${NC}"
        npm run dev > /tmp/frontend-dev.log 2>&1 &
        DEV_PID=$!

        # Wait for dev server to be ready
        echo "Waiting for dev server to start (PID: $DEV_PID)..."
        for i in {1..30}; do
            if check_port 3000 || check_port 3001; then
                echo -e "${GREEN}Dev server is ready${NC}"
                break
            fi
            echo -n "."
            sleep 2
        done

        if ! check_port 3000 && ! check_port 3001; then
            echo -e "${RED}Dev server failed to start. Check /tmp/frontend-dev.log${NC}"
            tail -20 /tmp/frontend-dev.log
            exit 1
        fi

        # Run E2E tests with appropriate framework
        echo -e "${YELLOW}Running E2E tests...${NC}"
        # Check for test commands in package.json
        if npm run 2>/dev/null | grep -q "test:e2e"; then
            npm run test:e2e
        elif npm run 2>/dev/null | grep -q "test:playwright"; then
            npm run test:playwright
        elif npm run 2>/dev/null | grep -q "e2e"; then
            npm run e2e
        elif command -v playwright > /dev/null 2>&1 || npx playwright --version > /dev/null 2>&1; then
            echo -e "${YELLOW}Running playwright test directly...${NC}"
            npx playwright test
        else
            echo -e "${RED}No E2E test command found${NC}"
            exit 1
        fi
        ;;

    "quick")
        echo -e "${GREEN}Running quick test (unit tests only, no coverage)...${NC}"
        npx vitest run --no-coverage
        ;;

    "all")
        echo -e "${GREEN}Running all tests sequentially...${NC}"

        # Run unit tests first
        echo -e "${YELLOW}Step 1: Unit tests${NC}"
        npx vitest run --no-coverage

        # Then run E2E tests
        echo -e "${YELLOW}Step 2: E2E tests${NC}"

        # Start dev server
        echo -e "${YELLOW}Starting dev server for E2E tests...${NC}"
        npm run dev > /tmp/frontend-dev.log 2>&1 &
        DEV_PID=$!

        # Wait for dev server
        echo "Waiting for dev server..."
        for i in {1..30}; do
            if check_port 3000 || check_port 3001; then
                echo -e "${GREEN}Dev server is ready${NC}"
                break
            fi
            sleep 2
        done

        if ! check_port 3000 && ! check_port 3001; then
            echo -e "${RED}Dev server failed to start${NC}"
            tail -20 /tmp/frontend-dev.log
            exit 1
        fi

        # Run E2E tests
        if npm run 2>/dev/null | grep -q "test:e2e"; then
            npm run test:e2e
        elif npm run 2>/dev/null | grep -q "test:playwright"; then
            npm run test:playwright
        elif npm run 2>/dev/null | grep -q "e2e"; then
            npm run e2e
        elif command -v playwright > /dev/null 2>&1 || npx playwright --version > /dev/null 2>&1; then
            echo -e "${YELLOW}Running playwright test directly...${NC}"
            npx playwright test
        else
            echo -e "${RED}No E2E test command found${NC}"
            exit 1
        fi
        ;;

    *)
        echo -e "${RED}Unknown test type: $TEST_TYPE${NC}"
        echo "Usage: $0 [unit|e2e|quick|all] [yes|no]"
        exit 1
        ;;
esac

echo -e "\n${GREEN}=== TESTS COMPLETE ===${NC}"