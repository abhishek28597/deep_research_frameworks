# backend/Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Copy requirements first for better caching
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code maintaining package structure
COPY backend/ ./backend/

# Create data directory
RUN mkdir -p /app/data/conversations

# Add app directory to Python path
ENV PYTHONPATH=/app

# Expose port
EXPOSE 8000

# Run uvicorn with backend package
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

