# Backend Dockerfile
FROM node:18-alpine

# Build argument for environment (default: production)
ARG NODE_ENV=production

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application files
COPY . .

# Build TypeScript only in production
RUN if [ "$NODE_ENV" = "production" ]; then npm run build && npm prune --production; fi

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start command based on environment
CMD if [ "$NODE_ENV" = "production" ]; then node dist/server.js; else npm run dev; fi
