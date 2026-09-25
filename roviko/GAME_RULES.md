# Game rules — Roviko 1.13.0

These are the current rules. Documents for 1.9/v3 and earlier are historical. The requested daily competition replaces the earlier no-points policy **only for official daily games**.

## Official daily competition

Five games are published once per UTC date. Everyone receives the same frozen content for that edition. Each game is worth at most 1,000 points, with a combined maximum of 5,000 per day. There is no timer, time limit, speed bonus or XP. The first completed result for each player/date/mode is immutable. Reopening resumes the same game or shows the saved result; it never creates extra points.

| Game | Rounds | Daily points |
| --- | --- | --- |
| Daily Detour (formerly World Trip) | 20: flags, capitals, map, borders and area ordering, four of each, shuffled, never the same type twice in a row | 50 per correct question; map credit is proportional to accuracy (map points ÷ 20). Editions saved before 1.18 keep five stops of 200 |
| Daily Clue Trail | 5 countries | Correct after 1/2/3/4 clues: 200/150/100/50; wrong: 0 |
| Side by Side | 10 comparisons | Correct: 100; wrong: 0 |
| Country Mosaic | 4 country groups | 250 per group. A wrong submission forfeits points for its selected country-name anchor. Each hint for that country costs 125, minimum 0 |
| Rank Radar | 6 countries | `round(correctAnswers / 6 * 1000)`, rounded once for the total |

A player can always finish Mosaic and learn after a mistake; a solved forfeited group earns 0. The same named country must anchor a paid hint. Mistakes/hints do not remove points already earned for other solved countries. Shuffle, changing an unsubmitted selection and reordering countries cost nothing.

After completion, each game shows its score and `#rank of participant count`. Only completed results count, including zero scores. Ties share a competition rank (`1 + number of strictly greater scores`). Homepage totals sum completed daily games; cumulative totals sum all dates. Rankings can move as others finish. The date is the game's starting UTC date, including when it is finished after midnight. Players with blocked accounts are excluded; non-discoverable names are masked.

The new ledger begins with the 1.11 competitive edition. Previously played unranked games are preserved without retroactive points. Guests can compete using their saved browser session. Verified account linking transfers non-duplicate progress; an account's existing daily session/result remains canonical. Guests are not verified unique humans, and resetting an anonymous identity cannot be fully prevented.

## Practice and legacy editions

The six classic modes, fresh puzzle/rank practice, personal retries and the Mystery Country bonus warm-up are unranked, untimed and earn no daily points or XP. They retain correct-answer counts, accuracy, learning history, knowledge seals and sourced explanations. Immediate local feedback is allowed because these sessions never enter the points ledger. Daily competition waits for server confirmation and does not send solutions in advance.

Older native clients use their existing unranked daily edition. The website explicitly requests `competition:true`; a future native update must add the competitive result/hint/serialization handling before opting in. Native app compilation/signing is a separate release gate.

## Clue Trail

The order is (1) continent, (2) a land neighbour or lack of land borders, (3) capital, (4) flag. Four choices contain the target, one other country from its continent and two outside it. Answer options do not show flags. Capitals whose names disclose the country are excluded. One answer per country; more clues can be revealed before committing. Clue use survives reload and cannot be refunded. In daily competition only already revealed hints are delivered, and the flag asset is inaccessible before clue 4. Multiplayer shows all four clues and uses its match scoring.

## Maps, capitals, ordering and borders

Pinpoint accepts the chosen country's source geometry/islands with a declared 25 km touch/simplification tolerance. An outside pin reports distance to the nearest country boundary. Raw map accuracy is 1,000 for a correct pin, otherwise `round(900 * exp(-boundaryDistanceKm / 1600))`; invalid/missing pins get 0. In World Trip, the round earns `round(rawAccuracy / 5)`, capped at 200. A nearer miss never earns less than a farther miss. Neighbour/continent labels explain proximity without inconsistent fixed bonuses. Practice displays distance and correctness, not points. Legacy reference-point games retain their original frozen rules.

The map supports two-finger zoom, pan, buttons, wheel input and keyboard interaction. A pinch/pan does not accidentally submit a pin. Pin placement is confirmed before answering.

Capital answers normalize case, accents and punctuation, accept configured aliases and allow one typo for strings at least five characters long. Short names need exact normalized matches. Self-revealing capital/country names are filtered. Capital/flag choices never reveal the answer via option flags before submission. Border options that are embedded in the question's target name are excluded.

Size Shuffle orders four countries by total area. Dragging or accessible move buttons only change the draft; **Confirm order** submits it. An incorrect submission marks each misplaced row red with a cross and its correct place, followed by the complete correct ordering. A daily ordering round is all-or-nothing (200/0).

## Side by Side

Choose the greater figure (or more northerly latitude). The left country moves right on the next round regardless of which answer was chosen; a fresh country arrives left, and the old right country retires. Source years, units and values are explained after submission. Practice may show the already learned carried value; daily answers still require server validation.

Fourteen topics rotate on a deterministic UTC cycle. WDI observations use the pinned 2023 snapshot. Missing observations, exact ties and display-rounded ties are excluded. All comparisons can be reviewed after finishing. Automatic advance is optional, only follows correct answers and imposes no deadline.

## Country Mosaic

The daily board contains 16 tiles: four flags, four names, four silhouettes and four numerical facts. Practice allows 3/4/5 clue types (12/16/20 tiles); the fifth type is capital. Select one of each type for one country. Selecting another clue of the same type replaces its slot. Solved tiles stay in their positions. Country shapes are simplified north-up main landmasses.

The name is the feedback anchor. Incorrect clues are red with cross icons and “Does not match”; matching clues are green. Competitive feedback does not disclose the wrong tile's other country while its group remains unsolved. Practice can show that extra explanation. Changing the selection clears the prior verdict. Solving a group reveals its sourced fact explanation; finishing reveals all groups.

One dated numerical observation is selected per country each UTC day. Subjects include highest point, mean elevation, coastline, median age, area and WDI indicators. Units, source years and estimate labels are explicit. Missing data are never invented, and equal displayed clues are avoided within a board. A practice board keeps its creation date; a daily board keeps its published date. The earlier clue-only compatibility projection into `metrics-v2` preserves tile IDs, country matches, solved sets and version/history; old raw snapshots remain auditable.

## Rank Radar

Six distinct countries, four subject choices each and six different winning subjects. Choose the subject where the country has the strongest relative position among countries with observations. Fifteen subjects: population, forest share, area, life expectancy, urban share, GDP/person, internet use, fertility, agricultural land share, GDP, exports/GDP, highest point, mean elevation, coastline and median age.

Higher numerical values rank first. Ties share a rank. Relative position is `(rank-1)/(coverage-1)`; displayed top percentage is `ceil(rank/coverage*100)`. Missing observations do not become zero. Questions require at least eight percentage points' separation from the winner plus a strictly better absolute rank, avoiding contradictory-looking results with unequal coverage. WDI figures use 2023; median ages use the 2025 estimate; archived geographic figures declare their source limitations. Numeric rank does not express a country's worth.

A selection remains editable until **Confirm choice**. Daily rank/metric solutions stay on the server until submission. Feedback shows all four values/ranks, with the wrong choice red and correct choice green, supported by text and icons. The final recap preserves definitions, coverage and source years.

## Multiplayer

The host chooses 5/10/15/20 questions, region, difficulty, timer and included mixed-mode categories. All six are enabled by default and at least one must remain. Timers are 5/10/15/30 seconds or untimed. When every currently active player has answered, reveal is scheduled for one second after the last answer; an earlier deadline still closes the round. A returning unanswered player cancels a premature early reveal.

Correct answers earn 1,000 base + up to 500 speed + up to 250 streak points (50 per extra consecutive correct answer). Untimed rooms have no speed bonus. Incorrect categorical/ordering answers earn 0. Incorrect map pins use the raw distance curve; correct pins retain normal match bonuses. Server timestamps, answer locks and scores are authoritative. Clients cannot submit points or see other choices before reveal.

Match XP is `round(score/25)+10*rounds`; level is `1+floor(sqrt(XP/100))`. These multiplayer scores/XP/wins have their own leaderboards and never enter daily or cumulative daily-game totals. No paid knowledge advantage exists.

## Learning and saved progress

Completing at least one daily game on a UTC date adds one daily streak entry. Thirty achievements cover learning and multiplayer milestones. Personal retries revisit up to five misses without altering the official result. A passport stamp requires one correct country answer; a knowledge seal requires correct answers in a concept across three distinct sessions. Reloading cannot multiply awards. Shared daily snapshots and scored answers are not regenerated after a deployment.

## Rank Radar medals (1.12)

Every choice also earns a medal for its place among the four subjects of that country: 🥇 best, 🥈 second, 🥉 third, ⚪ weakest. Place is `1 + count(options with a strictly better relative position)`, so ties share a medal. Medals are feedback only: daily points still follow the table above (`round(correctAnswers / 6 * 1000)`). The medal trail, the result summary (`n× best · n× 2nd · n× 3rd`) and the share text (`🥇🥈…`) use these places; a share never names countries or subjects. `GET /api/ranks/:id` adds `places` for answered rounds only, so medals survive a reload and nothing about an unanswered round is revealed.

## World Duel (extra, unranked)

The player holds five country cards. Each of five rounds shows one Rank Radar subject and one country played by Roviko; the player picks an unused card and the higher value wins that duel. Each card is played once. Boards are deterministic per seed (`roviko:duel:v1:<UTC date>` for the daily board, a random nonce for practice) and use the same sourced observations as Rank Radar. The generator only accepts boards where every card–round pairing differs by at least 12%, exactly one assignment wins all five rounds, and at least three rounds can be won by more than one card. After each play both values, world ranks, the explanation, source and year are shown. No timer, points or XP; progress is kept per board in the browser.

## How to play

Every mode has three short steps and one tip in English, Dutch and Spanish (`lib/how-to-play.ts`). The explanation opens by itself the first time a player starts a game (once per game, remembered in the browser), except in mixed practice and multiplayer rooms. A "?" button in every game header reopens it, and `/how-to-play` lists every game with a button to start it. While it is open, a game's number-key shortcuts are ignored.

## Daily quests and crowns (1.12)

Three quests per UTC date, the same for everyone (`lib/daily-quests.ts`): (1) finish one named daily game, rotating through the five daily games; (2) finish a bonus game, alternating between the mystery country and the World Duel; (3) finish three different daily games. Progress comes from today's completed official daily games (server sessions) and the bonus games' browser progress. When all three are done, the player can open a chest that adds one crown for that date. Quests and crowns award no points or XP and never change daily scores, rankings or streaks. Crowns are kept in the browser (at most 400 dates) and are not synchronised between devices.

## Practise tricky countries (1.12)

When a player has country/mode pairs they answered wrongly before, the homepage offers an unranked practice round. It uses the existing practice selection (up to 20 of the weakest country concepts), has no timer, points or XP, and never alters daily results.

## App reminders (1.12)

In the native app only, the optional daily reminder is scheduled as seven weekly notifications at 18:00 local time, one per weekday, each with a different friendly line. Turning it off cancels all seven (and the earlier single reminder). The website never asks for notification permission.

## Streak shields (1.13)

The daily streak counts consecutive UTC dates with at least one completed daily game. From 25 September 2026 on, every 7 play days earn one streak shield, with at most 2 in stock. A missed day automatically uses a freeze: the streak survives, but frozen days do not add to it. If more days are missed than there are freezes, the streak breaks and the stock is emptied. Everything is derived from the stored daily results (`lib/streak.ts`, used by `server/stats.ts`), so no extra storage is needed, the outcome is identical on every device and freezes cannot be bought or farmed. Days before the start date follow the old rule, so no existing streak changes retroactively. `stats.streakFreezes` exposes `available`, `nextIn` and the last 14 `frozenDates`.

## One tap answers in single player (1.13)

In single player (solo, practice and all official daily games) a tap on an answer is the answer: Rank Radar subjects and Pinpoint map taps no longer need a separate confirm button. The tapped card is outlined straight away and stays marked after the reveal. Arrow-key pin moves still need Enter, and multiplayer keeps the explicit lock button. Size Shuffle keeps its confirm button, because reordering is not an answer by itself. In daily Side by Side the carried country shows the value that was already revealed in the previous round; the new country's value stays hidden until the answer is saved.

## Multiplayer review and clues (1.13.2)

The pre-round countdown shows 3, 2, 1 and then "Go!". During each reveal the room view adds `roundAnswers`: every player's answer (as a readable label), whether it was right and the points it earned; answers stay private until the reveal. The live ranking shows each player's answer with ✓/✗ and their "+points" for the round (previously the points were hidden behind the streak indicator). A finished match adds `history`: every round's question, correct answer and all players' answers and points, shown as a round-by-round review on the podium screen. In multiplayer Clue Trail the four clues appear one at a time, 2 seconds apart; answering earlier still earns more speed points.

