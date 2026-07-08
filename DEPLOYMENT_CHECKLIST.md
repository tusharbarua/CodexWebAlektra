# Alektra Renewable Production Deployment Checklist

## Build And Release
- Use Node.js 22 LTS or the version pinned by the VPS runtime.
- Install pnpm: `corepack enable && corepack prepare pnpm@11.7.0 --activate`.
- Install dependencies: `pnpm install --frozen-lockfile`.
- Configure `.env` from `.env.example`; never copy development secrets.
- Generate Prisma client: `pnpm run db:generate`.
- Apply migrations: `pnpm run db:deploy`.
- Build: `pnpm run build`.
- Start with PM2: `mkdir -p logs && pm2 start ecosystem.config.cjs && pm2 save`.
- Restart after future deploys: `pnpm install --frozen-lockfile && pnpm run db:deploy && pnpm run build && pm2 reload alektra-renewable`.

## Required Environment
- `DATABASE_URL`
- `AUTH_SECRET` or `NEXTAUTH_SECRET`
- `CUSTOMER_SESSION_SECRET`
- `APP_URL`, `NEXT_PUBLIC_APP_URL`, `NEXTAUTH_URL`
- `AUTH_TRUST_HOST=true`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`
- `MAIL_FROM_EMAIL`, `MAIL_FROM_NAME`
- `ADMIN_NOTIFICATION_EMAIL`
- `HERO_VIDEO_MAX_BYTES`, `SERVER_ACTION_BODY_SIZE_LIMIT`
- `SSLCOMMERZ_STORE_ID`, `SSLCOMMERZ_STORE_PASSWORD`, `SSLCOMMERZ_SANDBOX`, callback URLs if online payment is enabled
- Storage/upload variables if moving uploads outside `public/uploads`

## Nginx And SSL
- Reverse proxy `https://your-domain` to `http://127.0.0.1:3000`.
- Set `proxy_set_header Host $host`, `X-Real-IP`, `X-Forwarded-For`, and `X-Forwarded-Proto`.
- Enable SSL with Certbot/Let's Encrypt or Cloudflare.
- Enable HSTS at Nginx only after HTTPS is confirmed stable.
- Set upload/body limits to match app limits, for example `client_max_body_size 80m`.
- Add rate limiting for `/admin/login`, `/account/login`, `/api/checkout/otp/send`, and form POST endpoints if practical.

## Uploads And Files
- Persist `public/uploads` across releases, or mount it as a volume/symlink.
- Ensure the deploy user can write uploads: `chown -R deploy:www-data public/uploads logs`.
- Do not allow script execution from upload directories in Nginx.
- Back up `public/uploads` regularly.
- Compress hero videos before upload; keep MP4/WebM optimized and below `HERO_VIDEO_MAX_BYTES`.

## Database
- Do not expose the database publicly.
- Run migrations before app restart: `pnpm run db:deploy`.
- Back up before every release and daily after launch.
- Verify production indexes were applied by the `20260708162000_production_readiness_indexes` migration.

## VPS Hardening
- Create a non-root deploy user.
- Use SSH key login.
- Disable root password login where practical.
- Enable firewall and allow only SSH, HTTP, HTTPS.
- Install and enable fail2ban.
- Keep OS packages updated.
- Protect Adminer/phpMyAdmin if installed; preferably do not expose them publicly.
- Set correct file permissions for app, logs, uploads, and backups.
- Monitor disk usage, memory, CPU, PM2 restarts, and Nginx errors.

## Monitoring And Logs
- PM2 logs: `pm2 logs alektra-renewable`.
- PM2 status: `pm2 monit`.
- Nginx logs: `/var/log/nginx/access.log` and `/var/log/nginx/error.log`.
- Configure logrotate for PM2 and Nginx logs.
- Alert on app restarts, disk usage above 80%, and failed backups.

## Performance Testing
- Bundle analyzer: `pnpm run analyze`.
- Lighthouse/PageSpeed against staging:
  - `/`
  - `/shop`
  - product detail page
  - `/checkout`
  - `/resources`
- k6 smoke/load test: `BASE_URL=https://staging.example.com PRODUCT_PATH=/shop/product/example-slug pnpm run load:k6`.
- Do not load test real order creation unless connected to a staging database/payment sandbox.

## Security Scanning
- Dependency audit: `pnpm run audit:high`.
- Optional: Snyk dependency scan.
- Optional: OWASP ZAP baseline scan against staging.
- Optional: Trivy scan if Docker images are introduced.

## Smoke Test URLs
- `/`
- `/epc`
- `/thermal`
- `/sparkle`
- `/mapping`
- `/resources`
- `/shop`
- product detail page
- cart drawer
- `/checkout`
- `/account/login`
- `/account/register`
- `/admin/login`
- `/admin`

