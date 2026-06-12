# Alektra Renewable Website

Production-ready Next.js platform for Alektra Renewable, focused on Alektra EPC with Thermal, Sparkle and Mapping subdivisions, learning resources, e-commerce, admin management, SSLCommerz payment structure and impact dashboard architecture.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Configure environment:

```bash
cp .env.example .env
```

3. Start PostgreSQL and set `DATABASE_URL`.

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

## Assets

The workspace sandbox prevented binary copying from the supplied logo/PDF paths. A vector Alektra logo fallback is included at `public/brand/alektra-logo.svg`, and brochure text/data exposed by the PDF has been seeded into the site. Replace or add production binary media in `public/brand` and your configured media storage during deployment.
