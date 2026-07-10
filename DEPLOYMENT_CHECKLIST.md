# Hostinger VPS Deployment Checklist

## Current Go/No-Go
- Build/lint/typecheck/audit are expected to pass before deployment.
- Current Prisma datasource provider is `sqlite`. Do not deploy to PostgreSQL until the Prisma provider and migrations are converted/tested for PostgreSQL.
- If deploying immediately with current code, use a persistent SQLite database file and back it up aggressively. PostgreSQL remains the recommended production target after migration conversion.

## Install And Build
- Ubuntu VPS with Node.js LTS.
- Enable pnpm through Corepack: `corepack enable && corepack prepare pnpm@11.7.0 --activate`.
- Install dependencies: `pnpm install --frozen-lockfile`.
- Configure `.env` from `.env.example`; never commit real secrets.
- Generate Prisma client: `pnpm run db:generate`.
- Apply migrations: `pnpm run db:deploy`.
- Build: `pnpm run build`.
- Start with PM2: `mkdir -p logs && pm2 start ecosystem.config.cjs && pm2 save`.
- Reload after updates: `pnpm install --frozen-lockfile && pnpm run db:deploy && pnpm run build && pm2 reload alektra-website`.

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
- Current repo migrations are SQLite-oriented.
- PostgreSQL deployment requires a separate migration conversion and staging rehearsal.
- Do not expose the database publicly.
- Back up before every deploy and daily after launch.
- For current SQLite deployment, store the database outside ephemeral build output and back up the `.db` file.

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
