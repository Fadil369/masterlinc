FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm install

# Copy source
COPY src ./src

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 4000

# Start service
CMD ["npm", "start"]
