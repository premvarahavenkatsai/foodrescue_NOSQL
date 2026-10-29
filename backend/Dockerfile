FROM python:3.11-slim

# Prevent Python from writing .pyc and buffer outputs
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install curl for container health checks
RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY . .

# Expose backend port
EXPOSE 5055

# Healthcheck endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:5055/api/health || exit 1

# Start Gunicorn WSGI server with 2 worker processes
CMD ["gunicorn", "--bind", "0.0.0.0:5055", "--workers", "2", "--timeout", "60", "app:app"]
