# Roviko website 1.10.0 — 2026-09-23

## Player changes

- English, Dutch and Spanish language picker, persisted in this browser. Spanish covers UI copy, question templates, country/capital names, puzzle subjects, numerical fact units, all 40 mystery-country records, achievements, feedback, account screens and source/policy pages. Existing saved bilingual content receives Spanish presentation without changing its answers or IDs.
- Timed and untimed multiplayer schedule an authoritative reveal at the final active player's answer timestamp + 1,000 ms. Answers remain private until that timestamp. Missing answers still wait for the normal deadline. Reconnecting eligible players without an answer cancel early completion. Rematches clear this round state.
- Lobby round counts are explicit 5 / 10 / 15 / 20 buttons. In the default mixed game all six modes participate; the host can uncheck any mode while retaining at least one. Changes are validated on the server and retained for rematches.
- Size Shuffle has a prominent, sticky **Confirm order** action. Reordering never submits. Rank Radar also lets players select/change their choice before confirming.
- Pinpoint supports focal-point pinch zoom (1–64×), one-finger/mouse panning, cursor-centred wheel zoom, keyboard zoom, and reset. A tap places a pin on release. Drags, pinches and cancelled pointers cannot accidentally place or submit an answer. Letterboxed SVG coordinates are respected.
- Country-boundary scoring gives full credit inside the country/25 km tolerance, with decreasing credit outside it. Feedback recognises a neighbouring country or the same continent. Solo accuracy credit is recorded separately from competitive points and XP; the other solo modes remain unscored and untimed.
- Trail and flag options hide flags until reveal. Self-naming capitals (including embedded names such as Bissau / Guinea-Bissau) and overlapping border-answer names are excluded. Trail's final clue uses area, avoiding capital names that contain the target country.
- Updated offline asset-cache version so returning players fetch Spanish mystery clues and current code.

## Data and rollout

No new migrations, secrets or external providers. Existing country and UNESCO licences are retained; Spanish additions are documented in DATA_SOURCES.md. Website release only: native iOS source and store binaries are not rebuilt in this change.

## Validation

- `npm run typecheck`
- `npm test`: 92 passing tests, including isolated Workerd/D1 two-player WebSocket play, early reveal before the timer expires, 12-player matches, rematch, reconnect, host permissions, mode validation, score persistence, touch gestures, explicit confirmation, Spanish key/placeholder coverage and generated-question spoiler checks.
- `npm run build`

The supervised browser preview was unavailable in this editing environment. Component pointer tests are not a substitute for a final physical iOS/Android touch check. No production test accounts or artificial scores were created.
