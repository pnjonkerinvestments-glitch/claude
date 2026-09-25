#!/usr/bin/env bash
# Optie B: Roviko publiceren naar het eigen Cloudflare-account (zie docs/PUBLICEREN.md).
# Bouwt, test, past nieuwe D1-migraties toe en deployt de worker "roviko" naar workers.dev.
# roviko.app is in het dashboard als custom domain aan deze worker gekoppeld: dit is de live site.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

config=wrangler.cloudflare.jsonc
if [[ -z "${CLOUDFLARE_API_TOKEN:-}" ]]; then
  echo "CLOUDFLARE_API_TOKEN ontbreekt. Zet het token als omgevingsvariabele (nooit in een bestand in git)." >&2
  exit 1
fi
export CLOUDFLARE_ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID:-d3e59f712dc36fea587bc5be0ebf58ec}"

if [[ -n "$(git status --porcelain -- . ':!EXPORT_MANIFEST.json')" ]]; then
  echo "Let op: er zijn niet-gecommitte wijzigingen; die gaan ook mee in deze deploy." >&2
fi

echo "== 1/4 Bouwen"
npm run build
echo "== 2/4 Testen"
npm test
echo "== 3/4 Nieuwe databasemigraties toepassen (alleen wat nog niet gedaan is)"
npx wrangler d1 migrations apply roviko-db --remote -c "$config"
echo "== 4/4 Deployen"
commit="$(git rev-parse --short HEAD)"
version="$(node -e "console.log(require('./EXPORT_MANIFEST.json').website_version)" 2>/dev/null || echo onbekend)"
npx wrangler deploy -c "$config" --message "Roviko ${version} (${commit})"

echo
echo "Klaar: https://roviko.app (ook op https://roviko.pnjonkerinvestments.workers.dev)"
echo "Controleren: open https://roviko.app. De rooktest schrijft in de live database; alleen met akkoord."
echo "Terugdraaien: npx wrangler rollback -c $config   (zie docs/PUBLICEREN.md)"
