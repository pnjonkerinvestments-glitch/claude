# V1 scope and honest delivery boundary

| Area | Status |
|---|---|
| Original responsive game selection, six modes, light/dark, EN/NL | Implemented; browser visual QA pending due preview infrastructure |
| Untimed, unscored singleplayer with immediate feedback; options/typed capitals, map, reorder, borders | Implemented and core/integration-tested |
| Untimed daily UTC challenges, persistence, discoveries and share text | Daily expedition plus Side by Side and Country Mosaic; integration-tested |
| Country clue matching | 12/16/20-tile practice, shared 16-tile daily, unlimited retries, pair hints, shuffle and review; engine/integration-tested |
| Live private rooms, synchronized phases, scores, podium, rematch/reconnect | Implemented over native WebSockets with D1 revision fanout; two-session integration-tested |
| Email/password accounts and persistent guests | Implemented; signup links existing guest progress |
| Google OAuth | Implemented behind server configuration; no credentials were available to exercise it |
| Profiles, XP/levels, 30 achievements, history and practice | Implemented |
| Friends, request privacy/blocking, room invite links | Implemented; comparison shows saved score; no direct push-message delivery |
| Daily / rolling seven-day / all-time multiplayer XP, wins and score rankings | Implemented; ratings UI remains off until ranked rollout |
| Geography database | 195 country records, facts, flags, coordinates, borders, full source geometries and a simplified 177-geometry display map |
| Dated statistical comparisons | Ten World Bank WDI indicators, 2023 snapshot, plus four catalog comparison topics; highest points remain deferred |
| Infinite/endless and knockout sub-variants | Deferred; configurable finite 5/10/15/20-round sessions and untimed play work |
| Admin and reports | Implemented with server allowlist; configure reviewer IDs before use |
| Analytics | No tracking provider; event table and interface are prepared, not an active analytics integration |
| PWA and sound | Install manifest, local icons, static cache/offline shell; synthesized optional sound |
| Quick Match / ranked rating / tournaments / classroom / premium | Flags/schema or documented extension points only; no misleading primary-flow buttons |
| Production rollout | Deployable V1; still needs browser/real-device QA, credentials, legal/operator setup and scale testing |

The first release deliberately puts real playable flows ahead of adding every sub-variant in the larger brief. It must not be represented as completing all 70 long-term requirements or as independently security-audited.
