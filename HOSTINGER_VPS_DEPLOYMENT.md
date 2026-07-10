# Hostinger VPS Deployment Notes

## Important Database Note
The current Prisma schema uses `provider = "sqlite"`. Hostinger PostgreSQL is the preferred production target, but this repo is not yet PostgreSQL-ready because the schema provider and migration history must be converted and tested for PostgreSQL.

Use one of these paths:
- **Staging now:** deploy with current SQLite config using a persistent database file and backups.
- **Preferred production:** first create a PostgreSQL migration branch, convert Prisma provider/migrations, migrate data, and run a full staging rehearsal.

## Commands
```bash
corepack enable
corepack prepare pnpm@11.7.0 --activate
pnpm install --frozen-lockfile
cp .env.example .env
pnpm run db:deploy
pnpm run build
mkdir -p logs
pm2 start ecosystem.config.cjs
pm2 save
```

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
- SQLite current-state deployment: back up the database file and `public/uploads`.
- PostgreSQL future deployment: use `pg_dump` plus upload backup.

## Staging Manual Checks
- Desktop and mobile header/menu/footer.
- Footer legal modal global overlay.
- Shop product cards and cart drawer.
- Checkout with and without logged-in customer.
- Optional guest account creation.
- Customer login/logout/register/profile/address/orders.
- Project create/edit and Feature this on Resources.
- Resource edit and resource detail page.
- Upload invalid file rejection.
- Non-admin `/admin` access rejection.
