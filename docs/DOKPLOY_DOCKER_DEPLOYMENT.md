# Dokploy Docker Deployment

This project is prepared for Dokploy using the **Dockerfile** build type.

## Build Settings

| Setting | Value |
| --- | --- |
| Dockerfile path | `Dockerfile` |
| Build context | repository root |
| Application port | `3000` |
| Runtime bind address | `0.0.0.0:3000` |
| Production Prisma schema | `prisma/postgresql/schema.prisma` |
| Migration command | `prisma migrate deploy --schema prisma/postgresql/schema.prisma` |
| Start command inside image | `node scripts/docker/start-production.js` |

The image uses Node.js 22 LTS on Alpine and pnpm `11.12.0`.

## Production Database

Production must use PostgreSQL. Do not use SQLite in Dokploy.

`DATABASE_URL` must start with one of:

```text
postgresql://
postgres://
```

If `DATABASE_URL` is missing or points to `file:...`, container startup fails before the app starts.

## Required Environment Variables

Configure these in Dokploy, not in the Docker image:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE_NAME

NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0

APP_URL=https://alektraepc.com
NEXT_PUBLIC_APP_URL=https://alektraepc.com
NEXTAUTH_URL=https://alektraepc.com
AUTH_TRUST_HOST=true

AUTH_SECRET=replace-with-strong-random-secret
NEXTAUTH_SECRET=replace-with-strong-random-secret
CUSTOMER_SESSION_SECRET=replace-with-strong-random-secret

ADMIN_EMAIL=admin@alektraepc.com
ADMIN_PASSWORD=replace-with-initial-admin-password

SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_REQUIRE_TLS=false
SMTP_USER=contact@alektraepc.com
SMTP_PASS=your_hostinger_email_password
MAIL_FROM_EMAIL=contact@alektraepc.com
MAIL_FROM_NAME=Alektra Renewable
ADMIN_NOTIFICATION_EMAIL=admin@alektraepc.com

NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
HERO_VIDEO_MAX_BYTES=83886080
MAX_UPLOAD_SIZE=83886080
SERVER_ACTION_BODY_SIZE_LIMIT=80mb

SSLCOMMERZ_STORE_ID=
SSLCOMMERZ_STORE_PASSWORD=
SSLCOMMERZ_SANDBOX=false
SSLCOMMERZ_SUCCESS_URL=https://alektraepc.com/api/payments/sslcommerz/success
SSLCOMMERZ_FAIL_URL=https://alektraepc.com/api/payments/sslcommerz/fail
SSLCOMMERZ_CANCEL_URL=https://alektraepc.com/api/payments/sslcommerz/cancel

MEDIA_STORAGE_DRIVER=local
UPLOAD_DIR=public/uploads
```

Never commit real secrets.

## Persistent Volumes

Dokploy/container replacement deletes container-local writes unless volumes are mounted.

Mount these paths:

| Container path | Purpose |
| --- | --- |
| `/app/public/uploads` | Product images, project images, resource images, hero videos, datasheets, manuals, CMS media |
| `/app/storage` | Runtime generated files, including thermal inspection PDFs |

On first startup, the container copies bundled seed upload files from `/app/.image-seed/uploads` into `/app/public/uploads` without overwriting existing files. This protects first-deploy hero/product media while still allowing a persistent upload volume.

Back up both volumes regularly.

## Startup And Migration Behavior

The container starts with:

```bash
node scripts/docker/start-production.js
```

The startup script:

1. Requires `DATABASE_URL`.
2. Refuses non-PostgreSQL database URLs.
3. Ensures `/app/public/uploads`, `/app/storage`, and `/app/storage/thermal` exist.
4. Copies missing bundled upload seed files into the upload volume.
5. Verifies the generated Prisma Client is PostgreSQL when the generated schema is available.
6. Runs:

```bash
prisma migrate deploy --schema prisma/postgresql/schema.prisma
```

7. Stops startup if migration fails.
8. Starts the Next.js production server on `0.0.0.0:3000`.

The startup script never runs:

- `prisma migrate dev`
- `prisma migrate reset`
- `prisma db push --force-reset`
- destructive database recreation
- automatic production seeding

## Health Check

The Docker image checks:

```text
/api/health
```

The endpoint returns only a safe status and performs a minimal database connectivity check. It does not expose credentials, internal errors, or environment variables.

## First Deployment Procedure

1. Create PostgreSQL database in Dokploy or an external PostgreSQL service.
2. Set all required environment variables.
3. Configure persistent volumes:
   - `/app/public/uploads`
   - `/app/storage`
4. Deploy with Dockerfile build type.
5. Watch container logs for:
   - successful `prisma migrate deploy`
   - server listening on port `3000`
6. Visit `/api/health`.
7. Smoke test:
   - `/`
   - `/shop`
   - product detail
   - `/checkout`
   - `/resources`
   - resource detail
   - `/account/login`
   - `/admin/login`

## SQLite To PostgreSQL Data Migration

If current production content still lives in SQLite, migrate before going live.

From the existing SQLite environment:

```bash
npm run db:backup:sqlite
npm run db:export:sqlite
```

Copy the export JSON to the deployment environment, then import into a fresh PostgreSQL database:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE_NAME" \
npm run db:import:postgres -- --input backups/sqlite-export/sqlite-export-YYYYMMDD-HHMMSS.json
```

Do not seed production after importing real data.

Full migration runbook: `docs/POSTGRESQL_MIGRATION_PLAN.md`.

## Backups

Before first production traffic:

```bash
pg_dump "$DATABASE_URL" > alektra_website_backup.sql
```

Also back up:

- `/app/public/uploads`
- `/app/storage`
- latest SQLite export until PostgreSQL migration is fully verified

## Rollback Procedure

1. Keep the previous Docker image tag available in Dokploy.
2. Before deploying a new image, create a PostgreSQL backup.
3. If rollback is needed:
   - redeploy the previous image
   - keep the same persistent volumes
   - restore the database backup only if the new deployment applied incompatible migrations
4. Never run destructive Prisma commands to roll back production.

## Local Docker Test Commands

Build:

```bash
docker build -t alektra-website:local .
```

Run against a PostgreSQL test database:

```bash
docker run --rm \
  --name alektra-website-local \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://alektra_user:alektra_password@host.docker.internal:5432/alektra_website_test" \
  -e AUTH_SECRET="local-test-secret" \
  -e NEXTAUTH_SECRET="local-test-secret" \
  -e CUSTOMER_SESSION_SECRET="local-test-secret" \
  -e APP_URL="http://localhost:3000" \
  -e NEXT_PUBLIC_APP_URL="http://localhost:3000" \
  -e NEXTAUTH_URL="http://localhost:3000" \
  -v alektra_uploads:/app/public/uploads \
  -v alektra_storage:/app/storage \
  alektra-website:local
```
