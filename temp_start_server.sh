#!/bin/bash

# Exit on any error
set -e

# Parse command line arguments
CLEANUP_ON_EXIT=true
for arg in "$@"; do
    case $arg in
        --no-cleanup)
            CLEANUP_ON_EXIT=false
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  --no-cleanup    Don't stop/remove Docker containers on exit"
            echo "  -h, --help      Show this help message"
            exit 0
            ;;
    esac
done

# Function to cleanup on exit
cleanup() {
    echo
    echo "========================================="
    echo "Shutting down..."
    echo "========================================="
    
    if [ "$CLEANUP_ON_EXIT" = true ]; then
        echo "Stopping and removing Docker containers..."
        docker stop mongodb redis 2>/dev/null || true
        docker rm mongodb redis 2>/dev/null || true
        echo "✓ Docker containers stopped and removed"
    else
        echo "Keeping Docker containers running (--no-cleanup flag was used)"
    fi
    
    echo "✓ Server shutdown complete"
    exit 0
}

# Set up trap to catch Ctrl+C (SIGINT) and other termination signals
trap cleanup SIGINT SIGTERM

echo "========================================="
echo "Starting Manna Cloud Development Server"
echo "========================================="
echo

# Step 1: Check and start Docker containers
echo "Step 1: Checking Docker containers..."

# Check if MongoDB and Redis containers are already running
MONGODB_RUNNING=false
REDIS_RUNNING=false

if command -v docker &> /dev/null; then
    # Check for MongoDB container
    if docker ps --format "{{.Names}}" | grep -q "^mongodb$"; then
        MONGODB_RUNNING=true
        echo "✓ MongoDB container is already running"
    fi
    
    # Check for Redis container  
    if docker ps --format "{{.Names}}" | grep -q "^redis$"; then
        REDIS_RUNNING=true
        echo "✓ Redis container is already running"
    fi
else
    echo "Warning: Docker command not found!"
    echo "Please ensure Docker is installed and running."
    exit 1
fi

# Start containers if needed
if [ "$MONGODB_RUNNING" = true ] && [ "$REDIS_RUNNING" = true ]; then
    echo "✓ All required Docker containers are already running"
else
    echo "Starting Docker containers..."
    
    # Start or create MongoDB container
    if ! [ "$MONGODB_RUNNING" = true ]; then
        # Check if container exists (running or stopped)
        if docker ps -a --format "{{.Names}}" | grep -q "^mongodb$"; then
            echo "Starting existing MongoDB container..."
            docker start mongodb
        else
            echo "Pulling MongoDB image if needed..."
            docker pull mongo:7.0
            echo "Creating new MongoDB container..."
            docker run -d --name mongodb -p 27017:27017 mongo:7.0
        fi
    fi
    
    # Start or create Redis container
    if ! [ "$REDIS_RUNNING" = true ]; then
        # Check if container exists (running or stopped)
        if docker ps -a --format "{{.Names}}" | grep -q "^redis$"; then
            echo "Starting existing Redis container..."
            docker start redis
        else
            echo "Pulling Redis image if needed..."
            docker pull redis:7.2-alpine
            echo "Creating new Redis container..."
            docker run -d --name redis -p 6379:6379 redis:7.2-alpine
        fi
    fi
    
    # Wait and verify containers are ready
    echo "Waiting for containers to be ready..."
    sleep 5
    
    # Verify MongoDB is running
    MONGODB_CHECK=$(docker ps --format "{{.Names}}" | grep -c "^mongodb$" || true)
    if [ "$MONGODB_CHECK" -eq 0 ]; then
        echo "Error: MongoDB container failed to start"
        echo "Container logs:"
        docker logs mongodb --tail 20 2>&1 || true
        exit 1
    fi
    
    # Verify Redis is running
    REDIS_CHECK=$(docker ps --format "{{.Names}}" | grep -c "^redis$" || true)
    if [ "$REDIS_CHECK" -eq 0 ]; then
        echo "Error: Redis container failed to start"
        echo "Container logs:"
        docker logs redis --tail 20 2>&1 || true
        exit 1
    fi
    
    echo "✓ Docker containers started successfully"
fi
echo

# Step 2: Test service connectivity
echo "Step 2: Testing service connectivity..."

# Test MongoDB connection
echo -n "Testing MongoDB connection... "
MAX_RETRIES=10
RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if docker exec mongodb mongosh --eval "db.adminCommand('ping')" >/dev/null 2>&1; then
        echo "✓ MongoDB is ready"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
        echo "✗ MongoDB is not responding after $MAX_RETRIES attempts"
        exit 1
    fi
    sleep 1
done

# Test Redis connection
echo -n "Testing Redis connection... "
RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if docker exec redis redis-cli ping >/dev/null 2>&1; then
        echo "✓ Redis is ready"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
        echo "✗ Redis is not responding after $MAX_RETRIES attempts"
        exit 1
    fi
    sleep 1
done
echo

# Step 3: Create fake data
echo "Step 3: Creating fake database data..."
if [ -f "manage_database.py" ]; then
    uv run python manage_database.py create-fake-data --force
    echo "✓ Fake data created"
else
    echo "Error: manage_database.py not found!"
    exit 1
fi
echo

# Step 4: Start the FastAPI server
echo "Step 4: Starting FastAPI server..."
echo "========================================="
echo "Server will be available at: http://localhost:8000"
echo "API documentation: http://localhost:8000/docs"
if [ "$CLEANUP_ON_EXIT" = true ]; then
    echo "Press Ctrl+C to stop the server and cleanup Docker containers"
else
    echo "Press Ctrl+C to stop the server (Docker containers will keep running)"
fi
echo "========================================="
echo

# Start the server with reload
uv run uvicorn app.main:app --reload