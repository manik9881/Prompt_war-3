# ==========================================
# Stage 1: Build the React + Vite Frontend
# ==========================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend packages and install dependencies
COPY frontend/package*.json ./
RUN npm ci

# Copy the rest of the frontend source code and compile
COPY frontend/ ./
RUN npm run build

# ==========================================
# Stage 2: Create Python Backend and Bundle
# ==========================================
FROM python:3.11-slim AS final

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend codebase
COPY backend/ ./backend/

# Copy built frontend assets from Stage 1 builder
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Expose backend port
EXPOSE 8000

# Run FastAPI using uvicorn, reading the Cloud Run PORT environment variable
CMD ["sh", "-c", "uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
