@echo off
echo Starting Voice Accounting System...
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if errorlevel 1 (
    echo Error: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if MongoDB is running
echo Checking MongoDB connection...
netstat -an | findstr ":27017" >nul
if errorlevel 1 (
    echo Warning: MongoDB may not be running
    echo Starting MongoDB service...
    net start MongoDB >nul 2>nul
    if errorlevel 1 (
        echo Error: Could not start MongoDB
        echo Please ensure MongoDB is installed and running
    )
)

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo Error: Failed to install dependencies
        pause
        exit /b 1
    )
)

REM Create required directories
if not exist "uploads" mkdir uploads
if not exist "logs" mkdir logs

REM Load environment variables
if exist ".env" (
    echo Loading environment variables from .env
) else (
    echo Copying .env.example to .env
    copy .env.example .env >nul
    echo Please configure your .env file before starting
)

REM Start the application
echo Starting application...
echo Server will be available at http://localhost:3000
echo Press Ctrl+C to stop
echo.

node server.js

if errorlevel 1 (
    echo Error: Application failed to start
    echo Check the error message above
    pause
)