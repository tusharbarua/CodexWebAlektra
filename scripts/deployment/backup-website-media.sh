#!/usr/bin/env bash
set -euo pipefail
umask 077

: "${ALEKTRA_WEBSITE_SERVICE:?Set the Dokploy website service name}"
: "${ALEKTRA_UPLOAD_VOLUME:?Set the verified Docker volume name}"
: "${RESTIC_REPOSITORY:?Set the private restic repository}"
: "${RESTIC_PASSWORD_FILE:?Set the restic password file}"

container=$(docker ps --filter "name=${ALEKTRA_WEBSITE_SERVICE}.1." --filter health=healthy --format '{{.ID}}')
if [[ ! $container =~ ^[a-f0-9]{12}$ ]]; then
  echo 'Expected one healthy Alektra website container. No backup was created.' >&2
  exit 1
fi

mount=$(docker inspect --format '{{range .Mounts}}{{if eq .Destination "/app/public/uploads"}}{{.Type}} {{.Name}} {{.RW}}{{end}}{{end}}' "$container")
if [[ $mount != "volume ${ALEKTRA_UPLOAD_VOLUME} true" ]]; then
  echo 'The healthy website container is not using its verified writable upload volume.' >&2
  exit 1
fi

root=$(docker exec "$container" node -e 'console.log(require("node:path").resolve(process.env.UPLOAD_DIR?.trim() || "public/uploads"))')
if [[ $root != /app/public/uploads ]]; then
  echo 'The running application uses a different upload directory.' >&2
  exit 1
fi

source=$(docker volume inspect --format '{{.Mountpoint}}' "$ALEKTRA_UPLOAD_VOLUME")
if [[ ! -d $source/projects || ! -r $source/projects ]]; then
  echo 'The verified upload volume is missing its readable projects directory.' >&2
  exit 1
fi

restic backup --tag website-uploads --exclude '.upload-*' "$source"
restic forget --tag website-uploads --keep-daily 14 --keep-weekly 8 --keep-monthly 12
