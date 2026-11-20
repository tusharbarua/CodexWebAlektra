# Production website media

The website runs as a Dokploy Docker application. Its public `/uploads/...` URLs resolve to paths within the effective upload directory. Next.js reads and writes the same configured `UPLOAD_DIR`, with `/app/public/uploads` as the default in the Docker image. Traefik forwards the website hostname to Next.js on port 3000. A successful request for an image bundled with the application only verifies serving, not persistence.

## Before changing storage

1. In Dokploy open **Alektra_Production → production → Alektra_Website → Advanced → Volumes**. Compare the saved configuration with `docker inspect --format '{{json .Mounts}}' CONTAINER_ID` on the VPS. Read only `UPLOAD_DIR` and the effective application working directory from the container. Avoid dumping the container environment.
2. As the app user, check that the effective directory is readable and writable. Run `node scripts/db/diagnose-resource-image.js ARTICLE_SLUG` in the app container to see how the project cover, gallery, and article resolve. `node scripts/db/diagnose-media.js` inventories the full project and Resources image references.
3. Save a private archive of the effective uploads **before** adding a mount that would cover the directory. From the VPS use `umask 077`, a private backup directory, and `set -o pipefail` before `docker cp -a CONTAINER_ID:/app/public/uploads/. - | gzip -c > uploads.tar.gz`. Validate it with `gzip -t`, `tar -tzf`, and `sha256sum`. If a different path was verified, substitute that path.
4. Inspect stopped website containers and previous volumes and backups for earlier files. Transfer approved recovery files using SCP over an authenticated SSH connection to a mode-0700 staging directory. Verify SHA-256 before publishing. Seed the volume from the backup and use exclusive creation for recovered files. Keep the archive and verify a checksum list for all pre-existing files before cutover.

## Before and after deployment

- Keep the **`alektra-website-media`** Docker volume mounted read/write at `/app/public/uploads` in the Dokploy application definition. Preserve the existing URL namespace and application UID 1001. Leave the selected path and volume unchanged on redeploy. Seed assets from `.image-seed/uploads` only fill missing files.
- On the running container check its real mount, access as the application user, and a recent successful backup. The optional `REQUIRE_PERSISTENT_UPLOADS=true` setting makes startup refuse a missing, read-only or container-local upload mount. Preflight the new task before enabling it.
- After deploying, compare the old and new task IDs, confirm `docker inspect --format '{{json .Mounts}}' NEW_CONTAINER_ID` shows the same volume and destination, and run the integrity audit from the actual app task with `--require-mount --origin=https://www.alektraepc.com`. Compare sample byte hashes and content types over HTTPS, and open the homepage project cards and their linked case studies. Check at least one bundled asset and one CMS-only asset. Avoid testing solely against the old task or a cached response.

## Daily backups

The VPS backup timer runs at 02:20 Asia/Dhaka. The job uses `scripts/deployment/backup-website-media.sh` with the verified `ALEKTRA_WEBSITE_SERVICE` and `ALEKTRA_UPLOAD_VOLUME` in a private systemd environment file. The backup job refuses to snapshot a healthy task with a different or missing mount. It makes a deduplicated encrypted restic snapshot with 14 daily, 8 weekly, and 12 monthly recovery points. Each snapshot is a complete restore point. Apply `restic prune` during an approved maintenance window to reclaim unreferenced data. Never reset or prune Docker volumes to reclaim backup space.

Set `RESTIC_REPOSITORY` to an approved separate destination and `RESTIC_PASSWORD_FILE` to a mode-0600 secret outside the source tree. For the local VPS repository, restrict the repository to root and protect an independent copy of the repository password before enabling an offsite copy. A private S3 repository can use narrowly scoped credentials for only the website backup prefix. Verify a backup and restore at the new destination before retiring any fallback copy.

For restore testing, use `restic check --read-data` and restore a known snapshot to a **new nonproduction directory** using `restic restore SNAPSHOT_ID --target SCRATCH_DIRECTORY`. Compare restored checksums with the expected upload manifest. Review new files in the website that were added after the snapshot before any real restore. Use a separate recovery volume and verify it before changing production mounts.

## Daily integrity audit and failure reporting

The VPS audit timer runs at 02:45 Asia/Dhaka. To move the audit to Dokploy, schedule an **Application Job** in **Alektra_Website → Schedules** with command `node scripts/db/diagnose-media.js --require-mount --origin=https://www.alektraepc.com`. If using a VPS timer, select the healthy current website task and execute that same command as its application user. The report names the affected record, field and URL, distinguishes local file failures from public HTTP failures, and exits nonzero for errors. A published record with no configured cover is reported separately as a warning. It only writes to private scheduler logs.

Add `--notify` when the application has working SMTP and a configured `ADMIN_NOTIFICATION_EMAIL` or `ADMIN_EMAIL`. A failing run then sends a short alert without paths or secrets. With no configured mail transport, use the VPS journal failure logs and connect an approved alert destination to receive external notifications. Do not enable unauthenticated public diagnostics.

## EPC homepage hero video

Use **Admin / Hero Media / EPC** to publish an H.264 MP4 or VP8/VP9 WebM. The authenticated upload accepts up to 80 MiB by default. `HERO_VIDEO_MAX_BYTES` controls this limit. The upload streams to `hero/epc` on the existing media volume and uses the runtime image's FFmpeg tools to check the encoding and decode frames before activation.

Every successful replacement has a unique filename. Keep previous EPC hero videos and their records as rollback assets and include them in the daily media backup. There is no automatic deletion. If space requires an approved cleanup, verify the backup, check all CMS records and references to the exact URL, and keep the immediately previous video.
