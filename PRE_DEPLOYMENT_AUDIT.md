# Alektra Renewable Pre-Deployment Audit

## Build Status
- Dependency install: `pnpm install --frozen-lockfile`
- Lint: `pnpm run lint`
- TypeScript: `pnpm run typecheck`
- Production build: `pnpm run build`
- Tests: no `test` script is currently defined.
- Audit: `pnpm run audit:high`

## Performance Checklist
- Product listing selects only listing fields and primary image.
- Checkout product validation selects only pricing, stock, slug, SKU, and name.
- Cart thumbnails use `next/image` with fixed dimensions and fallback image handling.
- Hero videos use `preload="metadata"`, muted autoplay, loop, and `playsInline`.
- Default hero upload cap is 80 MB; compress video assets before deployment.
- Run `pnpm run analyze` before launch and inspect large public/admin bundles.
- Run Lighthouse/PageSpeed on homepage, shop, product detail, checkout, and resources.

## Security Checklist
- Admin auth and customer auth are separate.
- Admin layout and admin API routes enforce admin role server-side.
- Customer account pages call `requireCustomer`.
- Customer order detail filters by `customerId` plus order id/number.
- Passwords use bcrypt hashing.
- Verification/reset tokens are hashed, expire, and use `usedAt` single-use checks.
- Customer session cookies are HTTP-only, SameSite=Lax, and Secure in production.
- Production customer sessions require `CUSTOMER_SESSION_SECRET`, `AUTH_SECRET`, or `NEXTAUTH_SECRET`.
- Nodemailer file and URL access are disabled in transport config.
- Global headers include X-Frame-Options, X-Content-Type-Options, Referrer-Policy, and Permissions-Policy.
- CSRF/rate limiting should be verified at staging/Nginx for login, checkout, admin actions, uploads, and OTP endpoints.

## Environment Variables Checklist
- `DATABASE_URL`
- `AUTH_SECRET` or `NEXTAUTH_SECRET`
- `CUSTOMER_SESSION_SECRET`
- `APP_URL`, `NEXT_PUBLIC_APP_URL`, `NEXTAUTH_URL`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`
- `MAIL_FROM_EMAIL`, `MAIL_FROM_NAME`
- `ADMIN_NOTIFICATION_EMAIL`
- `HERO_VIDEO_MAX_BYTES`, `SERVER_ACTION_BODY_SIZE_LIMIT`
- SSLCommerz variables if payments are enabled
- Storage/upload variables if uploads move outside local disk

## Database Checklist
- Run `pnpm run db:deploy`.
- Verify product, order, resource, and image indexes are present.
- Confirm backups and restore process.
- Confirm production DB is not publicly reachable.
- Confirm admin lists are paginated where high growth is expected; orders are paginated, several smaller admin lists are not yet paginated.

## Email Checklist
- SMTP credentials are provided only through environment variables.
- `.env` is ignored by git.
- `.env.example` contains placeholders only.
- Test account verification, password reset, order confirmation, and thermal request emails.
- Confirm email failures are logged internally without exposing SMTP credentials to customers.

## Upload And Storage Checklist
- Confirm `public/uploads` persists between releases.
- Confirm upload directory ownership and permissions.
- Confirm invalid extensions/MIME types are rejected.
- Confirm SVG uploads are rejected unless a future sanitizer is added.
- Confirm hero video uploads respect the configured max size.
- Back up uploads daily.

## VPS Hardening Checklist
- SSH key login enabled.
- Root password login disabled where practical.
- Non-root deploy user configured.
- Firewall allows only SSH, HTTP, HTTPS.
- fail2ban installed.
- OS packages updated.
- HTTPS enabled.
- Nginx login/admin rate limits considered.
- Database is private.
- Disk usage monitoring enabled.
- Database and upload backups scheduled.

## Smoke Test Checklist
- Homepage loads.
- Hero videos/images load.
- Header/footer legal links work.
- Resources articles open.
- Shop products load.
- Product detail opens.
- Add to cart works.
- Cart drawer opens.
- Checkout page works.
- Order confirmation email sends.
- Customer registration, verification, login, forgot password, address, and orders work.
- Admin login, product/resource edit, hero upload, orders, customers, and footer CMS work.
- EPC, Thermal, Sparkle, and Mapping request forms submit.
- Non-admin cannot access `/admin`.
- Customer cannot access another customer's order.
- Upload rejects invalid file.
- Wrong password errors do not expose sensitive details.

## Rollback Checklist
- Keep previous release directory or git revision available.
- Back up database before migration.
- Record migration applied during release.
- If rollback is required, restore previous code and compatible database backup.
- Restart with `pm2 reload alektra-renewable`.
- Re-run smoke tests after rollback.

