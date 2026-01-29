FROM node:22-alpine

WORKDIR /app

# Copy the entire monorepo context
COPY . .

# Navigate to the package
WORKDIR /app/packages/masterlinc-coordinator

# Install dependencies
# We install locally here. Since we copied the parent directories, 
# dependencies like "file:../deepseek-radiology" will resolve correctly.
RUN npm install

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 4000

# Start service
CMD ["npm", "start"]
