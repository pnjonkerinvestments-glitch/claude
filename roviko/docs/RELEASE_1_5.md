# Roviko 1.5 — daily atlas and reliability

Date: 2026-09-10. Existing Site, accounts, country IDs and URLs preserved. This is an implementation and controlled-test report, **not proof that the live multiplayer gateway or mobile browsers have passed QA**.

## Diagnosis and decisions

The supplied browser audit reported a room URL stuck loading. Source inspection established a concrete failure mode: the browser discarded the successful HTTP join snapshot and rendered a spinner until a WebSocket state arrived. This did not establish why the production WebSocket failed. The new client renders the lobby from HTTP immediately, requires an authoritative socket state before enabling live actions, times out join/handshake/stale connections, retries at most three attempts and offers manual recovery. It never replays answers automatically. Lost acknowledgements trigger state reconciliation. A replacement tab has its own connection token; a stale socket cannot disconnect it.

The daily world trip is now the primary homepage activity. Five connected stops show progress. Side by Side and Country Mosaic sit below as two additional daily puzzles. The six practice modes and friends remain available. A passport-style header, ink/ocean colours, compact controls and existing original globe carry the identity. Wrong answers keep the rose-red, labelled correction system.

Mosaic's desktop selection summary duplicated the board and consumed height, so it is removed. Desktop tiles use four columns and shorter surrounding sections; mobile retains readable two-column tiles. The mobile action area has scroll clearance. All new boards use four distinct subregions as a uniform fact type, excluding exact-area memorisation and currency-name giveaways. Existing boards remain intact.

Clue Trail now reveals region, a border clue, flag and capital in order. One attempt per country, unlimited thinking time and no points. Hint count is saved. Multiplayer presents all clues simultaneously. Pinpoint now tests simplified country polygons, including source islands and a disclosed 25 km boundary margin. Small countries above 25 km² are eligible; zoom reaches 64× and loads more detailed geometry on demand. Shift plus arrow keys makes finer adjustments. Existing reference-point sessions retain their original under-700-km rule, now disclosed before answering. This avoids silently changing past or ongoing results. Next Door includes a labelled reveal map.

## Shared content and progress

`daily_content` freezes questions, board, settings and dataset version per UTC date/mode. Existing sessions supply the first snapshot during adoption. Subsequent deploys do not regenerate an ongoing puzzle. UTC reset is displayed in local time. A streak means at least one completed daily activity, separate from three-of-three completion.

`learning_reviews` connects errors from solo, comparison, Mosaic and multiplayer to targeted practice. Comparisons practise the same indicator and country against a new baseline. Mosaic practice preserves the target country while changing the surrounding board. Correcting the same original attempt does not prematurely clear a review; a new practice session can resolve it. Existing recent failed sessions are adopted lazily. Unique countries answered correctly provide a solo passport measure; competitive points remain separate.

Signing into an existing account transfers guest sessions, answers, results, achievements and reviews in one database batch. Conflicting daily sessions remain accessible as practice; the established account keeps its canonical daily attempt. Guest bearer tokens are revoked instead of being promoted. Account linking during an active match is rejected with a specific message until the player finishes or leaves, to preserve live identity. Signup retains the guest ID. No schema is dropped or historical migration rewritten.

The auto-next setting persists locally and gracefully tolerates blocked storage. Titles update per route/game and language without exposing private IDs. Share text contains mode/date/result and a public destination, with no answers; failed clipboard access exposes selectable text. Daily results lead to review or the next daily puzzle.

## Measurement and editorial controls

Optional first-party measurement is off by default and can be enabled in the passport. Only consenting events enter the funnel: first start, game start, day-1/day-7 return, daily completion, room creation/join, player-match start/completion and shared-result opening. Digested identifiers deduplicate events; no raw names, emails, IPs or answers are in this event table. These are pseudonymous, not claimed anonymous. Rows expire after 90 days on the next measurement write.

Denominators: first-start players for return rates (only cohorts old enough to reach day 1/7), started daily sessions for completion, and started player-match participations for multiplayer completion. The admin shows raw consenting counts, never a fabricated retention percentage or representative visitor total. Opt-in changes during a funnel and different devices can limit comparisons. Shared-open and client error events are self-reported and not anti-cheat evidence. Operational API errors record a route category and hashed context rather than a raw payload.

Admin can inspect stored daily content and its version, investigate reports and disable questions. Disabled content is excluded from new practice generation; a published daily containing disabled content refuses new starts with a review message. Existing sessions/results retain their frozen content. This is deliberately not a silent retrospective correction.

## Evidence and remaining verification

Automated tests cover all six full practice games, daily persistence, deterministic topics, matching, wrong-answer markings, auto-next across remounts, scoring, map polygons (mainland, Hawaii, Kuwait, holes and dateline), malformed answers, authorization, 2 independent WebSocket clients completing a match and rematch, 12 guest identities completing two matches with simultaneous submissions, a rejected 13th guest, duplicate submissions, host transfer, reconnect, expired rooms, merge idempotency and optional measurement. The 12-player test is a controlled API-concurrency test, not 12 physical browsers or a production load test. Server clocks are advanced in integration tests to avoid real waiting.

The production build and full test result are recorded in `docs/QA.md` after execution. Source/SSR checks are not browser layout checks.

**Blocked:** the supervised preview service has no available mailbox. Start and status failed at the infrastructure boundary. No alternate browser or production-page navigation was used. Therefore there are no newly captured before/after browser images, no verified mobile screenshots, no verified keyboard/screen-reader run, no 200% visual-zoom audit and no measured Core Web Vitals. The supplied September 10 audit and screenshots remain the before evidence; they are not new measurements.

Unverified viewport checklist: 360×800, 390×844, 768×1024, 1440×900, short desktop, landscape and 200% text. Remaining visual accessibility risk includes visual-only flags/shapes: generic alternative labels avoid revealing an answer but are not an equivalent blind-play mode. Full assistive-technology equivalence is not claimed. Google OAuth configuration/live provider flow and production WebSocket proxy behaviour also need real end-to-end validation.

LCP ≤2.5 s, INP ≤200 ms and CLS ≤0.1 at the 75th percentile are targets, separately for mobile/desktop, not achieved measurements. The 3–5 minute daily duration and better retention are hypotheses requiring observation.

## Rollout / recovery

The additive migration creates only `daily_content` and `learning_reviews`. Package and deploy the exact committed build. The preceding saved version can restore the old frontend/server if necessary; retain the additive tables, and never roll back by deleting user data or rewriting applied migrations. Note that reverting the old code would remove new practice visibility and could reintroduce the loading failure. Do not delete the newer source or snapshots.

Later scope: public matchmaking, ranked competition, classroom tools, paid archives and cosmetics. No payments, advertisements between rounds, chat or purchased knowledge advantage are added.
