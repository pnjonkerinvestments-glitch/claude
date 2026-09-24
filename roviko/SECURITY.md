# Security

## Implemented

- Server-side Zod validation, bounded request/message payloads, display name constraints and a baseline profanity/link/HTML filter.
- Random 256+ bit session tokens, stored as SHA-256 digests. HttpOnly, SameSite=Lax cookies; Secure in HTTPS. Thirty-day expiration.
- Passwords are salted and hashed using Web Crypto PBKDF2-SHA256 (100,000 iterations, the deployed Workers API limit). A timing-neutral comparison avoids a direct early-return string check. Login and signup have durable rate limits. Never store readable passwords.
- Same-origin enforcement for state-changing browser requests and WebSocket upgrades. Parameterized D1 statements; no string interpolation of untrusted SQL values. Server allowlists bound dynamic leaderboard fields.
- Room membership, current match/round identity and host checks on the server. Multiplayer solutions are omitted until reveal. Unranked practice/legacy solo has a current-round solution for immediate learning feedback. Official daily competition withholds solutions and uses server-only points. Opaque flag asset identifiers prevent the straightforward filename answer leak.
- Multiplayer server deadlines, one answer per round, immutable audit keys, server-only scoring and CAS room updates. Fast-answer risk flags are kept for review; leaderboard queries exclude results with repeated impossible timings.
- App-account data export and deletion; names are scrubbed from room snapshots during deletion. Discoverability and friend request blocking are configurable.
- Admin access through `ADMIN_USER_IDS` only, checked on every endpoint. No free chat or user uploads. No payment integration, client secrets or ad trackers.
- Google OAuth is optional, with session-bound one-time state, a server-side code exchange, verified email and no browser token storage.

## Boundaries

The app is not cheat-proof. Public geography is knowable, and browser automation or external assistance cannot be eliminated by hiding payload fields. A guest can create another identity. Concurrent duplicate responses are rejected, but the system does not claim a complete device fingerprinting or duplicate-person system. Risk flags are not proof of misconduct.

The password work factor reflects this runtime's API cap and should be reviewed against the selected production identity service. There is no transactional email service, verified email flow for password signup, self-service password reset or independent penetration test in this V1. Configure a vetted identity provider for commercial use if those are required. Google OAuth could not be validated without credentials.

Cloudflare D1 has no PostgreSQL RLS here. Application handlers and session ownership checks are the security boundary; never expose the raw binding to the frontend. Friend-request uniqueness and moderation are suitable baseline measures, not a full abuse-prevention system.

Race-resistant room deletion and account erasure need repeated validation under production load. Cleanup is an authenticated operational task, not a hidden client button. Establish operator contact details, retention policy, incident response, user support and legal documents before a commercial launch. No GDPR compliance certification is claimed.


## Unranked puzzle boundary

Side by Side and Country Mosaic follow the current-solution solo learning model. Source datasets are open, and learning solutions are intentionally available to the client; unranked practice and legacy editions never contribute points, XP or ranked scores. Submitted country/tile IDs are validated against stored session content. Puzzle writes require the owned authenticated session, same-origin checks, existing API rate limits, a validated request body and an exact server revision. Duplicate submissions, reused solved groups, unknown or duplicate tiles and cross-user access are rejected. A finished-session retrieval repairs idempotent audit/result persistence after an interrupted request. The classic game endpoint cannot read or mutate puzzle state.

## 1.5 account and transport protections

Guest-to-existing-account linking requires verified credentials, transfers owned records transactionally and revokes guest bearer sessions. Linking during an active match is deferred with a specific error. Clients cannot call the internal socket-registration action or supply connection tokens. Answer shapes/options are validated before acceptance. Optional telemetry contains pseudonymous digests and defaults off; it is not an anti-cheat input. Daily snapshots preserve rules and historical interpretation.

## Daily competition boundary (1.11)

Only authenticated owned canonical daily sessions with `competition.version=1` can create ledger entries. Scores are derived from server answers and persisted hint/mistake counters, not submitted totals. A unique user/date/mode key prevents farming replays. Per-session versions lock concurrent guesses/hints; classic and puzzle/rank endpoints reject each other's sessions. Daily questions send no current solution, Mosaic association table or rank values before answer reveal. Flag images use owned session routes, and Clue Trail's fourth clue asset cannot be requested early. Practice, warm-ups and multiplayer are excluded from combined daily totals.

Guest identities remain resettable and licensed datasets are public. These controls deter payload tampering and ordinary answer leaks; they are not identity verification, bot-proof rankings or proctoring. Daily rankings have no speed bonus, so fast legitimate answers are not penalized. Operator user blocking excludes a user from ranking queries. Historical results are preserved; do not backfill unranked sessions whose solutions were public into the competitive ledger.
