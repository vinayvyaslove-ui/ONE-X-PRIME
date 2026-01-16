#!/bin/bash

echo "Starting Voice Accounting System..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check if MongoDB is running
echo "Checking MongoDB connection..."
if ! nc -z localhost 27017 2>/dev/null; then
    echo "Warning: MongoDB may not be running"
    echo "Attempting to start MongoDB..."
    
    # Try different MongoDB start commands
    if command -v systemctl &> /dev/null; then
        sudo systemctl start mongodb 2>/dev/null || sudo systemctl start mongod 2>/dev/null
    elif command -v service &> /dev/null; then
        sudo service mongodb start 2>/dev/null || sudo service mongod start 2>/dev/null
    fi
    
    sleep 2
    
    if ! nc -z localhost 27017 2>/dev/null; then
        echo "Error: Could not start MongoDB"
        echo "Please ensure MongoDB is installed and running"
        exit 1
    fi
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "Error: Failed to install dependencies"
        exit 1
    fi
fi

# Create required directories
mkdir -p uploads logs

# Load environment variables
if [ -f ".env" ]; then
    echo "Loading environment variables from .env"
else
    echo "Copying .env.example to .env"
    cp .env.example .env
    echo "Please configure your .env file before starting"
fi

# Check if in development mode
if [ "$NODE_ENV" = "development" ] || [ -z "$NODE_ENV" ]; then
    echo "Starting in development mode..."
    npm run dev
else
    echo "Starting in production mode..."
    node server.js
fi

if [ $? -ne 0 ]; then
    echo "Error: Application failed to start"
    echo "Check the error message above"
    exit 1
fi