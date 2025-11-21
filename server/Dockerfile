FROM node:24-alpine

WORKDIR /app

# Install build dependencies for sqlite3
RUN apk add --no-cache python3 make g++ poppler-utils

COPY package*.json ./

RUN npm install --production

COPY . .

# Create uploads and data directory and set permissions
RUN mkdir -p uploads data && chown -R node:node /app

# Switch to non-root user
USER node

EXPOSE 3000

CMD ["node", "index.js"]
