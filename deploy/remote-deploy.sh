#!/usr/bin/env bash
# Runs ON THE SERVER, invoked by .github/workflows/deploy.yml over SSH:
#
#   remote-deploy.sh <release-id> <path-to-uploaded-tarball>
#
# Layout (one-time setup: deploy/DEPLOYMENT.md, "CI/CD"):
#   /var/www/ina/releases/<id>/       one directory per release (built in CI)
#   /var/www/ina/shared/.env.production   secrets, shared by all releases
#   /var/www/ina-app -> releases/<id>     what systemd + Nginx point at
#
# The switch is a single symlink swap, so the site is never half-updated.
# If the new release fails its health check, the previous one is restored.
set -euo pipefail

RELEASE_ID="${1:?release id required}"
TARBALL="${2:?tarball path required}"

BASE=/var/www/ina
RELEASES="$BASE/releases"
SHARED="$BASE/shared"
CURRENT=/var/www/ina-app
SERVICE=inaornamentalfish-next
HEALTH_URL=http://127.0.0.1:3000/
KEEP=5

log() { printf '[deploy %s] %s\n' "$(date -u +%H:%M:%S)" "$*"; }

[[ -f "$SHARED/.env.production" ]] || { log "missing $SHARED/.env.production"; exit 1; }

NEW="$RELEASES/$RELEASE_ID"
log "unpacking $RELEASE_ID"
rm -rf "$NEW"
mkdir -p "$NEW"
tar -xzf "$TARBALL" -C "$NEW"
rm -f "$TARBALL"

# Secrets live outside the release so a deploy never overwrites them.
ln -sfn "$SHARED/.env.production" "$NEW/.env.production"

# Next writes its optimised-image cache to .next/cache at runtime, as the
# service user (www-data). Share one cache across releases so a deploy doesn't
# throw away every resized image (re-resizing is the CPU cost we avoid), and
# make it group-writable for www-data.
mkdir -p "$SHARED/next-cache"
chgrp www-data "$SHARED/next-cache"
chmod 2775 "$SHARED/next-cache"
rm -rf "$NEW/.next/cache"
ln -sfn "$SHARED/next-cache" "$NEW/.next/cache"

# Runtime dependencies only — the build already happened in CI, so this is
# the only heavy step on the server and it skips devDependencies entirely.
log "installing runtime dependencies"
(cd "$NEW" && npm ci --omit=dev --no-audit --no-fund --loglevel=error)

PREVIOUS="$(readlink -f "$CURRENT" 2>/dev/null || true)"

switch_to() {
  ln -sfn "$1" "$CURRENT.next" && mv -Tf "$CURRENT.next" "$CURRENT"
  sudo /bin/systemctl restart "$SERVICE"
}

healthy() {
  for _ in $(seq 1 30); do
    if curl -fsS -o /dev/null --max-time 5 "$HEALTH_URL"; then return 0; fi
    sleep 2
  done
  return 1
}

log "switching to $RELEASE_ID"
switch_to "$NEW"

if healthy; then
  log "healthy"
else
  log "health check FAILED"
  if [[ -n "$PREVIOUS" && -d "$PREVIOUS" && "$PREVIOUS" != "$NEW" ]]; then
    log "rolling back to $(basename "$PREVIOUS")"
    switch_to "$PREVIOUS"
    healthy && log "rollback healthy" || log "rollback ALSO unhealthy — check: journalctl -u $SERVICE -n 100"
  fi
  exit 1
fi

# Keep the newest $KEEP releases (never the live one) for manual rollback.
log "pruning old releases"
ls -1dt "$RELEASES"/*/ 2>/dev/null | tail -n +$((KEEP + 1)) | while read -r dir; do
  [[ "$(readlink -f "$dir")" == "$(readlink -f "$CURRENT")" ]] && continue
  rm -rf "$dir"
done

log "done: $RELEASE_ID is live"
