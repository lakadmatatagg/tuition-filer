# Stage 1: Build NestJS
FROM node:22 AS build

WORKDIR /app

# Copy only package files first
COPY package*.json ./

# Install all dependencies (dev included for build)
RUN npm ci

# Copy the rest of the source code
COPY . .

# Build the NestJS app
RUN npm run build

# Stage 2: Production image
FROM node:22-alpine

WORKDIR /app

# Copy built files and package.json
COPY --from=build /app/dist ./dist
COPY --from=build /app/package*.json ./

# Install only runtime dependencies
RUN npm ci --omit=dev

# Set environment variable for port
ENV PORT 3000
EXPOSE 3000

# Start the NestJS app
CMD ["npx", "dotenv", "-e", "environments/.env.prod", "--", "node", "dist/main"]
