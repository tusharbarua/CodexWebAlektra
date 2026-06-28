# Alektra Renewable Website

Production-ready Next.js platform for Alektra Renewable, focused on Alektra EPC with Thermal, Sparkle and Mapping subdivisions, learning resources, e-commerce, admin management, SSLCommerz payments and a live impact dashboard.

## Setup

Active local development path: `C:\Projects\AlektraWebsiteE`.

1. Install dependencies:

```bash
npm install
```

2. Configure environment:

```bash
cp .env.example .env
```

For local development, keep `AUTH_TRUST_HOST=true`. In production, set `NEXTAUTH_URL` to the public HTTPS URL and configure trusted proxy/host handling for the deployment platform.

3. Set `DATABASE_URL`. The checked-in local configuration uses SQLite. A managed database can be configured for production with the matching Prisma provider and migration.

4. Run migrations and seed data:

```bash
npm run db:migrate
npm run db:seed
```

5. Start development:

```bash
npm run dev
```

## Admin

Default seeded admin credentials come from:

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

Visit `/admin/login`.

## Daily Impact Job

Schedule this command once per day with cron, Windows Task Scheduler or your hosting scheduler:

```bash
npm run impact:daily
```

The job appends enabled inverter API readings to `ImpactDailyLedger` and recalculates totals from the manual baseline plus ledger totals.

## SSLCommerz

Set these variables for payment:

- `SSLCOMMERZ_STORE_ID`
- `SSLCOMMERZ_STORE_PASSWORD`
- `SSLCOMMERZ_SANDBOX`
- `SSLCOMMERZ_SUCCESS_URL`
- `SSLCOMMERZ_FAIL_URL`
- `SSLCOMMERZ_CANCEL_URL`

Cash on delivery works without payment credentials.

## Alektra Thermal

- Public experience: `/thermal`
- Inspection admin: `/admin/thermal-inspections`
- Minimum request capacity: 50 kWp
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` enables the interactive Google Maps picker. Manual location entry remains available without it.
- `THERMAL_VIDEO_PATH` must point to the supplied drone MP4 in production. The app streams it with HTTP Range support at `/videos/thermal-drone.mp4`. Local development falls back to the original uploaded file path when it is available.
- Thermal request PDFs are written to `storage/thermal`, with an operating-system temporary directory fallback.
- SMTP is optional. Requests, quotations and payment receipts are still saved if email is not configured.

## Assets

The site uses the official uploaded Alektra logo artwork through an optimized data asset generated from `C:\Users\Dell\Downloads\ALEKTRA LOGO.png`. The vector logo remains in `public/brand/alektra-logo.svg` only as a fallback/reference asset.
