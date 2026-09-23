# Roviko 1.6 — travel atelier

Implemented from the attached improvement brief on 2026-09-11, with the final daily-return refinements on 2026-09-21. Builds on release 1.5; no routes, accounts, stored daily questions, source datasets, or multiplayer rules are replaced.

## Product changes

- Three equally prominent daily cards: World Trip / Wereldreis, Side by Side, Country Mosaic. Each has a full game colour, original decorative SVG, short explanation, extent/topic, server-backed New/In progress/Complete state and one primary Start/Continue/View result action. A completed counter counts completed games only. The extended five-stage route is retained inside World Trip.
- A compact globe welcome, subtle illustration hover/focus feedback, real completion stamps for the last seven UTC days and tomorrow's actual comparison topic make the daily routine visible. All three completed games receive an explicit acknowledgement. These reuse the existing authoritative daily endpoint; no fabricated streak, additional notifications or new tracking. The calendar exposes full dates and completion labels to assistive technology.
- Brief introduction, a six-mode quick-launch grid, visible persistent region filter, Surprise me (five questions in that region), secondary settings controls, a compact 2–12-player friends section and personal passport preview. Empty leaderboards no longer consume a homepage panel; their existing route remains available.
- Warm ivory/ink light theme, three full turquoise/gold/lilac card surfaces, separate darker surfaces, 44px header controls, mobile sign-in in the menu, original vector illustrations, existing friendly globe and self-hosted Manrope/Outfit.
- Solo and puzzle game back controls return to their starting page and scroll position. The selected region is visible in solo games. One saved automatic-continue preference covers solo and comparisons: opt-in for new players, adopts an existing comparison preference, waits three seconds after a correct answer is saved, and pauses on incorrect answers or errors. Manual next remains available. Mosaic retains its matching interaction.
- Incorrect answers keep their explicit correction and rose-red state. A saved incorrect Mosaic match now restores its selection and per-clue verdict after reload.

## Meaningful next steps

Result screens offer one primary next discovery and a clear stopping action. If there were misses, a personal retry contains at most five relevant questions. Solo retries preserve the missed questions and original region; comparison retries preserve the missed pairs, reference years and sources and omit carry-forward because they review selected pairs. Mosaic retries translate mismatched clue types into short practice about the same country (flags, capitals, location or country clues). Ineligible reviewed questions are omitted rather than fabricated. With no misses, a five-question companion mode is offered; countries from the previous game are reused where eligible, with remaining slots filled in the same region.

The `/api/next-round` endpoint accepts only an owned completed source session and an intent, validates on the server, and creates a deterministic follow-up identity. Repeated or concurrent requests resume the same follow-up. It remains separate from the daily session/result, contains no solo points or countdown, and uses existing authoritative answer storage. Fresh complete games can still be started via Play again. Existing immediate feedback and WebSocket multiplayer are preserved.

## Passport

Country stamps are derived from at least one persisted correct answer. Knowledge seals require correct answers in the same mode in three distinct sessions. Repeated completion requests or extra answers in one session cannot multiply the awards. Region stamps require five distinct countries in that region. The nearest incomplete regional milestone is explicit. There is no loss of earned discoveries after an inactive day.

The profile includes a map coloured from the same saved country IDs, a text count/legend, all six regional stamps and a collapsible list of country stamps with flags and knowledge seals. The full list includes microstates omitted by the simplified Natural Earth basemap. All rewards are derived from existing immutable answers; no schema migration or new tracking is needed. Account merging preserves those answers.

## Intentionally deferred

- A weekly themed route and shareable custom question packs. No inactive buttons are shown. Existing same-UTC-date daily challenges, spoiler-free text results and live private rooms remain available for friends.
- A rendered downloadable result-image card. The existing original spoiler-free text share and manual-copy recovery remain in use.
- Visual/browser verification, including requested 1440×900, 390×844 and 320px captures, cannot be completed because the supervised preview service is unavailable. No screenshots or browser-performance claims have been fabricated.

See `QA_1_6.md` for measured evidence and untested cases, and `DATA_SOURCES.md` for provenance and restrictions.
