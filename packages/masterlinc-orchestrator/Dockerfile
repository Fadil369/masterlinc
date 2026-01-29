# MasterLinc Orchestrator - Production Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY packages/masterlinc-orchestrator/package*.json ./packages/masterlinc-orchestrator/

# Install dependencies
RUN npm ci --workspace=@brainsait/masterlinc-orchestrator

# Copy source
COPY packages/masterlinc-orchestrator ./packages/masterlinc-orchestrator

# Build
RUN npm run build --workspace=@brainsait/masterlinc-orchestrator

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
COPY packages/masterlinc-orchestrator/package*.json ./packages/masterlinc-orchestrator/
RUN npm ci --workspace=@brainsait/masterlinc-orchestrator --omit=dev

# Copy built files
COPY --from=builder /app/packages/masterlinc-orchestrator/dist ./packages/masterlinc-orchestrator/dist

# Security: non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

EXPOSE 3001

ENV NODE_ENV=production

CMD ["node", "packages/masterlinc-orchestrator/dist/index.js"]
