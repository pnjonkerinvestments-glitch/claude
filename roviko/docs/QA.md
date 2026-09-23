# Quality and acceptance record

## Executed

- TypeScript compilation.
- Full optimized Vinext production build, including server Worker and static assets.
- Pure scoring, map distance, conservative fuzzy matching, code uniqueness and Elo tests.
- Question generation across all six modes plus mixed, all seven regions and easy/medium/hard settings; unique options, valid answers and private field omission.
- Exact 195-country roster, local flags and geometry files; deterministic five-mode UTC daily.
- Workerd/D1 integration: a completed guest game, concurrent duplicate submissions, authoritative points, signup preserving the guest ID/results, login, stats, achievements, report creation, data export and deletion.
- Workerd/D1 integration: shared daily questions, full completion and immutable first result.
- Native WebSocket integration: two independently authenticated sessions; shared lobby, same question and start time; authorization, independent answers, hidden choices, reveal, score order, five complete rounds, podium data, rematch, non-repeating question selection where possible, socket reconnect and host transfer.
- Friend request acceptance authorization and privacy; cross-origin writes, SQL-shaped room input and HTML-shaped names rejected.

## Corrections found through testing/review

- Fixed the host handover window so a timed-out host is not selected again.
- Added bounded fallback question variants for very small regional pools.
- Removed correct-country codes from public question IDs and flag request paths.
- Completed WebSocket close handshakes and retained disconnect work for graceful teardown.
- Fixed custom-font URLs to load from local static assets.
- Added a unique daily-session constraint and idempotent completion audit writes.
- Kept the homepage server-renderable while real session data loads.
- Increased map, reorder and avatar controls to approximately 44 px, preserved reduced motion and prevented answer hotkeys from firing inside modal dialogs.

## Not executed / cannot be marked passed

The supervised Sites preview service was unavailable (its runtime mailbox was missing). Per the supported browser workflow, no alternate browser server was improvised. Therefore desktop/mobile screenshots, real browser end-to-end, keyboard/focus traversal and rendered overflow checks have **not** been completed. No production load test, OAuth provider test or deployed cross-device latency test was executed.

## Remaining browser acceptance script

At 320, 375, 390, 430, 768, 1366 and 1920 px, in light/dark and English/Dutch:

1. Confirm header, hero, mode cards and modals have no horizontal overflow, clipped names or overlapped controls. Test 200% zoom and reduced motion.
2. Complete a guest Flag Signal game with keyboard 1–4, check correct/incorrect feedback and results.
3. Complete typed capitals, reorder with buttons and drag, and Pinpoint with touch/keyboard/zoom. Verify pin alignment with the actual map projection.
4. Complete the daily and verify opening it again shows the saved first result.
5. Open two separate browser profiles, create/join via code or invite URL, observe the same lobby, alter settings, ready and start. Check client clocks against server deadlines, answer independently, inspect rankings and finish/rematch.
6. Interrupt one network connection, restore it and verify the same player is restored. Disconnect the host for over 30 seconds and verify handover without duplicate membership.
7. Create an account, sign out/in, inspect saved stats, send/accept a friend request and test discoverability. Configure real Google credentials before testing OAuth.
8. Check every route's loading, empty, offline and recoverable error state; verify focus trapping, focus visibility, labels and screen-reader announcements.

Do not call these checks passed until actually observed in a browser. The attached automated suite is evidence for backend correctness, not a guarantee of visual perfection.

## September 9 interaction update

- Original emoji badges, tactile game cards, emoji avatars and discovery-focused results. Both existing themes and responsive breakpoints are preserved and extended.
- Solo and daily deadlines, speed points, regular points and XP removed, including resumed legacy sessions. Existing data is retained without contributing solo points to competitive views.
- Current solo solutions support synchronous answer feedback; the server independently re-evaluates submitted answers. Next waits for an in-flight save. Multiplayer payloads still contain no solutions.
- Added tests for all six solo modes and daily with requested/legacy timers, old sessions, ignored client-supplied scores/correctness, zero-point audit records, and hidden multiplayer solutions.
- Added rendered-component checks that learning feedback and results show no point or time fields while multiplayer feedback retains points.
- The supervised preview was attempted again and its mailbox remains unavailable. No browser/device visual pass is claimed.


## Puzzle extension (1.2)

- All 14 comparison topics: ten deterministic pairs each, unique pairs, finite correctly ordered observations, no display-rounded ties, source URLs and reference years.
- A full UTC topic cycle covers all 14 subjects; subsequent daily seeds differ.
- 120 generated matching boards across 3/4/5 clue types: complete four-country groups, unique tile IDs and facts, valid shapes, duplicate/unknown/solved tile rejection and near-match behavior.
- Workerd/D1: concurrent daily start uniqueness, identical daily comparisons across two guests, isolated ownership, rejection by the classic endpoint, concurrent answer locking, ten complete rounds, resume, immutable replay, zero points/XP, profile and daily streak, exported audit records.
- Workerd/D1: identical daily matching boards, each practice board size, wrong guesses and successful retries, saved intermediate states, final results, fresh practice and completed daily matching resume.
- Rendered homepage assertions cover both new games before the classic game shelf, direct daily actions and the default light theme. Existing multiplayer, signup, friends and learning checks are retained.
- The supported preview was attempted for this extension and still lacks its runtime mailbox. Browser rendering, responsive screenshots, live click timing and focus behavior remain **unverified**; no substitute browser server or simulated screenshots were used.

Additional browser script: play both daily puzzles; reload after each answer; select/deselect/replace tiles, use a hint and shuffle; try 3/4/5 clue boards at 320 and 390 px; finish and open the answer review; use comparison hotkeys 1/2; click Next during an in-flight save; interrupt connectivity and recover; leave the daily hub open over UTC midnight. Repeat in Dutch, dark mode, keyboard-only and 200% text zoom.


## Sleek interaction refresh (1.3)
Added mounted React interaction checks for Mosaic selection replacement, double-submit locking, board stability, failed-save draft retention, lost-response reconciliation, immediate comparison reveal, and acknowledged-version next-round sequencing. Added rolling-chain/legacy-session API tests, seven-day activity checks, and flag answer-disclosure rendering checks. Browser preview remains unavailable because the preview daemon request directory is absent; responsive layout and animation checks are still manual verification items, not claimed as completed browser tests.


## Reported mobile layout and corrections (1.4)
The supplied iPhone screenshot exposed a concrete CSS naming collision: the Mosaic board used `size-4`, which Tailwind emitted as width and height of 1rem. Interaction-only tests in 1.3 missed this visual regression. The board now uses a dedicated `mosaic-board` class, a `data-clues` attribute, explicit 100% width and automatic height. Regression coverage checks mounted board markup for all 3/4/5 clue counts and the emitted production CSS.

Incorrect ranking rows retain the submitted order, show a red cross and the correct destination rank, with a separate correct-order list. Reloaded multiple-choice and typed answers retain their selected value and red state. Mosaic uses the selected country name as its feedback anchor, marks mismatched clues red and identifies their actual country. Incorrect comparison reveals stay visible until Next so explanations can be read.

The supervised browser preview was attempted but its daemon mailbox was unavailable. Screenshot-based diagnosis, component checks and emitted-CSS checks are completed; actual mobile-browser visual verification remains unavailable and is not claimed.

## 1.5 final verification — 2026-09-10

- Production build: passed (Sites build helper, exit 0).
- TypeScript: passed (`tsc --noEmit`, exit 0).
- Full suite: **52 tests, 52 passed, 0 failed, 0 skipped**; final run 11.694 seconds.
- Includes 2 independent WebSocket guest clients finishing a match **and a complete rematch**; 12 independent guest identities complete two five-round matches with concurrent answers through the API. The 13th guest is rejected. These are controlled Miniflare tests with accelerated server-clock transitions, not physical browsers or production traffic.
- Every six-mode practice flow reaches saved results; daily and puzzle flows, review targeting, guest/account merge, duplicate answers, room recovery, map mainland/island/dateline/hole cases, preference persistence and spoiler-free share/title content are covered.
- English/Dutch literal translation parity: 462 keys each. No missing literal interface keys in the component scan.
- Git whitespace check passed. Additive migration inspected: two new tables, one index, existing tables/migrations unchanged.
- A previous test asserted a visible countdown question. It was updated to assert `null`, because the server now withholds questions until the synchronized start. Another previous test expected legacy future-question regeneration; it now verifies the entire frozen session remains unchanged, matching the supplied brief.
- Browser start/status: unavailable preview infrastructure. **Not verified**: viewport screenshots, 360×800 / 390×844 / 768×1024 / 1440×900 / short desktop / landscape / 200% text layouts, physical mobile browsers, real screen reader/keyboard walkthrough, live Site WebSocket routing and Google OAuth. No before/after screenshots were fabricated.
- No LCP, INP, CLS, Lighthouse or real-user retention measurements were taken. Performance and WCAG targets remain goals, not passed claims.

See `RELEASE_1_5.md` for diagnosis, design choices, exact boundaries, privacy/measurement definitions and rollout recovery.
