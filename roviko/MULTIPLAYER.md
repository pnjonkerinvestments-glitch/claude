# Multiplayer protocol

## Connection and access

1. `GET /api/bootstrap` issues an HttpOnly guest session or resumes an account.
2. `POST /api/rooms` creates a cryptographically generated five-character code. Codes exclude ambiguous O/I/0/1 and are retried on a database uniqueness collision.
3. `POST /api/rooms/CODE/join` admits the authenticated session (maximum 12 players).
4. `/api/rooms/CODE/socket` validates the origin and session, confirms membership and upgrades to a native WebSocket.

A code locates a casual room; it does not authorize host actions. Session identity and the room's stored host do that. Guests can participate. A new participant cannot join a running match, while an existing session can reconnect. No names or scores are accepted from the answer message.

## Authoritative state

`lobby → countdown → question → reveal → countdown … → finished → lobby`

The server owns question IDs, round, start timestamp, deadline, answers, scores, streak and match identity. `start` generates all private questions but publishes only the current question. Flag images use opaque question-asset URLs. Reveals contain feedback only after the round closes. During answering, peers may see that a player answered, never which option they selected.

Client messages: `ready`, `start`, `answer`, `ping`, `advance` (untimed host only), `rematch`. REST supports join, leave and settings changes. `answer` must carry the current `round`, `matchId` and answer payload. A second, early, late or stale-match submission is rejected. Both timed and untimed rounds reveal 1,000 ms after the last active player answers, using persisted `answersCompleteAt`. If answers are missing, timed rounds wait for their deadline and the untimed host can end the round. Reconnecting eligible players without an answer cancel pending early completion. Each WebSocket schedules the authoritative timestamp as soon as it receives the completion state; network and database delivery can add latency.

Server snapshots include semantic events: `player_joined`, `player_left`, `player_ready`, `game_started`, `countdown`, `round_started`, `answer_submitted`, `round_finished`, `leaderboard_updated`, `game_finished`, `host_changed`. Each snapshot has server time so the client corrects its displayed countdown.

Compare-and-swap on the room version makes concurrent writes retry against current state. Results use stable unique match/player keys and immutable per-round audit rows. A retry cannot multiply awarded XP.

## Reconnect and lifecycle

Clients reconnect with exponential backoff capped at 10 seconds and keep the same HttpOnly session. Heartbeats update presence every 8 seconds. A missing host is replaced after 30 seconds if another player is present. Empty rooms become unavailable after 30 minutes; expired records can be deleted by the cleanup job. Matches resume from durable snapshots even after all sockets were interrupted; no active browser needs to be the authority.

The server responds to WebSocket close handshakes and finishes its presence update within the Worker execution context. Local tests exercise an actual socket disconnect, a rejoin with the same session and host handover.

## Hosting tradeoff and scale

The available Sites profile supplies Workers and D1 but no custom Durable Object binding. WebSocket connections therefore read D1 revisions every 750 ms and push updates when the revision changes, with occasional clock heartbeats. This is genuine socket communication with server-authoritative state, but its cross-isolate fanout is driven by **server-side revision polling**. There is no client polling. Do not describe it as a durable-actor or Pub/Sub deployment.

This adapter targets small V1 rooms. Database read costs scale with connected players, and changed state can take one tick to reach another player. High concurrency needs a room-actor or dedicated WebSocket service before a broad public launch. A PostgreSQL backend would also need row locking/transactions or equivalent CAS and an explicit event fanout layer. Do not replace D1 with process-local arrays.

## Quick match and computer players (1.19)

`POST /api/match/quick` joins the oldest open quick search of another player whose connection was seen in the last 25 seconds and starts the match at once (mixed, 10 questions, 15 seconds), or opens a new search (`quick: "open"` in the room state). Searching again returns the same search. The waiting screen shows the elapsed time; after three minutes (`QUICK_SEARCH_MS`) it offers a button to play against the computer instead, with a level choice. Waiting on stays possible. Open searches are found with a state scan, which is fine at the current scale.

Computer players are ordinary room players with `bot: true` and a `level` (`easy`, `medium`, `hard`). The host adds them in the lobby (`POST /api/rooms/CODE/bot {level}`, at most five) or removes them (`removeBot {id}`); `computer {level}` adds one and starts immediately. Each bot's answer and thinking time follow deterministically from match, round and bot id (`lib/game-engine/bots.ts`): easy ≈45% right in 5.5–10 s, medium ≈68% in 3.5–7 s, hard ≈88% in 1.8–4.2 s, always before a timed deadline. Bots never persist results, and **a match with a computer player gives no ranking score, XP or wins**: it is saved as an unranked game for the players' own stats.

## Development bots (before 1.19)

Until 1.18, `POST /api/rooms/CODE/bot` required `ENVIRONMENT=development` and `DEV_MULTIPLAYER_BOTS=true`. Since 1.19 it is a host feature in production (see above). Bots answer with a deterministic approximately 70% accuracy and are excluded from persisted account results. The automated tests use two real sessions instead of claiming bots demonstrate multiplayer.

## 1.5 recovery

HTTP join renders the first snapshot. Live actions wait for the initial authoritative WebSocket state. Joins are bounded at 12 seconds in the HTTP client (13 seconds in the controller); socket handshakes at 10 seconds; stale-state detection at 22 seconds; at most three automatic attempts, followed by manual retry. A six-second missing answer acknowledgement initiates state reconciliation without resending. Per-connection tokens prevent an old tab from disconnecting its replacement. Database CAS allows up to 24 attempts for concurrent room updates. Countdown no longer includes the question payload. Tied scores use shared ranks. Controlled tests are documented separately from unverified production gateway behaviour.

The host chooses 5, 10, 15 or 20 rounds. Mixed games include all six modes by default; optional `enabledModes` contains a non-empty unique subset of supported mode IDs. The generator rotates a seeded shuffle of that subset, so exclusions apply throughout the match. Settings survive rematches.
