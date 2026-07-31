#!/bin/sh
# Remove stray files from the first (wrong-path) deploy that landed in the SFTP
# user-home instead of public_html/. The home dir is not webserver-exposed but
# wastes quota and is messy. SFTP has no `rm -r`, so we walk out/ bottom-up and
# build per-file rm + per-dir rmdir commands.
set -e

if [ -z "${HETZNER_SFTP_PASS:-}" ] && [ -f "/srv/Container/.env" ]; then
  set -a
  . "/srv/Container/.env"
  set +a
fi

HOST="${HETZNER_SFTP_HOST:-}"
PORT="${HETZNER_SFTP_PORT:-22}"
USER="${HETZNER_SFTP_USER_1STAI:-}"
PASS="${HETZNER_SFTP_PASS:-}"

if [ -z "${HOST}" ] || [ -z "${USER}" ] || [ -z "${PASS}" ]; then
  echo "Missing HETZNER_SFTP_HOST/USER_1STAI/PASS in /srv/Container/.env"; exit 1
fi

if [ ! -d out ]; then
  echo "out/ missing — run a build first (deploy script handles this)."; exit 1
fi

BATCH="$(mktemp)"

# Files first (relative paths from out/)
find out -type f | sed 's|^out/||' | while IFS= read -r f; do
  printf 'rm %s\n' "$f"
done >> "${BATCH}"

# Then directories, deepest first
find out -mindepth 1 -type d | awk '{print length, $0}' | sort -rn | cut -d' ' -f2- \
  | sed 's|^out/||' | while IFS= read -r d; do
  printf 'rmdir %s\n' "$d"
done >> "${BATCH}"

echo "bye" >> "${BATCH}"

LINES=$(wc -l < "${BATCH}")
echo "Cleanup plan: ${LINES} sftp commands. Targeting ${USER}@${HOST}:~ (user-home, NOT public_html)."

SSHPASS="${PASS}" sshpass -e sftp -P "${PORT}" \
  -o StrictHostKeyChecking=no -o PreferredAuthentications=password -o PubkeyAuthentication=no \
  "${USER}@${HOST}" < "${BATCH}" 2>&1 | tail -30

rm -f "${BATCH}"
echo "Done. Verify with: sftp ... → ls -la"
