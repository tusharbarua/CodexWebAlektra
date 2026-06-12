# Alektra Renewable Platform Architecture

## Stack

- Next.js App Router for the website, storefront, admin dashboard and API routes.
- Prisma ORM with PostgreSQL by default.
- NextAuth credentials authentication with role-based admin access.
- SSLCommerz payment initiation and callback validation structure.
- Nodemailer order confirmation email structure.
- Local media URLs today, S3-compatible storage environment variables for deployment.

## Impact Dashboard

Manual admin values are stored in `ImpactSnapshot`. The immutable manual baseline is also stored inside `manualBaselineJson.baseline`.

Future inverter platform readings are stored in `ImpactDailyLedger` by `source`, `externalPlantId` and `date`. Recalculation always uses:

`manual baseline + sum(ImpactDailyLedger)`

This means SolisCloud, Sungrow iSolarCloud, SMA Sunny Portal or generic API data can add production without destroying or overwriting previous accumulated manual values.

## Commerce

Products include category, gallery, price, stock, SKU/model, descriptions, datasheet/manual URLs and featured flags. Orders store customer details, line items, coupon, delivery charge, payment method, payment status and admin order status.

## Admin Coverage

The dashboard covers content, hero media, projects, impact, integrations, resources, products, categories, orders, customers, coupons, contacts, SEO and users/roles. The schema and protected APIs are ready for expanded form editing screens.
