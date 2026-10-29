# --- Zaraz Boutique API -----------------------------------------------------
FROM node:20-alpine

# `tini` gives us correct signal handling so SIGTERM actually stops the server.
RUN apk add --no-cache tini curl

ENV NODE_ENV=production
WORKDIR /app

# Install dependencies first so this layer is cached across code changes.
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev || npm install --omit=dev

COPY . .

# Uploaded product images live here; Compose mounts a named volume over it.
RUN mkdir -p /app/uploads && chown -R node:node /app

USER node
EXPOSE 4000

HEALTHCHECK --interval=15s --timeout=5s --start-period=40s --retries=5 \
  CMD curl -fsS http://127.0.0.1:4000/api/health || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "src/index.js"]
