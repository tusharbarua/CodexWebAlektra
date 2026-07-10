# Final Pre-Deployment Audit

Audit date: 2026-07-10

## Build Status
- `pnpm install --frozen-lockfile`: pass.
- `pnpm run lint`: pass.
- `pnpm run typecheck`: pass.
- `pnpm audit`: pass, no known vulnerabilities.
- `pnpm exec prisma validate`: pass.
- `npm run build`: pass.
- `pnpm run build`: pass after final code changes; one parallel-run failure was caused by simultaneous builds writing `.next`, then a clean single build passed.
- `npm audit`: not applicable without creating a package-lock; this repo is pnpm-locked.

## Security Checks Performed
- Confirmed admin and customer auth are separate.
- Confirmed `/admin` is protected by server-side admin layout and admin API/server actions use admin guards.
- Confirmed customer sessions use a separate HTTP-only cookie with Secure in production and SameSite=Lax.
- Confirmed customer passwords use bcrypt hashing.
- Confirmed verification/setup/reset tokens are hashed, expire, and are single-use.
- Confirmed account order detail queries require the current `customerId`.
- Confirmed customer address edit/delete/default actions scope by current `customerId`.
- Confirmed checkout recalculates prices, stock, delivery charge, discounts, legal agreement, and order totals server-side.
- Confirmed upload allow-lists reject SVG/executable types, sanitize filenames, generate unique names, and constrain subdirectories.
- Confirmed legal and article markdown renderer escapes HTML before applying limited inline formatting.
- Confirmed footer legal modal uses a single portal and restores body scroll.
- Confirmed global app headers include X-Frame-Options, X-Content-Type-Options, Referrer-Policy, and Permissions-Policy.

## Security Issues Found/Fixed
- Fixed project deletion leaving linked Resource case-study articles connected to deleted projects. The linked article is now unpublished and detached.
- Kept project-to-Resources creation admin-only through `requireAdmin`.
- Verified project-to-Resources uses unique `sourceProjectId` to prevent duplicate generated articles.

## Vulnerabilities
- No known dependency vulnerabilities remain from `pnpm audit`.
- `npm audit` cannot be used without generating a package-lock. Do not add a second lockfile just for audit.

## Performance Checks Performed
- Homepage project showcase now caps project records to 24 instead of 100.
- Project showcase interval respects reduced motion, desktop-only auto-scroll, pause-on-hover, and now clears resume timer on unmount.
- Resources list fetches card fields only, not full article bodies, and caps Load More to 60 visible records.
- Shop listing fetches listing/card fields only.
- Checkout avoids the floating cart and uses a dedicated checkout summary.
- Header/cart event listeners have cleanup.
- Hero video component uses `preload="metadata"`.

## Bottlenecks Found/Fixed
- Fixed potential homepage over-rendering from loading 100 project cards.
- Added project ordering index for homepage project showcase queries.
- Existing admin project/resource pages still load all rows and should be paginated if content grows substantially.

## Hostinger VPS Readiness
- PM2 config exists with app name `alektra-website`.
- Hostinger SMTP placeholders are in `.env.example`.
- Nginx reverse proxy, upload persistence, backups, and hardening are documented.
- **Blocking note:** PostgreSQL is preferred, but current Prisma schema/migrations are SQLite. PostgreSQL deployment is not ready until converted and tested.

## Manual Tests Still Required
- Staging visual regression on desktop and mobile.
- Customer register/login/logout/forgot/reset/profile/address/orders.
- Guest checkout, logged-in checkout, optional guest account creation, legal agreement validation, and order confirmation email.
- Admin project create/edit, Feature this on Resources, resource edit, product edit, upload media, orders/customers.
- Invalid upload rejection.
- Non-admin cannot access `/admin`.

## Third-Party Staging Tests
- Lighthouse/PageSpeed:
  - `https://staging.alektraepc.com/`
  - `https://staging.alektraepc.com/shop`
  - one product detail URL
  - `https://staging.alektraepc.com/checkout`
  - `https://staging.alektraepc.com/resources`
  - one resource article detail URL
- k6:
  - `BASE_URL=https://staging.alektraepc.com PRODUCT_PATH=/shop/product/example-slug DURATION=2m VUS=15 pnpm run load:k6`
- OWASP ZAP baseline scan against staging.
- Optional Snyk dependency scan.
- Trivy only if Docker is introduced.

## Final Go/No-Go Checklist
- Build passes after final edits.
- Migrations apply on staging database.
- SMTP works on staging.
- Upload persistence is configured.
- SSL works for `alektraepc.com` and `www.alektraepc.com`.
- PostgreSQL conversion decision is made before production.
