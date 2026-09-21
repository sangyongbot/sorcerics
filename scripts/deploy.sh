#!/usr/bin/env bash
#
# Deploy the static site to production: the Vultr box "sol-web"
# (158.247.214.3, Ubuntu, nginx default site, web root /var/www/html).
#
#   bash scripts/deploy.sh                 # backup + rsync + smoke check
#   DEPLOY_HOST=root@1.2.3.4 bash scripts/deploy.sh
#
# The current web root is copied to /var/www/html.bak-<timestamp> on the
# server first (the three most recent backups are kept), then the site is
# rsynced with --delete. Build outputs only: pages, styles.css, main.js,
# fonts/, frames/, product/, assets/. Repo tooling is excluded.
set -euo pipefail

HOST="${DEPLOY_HOST:-root@158.247.214.3}"
ROOT="${DEPLOY_ROOT:-/var/www/html}"
cd "$(dirname "$0")/.."

echo "→ backing up $HOST:$ROOT"
ssh "$HOST" "set -e; B='$ROOT.bak-'\$(date +%Y%m%d-%H%M%S); cp -a '$ROOT' \"\$B\"; echo \"  \$B\"; ls -d '$ROOT'.bak-* | head -n -3 | xargs -r rm -rf"

echo "→ syncing build"
rsync -az --delete \
  --exclude .git --exclude .superset --exclude scripts --exclude docs \
  --exclude node_modules --exclude .gitignore --exclude .nojekyll --exclude .DS_Store \
  ./ "$HOST:$ROOT/"

echo "→ smoke check"
IP="${HOST#*@}"
for p in "" styles.css main.js fonts/Satoshi-700.woff2 frames/frame_0001.webp; do
  printf "  %-28s " "/$p"
  curl -s -m 10 -o /dev/null -w "%{http_code} %{content_type}\n" "http://$IP/$p"
done
echo "done → http://$IP/"
