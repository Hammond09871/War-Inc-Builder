FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci --production=false

# Copy source
COPY . .

# Build
RUN npm run build

# Create data directory for persistent SQLite
RUN mkdir -p /data

# Set environment variables
ENV NODE_ENV=production
ENV DATABASE_PATH=/data/warinc.db
ENV PORT=3000

EXPOSE 3000

# Run schema push then start server
CMD ["sh", "-c", "npx drizzle-kit push && node dist/index.cjs"]
