# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS base
RUN apt-get update \
    && apt-get install --yes --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

FROM base AS dependencies
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1 \
    DATABASE_PROVIDER=sqlite \
    DATABASE_URL=file:/tmp/build.db \
    AUTH_SECRET=build-only-placeholder-not-used-at-runtime
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN npm run db:generate && npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000 \
    DATABASE_PROVIDER=sqlite

RUN groupadd --system --gid 1001 nodejs \
    && useradd --system --uid 1001 --gid nodejs nextjs \
    && mkdir --parents /app/data \
    && chown nextjs:nodejs /app/data

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/bcryptjs ./node_modules/bcryptjs
COPY --from=builder --chown=nextjs:nodejs /app/prisma/generated ./prisma/generated
COPY --from=builder --chown=nextjs:nodejs /app/prisma/load-env.mjs ./prisma/load-env.mjs
COPY --from=builder --chown=nextjs:nodejs /app/prisma/migrate-postgresql.mjs ./prisma/migrate-postgresql.mjs
COPY --from=builder --chown=nextjs:nodejs /app/prisma/migrate-sqlite.mjs ./prisma/migrate-sqlite.mjs
COPY --from=builder --chown=nextjs:nodejs /app/prisma/bootstrap-admin.mjs ./prisma/bootstrap-admin.mjs
COPY --from=builder --chown=nextjs:nodejs /app/prisma/initialize-sqlite.mjs ./prisma/initialize-sqlite.mjs
COPY --from=builder --chown=nextjs:nodejs /app/prisma/seed.mjs ./prisma/seed.mjs
COPY --from=builder --chown=nextjs:nodejs /app/prisma/postgresql/migrations ./prisma/postgresql/migrations

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
