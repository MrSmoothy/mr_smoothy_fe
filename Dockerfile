# --- Build Stage ---
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --no-audit --no-fund
# Copy config files first (for better caching)
COPY postcss.config.mjs ./
COPY next.config.ts ./
COPY tsconfig.json ./
COPY eslint.config.mjs ./
# Copy all source files (exclude files in .dockerignore)
COPY . .

# Build arguments for environment variables (must be passed at build time)
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_MINIO_URL

# Set environment variables for build
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}
ENV NEXT_PUBLIC_MINIO_URL=${NEXT_PUBLIC_MINIO_URL}

RUN npm run build

# --- Runtime Stage ---
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/package*.json ./
# Install TypeScript for runtime (needed for next.config.ts)
RUN npm ci --omit=dev --no-audit --no-fund && \
    npm install typescript --save-dev --no-audit --no-fund
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/next-env.d.ts ./next-env.d.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json
# Copy PostCSS config for Tailwind CSS
COPY --from=builder /app/postcss.config.mjs ./postcss.config.mjs
EXPOSE 3000
ENV PORT=3000
CMD ["npm", "start"]


