#!/bin/bash

# Docker startup script for AI Council

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting AI Council with Docker...${NC}"

# Create data directory if it doesn't exist
mkdir -p data/conversations

# Start services
echo -e "${BLUE}Building and starting containers...${NC}"
docker-compose up --build -d

echo -e "\n${GREEN}✓ Services are starting!${NC}"
echo -e "${BLUE}Backend: http://localhost:8000${NC}"
echo -e "${BLUE}Frontend: http://localhost:5173${NC}"
echo -e "\n${YELLOW}To view logs: docker-compose logs -f${NC}"
echo -e "${YELLOW}To stop: docker-compose down${NC}\n"

