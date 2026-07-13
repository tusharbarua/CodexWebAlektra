# Alektra Renewable Website & Ecommerce Platform

A production-grade company website, ecommerce shop, CMS, project showcase, customer account system, and admin dashboard for Alektra Renewable.

- Production domain: `https://alektraepc.com`
- ERP domain, if used separately: `https://erp.alektraepc.com`

This repository does not contain production credentials. Keep all secrets in environment files or server-level secret storage.

## Project Overview

The platform powers the public Alektra Renewable website and related business workflows:

- Alektra EPC homepage and company landing experience
- Alektra Thermal service page and inspection request flow
- Alektra Sparkle service page and cleaning request flow
- Alektra Mapping page and mapping request flow
- Shop and ecommerce catalog
- Cart, checkout, delivery options, legal acceptance, and payment instruction flow
- Customer account system with registration, email verification, password reset, addresses, and orders
- Guest checkout with optional account creation
- Admin dashboard for operational management
- CMS-managed Resources and knowledge articles
- Project showcase / Featured Delivery / Our Projects
- Project case study publishing from Projects into Resources
- Legal policy modal plus standalone legal pages
- Transactional email through Hostinger SMTP
- Upload and media management for products, projects, hero media, resources, logos, and service pages

The current visual direction is premium and brand-led:

- Apple-like interface quality
- Glassmorphic crystal UI
- Emerald Solar Crystal theme for EPC, shop, checkout, customer account, and resources
- Page-specific themes for Thermal, Sparkle, and Mapping

## Technology Stack

Detected from `package.json`, Prisma schema, and project structure:

| Area | Technology |
| --- | --- |
| Framework | Next.js 15 App Router |
| UI runtime | React 19 |
| Language | TypeScript |
| Styling | Global CSS in `src/app/globals.css` |
| Database ORM | Prisma |
| Local database provider | SQLite, configured in `prisma/schema.prisma` |
| Production database target | PostgreSQL, configured in `prisma/postgresql/schema.prisma` |
| Authentication | NextAuth v5 beta for admin/auth integration; custom customer session utilities in `src/lib/customer-auth.ts` |
| Password hashing | `bcryptjs` |
| Validation | `zod` |
| Email | `nodemailer` with Hostinger SMTP |
| Icons | `lucide-react` |
| Motion | `framer-motion` where used |
| Payments | SSLCommerz integration utilities and routes |
| PDF support | `pdf-lib` for generated documents |
| Location data | `bangladesh-geojson` and local Bangladesh location service |
| Production process | PM2 via `ecosystem.config.cjs` |
| Reverse proxy | Nginx, documented in `HOSTINGER_VPS_DEPLOYMENT.md` |
| Load testing | k6 script in `load-tests/k6-smoke.js` |

Important database note: the current local workflow is SQLite-based to protect the existing `dev.db`. PostgreSQL is the recommended staging and production database. A separate PostgreSQL schema and migration path exists under `prisma/postgresql/`.

## Main Features

### Public Pages

- `/` - main Alektra Renewable / EPC homepage
- `/epc` - EPC route alias/page
- `/thermal` - Alektra Thermal
- `/sparkle` - Alektra Sparkle
- `/mapping` - Alektra Mapping
- `/resources` - knowledge hub and articles
- `/shop` - ecommerce shop
- `/company` - company/about page
- Legal pages: `/privacy-policy`, `/terms-of-use`, `/sales-and-refunds`, `/legal`, `/site-map`

### Ecommerce

- Product listing and category browsing
- Product detail pages
- Product images and gallery
- Cart drawer and cart view
- Checkout with delivery method selection
- Guest checkout
- Logged-in customer checkout
- Order confirmation email
- Bank/payment instruction flow
- SSLCommerz routes for online payment callbacks

### Customer Account

- Customer registration
- Email verification
- Login and logout
- Forgot password and reset password
- Profile editing
- Saved delivery addresses
- Customer order history and order detail pages
- Optional account creation from guest checkout
- Customer session is separate from admin authentication

### Admin Panel

- Admin login
- Dashboard and admin navigation
- Products and product images
- Orders and order export
- Customers
- Projects and project images
- Resources/articles and categories
- Page CMS/content management
- Hero media management
- Legal content management
- Footer/contact settings
- Impact dashboard settings
- Thermal, Sparkle, Mapping, and EPC request management
- Checkout, delivery, payment instruction, and integration settings

### Project Showcase

- Featured Delivery / Our Projects section on the homepage
- Admin-selected default featured project
- Temporary user-side project selection in the public showcase
- Side project list/carousel to prevent long project sections
- Project case study can be published into Resources as a linked article
- Re-saving a project updates the linked Resources article instead of creating duplicates

### Resources

- CMS-backed article cards
- Article detail pages at `/resources/[slug]`
- Resource categories and filters
- Search/filter support
- Load More pagination for scalable article lists
- Project case study integration from admin Projects

## Folder Structure

```text
.
├── docs/                         # Additional documentation assets if needed
├── load-tests/                   # k6 smoke/load test scripts
├── backups/                      # Local database backups and JSON exports; do not deploy blindly
├── prisma/                       # Prisma schemas, migrations, seed script
│   ├── migrations/               # Current SQLite migration history
│   ├── postgresql/               # PostgreSQL production schema and migrations
│   ├── schema.prisma             # Current local SQLite schema
│   └── seed.ts
├── public/                       # Static public assets
│   ├── brand/
│   ├── brochure-assets/
│   ├── uploads/
│   └── videos/
├── scripts/                      # Utility scripts, including DB migration helpers and impact job
├── src/
│   ├── app/                      # Next.js App Router routes, layouts, API routes, admin pages
│   ├── components/               # Shared UI and feature components
│   ├── data/                     # Static/local data used by the app
│   ├── lib/                      # Server utilities, auth, mail, uploads, CMS, cart, validation
│   └── types/                    # Shared TypeScript types
├── storage/                      # Runtime/generated storage, for example generated PDFs
├── .env.example                  # Safe environment variable template
├── ecosystem.config.cjs          # PM2 production process config
├── next.config.mjs               # Next.js configuration
├── package.json                  # Scripts and dependencies
├── pnpm-lock.yaml                # pnpm lockfile
└── README.md
```

## Environment Variables

Use `.env.local` for local development and a server-side `.env` file for production. Never commit real secrets.

The current `.env.example` contains the safe template. Key variables include:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE_NAME"
SQLITE_DATABASE_URL="file:../dev.db"

APP_URL="https://alektraepc.com"
NEXT_PUBLIC_APP_URL="https://alektraepc.com"
NEXTAUTH_URL="https://alektraepc.com"
AUTH_TRUST_HOST="true"

AUTH_SECRET="replace-with-a-strong-random-secret"
NEXTAUTH_SECRET="replace-with-a-strong-random-secret"
CUSTOMER_SESSION_SECRET="replace-with-a-strong-random-secret"

ADMIN_EMAIL="admin@alektraepc.com"
ADMIN_PASSWORD="replace-with-initial-admin-password"

SMTP_HOST="smtp.hostinger.com"
SMTP_PORT="465"
SMTP_SECURE="true"
SMTP_REQUIRE_TLS="false"
SMTP_USER="contact@alektraepc.com"
SMTP_PASS="your_hostinger_email_password"
SMTP_PASSWORD=""
MAIL_FROM_EMAIL="contact@alektraepc.com"
MAIL_FROM_NAME="Alektra Renewable"
SMTP_FROM=""
ADMIN_NOTIFICATION_EMAIL="admin@alektraepc.com"

NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=""
THERMAL_VIDEO_PATH=""
HERO_VIDEO_MAX_BYTES="83886080"
MAX_UPLOAD_SIZE="83886080"
SERVER_ACTION_BODY_SIZE_LIMIT="80mb"

SSLCOMMERZ_STORE_ID=""
SSLCOMMERZ_STORE_PASSWORD=""
SSLCOMMERZ_SANDBOX="false"
SSLCOMMERZ_SUCCESS_URL="https://alektraepc.com/api/payments/sslcommerz/success"
SSLCOMMERZ_FAIL_URL="https://alektraepc.com/api/payments/sslcommerz/fail"
SSLCOMMERZ_CANCEL_URL="https://alektraepc.com/api/payments/sslcommerz/cancel"

MEDIA_STORAGE_DRIVER="local"
UPLOAD_DIR="public/uploads"
S3_ENDPOINT=""
S3_BUCKET=""
S3_ACCESS_KEY_ID=""
S3_SECRET_ACCESS_KEY=""
```

Notes:

- Generate strong random values for `AUTH_SECRET`, `NEXTAUTH_SECRET`, and `CUSTOMER_SESSION_SECRET`.
- `DATABASE_URL` should point to PostgreSQL in staging/production.
- `SQLITE_DATABASE_URL` is only a reference for local SQLite snapshots; the current local `.env` may still use `DATABASE_URL="file:../dev.db"` for quick development.
- `ADMIN_PASSWORD` is only for initial seeding/bootstrap. Rotate it after setup.
- SMTP and SSLCommerz secrets must never be committed.
- Keep `public/uploads` persistent in production.

## Local Development Setup

This repository has a `pnpm-lock.yaml`, so `pnpm` is the recommended package manager. The scripts can also be run with npm if dependencies are installed with npm, but avoid mixing package managers in the same working copy.

1. Clone the repository.

```bash
git clone <repo-url> alektra-website
cd alektra-website
```

2. Install dependencies.

```bash
pnpm install
```

3. Create a local environment file.

```bash
cp .env.example .env.local
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

4. Configure `DATABASE_URL` and required secrets in `.env.local`.

For current local SQLite development:

```env
DATABASE_URL="file:../dev.db"
```

5. Generate Prisma client and run migrations.

```bash
pnpm run db:generate
pnpm run db:migrate
```

For local PostgreSQL/staging rehearsal, set `DATABASE_URL` to a PostgreSQL database and use:

```bash
pnpm run db:pg:generate
pnpm run db:pg:deploy
```

6. Seed initial data if needed.

```bash
pnpm run db:seed
```

7. Start the development server.

```bash
pnpm run dev
```

Local URL:

```text
http://localhost:3000
```

Admin login route:

```text
http://localhost:3000/admin/login
```

Seeded admin credentials are controlled by `ADMIN_EMAIL` and `ADMIN_PASSWORD`.

## Available Scripts

Actual scripts from `package.json`:

| Command | Description |
| --- | --- |
| `pnpm run dev` | Starts the local Next.js development server |
| `pnpm run build` | Generates Prisma Client based on `DATABASE_URL` and creates the Next.js build |
| `pnpm run build:postgres` | Generates Prisma client from the PostgreSQL schema and builds Next.js |
| `pnpm run start` | Starts the production Next.js server |
| `pnpm run lint` | Runs ESLint checks |
| `pnpm run typecheck` | Runs TypeScript type checking with `tsc --noEmit` |
| `pnpm run analyze` | Runs a bundle analyzer build |
| `pnpm run audit:high` | Runs dependency audit for high severity issues |
| `pnpm run load:k6` | Runs the k6 smoke load test |
| `pnpm run db:generate` | Generates Prisma client |
| `pnpm run db:migrate` | Runs Prisma development migrations |
| `pnpm run db:deploy` | Applies Prisma migrations in production/deployment |
| `pnpm run db:pg:generate` | Generates Prisma client from `prisma/postgresql/schema.prisma` |
| `pnpm run db:pg:migrate` | Runs development migrations against the PostgreSQL schema |
| `pnpm run db:pg:deploy` | Applies PostgreSQL production migrations |
| `pnpm run db:pg:studio` | Opens Prisma Studio using the PostgreSQL schema |
| `pnpm run db:generate:postgres` | Alias for PostgreSQL Prisma Client generation |
| `pnpm run db:deploy:postgres` | Alias for PostgreSQL production migration deploy |
| `pnpm run db:import:postgres` | Imports a SQLite JSON export into PostgreSQL |
| `pnpm run db:verify:postgres` | Verifies generated Prisma Client was built from PostgreSQL schema |
| `pnpm run db:backup:sqlite` | Copies `dev.db` into `backups/sqlite/` with a timestamp |
| `pnpm run db:export:sqlite` | Exports all Prisma models from SQLite into JSON |
| `pnpm run db:seed` | Seeds the database with `prisma/seed.ts` |
| `pnpm run impact:daily` | Runs the daily impact update job |

If using npm instead of pnpm, replace `pnpm run` with `npm run`.

## Database

Current database setup:

- Prisma ORM
- SQLite provider in `prisma/schema.prisma` for the existing local `dev.db`
- PostgreSQL provider in `prisma/postgresql/schema.prisma` for staging/production
- SQLite migrations in `prisma/migrations`
- PostgreSQL migrations in `prisma/postgresql/migrations`
- Seed script in `prisma/seed.ts`

Development commands:

```bash
pnpm run db:generate
pnpm run db:migrate
pnpm run db:seed
```

Production PostgreSQL migration command:

```bash
pnpm run db:pg:deploy
```

SQLite to PostgreSQL data migration:

```bash
pnpm run db:backup:sqlite
pnpm run db:export:sqlite

DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE_NAME" pnpm run db:generate:postgres
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE_NAME" pnpm run db:deploy:postgres
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE_NAME" pnpm run db:import:postgres -- --input backups/sqlite-export/sqlite-export-YYYYMMDD-HHMMSS.json
```

Backup notes:

- Back up the SQLite database file before every production migration.
- Keep `dev.db` until PostgreSQL staging and production data are verified.
- Do not store the database file in a disposable deployment directory unless it is intentionally persistent.
- Do not expose any database service publicly.
- Back up PostgreSQL with `pg_dump` after migration and before every release.

## Media and Uploads

The app supports local upload storage via `MEDIA_STORAGE_DRIVER=local` and `UPLOAD_DIR=public/uploads`.

Uploaded or managed media includes:

- Product images
- Product detail/gallery images
- Hero media and posters
- Project images
- Resource/article images
- Mapping/Thermal/Sparkle/EPC page media
- Logos and public brand assets
- Generated or uploaded operational media where supported

Production notes:

- `public/uploads` must be persistent across deployments.
- Do not delete `public/uploads` during `git pull`, build, or release cleanup.
- Back up uploads regularly.
- Enforce file type and size limits.
- Compress large images before upload.
- Hero videos should be optimized, use poster images, and avoid unnecessary file size.

## Email Configuration

Transactional email is handled through `nodemailer` and Hostinger SMTP.

Recommended Hostinger SMTP configuration:

```env
SMTP_HOST="smtp.hostinger.com"
SMTP_PORT="465"
SMTP_SECURE="true"
SMTP_USER="contact@alektraepc.com"
SMTP_PASS="your_hostinger_email_password"
MAIL_FROM_EMAIL="contact@alektraepc.com"
MAIL_FROM_NAME="Alektra Renewable"
```

Email flows include:

- Order confirmation
- Customer email verification
- Forgot password / reset password
- Guest account setup
- Admin/test email where available
- Service/request notifications where configured

Operational notes:

- SMTP failures should be logged safely without exposing credentials.
- Never commit SMTP passwords.
- Test email sending after each production deployment.

## Production Deployment on Hostinger VPS

Recommended production stack:

- Hostinger VPS
- Ubuntu
- Node.js LTS
- Production database: PostgreSQL
- Nginx reverse proxy
- PM2 process manager
- SSL/TLS certificates
- Hostinger SMTP

Basic deployment outline:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install git nginx -y

git clone <repo-url> alektra-website
cd alektra-website

pnpm install --frozen-lockfile
pnpm run db:generate:postgres
pnpm run db:deploy:postgres
pnpm run build
pnpm run db:verify:postgres
```

Start with PM2:

```bash
mkdir -p logs
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

The PM2 config starts Next.js on port `3000`:

```text
node_modules/next/dist/bin/next start -p 3000
```

Read the full deployment documents before production release:

- `HOSTINGER_VPS_DEPLOYMENT.md`
- `DEPLOYMENT_CHECKLIST.md`
- `docs/DOKPLOY_DOCKER_DEPLOYMENT.md`
- `docs/POSTGRESQL_MIGRATION_PLAN.md`
- `PRE_DEPLOYMENT_AUDIT.md`
- `FINAL_PRE_DEPLOYMENT_AUDIT.md`

## Nginx Reverse Proxy Summary

Recommended Nginx responsibilities:

- Serve `alektraepc.com` and `www.alektraepc.com`
- Reverse proxy app traffic to `127.0.0.1:3000`
- Enable SSL/TLS
- Set `client_max_body_size` high enough for configured uploads and hero media
- Serve or protect `/uploads/` according to the deployment guide
- Add security headers
- Do not expose the database publicly

Keep the full Nginx config in deployment documentation or server configuration, not only in this README.

## Security Notes

- Keep `.env`, database files, SMTP credentials, SSLCommerz credentials, and auth secrets private.
- Use strong random values for auth/session secrets.
- Use HTTPS in production.
- Keep admin and customer sessions separate.
- Protect all `/admin` routes.
- Validate all submitted data server-side.
- Do not trust client-side product prices, cart totals, discounts, or checkout totals.
- Recalculate order totals server-side.
- Customer account pages must only expose that customer's own orders and addresses.
- Email verification and password reset tokens should expire and be single-use.
- Validate upload MIME type, extension, and size.
- Run `pnpm run audit:high` and review dependency security issues.
- Run OWASP ZAP baseline against staging before production.
- Rotate initial admin passwords after deployment.

## Performance Notes

- Use optimized image dimensions for products, resources, and project cards.
- Avoid loading huge hero videos.
- Use video poster images and metadata/preload strategy where practical.
- Product, resource, and project card grids should use thumbnails/card fields rather than full detail payloads.
- The Resources grid should not fetch full article bodies for card listings.
- Use pagination or Load More for large article/product/project lists.
- Run Lighthouse/PageSpeed before production release.
- Use k6 or Artillery for staging load testing.
- Keep animations lightweight and respect mobile performance.

## Testing Checklist

Before deployment:

- [ ] `pnpm run build`
- [ ] `pnpm run lint`
- [ ] `pnpm run typecheck`
- [ ] `pnpm run audit:high`
- [ ] Test public pages: `/`, `/thermal`, `/sparkle`, `/mapping`, `/resources`, `/shop`
- [ ] Test product listing and product detail
- [ ] Test cart drawer and cart page
- [ ] Test checkout, delivery method, legal acceptance, and order placement
- [ ] Test customer register, email verification, login, logout
- [ ] Test forgot password and reset password
- [ ] Test customer profile, addresses, and order history
- [ ] Test admin login
- [ ] Test product create/edit and image upload
- [ ] Test project create/edit and project image upload
- [ ] Test project case study publishing to Resources
- [ ] Test Resources article create/edit/detail page
- [ ] Test transactional email sending
- [ ] Test media upload type/size validation
- [ ] Test mobile header, menu, footer, and cart access
- [ ] Test footer legal modal and standalone legal pages

After staging deployment:

- [ ] Lighthouse/PageSpeed scan
- [ ] OWASP ZAP baseline scan
- [ ] k6 or Artillery moderate load test
- [ ] Manual smoke test on desktop, tablet, and mobile
- [ ] Confirm PM2 process survives restart
- [ ] Confirm Nginx proxy and SSL
- [ ] Confirm database and upload backups

## Important Routes

| Route | Purpose |
| --- | --- |
| `/` | Main EPC/homepage |
| `/epc` | EPC route |
| `/thermal` | Alektra Thermal |
| `/sparkle` | Alektra Sparkle |
| `/mapping` | Alektra Mapping |
| `/resources` | Knowledge articles |
| `/resources/[slug]` | Article detail |
| `/shop` | Ecommerce shop |
| `/shop/product/[slug]` | Product detail |
| `/cart` | Cart page |
| `/checkout` | Checkout |
| `/company` | Company/about page |
| `/account/login` | Customer login |
| `/account/register` | Customer registration |
| `/account` | Customer dashboard |
| `/account/orders` | Customer order history |
| `/account/addresses` | Customer saved addresses |
| `/admin/login` | Admin login |
| `/admin` | Admin dashboard |
| `/admin/products` | Product management |
| `/admin/orders` | Order management |
| `/admin/customers` | Customer management |
| `/admin/projects` | Project showcase/case study management |
| `/admin/resources` | Resources article management |
| `/admin/pages` | Page CMS |
| `/admin/hero-media` | Hero media management |
| `/admin/site-settings/footer` | Footer/contact settings |
| `/privacy-policy` | Privacy Policy |
| `/terms-of-use` | Terms of Use |
| `/sales-and-refunds` | Sales and Refunds |
| `/legal` | Legal information |
| `/site-map` | Site map |

## Maintenance Notes

- Back up the database regularly.
- Back up `public/uploads` regularly.
- Keep dependencies updated and review changelogs before major upgrades.
- Monitor PM2 logs in `logs/pm2-out.log` and `logs/pm2-error.log`.
- Monitor Nginx access and error logs.
- Test SMTP periodically.
- Test SSLCommerz callbacks after payment configuration changes.
- Compress media before upload.
- Remove unused large media from staging before production.
- Do not push secrets or production database files.
- Review admin users and permissions periodically.
- Run migrations on staging before production.

## Documentation Links

The following project documents exist in this repository:

- `HOSTINGER_VPS_DEPLOYMENT.md`
- `DEPLOYMENT_CHECKLIST.md`
- `PRE_DEPLOYMENT_AUDIT.md`
- `FINAL_PRE_DEPLOYMENT_AUDIT.md`

Use these alongside this README for deployment planning, final audit, and go-live checks.
