# Hostinger VPS Deployment Notes

## Production Database Strategy

The working local project still keeps the original SQLite schema at `prisma/schema.prisma` so the current `dev.db` and local build remain safe. For Hostinger VPS production, use the PostgreSQL schema and migration path in:

```text
prisma/postgresql/schema.prisma
prisma/postgresql/migrations/
```

Recommended database strategy:

- Use SQLite only for quick local testing snapshots.
- Use PostgreSQL for staging and production.
- Ideally use PostgreSQL locally as well before launch so development matches production.
- Never assume Prisma schema migration will move SQLite data into PostgreSQL. Schema migration and data migration are separate steps.

## PostgreSQL Setup On Ubuntu/Hostinger VPS

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib -y
sudo systemctl enable postgresql
sudo systemctl start postgresql

sudo -u postgres psql
CREATE DATABASE alektra_website;
CREATE USER alektra_user WITH ENCRYPTED PASSWORD 'strong_password_here';
GRANT ALL PRIVILEGES ON DATABASE alektra_website TO alektra_user;
\c alektra_website
GRANT ALL ON SCHEMA public TO alektra_user;
\q
```

Keep PostgreSQL listening locally only. Do not expose port `5432` publicly.

Production `.env`:

```env
DATABASE_URL="postgresql://alektra_user:strong_password_here@localhost:5432/alektra_website"
```

## SQLite To PostgreSQL Data Migration

Run these from the current SQLite project before deploying:

```bash
pnpm run db:backup:sqlite
pnpm run db:export:sqlite
```

This creates:

```text
backups/sqlite/dev-YYYYMMDD-HHMMSS.db
backups/sqlite-export/sqlite-export-YYYYMMDD-HHMMSS.json
```

Copy the export JSON to the VPS or staging server, then run PostgreSQL migrations and import:

```bash
pnpm install --frozen-lockfile
pnpm run db:pg:generate
pnpm run db:pg:deploy

DATABASE_URL="postgresql://alektra_user:strong_password_here@localhost:5432/alektra_website" \
pnpm run db:import:postgres -- --input backups/sqlite-export/sqlite-export-YYYYMMDD-HHMMSS.json

pnpm run db:diagnose
```

If the export JSON has already been copied to `backups/sqlite-export/` and is the newest/only export, `pnpm run db:import:postgres` will use it automatically.

The import script refuses non-PostgreSQL URLs and refuses non-empty destination databases unless `--truncate` is explicitly passed.

Also copy or mount persistent media:

```text
public/uploads/
storage/
```

Missing `/shop` products or empty Thermal/Sparkle/Mapping body sections after deployment usually means the schema was migrated but this SQLite data import step was missed.

## Build And Run

Use a PostgreSQL `DATABASE_URL` in production. The default `pnpm run build` now chooses the Prisma schema from `DATABASE_URL`; with a PostgreSQL URL it generates Prisma Client from `prisma/postgresql/schema.prisma`.

```bash
corepack enable
corepack prepare pnpm@11.12.0 --activate
pnpm install --frozen-lockfile
cp .env.example .env

pnpm run db:generate:postgres
pnpm run db:deploy:postgres
pnpm run build
pnpm run db:verify:postgres
pnpm run db:diagnose

mkdir -p logs
pm2 start ecosystem.config.cjs
pm2 save
```

Reload after updates:

```bash
pnpm install --frozen-lockfile
pnpm run db:deploy:postgres
pnpm run build
pnpm run db:verify:postgres
pnpm run db:diagnose
pm2 reload alektra-website
```

Equivalent explicit commands:

```bash
npx prisma generate --schema=prisma/postgresql/schema.prisma
npx prisma migrate deploy --schema=prisma/postgresql/schema.prisma
npm run build
npm run db:verify:postgres
pm2 start ecosystem.config.cjs
```

Do not deploy production with `DATABASE_URL="file:..."`. That is the local SQLite format.

## Nginx Skeleton

```nginx
server {
  listen 80;
  server_name alektraepc.com www.alektraepc.com;
  return 301 https://$host$request_uri;
}

server {
  listen 443 ssl http2;
  server_name alektraepc.com www.alektraepc.com;

  client_max_body_size 80m;

  add_header X-Frame-Options "SAMEORIGIN" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header Referrer-Policy "strict-origin-when-cross-origin" always;
  add_header Permissions-Policy "camera=(), microphone=(), geolocation=(self), payment=(self)" always;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  location ^~ /uploads/ {
    try_files $uri =404;
    add_header X-Content-Type-Options "nosniff" always;
  }
}
```

## Email

Use Hostinger SMTP:

- `SMTP_HOST=smtp.hostinger.com`
- `SMTP_PORT=465`
- `SMTP_SECURE=true`
- `SMTP_USER=contact@alektraepc.com`
- `SMTP_PASS=your_hostinger_email_password`
- `MAIL_FROM_EMAIL=contact@alektraepc.com`
- `MAIL_FROM_NAME=Alektra Renewable`

Test order confirmation, verification, password reset, guest account setup, and admin SMTP test after staging deploy.

## Uploads

Keep `public/uploads` persistent across deployments. Do not delete it during git pulls/builds. Back up uploads daily.

## Backups

PostgreSQL backup example:

```bash
pg_dump -U alektra_user -h localhost alektra_website > alektra_website_backup.sql
```

Also back up:

- `public/uploads`
- `storage`
- `.env` stored securely outside git
- latest SQLite export JSON until migration is fully verified

## Staging Manual Checks

- Desktop and mobile header/menu/footer.
- Footer legal modal global overlay.
- Shop product cards, category filtering, search, pagination, and cart drawer.
- Checkout with and without logged-in customer.
- Optional guest account creation.
- Customer login/logout/register/profile/address/orders.
- Customer verification and password reset tokens.
- Project create/edit and Feature this on Resources.
- Resource edit and resource detail page.
- Upload invalid file rejection.
- Non-admin `/admin` access rejection.
