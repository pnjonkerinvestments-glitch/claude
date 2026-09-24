# Architecture

## Flow and responsibility

The app uses a compact consumer interface with persistent top navigation and routes for play, daily, multiplayer rooms, games, rankings, passport, friends, explore and legal/source information. `components/RovikoApp.tsx` composes these product surfaces. Shared primitives supply accessible dialogs, alert dialogs, selects, switches, tabs and progress. `app/globals.css` is the central visual system, with both semantic themes and responsive breakpoints including 320px.

`worker/index.ts` routes `/api/*` before the Vinext page handler. `server/api.ts` validates requests and dispatches to small auth, solo, multiplayer, stats and catalog services. No score endpoint accepts a score as authoritative. `lib/game-engine` contains deterministic generation and pure validation/scoring independent of React. Only current questions are serialized. Multiplayer keeps solutions private until reveal. Unranked solo questions include a current-round learning solution for immediate feedback, while the server independently validates saved answers. No future solo questions are sent. `lib/game-engine/learning.ts` is shared without bundling the country catalog into the client. Practice and legacy daily results never award competition points or XP. Official website dailies opt into the server-only competitive edition described below; `mapPoints` is a raw accuracy measurement normalized to a 200-point daily round.

`public/data` is the reusable ODbL-derived country catalog and simplified Natural Earth map. The server uses the same pinned catalog to create authoritative questions. The first bootstrap imports relational catalog records and definitions separately from schema migrations. Heavy map geometry is lazy loaded by the map surface; flag images, fonts and illustration are local assets.

## Database

D1 is a relational SQLite database supplied by the hosting platform. Drizzle generates versioned, schema-only migrations. Twenty-three tables cover users, auth sessions, games, results, immutable answers, UTC daily results, room snapshots, country records/borders, data sources, reports, disabled questions, achievements, earned achievements, concept performance, friend requests, ratings, matchmaking queue, rate limits and optional event storage.

Room snapshots include a monotonically increasing version. Compare-and-swap updates (`WHERE version=?`) serialize competing room operations. Losing writes reload and re-evaluate server rules. Match results and answers have unique keys; completion is retryable without doubling XP. Daily sessions are unique per user/date/kind, while daily results have a user/date primary key.

Foreign keys cascade a deleted account's sessions, games, answers, results, friends and ratings. Public reports can be de-identified at schema level; the account-deletion workflow removes that account's submitted reports. Room snapshots containing the account are scrubbed before removal. Shared room membership is not a user secret, but only participants can access it.

## Realtime boundary

Native WebSocket clients connect to a server-authorized room. D1 remains the source of truth across Worker isolates. This hosting profile does not provision custom Durable Object namespaces, so each connection checks D1 revisions at 750 ms and pushes changed states via WebSocket. There is no browser polling. Server-side revision checks are a V1 tradeoff: they add database load and up to roughly one tick of synchronization delay. They are not equivalent to a dedicated room actor. A popular public rollout should replace this fanout with one Durable Object/room or a dedicated WebSocket service plus PostgreSQL transactions.

## Extensibility

Stable country IDs are ISO alpha-3; localized strings never become database IDs. Mode IDs, question serialization, scoring and persistence are separated. New modes should implement generation, server validation and a small question renderer. Disputed-territory policy is centralized. Time-sensitive statistics must use `{value, reference_year, source_id}` before new ranking templates are enabled.

Ratings and matchmaking tables plus tested Elo logic prepare ranked matchmaking; the feature flags are off. Payments, tournaments, classroom tools and free chat are intentionally absent.


## Daily puzzle extension (1.2)

`lib/puzzles/topics.ts` contains trilingual topic definitions and formatting; `generate.ts` is server-only country/metric generation; `model.ts` contains shared types and the pure matching validator. Statistical and silhouette snapshots are local JSON with downloadable copies. `components/puzzles/PuzzleDeck.tsx` provides daily entry points and practice setup, while `PuzzleGame.tsx` renders the two game flows, immediate feedback and retrospective solutions.

`server/puzzles.ts` handles authenticated `/api/puzzles`, `/today`, `/:id`, `/:id/answer` and `/:id/next`. It reuses `game_sessions` with discriminated `puzzle:compare` and `puzzle:mosaic` kinds, the existing user/date/kind uniqueness constraint, and compare-and-swap versions. The classic API rejects puzzle session kinds. Each move stores authoritative state and an immutable answer audit. Idempotent result/audit repair runs on finished-session retrieval. Existing cascades, signup identity upgrades and exports cover these records without a schema migration. Only completed results affect profile statistics; legacy unranked puzzles do not change competitive totals.

The browser receives one current comparison or one current matching board for unranked learning. It never submits a score or trusted correctness flag. All prior comparisons become available for review only after completion. Saving failures reconcile server state and offer a reload instead of silently losing a move. Daily entry cards refresh on returning to the tab and at the next UTC midnight; an in-progress puzzle retains its original date and content. Do not update the pinned data halfway through a UTC daily date.

## Daily atlas revision

`lib/realtime/room-client.ts` owns bounded connection/recovery; React presents HTTP snapshots before realtime is available. `daily_content` freezes the per-day content and dataset version. `learning_reviews` records per-country/knowledge-point practice targets without changing daily outcomes. `server/merge-progress.ts` transactionally links guest history after credential verification and revokes guest sessions. Country geometry stays server-side except the current unranked learning solution; detailed map rendering loads on demand. Optional first-party measurement is off by default. See `docs/RELEASE_1_5.md` for rules and evidence.


## Native iPhone client (1.8)

`ios/Roviko` is SwiftUI with no package dependencies. An actor-isolated API client handles the existing JSON endpoints and stores only the opaque session cookie in iOS Keychain. Every mutation remains server-validated. Requests use the configured HTTPS origin; cross-host redirects are rejected. The shared backend accepts an optional PNG representation of the same opaque flag image endpoint.

The room client uses URLSessionWebSocketTask for live state, an eight-second application heartbeat, a bounded handshake/staleness watchdog, generation tokens to reject stale connections, and at most three unsuccessful connection attempts before manual retry. Answers and host actions are never replayed automatically. Foreground reconnects restore the authoritative room. Notifications are local and opt-in, and offline practice uses bundled country data with separate device-only progress. See `ios/APP_STORE.md` for remaining release gates.


## Rank Radar

`lib/puzzles/rank.ts` owns the typed ranking model, licensed metric adapters, competition ranks and seeded generator. `server/ranks.ts` owns session validation, versioned transitions and idempotent answer/results persistence. Existing `game_sessions` rows use `kind=rank`; `daily_content` stores immutable daily sets. The mode is isolated from `/games` and `/puzzles` mutations. `components/puzzles/RankGame.tsx` renders `/rank/:id` with immediate learning feedback; the server confirms every answer. `ios/Roviko/RankRadar.swift` is the native counterpart using the same response schema. No new table or external runtime data request is required.

`i18n/es.ts` holds Spanish UI messages; `i18n/content.ts` supplies data/template localization and a compatibility adapter for saved EN/NL sessions at API and WebSocket consumption. Country names use a compact ODbL-derived Spanish name table; IDs, correct answers, measurements and source credits remain unchanged. The locale lives in the existing local preference.

## Daily competition 1.11

`lib/daily-scoring.ts` defines versioned, pure score rules. `server/competition.ts` inserts completed results into `daily_scores` with primary key `(user_id,date,mode)`, unique session ID, foreign-key cascades, bounds checks and indexes. It computes per-game, per-date combined, and cumulative rankings using SQL competition ranks. The authenticated endpoint is `/api/competition?date=YYYY-MM-DD&mode=trail` (date/mode optional). Blocked users are excluded; non-discoverable names are displayed as Explorer. Ties share a rank. A result retrieval repairs a missing completion ledger entry after a interrupted save; scores are never client inputs.

The website sends root `competition:true` when starting official daily sessions. Their kind/content namespace ends in `:competitive-v1`; Clue Trail uses settings mode `daily-trail`, normalized server-side to five World/medium trail questions. Old apps/default requests retain their separate legacy edition and JSON solution contracts. Existing answers are not retroactively scored. New totals start with completed competitive-edition games.

Competitive serialization hides current correct answers, rank statistics and future questions. Mosaic hides unsolved tile-country mappings, fact explanations/source URLs and readable flag filenames. Authenticated `/api/game-asset/:session/:round-or-tile` serves owned assets; trail flags are locked until hint 4 or answer reveal. Clue counts, Mosaic mistakes and paid hints persist before scoring. Revision checks serialize answers and hints. Paid Mosaic hint selections also persist so a lost response cannot silently consume a hint.

`CompetitionPanel` renders actual score/rank/count data on home, daily, rankings and result screens. All rules are translated in `i18n/competition.ts`. Practice components retain their unranked optimistic feedback; competition components wait for the server. Guest linking updates non-duplicate ledger ownership in the same D1 batch as session transfer, keeps the account's canonical daily, revokes guest sessions and removes abandoned duplicates. Export/delete include the new ledger.
