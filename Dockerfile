FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json yarn.lock* ./

# Install dependencies
RUN yarn install --frozen-lockfile --production

# Copy application files
COPY . .

# Expose port
EXPOSE 4000

# Start server
CMD ["node", "server.js"]
