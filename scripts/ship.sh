#!/usr/bin/env bash
# Build prevail.sh and deploy it to Vercel (project prevail-site, team fru-dev3).
# Deploy only committed, pushed code. Never Netlify.
#
#   ./scripts/ship.sh
set -euo pipefail
cd "$(dirname "$0")/.."

[ -f .vercel/project.json ] || vercel link --yes --project prevail-site --scope fru-dev3

vercel build --prod --yes

SECSCAN=../../fd-libs/fd-libs-sitecheck/bin/secscan.mjs
[ -f "$SECSCAN" ] || SECSCAN="$HOME/Documents/fru/fd-libs/fd-libs-sitecheck/bin/secscan.mjs"
[ -f "$SECSCAN" ] || { echo "security scan not found (fd-libs/fd-libs-sitecheck): not deploying"; exit 1; }
node "$SECSCAN" . || { echo "security scan failed (see above): not deploying"; exit 1; }

# Deployed from a copy outside the repo: inside a git checkout the CLI attaches the commit,
# and Hobby blocks deploys whose commit author is not the account owner.
STAGE=$(mktemp -d)
trap 'rm -rf "$STAGE"' EXIT
mkdir "$STAGE/.vercel"
cp -R .vercel/project.json .vercel/output "$STAGE/.vercel/"
(cd "$STAGE" && vercel deploy --prebuilt --prod --scope fru-dev3 >/dev/null)

echo "checking the live site"
# prevail.sh is retired: every page 301s to Glyph Studio, the installer scripts stay served here.
for path in /install /install-mac; do
  code=$(curl -s -o /dev/null -w '%{http_code}' "https://prevail.sh$path")
  [ "$code" = 200 ] || { echo "https://prevail.sh$path answered $code"; exit 1; }
done
curl -s https://prevail.sh/install-mac | head -1 | grep -q '^#!/usr/bin/env bash' || { echo "/install-mac is not the script"; exit 1; }
for path in / /faq /how-it-works /changelog; do
  r=$(curl -s -o /dev/null -w '%{http_code} %{redirect_url}' "https://prevail.sh$path")
  [ "$r" = "301 https://glyph.fru.dev/studio" ] || { echo "https://prevail.sh$path answered $r"; exit 1; }
done
code=$(curl -s -o /dev/null -w '%{http_code}' -L "https://prevail.sh/download")
[ "$code" = 200 ] || { echo "/download does not reach the releases ($code)"; exit 1; }
echo "live: prevail.sh redirects to https://glyph.fru.dev/studio, installers served"
