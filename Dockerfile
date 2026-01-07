# --- Build Stage ---
    FROM node:20-alpine AS builder
    WORKDIR /app
    COPY package*.json ./
    # ติดตั้งทั้งหมด (รวม DevDeps) เพื่อใช้ในการ Build
    RUN npm ci
    
    # Copy configuration files
    COPY postcss.config.mjs ./
    COPY next.config.mjs ./
    COPY tsconfig.json ./
    COPY . .
    
    # Build arguments
    ARG NEXT_PUBLIC_API_BASE_URL
    ARG NEXT_PUBLIC_MINIO_URL
    ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}
    ENV NEXT_PUBLIC_MINIO_URL=${NEXT_PUBLIC_MINIO_URL}
    
    RUN npm run build
    
    # --- Runtime Stage ---
    FROM node:20-alpine AS runner
    WORKDIR /app
    ENV NODE_ENV=production
    
    # คัดลอกเฉพาะสิ่งที่จำเป็นจริงๆ สำหรับการรัน
    COPY --from=builder /app/package*.json ./
    COPY --from=builder /app/.next ./.next
    COPY --from=builder /app/public ./public
    COPY --from=builder /app/next.config.mjs ./next.config.mjs
    
    # ติดตั้งเฉพาะ Production Dependencies
    RUN npm ci --omit=dev --no-audit --no-fund
    
    EXPOSE 3000
    ENV PORT=3000
    # บังคับให้ Bind ไปที่ 0.0.0.0 เพื่อให้ภายนอกเข้าถึงได้
    CMD ["npx", "next", "start", "-H", "0.0.0.0"]