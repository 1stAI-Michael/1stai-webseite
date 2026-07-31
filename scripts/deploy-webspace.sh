#!/bin/sh
set -e

# Load /srv/Container/.env if vars are missing
if [ -z "${HETZNER_SFTP_PASS:-}" ] && [ -f "/srv/Container/.env" ]; then
  set -a
  . "/srv/Container/.env"
  set +a
fi

HOST="${HETZNER_SFTP_HOST:-}"
PORT="${HETZNER_SFTP_PORT:-22}"
USER="${HETZNER_SFTP_USER_1STAI:-}"
PASS="${HETZNER_SFTP_PASS:-}"
REMOTE_DIR="${HETZNER_SFTP_REMOTE_DIR_1STAI:-/}"

if [ -z "${HOST}" ] || [ -z "${USER}" ] || [ -z "${PASS}" ]; then
  echo "Missing HETZNER_SFTP_HOST, HETZNER_SFTP_USER_1STAI or HETZNER_SFTP_PASS in /srv/Container/.env"
  exit 1
fi

NEXT_PUBLIC_SITE_URL="${NEXT_PUBLIC_SITE_URL:-https://1stai.eu}"
export NEXT_PUBLIC_SITE_URL

if [ "${SKIP_BUILD:-0}" = "1" ]; then
  echo "SKIP_BUILD=1 — using existing out/ ..."
else
  echo "Building static site (NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL})..."
  npm run build
fi

if [ ! -d "out" ]; then
  echo "Build output 'out/' missing."
  exit 1
fi

if ! command -v sshpass >/dev/null 2>&1; then
  echo "sshpass is required. Install with: apt-get install -y sshpass"
  exit 1
fi

# Build sftp batch. REMOTE_DIR="/" → upload into user-home (Hetzner SFTP chroot).
BATCH="$(mktemp)"
{
  if [ "${REMOTE_DIR}" != "/" ] && [ -n "${REMOTE_DIR}" ]; then
    echo "-mkdir ${REMOTE_DIR}"
    echo "cd ${REMOTE_DIR}"
  fi
  echo "lcd out"
  echo "put -r ."
  if [ -f ".htaccess" ]; then
    echo "lcd .."
    echo "put .htaccess"
  fi
  echo "bye"
} > "${BATCH}"

echo "Uploading out/ → ${USER}@${HOST}:${REMOTE_DIR} (port ${PORT}) via sftp ..."
# NOTE: do NOT use sftp -b — it detaches stdin and breaks sshpass.
# Instead pipe the batch via stdin (sftp reads commands from stdin like interactive mode).
SSHPASS="${PASS}" sshpass -e sftp -P "${PORT}" \
  -o StrictHostKeyChecking=no -o PreferredAuthentications=password -o PubkeyAuthentication=no \
  "${USER}@${HOST}" < "${BATCH}"

rm -f "${BATCH}"
echo "Done. Verify https://1stai.eu/"
