FROM node:20-alpine

# Install openssl and libc compatibility for Prisma engine on Alpine Linux
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Copy dependency definitions
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies (including devDependencies needed for Prisma CLI)
RUN npm install --legacy-peer-deps

# Generate Prisma Client for the Linux container environment
RUN npx prisma generate

# Copy application source code
COPY . .

# Expose API port
EXPOSE 8080

# Default command
CMD ["npm", "start"]
