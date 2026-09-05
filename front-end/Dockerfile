# Build context: raiz do monorepo
FROM node:22-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl

FROM base AS deps
COPY front-end/package.json front-end/package-lock.json ./
RUN npm ci --ignore-scripts

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY front-end/ .
# Substitui o symlink pelo schema real (migrations ficam no db-init)
RUN rm -rf prisma && mkdir -p prisma
COPY back-end/prisma/schema.prisma ./prisma/schema.prisma
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate && npx next build

FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup -S nodejs && adduser -S nextjs -G nodejs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
