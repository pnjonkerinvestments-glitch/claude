# Roviko

An original geography gaming platform: five competitive daily games, six untimed classic games, and live private rooms. English, Dutch and Spanish, light and dark themes, 195-country catalog, optional accounts, persistent guest sessions, progress, 30 achievements, friends and leaderboards.

## What runs

- **Side by Side**: ten country comparisons on one daily topic, with 14 topics rotating across UTC dates. Choose any topic for fresh practice. Values and reference years reveal after the server accepts the answer; review every comparison after finishing.
- **Country Mosaic**: connect one country’s flag, name, silhouette, fact and optionally capital. Practice uses 3, 4 or 5 clue types (12/16/20 tiles). The shared daily board uses four countries and four clues each. Unlimited attempts, shuffle, a pair hint, saved progress and a complete solution review.

- **Clue Trail**: infer a country from its capital and geographic clues.
- **City Circuit**: capitals, with multiple choice or typed answers and conservative typo matching.
- **Flag Signal**: identify flags served through opaque question assets.
- **Pinpoint**: tap an unlabelled, locally hosted world map; distance feedback appears immediately and is independently validated when saving; distance-based credit applies in the official daily expedition. Keyboard, zoom and touch input included.
- **Next Door**: identify a land neighbour.
- **Size Shuffle**: order four countries by area; drag or use accessible move buttons.
- **Daily expedition**: five seeded rounds, identical worldwide for the UTC date. Only the first completed result counts.
- **Multiplayer**: room codes, invite links, up to 12 players, settings, readiness, synchronized starts/deadlines, locked answers, between-round rankings, podium, rematch, reconnect and host transfer.
- Email/password accounts, guest-to-account linking on signup, server-persisted history and personal stats. Google OAuth works when provider credentials are configured.
- Friend requests/codes, consent to discoverability, accept/decline/block and room creation. No free chat, uploads, payments or trackers.

## Daily competition and relaxed practice (1.11.0)

The website offers five official UTC daily games, each worth up to **1,000 points**: World Trip, Daily Clue Trail, Side by Side, Country Mosaic and Rank Radar. The homepage shows today's total (maximum 5,000), cumulative points across all days, and real ranks/participant counts. Completed results are immutable, once per user/date/mode. Ties share places. There are no daily timers, speed bonuses or XP. See [GAME_RULES.md](GAME_RULES.md) for the exact scoring.

Practice earns no competition points. It retains immediate local learning feedback. Daily competition withholds solutions until a server-validated answer and uses a separate `daily_scores` ledger. Multiplayer retains its own match scores/XP and does not enter daily totals. The Mystery Country bonus is a warm-up without ranking points. Legacy clients/results remain unranked; the website explicitly requests the new competitive edition.

**Migration required:** apply all migrations through `drizzle/0003_gorgeous_arachne.sql` before serving this version. The hosting build includes these migrations. No new production secret is needed.

[Changes since the supplied v3](docs/CHANGES_SINCE_V3.md) · [Claude handoff](START_HERE_CLAUDE.md) · [Verification](docs/QA_1_11.md)

## Stack and deployment choice

React 19, TypeScript, Vinext (Next.js App Router APIs on Vite), Cloudflare Workers, D1/SQLite, Drizzle migrations, native WebSockets, local SVG geography, Tailwind with a custom design system, Radix/shadcn primitives Lucide utility icons and native emoji game badges. This host supplies D1, so V1 uses it instead of PostgreSQL. See [ARCHITECTURE.md](ARCHITECTURE.md) and [MULTIPLAYER.md](MULTIPLAYER.md) for the tradeoffs and scaling boundary.

## Development

Node 22.13+ on Linux is supported by the bundled scripts.

```sh
npm run install:ci
npm run db:generate
npm run dev
```

Configure the development D1 binding from `.openai/hosting.json` (`DB`). Apply `drizzle/*.sql` in journal order to the local D1 database with Wrangler, or use the hosting environment's migration mechanism. `db/seed.sql` is a separate, idempotent catalog seed. The server also performs a bounded, idempotent catalog import on the first `/api/bootstrap` request; it never creates or changes schema at runtime.

```sh
npx wrangler d1 execute site-creator-d1 --local --file=drizzle/0000_graceful_demogoblin.sql
npx wrangler d1 execute site-creator-d1 --local --file=drizzle/0001_mighty_madame_masque.sql
npx wrangler d1 execute site-creator-d1 --local --file=db/seed.sql
```

For an independent Wrangler deployment, add a normal `wrangler.jsonc` pointing to the generated Worker and static assets with the same `DB` binding. Sites itself owns the deployment configuration; do not add resource IDs to its manifest. A Vercel-only deployment cannot run this state transport unchanged; port the persistence and realtime adapters together.

## Configuration

Start with `.env.example`. Secrets are server-only environment variables. The working name is `BRAND.name` in `lib/config.ts`; `scripts/site-metadata.mjs` derives install metadata and public URL files from it. The placeholder SVG mark can be replaced independently.

Google login is shown only when both `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are configured. Register the actual site origin plus `/api/auth/google` as the Google redirect URI. The code uses state tied to the current session, a server-side token exchange and verified email. Credentials are not bundled in client code. Provider integration could not be exercised without real credentials.

Set `ADMIN_USER_IDS` to a comma-separated list of app user IDs to enable `/admin`; every read and action re-checks this allowlist on the server. Obtain your app ID from your own account export. Admin tools review reports, disable question templates and flag/block serious abuse. Do not grant admin from a browser flag or display name.

For bots, both `ENVIRONMENT=development` and `DEV_MULTIPLAYER_BOTS=true` must be set. A host can then call `POST /api/rooms/CODE/bot`. This route always rejects production, even if only the bot flag is mistakenly enabled. Quick Match, ranked play, paid features and chat are intentionally disabled in `lib/config.ts`.

## Data

Run `npm run data:prepare` to reproduce the pinned country import, simplified map paths, flags, full country geometries and SQL seed from dependencies. The catalog and derived geographic database are ODbL-licensed; attribution and the downloadable data are available at `/sources`. Run `python scripts/prepare-silhouettes.py` to derive normalized, simplified main-landmass silhouettes. The checked-in World Bank snapshot contains ten indicators with 2023 observations, covering 166–194 countries per indicator. `python scripts/import-comparisons.py` explicitly refreshes it after checking each indicator licence; no external data API is called during gameplay. Freeze datasets during an active daily UTC date, and review changes before release. Dataset versions, import date, rights and specific caveats are in [DATA_SOURCES.md](DATA_SOURCES.md). Do not replace data with scraped quiz questions.

## Validation

```sh
npm run typecheck
npm run test:unit
npm run test:integration
npm run build
npm test
```

The integration suite uses a real isolated Workerd runtime with D1 and WebSocket pairs. It runs two independent cookie sessions and verifies rooms, questions, score authority, concurrent duplicate answers, completed matches, rematch, reconnect, host transfer, signup/login, daily results, friends, export and deletion. It accelerates stored timestamps to exercise transitions without waiting through an entire match. No test identities are seeded into production.

Browser end-to-end and visual tests are **not marked as passed**: the supervised browser preview service was unavailable in this build environment. Follow the browser acceptance script in `docs/QA.md` before commercial launch. API tests are not a substitute for real browser interaction or production load testing.

## Production release boundary

This is a deployable V1. It is not a claim that every item in the broad long-term brief has shipped. See `docs/V1_SCOPE.md` for exact coverage. Before commercial release, configure and verify OAuth if needed, complete real-device/browser QA, load-test or replace the D1 revision-check fanout, select a public audience deliberately, define data retention and support contacts, and review privacy/terms and the working brand legally. There is no claim of GDPR compliance or trademark clearance.

## Documentation

- `ARCHITECTURE.md`: structure, data model and request boundaries.
- `DATA_SOURCES.md`: data/assets and licences.
- `GAME_RULES.md`: scoring, question generation, map policy and daily rules.
- `SECURITY.md`: implemented controls and known boundaries.
- `MULTIPLAYER.md`: protocol, state machine and transport.
- `docs/BRAND.md`: original direction and ten candidate names.
- `docs/QA.md`: executed tests and remaining browser checks.
- `docs/V1_SCOPE.md`: what is live, configured or intentionally deferred.

## Daily atlas update

See [release decisions and evidence](docs/RELEASE_1_5.md) for the 1.5 changes, migration, exact test scope and remaining browser/production checks. Apply the new additive migration through the standard deployment process. The boundary derivative can be regenerated with `python scripts/prepare-boundaries.py`. Optional product measurement is off by default.


## Previous interface: 1.6

The travel atelier update adds three equal daily cards, quick regional launch, resumable personal retries and a country-stamp passport. See [release notes](docs/RELEASE_1_6.md) and [verification and open checks](docs/QA_1_6.md). Existing gameplay, accounts, D1 migrations and WebSocket hosting setup remain unchanged.

## Previous interface: 1.7

The game collection update refines the interface and replaces basic Mosaic region hints with 80 sourced bilingual clues across 40 countries. See [release notes](docs/RELEASE_1_7.md), [data provenance](DATA_SOURCES.md) and [verification](docs/QA_1_7.md). Re-export the authored catalogue with `python scripts/content/prepare-mosaic-facts.py`. Saved daily boards remain unchanged; newly created practice and future daily boards use the new catalogue.


## Previous release: 1.8 — daily facts and a native iPhone project

Mosaic now uses numerical facts: highest point, coastline, mean elevation, median age, GDP, population, forest share and other dated statistics. The subject rotates daily. Existing saved boards receive the new clue presentation **without changing country matches, tile IDs, answers or progress**. See [data sources](DATA_SOURCES.md) and [release verification](docs/QA_1_8.md).

The genuine SwiftUI iPhone client is in [ios/](ios/README.md). It includes the three daily games, six online practice modes, private WebSocket rooms, guest/email accounts, profile management, deletion/export, offline flags/capitals and opt-in local reminders. It shares the web backend; it is not a WebView wrapper. The Xcode project, app icon, privacy manifest, native tests and Mac build scripts are included. **An iOS compile, simulator/device QA, signing and App Store submission have not been performed in this Linux environment.** Run the documented Mac gates before distribution.

Regenerate native assets with `node scripts/prepare-ios-assets.mjs`; regenerate the dependency-free Xcode project with `python3 ios/scripts/generate-project.py`. These steps use local, licensed source assets. No additional database migration or production secret is needed for this release.


## Historical release: 1.9 — Rank Radar

Four daily games now include **Rank Radar**, an original six-country discovery game. Choose which of four subjects gives a country its strongest relative rank, then see all four positions, values, coverage and source years. Fifteen subjects rotate across deterministic UTC puzzles; fresh practice is unlimited. Solo play remains untimed and unscored. Choices save on the server and resume across the website and the signed-in native app.

The homepage uses a two-by-two desktop collection, compact mobile cards, original warm game artwork and immediate, accessible red/green feedback. The SwiftUI client includes the same fourth daily game, practice and result recap in `ios/Roviko/RankRadar.swift`. See [verification and limits](docs/QA_1_9.md), [game rules](GAME_RULES.md) and the [native Mac release gates](ios/APP_STORE.md). No migration or new production secret is needed. Native compilation, signing and Apple submission still require a Mac and the owner's Apple Developer account.

Website 1.10.0 adds Spanish, early multiplayer reveals, mode exclusions, explicit ranking confirmation and improved map gestures/accuracy credit. See [the release notes](docs/WEBSITE_UPDATE_1_10.md).
