# frontend/Dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY frontend/package*.json ./

# Install dependencies
RUN npm ci

# Copy frontend code
COPY frontend/ .

# Expose port
EXPOSE 5173

# Set DOCKER environment variable for Vite config
ENV DOCKER=true

# Start dev server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

