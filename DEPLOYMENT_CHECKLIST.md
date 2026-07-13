# Hostinger VPS Deployment Checklist

## Current Go/No-Go
- Build/lint/typecheck/audit are expected to pass before deployment.
- Current local Prisma datasource provider is `sqlite` in `prisma/schema.prisma` to protect the existing `dev.db` workflow.
- Production PostgreSQL schema and migrations are in `prisma/postgresql/`.
- Use PostgreSQL for staging and production. Do not deploy ecommerce/customer/order workflows on SQLite unless it is a temporary emergency rollback.
- Back up `dev.db` and export SQLite data before any migration rehearsal.

## Install And Build
- Ubuntu VPS with Node.js LTS.
- Enable pnpm through Corepack: `corepack enable && corepack prepare pnpm@11.7.0 --activate`.
- Install dependencies: `pnpm install --frozen-lockfile`.
- Configure `.env` from `.env.example`; never commit real secrets.
- Generate PostgreSQL Prisma client: `pnpm run db:generate:postgres`.
- Apply PostgreSQL migrations: `pnpm run db:deploy:postgres`.
- Build with PostgreSQL `DATABASE_URL`: `pnpm run build`.
- Verify generated client provider: `pnpm run db:verify:postgres`.
- Start with PM2: `mkdir -p logs && pm2 start ecosystem.config.cjs && pm2 save`.
- Reload after updates: `pnpm install --frozen-lockfile && pnpm run db:deploy:postgres && pnpm run build && pnpm run db:verify:postgres && pm2 reload alektra-website`.

## Required Environment
- `DATABASE_URL`
- `AUTH_SECRET`, `NEXTAUTH_SECRET`, `CUSTOMER_SESSION_SECRET`
- `APP_URL=https://alektraepc.com`
- `NEXT_PUBLIC_APP_URL=https://alektraepc.com`
- `NEXTAUTH_URL=https://alektraepc.com`
- `AUTH_TRUST_HOST=true`
- `SMTP_HOST=smtp.hostinger.com`
- `SMTP_PORT=465`
- `SMTP_SECURE=true`
- `SMTP_USER=contact@alektraepc.com`
- `SMTP_PASS`
- `MAIL_FROM_EMAIL=contact@alektraepc.com`
- `MAIL_FROM_NAME=Alektra Renewable`
- `ADMIN_NOTIFICATION_EMAIL`
- `HERO_VIDEO_MAX_BYTES`, `SERVER_ACTION_BODY_SIZE_LIMIT`, `UPLOAD_DIR`
- SSLCommerz variables if online payment is enabled.

## PM2
- App name: `alektra-website`.
- Config: `ecosystem.config.cjs`.
- Port: `3000`.
- Logs: `logs/pm2-out.log`, `logs/pm2-error.log`.
- Check status: `pm2 status`, `pm2 logs alektra-website`, `pm2 monit`.

## Nginx
- Reverse proxy to `http://127.0.0.1:3000`.
- Include headers:
  - `proxy_set_header Host $host;`
  - `proxy_set_header X-Real-IP $remote_addr;`
  - `proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;`
  - `proxy_set_header X-Forwarded-Proto $scheme;`
- Set `client_max_body_size 80m;` or match `HERO_VIDEO_MAX_BYTES`.
- Enable gzip/Brotli if available.
- Configure SSL for `alektraepc.com` and `www.alektraepc.com`.
- Configure HSTS at Nginx after HTTPS is confirmed stable.
- Add Nginx rate limits for `/admin/login`, `/account/login`, `/api/checkout/otp/send`, checkout POST, and upload/admin POST endpoints where practical.
- Do not execute files from `public/uploads`.

## Upload Persistence
- Persist `public/uploads` across deploys by keeping it outside release folders or symlinking/mounting it.
- Ensure writable permissions for the deploy user: `chown -R deploy:www-data public/uploads logs`.
- Back up uploads daily.
- Compress hero videos before upload and keep MP4/WebM optimized.

## Database
- Production database: PostgreSQL.
- Production schema path: `prisma/postgresql/schema.prisma`.
- Production migration command: `pnpm run db:deploy:postgres`.
- Backup current SQLite data before migration: `pnpm run db:backup:sqlite`.
- Export current SQLite data: `pnpm run db:export:sqlite`.
- Import exported JSON after PostgreSQL schema deploy:
  `DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/alektra_website" pnpm run db:import:postgres -- --input backups/sqlite-export/sqlite-export-YYYYMMDD-HHMMSS.json`.
- Never use `DATABASE_URL="file:..."` for production.
- Verify row counts after import against the export metadata.
- Do not expose the database publicly.
- Back up before every deploy and daily after launch.
- Keep the original SQLite `dev.db` and backup files until PostgreSQL staging and production are fully verified.

## Security Hardening
- SSH key login only.
- Disable root password login where practical.
- Use a non-root deploy user.
- Enable UFW/firewall for SSH, HTTP, HTTPS only.
- Install fail2ban.
- Keep OS packages updated.
- Do not expose Adminer/phpMyAdmin publicly.
- Configure log rotation for Nginx and PM2 logs.
- Monitor disk, memory, CPU, PM2 restarts, Nginx errors, DB backups, upload backups.

## Smoke Test URLs
- `/`
- `/thermal`
- `/sparkle`
- `/mapping`
- `/resources`
- one resource article detail URL
- `/shop`
- one product detail URL
- cart drawer
- `/checkout`
- `/account/login`
- `/account/register`
- `/account`
- `/admin/login`
- `/admin`

## Manual Third-Party Tests
- Lighthouse/PageSpeed:
  - `https://staging.alektraepc.com/`
  - `https://staging.alektraepc.com/shop`
  - one product detail URL
  - `https://staging.alektraepc.com/checkout`
  - `https://staging.alektraepc.com/resources`
  - one resource article detail URL
- k6 moderate load:
  - `BASE_URL=https://staging.alektraepc.com PRODUCT_PATH=/shop/product/example-slug DURATION=2m VUS=15 pnpm run load:k6`
- OWASP ZAP baseline scan against staging only.
- `pnpm audit` and optional Snyk dependency scan.
- Trivy only if a Docker image is introduced.

## PostgreSQL Migration Verification

- Public pages: `/`, `/thermal`, `/sparkle`, `/mapping`, `/resources`, one resource article, `/shop`, one product detail.
- Shop: category filtering, search, 16-item pagination, cart drawer, checkout, order creation, order email.
- Customer: register, email verification, login, logout, forgot password, reset password, add/edit address, order history.
- Admin: login, products, orders, customers, projects, Feature this on Resources, Resources/articles, legal content, media upload.
- Security: customer cannot access admin; customer cannot see another customer order; admin routes are protected; verification/reset tokens expire.
