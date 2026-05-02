# Stage 1: build (needs devDeps for TypeScript + NestJS CLI)
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

# Stage 2: production base (only prod deps + compiled output)
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./

FROM base AS api
CMD ["node", "dist/main"]

FROM base AS worker
CMD ["node", "dist/worker"]
