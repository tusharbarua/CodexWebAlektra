# SQLite To PostgreSQL Migration Plan

This project currently uses SQLite locally through Prisma. PostgreSQL is the recommended database for Hostinger VPS staging and production.

## Current Audit

- Current local Prisma schema: `prisma/schema.prisma`
- Current local provider: `sqlite`
- Current local database URL: `DATABASE_URL="file:../dev.db"`
- Current local database file: `C:\Projects\AlektraWebsiteE\dev.db`
- Production PostgreSQL schema: `prisma/postgresql/schema.prisma`
- Production PostgreSQL migrations: `prisma/postgresql/migrations/`
- Prisma model count: 49
- SQLite migration history exists in `prisma/migrations/`
- PostgreSQL initial migration was generated from the current Prisma data model.
- Seed file exists at `prisma/seed.ts`.
- No application raw SQL calls were found in `src/`, `prisma/`, or `scripts/`.

## Live SQLite Data Snapshot

The current `dev.db` contains important business and CMS data. Do not delete it.

| Model | Rows |
| --- | ---: |
| User | 1 |
| AppRole | 9 |
| AppRolePermission | 119 |
| Customer | 3 |
| CustomerEmailVerificationToken | 2 |
| CustomerAddress | 1 |
| SeoMetadata | 1 |
| SiteContent | 3 |
| Page | 4 |
| PageSection | 41 |
| PageSectionItem | 181 |
| SiteSettings | 1 |
| HeroMedia | 3 |
| Project | 4 |
| ProjectImage | 1 |
| ImpactSnapshot | 1 |
| ResourceCategory | 16 |
| ResourceArticle | 5 |
| ProductCategory | 11 |
| Product | 14 |
| ProductImage | 41 |
| Coupon | 1 |
| DeliveryCharge | 2 |
| EcommerceDeliverySetting | 1 |
| EcommerceCheckoutSetting | 1 |
| PaymentInstructionSetting | 1 |
| ShopLegalContent | 2 |
| LegalDocument | 4 |
| MessagingIntegration | 1 |
| OtpVerification | 2 |
| NotificationLog | 6 |
| Order | 5 |
| OrderItem | 11 |
| ThermalInspectionRequest | 1 |
| MappingServiceRequest | 1 |
| ThermalBaseLocation | 1 |
| ThermalPricingRule | 1 |

All other models had zero rows at the time of this audit.

## Recommendation

Use PostgreSQL for staging and production.

Reasons:

- Better concurrency for ecommerce, checkout, orders, admin usage, and customer accounts.
- Safer for production backups and point-in-time operational workflows.
- More reliable under simultaneous visitors and admin operations.
- Better fit for future reporting, integrations, and scaling.

SQLite can remain for quick local testing snapshots. For best production confidence, local development should eventually move to PostgreSQL too.

## Compatibility Notes

The schema uses Prisma features that PostgreSQL supports:

- String CUID primary keys.
- `DateTime` timestamps.
- `Decimal` money/capacity fields.
- `Boolean` fields.
- `Json` fields.
- Enums.
- Unique constraints and indexes.
- Cascading relations.

Important differences:

- Existing SQLite migration SQL is not reusable for PostgreSQL because the SQLite migration lock is provider-specific.
- Data migration is separate from schema migration.
- Decimal values are exported as strings and imported into PostgreSQL through Prisma.
- Date values are exported as ISO strings and converted back to `Date` during import.
- JSON values are preserved in the JSON export.

## Files Added For PostgreSQL

```text
prisma/postgresql/schema.prisma
prisma/postgresql/migrations/migration_lock.toml
prisma/postgresql/migrations/20260714000000_initial_postgresql/migration.sql
scripts/db/backup-sqlite-db.js
scripts/db/export-sqlite-to-json.js
scripts/db/import-json-to-postgres.js
```

## Migration Runbook

### 1. Back Up SQLite

```bash
pnpm run db:backup:sqlite
```

This creates:

```text
backups/sqlite/dev-YYYYMMDD-HHMMSS.db
```

### 2. Export SQLite Data

```bash
pnpm run db:export:sqlite
```

This creates:

```text
backups/sqlite-export/sqlite-export-YYYYMMDD-HHMMSS.json
```

### 3. Create PostgreSQL Database

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib -y

sudo -u postgres psql
CREATE DATABASE alektra_website;
CREATE USER alektra_user WITH ENCRYPTED PASSWORD 'strong_password_here';
GRANT ALL PRIVILEGES ON DATABASE alektra_website TO alektra_user;
\c alektra_website
GRANT ALL ON SCHEMA public TO alektra_user;
\q
```

### 4. Configure PostgreSQL Environment

```env
DATABASE_URL="postgresql://alektra_user:strong_password_here@localhost:5432/alektra_website"
```

Never commit production `.env` files.

### 5. Deploy PostgreSQL Schema

```bash
pnpm run db:generate:postgres
pnpm run db:deploy:postgres
```

### 6. Import Exported SQLite Data

```bash
DATABASE_URL="postgresql://alektra_user:strong_password_here@localhost:5432/alektra_website" \
pnpm run db:import:postgres -- --input backups/sqlite-export/sqlite-export-YYYYMMDD-HHMMSS.json
```

The import script:

- Refuses non-PostgreSQL URLs.
- Refuses non-empty destination databases unless `--truncate` is explicitly passed.
- Preserves IDs, slugs, timestamps, relation scalar fields, and media path references.

### 7. Build For PostgreSQL

```bash
pnpm run build
pnpm run db:verify:postgres
```

### 8. Verify Row Counts

Compare imported row counts with the JSON export metadata. Then verify the application manually.

## Production Verification Checklist

Public:

- Homepage
- Thermal
- Sparkle
- Mapping
- Resources
- Resource detail
- Shop
- Product detail

Shop:

- Category filtering
- Search
- 16-item pagination
- Cart
- Checkout
- Order creation
- Order confirmation email

Customer:

- Register
- Verify email
- Login
- Logout
- Forgot password
- Reset password
- Add/edit address
- View orders

Admin:

- Login
- Products
- Orders
- Customers
- Projects
- Feature project on Resources
- Resources/articles
- Legal content
- Media upload

Security:

- Customer cannot access admin.
- Customer cannot see another customer's order.
- Admin routes are protected.
- Reset and verification tokens work and expire.

## Backup After Migration

```bash
pg_dump -U alektra_user -h localhost alektra_website > alektra_website_backup.sql
```

Also back up:

- `public/uploads`
- `storage`
- production `.env` in secure server storage
- latest SQLite backup and export until production is fully verified
