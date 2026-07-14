# Post-Deployment Verification

Use this checklist after every Dokploy/Hostinger deployment and especially after migrating from local SQLite to production PostgreSQL.

## 1. Confirm Runtime Database

Run inside the deployed app container or deployment shell:

```bash
pnpm run db:verify:postgres
pnpm run db:diagnose
```

Expected:

- `generatedPrismaClientProvider` is `postgresql`
- `database.providerHint` is `postgresql` or `postgres`
- migrations are listed from `_prisma_migrations`
- products, CMS pages, page sections, resources, legal documents, and settings have non-zero counts when production content has been imported

Important: `prisma migrate deploy` creates/updates schema only. It does **not** import local SQLite data.

## 2. Expected Minimum Data After Import

The current local SQLite export contains important staging content. After importing it into PostgreSQL, these counts should not be zero:

| Area | Diagnostic model/count |
| --- | --- |
| Products | `Product`, `ProductCategory`, `ProductImage` |
| Public CMS pages | `Page`, `PageSection`, `PageSectionItem` |
| Thermal/Sparkle/Mapping content | `pages` entries for `thermal`, `sparkle`, `mapping` with sections/items |
| Projects | `Project` |
| Resources | `ResourceCategory`, `ResourceArticle` |
| Shop/legal | `ShopLegalContent`, `LegalDocument` |
| Footer/settings | `SiteSettings` |
| Checkout settings | `DeliveryCharge`, `EcommerceDeliverySetting`, `PaymentInstructionSetting` |

If `/shop` shows zero products, `Product` or published product counts are likely zero.

If `/thermal`, `/sparkle`, or `/mapping` show only header/footer/hero, `PageSection` or `PageSectionItem` rows are likely missing for those page keys.

## 3. Import SQLite Data Into PostgreSQL

From local development:

```bash
pnpm run db:backup:sqlite
pnpm run db:export:sqlite
```

Copy the generated file from:

```text
backups/sqlite-export/sqlite-export-YYYYMMDD-HHMMSS.json
```

to the deployed server/container path:

```text
backups/sqlite-export/
```

Then on Hostinger/Dokploy, with `DATABASE_URL` pointing to PostgreSQL:

```bash
pnpm run db:generate:postgres
pnpm run db:deploy:postgres
pnpm run db:import:postgres -- --input backups/sqlite-export/sqlite-export-YYYYMMDD-HHMMSS.json
pnpm run db:diagnose
```

If the export file is the only `sqlite-export-*.json` file under `backups/sqlite-export/`, this also works:

```bash
pnpm run db:import:postgres
```

The import command refuses to import into a non-empty database unless `--truncate` is provided. Use `--truncate` only after confirming the target database can be cleared.

## 4. Copy Persistent Media

The database stores paths to uploaded media. Copy the local upload files to the persistent Dokploy volume:

```text
public/uploads/
```

Required persistent container paths:

```text
/app/public/uploads
/app/storage
```

Important media checks:

- main Alektra Renewable logo: `public/brand/alektra-renewable-logo.png`
- Thermal logo: `public/brand/alektra-thermal-logo.png`
- Sparkle logo: `public/brand/alektra-sparkle-logo.png`
- Mapping logo: `public/brand/alektra-mapping-logo.png`
- hero videos under `public/uploads/hero/`
- product images under `public/uploads/products/`
- project images under `public/uploads/projects/`

Run:

```bash
pnpm run db:diagnose
```

Check `media.missingLocalMedia`. It should be `0` or only list intentionally removed files.

## 5. Public Page Smoke Test

Open:

- `/`
- `/thermal`
- `/sparkle`
- `/mapping`
- `/company`
- `/resources`
- `/shop`
- a product detail page
- `/checkout`
- `/account/login`
- `/admin/login`

Or run:

```bash
pnpm run verify:deployment -- --url https://your-staging-host
```

## 6. Expected Fix For Current Hostinger Demo Symptoms

Current symptoms:

- `/shop` shows zero products
- Thermal/Sparkle/Mapping body sections are missing
- some pages show only fallback/static content
- main Alektra Renewable logo is missing on EPC/company/resources/shop

Most likely cause:

- PostgreSQL migrations ran, but the local SQLite JSON export was not imported into PostgreSQL
- uploaded media was not copied into the persistent `/app/public/uploads` volume or the deployed image is older than the static-logo fallback patch

Recovery order:

1. Confirm Dokploy `DATABASE_URL` is PostgreSQL.
2. Redeploy the latest GitHub commit.
3. Run PostgreSQL migrations.
4. Import the SQLite JSON export.
5. Copy/mount `public/uploads`.
6. Run `pnpm run db:diagnose`.
7. Run `pnpm run verify:deployment -- --url https://your-staging-host`.
8. Smoke test the affected pages manually.

Do not run destructive Prisma commands such as `migrate reset`, `db push --force-reset`, or production seed scripts against a live database.
