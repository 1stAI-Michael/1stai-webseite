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

# A preview build (npm run preview) contains draft posts and leaves this marker.
# Checked BEFORE the build on purpose: the build wipes out/ and with it the
# marker, so a check that only runs afterwards can never fire.
check_no_drafts() {
  if [ -f "out/DRAFTS-INCLUDED" ]; then
    echo "out/ is a preview build containing drafts. Run 'npm run build' before deploying."
    exit 1
  fi
}

# fA-339: the leak gate hangs on the script, not on the habit. blog-check.mjs
# holds the LEAK_PATTERNS list (client names, sister brand, internal hostnames,
# ticket ids, end-customer fingerprint). It used to be a separate npm script a
# human had to remember; publishing is irreversible, so remembering is not a
# control. Same before/after shape as the drafts marker, for the same reason:
#   before the build — source level, fails in a second instead of after a build
#   after the build  — --built scans what is ACTUALLY in out/ and goes up. Leaks
#                      that never appear in posts.js land there: hardcoded
#                      strings in components, generated llms.txt, sitemap.
# Only the second run is the real guard; the first one just saves time.
check_no_leaks() {  # $1: optional "--built"
  echo "Leak gate: blog-check ${1:-(source)} ..."
  if node scripts/blog-check.mjs ${1:-}; then
    return 0
  fi
  echo ""
  echo "Leak gate FAILED — nothing was uploaded (fA-339)."
  echo "Fix the findings above, or extend LEAK_PATTERNS if a new name is legitimate."
  exit 1
}

if ! command -v node >/dev/null 2>&1; then
  echo "node is required — the leak gate cannot run, so this deploy stops (fA-339)."
  exit 1
fi

check_no_drafts
check_no_leaks

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

# Again after the build — covers SKIP_BUILD=1, where out/ is whatever was there.
check_no_drafts
check_no_leaks --built


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
