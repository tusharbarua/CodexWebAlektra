# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
RUN apk add --no-cache libc6-compat openssl

FROM base AS deps
RUN corepack enable && corepack prepare pnpm@11.12.0 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS prod-deps
RUN corepack enable && corepack prepare pnpm@11.12.0 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --prod --frozen-lockfile

FROM base AS builder
RUN corepack enable && corepack prepare pnpm@11.12.0 --activate
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production
ENV DATABASE_URL=postgresql://build:build@localhost:5432/build
RUN pnpm run build:postgres && rm -rf .next/cache

FROM base AS runner
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=prod-deps --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/public/uploads ./.image-seed/uploads
COPY --from=builder --chown=nextjs:nodejs /app/prisma/postgresql ./prisma/postgresql
COPY --from=builder --chown=nextjs:nodejs /app/scripts/docker ./scripts/docker
COPY --from=builder --chown=nextjs:nodejs /app/scripts/db/verify-prisma-client-provider.js ./scripts/db/verify-prisma-client-provider.js
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/next.config.mjs ./next.config.mjs

RUN mkdir -p public/uploads storage/thermal logs \
  && chown -R nextjs:nodejs public/uploads storage logs .image-seed

USER nextjs

RUN DATABASE_URL=postgresql://build:build@localhost:5432/build \
  ./node_modules/.bin/prisma generate --schema prisma/postgresql/schema.prisma

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health >/dev/null || exit 1

CMD ["node", "scripts/docker/start-production.js"]
