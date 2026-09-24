#!/usr/bin/env bash
# Optie A: exportzip voor de ChatGPT-hosting maken (zie docs/PUBLICEREN.md).
# Inhoud: `git archive` van HEAD (de map roviko/ als zip-root) + een vers EXPORT_MANIFEST.json.
# Draait eerst typecheck, build en tests en zet de uitkomst in het manifest.
# Gebruik: npm run export:chatgpt            (versie uit het bestaande manifest)
#          npm run export:chatgpt -- 1.16.0  (nieuwe versie)
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

if [[ -n "$(git status --porcelain -- . ':!EXPORT_MANIFEST.json')" ]]; then
  echo "Er zijn niet-gecommitte wijzigingen. Commit eerst: de zip bevat alleen wat in HEAD staat." >&2
  exit 1
fi

version="${1:-$(node -e "console.log(require('./EXPORT_MANIFEST.json').website_version)")}"
commit="$(git rev-parse HEAD)"
prefix="$(git rev-parse --show-prefix)"   # "roviko/" in deze repository

echo "== Typecheck, build en tests"
typecheck=passed; npm run typecheck >/dev/null 2>&1 || typecheck=failed
npm run build >/dev/null
test_log="$(mktemp)"
npm test >"$test_log" 2>&1 || true
passed="$(sed -n 's/^# pass //p' "$test_log" | tail -1)"; failed="$(sed -n 's/^# fail //p' "$test_log" | tail -1)"
rm -f "$test_log"
echo "typecheck: $typecheck, tests: ${passed:-?} geslaagd, ${failed:-?} mislukt"
if [[ "${failed:-1}" != "0" ]]; then echo "Tests mislukt: geen zip gemaakt." >&2; exit 1; fi

mkdir -p outputs
zip_path="outputs/roviko-${version}-chatgpt.zip"
rm -f "$zip_path"
git archive --format=zip -o "$zip_path" "HEAD:${prefix}"

VERSION="$version" COMMIT="$commit" PREFIX="$prefix" TYPECHECK="$typecheck" PASSED="$passed" FAILED="$failed" node --input-type=module <<'JS'
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
const { VERSION, COMMIT, PREFIX, TYPECHECK, PASSED, FAILED } = process.env;
const git = (...a) => execFileSync('git', a, { maxBuffer: 1 << 28 });
const previous = JSON.parse(readFileSync('EXPORT_MANIFEST.json', 'utf8'));
const files = git('ls-tree', '-r', '-z', '--name-only', 'HEAD', '.').toString().split('\0').filter(Boolean)
  .map(p => p.slice(PREFIX.length)).filter(p => p !== 'EXPORT_MANIFEST.json').sort()
  .map(path => { const data = git('show', `HEAD:${PREFIX}${path}`); return { path, bytes: data.length, sha256: createHash('sha256').update(data).digest('hex') }; });
const journal = JSON.parse(readFileSync('drizzle/meta/_journal.json', 'utf8'));
const latest = `drizzle/${journal.entries.at(-1).tag}.sql`;
const manifest = {
  ...previous,
  website_version: VERSION,
  exported_at: new Date().toISOString(),
  source_commit: COMMIT,
  validation: { ...previous.validation, typecheck: TYPECHECK, production_build: 'passed', tests_passed: Number(PASSED), tests_failed: Number(FAILED) },
  required_latest_migration: latest,
  migrations_in_order: journal.entries.map(e => `drizzle/${e.tag}.sql`),
  files,
};
writeFileSync('EXPORT_MANIFEST.json', JSON.stringify(manifest, null, 2) + '\n');
console.log(`Manifest: versie ${VERSION}, commit ${COMMIT.slice(0, 7)}, ${files.length} bestanden, laatste migratie ${latest}`);
JS
zip -q "$zip_path" EXPORT_MANIFEST.json
echo
echo "Klaar: $(pwd)/$zip_path"
echo "Upload deze zip bij ChatGPT (zie docs/PUBLICEREN.md, optie A)."
echo "Het bijgewerkte EXPORT_MANIFEST.json staat ook in de werkmap; commit het als je het wilt bewaren."
