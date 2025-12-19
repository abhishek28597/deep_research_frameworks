#!/bin/bash

# Startup script for AI Council - starts both backend and frontend

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo -e "${BLUE}Starting AI Council...${NC}"

# Function to cleanup background processes on exit
cleanup() {
    echo -e "\n${YELLOW}Shutting down services...${NC}"
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
        echo -e "${GREEN}Backend stopped${NC}"
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
        echo -e "${GREEN}Frontend stopped${NC}"
    fi
    exit 0
}

# Set up trap to cleanup on script exit
trap cleanup SIGINT SIGTERM EXIT

# Check if Python virtual environment exists for backend
if [ -d "backend/venv" ]; then
    echo -e "${BLUE}Activating backend virtual environment...${NC}"
    source backend/venv/bin/activate
fi

# Start backend
echo -e "${BLUE}Starting backend server on port 8000...${NC}"
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload > backend.log 2>&1 &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 2

# Check if backend is running
if ps -p $BACKEND_PID > /dev/null; then
    echo -e "${GREEN}✓ Backend started (PID: $BACKEND_PID)${NC}"
else
    echo -e "${YELLOW}⚠ Backend may have failed to start. Check backend.log for details.${NC}"
fi

# Start frontend
echo -e "${BLUE}Starting frontend server...${NC}"
cd frontend
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait a moment for frontend to start
sleep 2

# Check if frontend is running
if ps -p $FRONTEND_PID > /dev/null; then
    echo -e "${GREEN}✓ Frontend started (PID: $FRONTEND_PID)${NC}"
else
    echo -e "${YELLOW}⚠ Frontend may have failed to start. Check frontend.log for details.${NC}"
fi

echo -e "\n${GREEN}✓ Both services are running!${NC}"
echo -e "${BLUE}Backend: http://localhost:8000${NC}"
echo -e "${BLUE}Frontend: http://localhost:5173${NC}"
echo -e "\n${YELLOW}Press Ctrl+C to stop both services${NC}\n"

# Wait for both processes
wait

