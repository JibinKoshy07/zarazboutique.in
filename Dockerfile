# Use multi-architecture base image
#FROM --platform=linux/arm64 node:18-alpine  # Use arm/v7 if 32-bit
FROM node:18-alpine
WORKDIR /app

# Upgrade npm globally
RUN npm install -g npm@9

# Copy only package.json and package-lock.json first for better caching
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci --only=production

# Copy remaining application files (to avoid invalidating cache too soon)
COPY . .

# Build assets
RUN npm run build

# Expose the correct port (if your app listens on 3000, update it)
EXPOSE 3000

# Start the application
CMD ["npm", "run", "start"]
