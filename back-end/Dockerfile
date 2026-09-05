# Build context: raiz do monorepo
FROM node:22-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl

FROM base AS deps
COPY back-end/package.json back-end/package-lock.json ./
RUN npm ci

FROM base AS runner
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY back-end/package.json back-end/package-lock.json ./
COPY back-end/prisma ./prisma
COPY back-end/dados_brutos.txt ./dados_brutos.txt
COPY back-end/tsconfig.json ./tsconfig.json

RUN npx prisma generate

CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed"]
