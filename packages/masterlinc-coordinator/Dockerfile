FROM node:22-alpine

WORKDIR /app

# Copy dependent packages
COPY packages/deepseek-radiology ./packages/deepseek-radiology/
COPY packages/radiolinc-agent ./packages/radiolinc-agent/
COPY packages/masterlinc-coordinator ./packages/masterlinc-coordinator/

# Build dependencies
WORKDIR /app/packages/deepseek-radiology
RUN npm install
RUN npm run build

WORKDIR /app/packages/radiolinc-agent
RUN npm install
RUN npm run build

# Build service
WORKDIR /app/packages/masterlinc-coordinator
RUN npm install
RUN npm run build

# Expose port
EXPOSE 4000

# Start service
CMD ["node", "dist/index.js"]
