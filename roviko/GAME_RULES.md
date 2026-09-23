# Game rules

Questions come from deterministic templates over the licensed catalog. Seven regions, four difficulty choices and 5/10/15/20 rounds are supported. Easy favours familiar countries; hard favours less familiar countries where the regional pool allows. Distractors remain unique and plausible.

## Solo discoveries

All singleplayer modes, practice and the daily expedition are untimed. There is no question deadline, game-age cutoff, score, speed bonus or XP award. Correct-answer counts, accuracy, streaks and concepts to review are saved. Existing unfinished sessions also adopt these rules; old stored records are retained, but solo points are excluded from active rankings and point aggregates.

The current solo question carries its own solution for immediate on-click learning feedback. No future questions are sent. The browser submits only its answer; the server independently validates and records it. If a player presses Next while saving, that action waits for persistence. The same pure evaluator handles typed aliases, options, ordering and map distance on both sides.

## Multiplayer competition

Multiplayer retains 5/10/15/30-second or host-managed untimed rounds. A correct categorical or fully ordered answer earns 1,000 base points, up to 500 speed points and up to 250 streak points (50 per additional consecutive answer). Untimed multiplayer earns no speed bonus. Incorrect or late answers earn zero. All points and deadlines are server-authoritative; clients never receive solutions until reveal.

Multiplayer results award `round(score / 25) + 10 * rounds` XP. Level is `1 + floor(sqrt(XP / 100))`. Wins, points and XP leaderboards include multiplayer only. No knowledge advantage is purchasable.

## Maps, typed answers and question selection

New Pinpoint games accept the chosen country geometry, source islands and a disclosed 25 km boundary tolerance. Outside pins report distance to the nearest boundary. Solo gives no points. Multiplayer awards normal correctness points for accepted pins; misses earn at most 900 distance-based points, with no speed bonus. Legacy frozen sessions retain their original reference-coordinate rule of less than 700 km and display that rule before play.

Typed capital matching ignores case, accents and punctuation, accepts configured aliases and allows one edit for responses of at least five characters. Short answers require an exact normalized match.

Repeated targets are avoided where possible. Very small regional pools can revisit targets using distinct round IDs and varied distractors rather than inventing neighbours or failing.

## Daily and progress

The UTC date seeds five shared rounds: flags, capitals, map, borders and order. The first result of each daily game is retained per user/date/kind; completing any daily game counts toward one daily streak entry for that UTC date. Daily results show discoveries, accuracy and streak, with an answer-free share summary. There is no daily points leaderboard or percentile competition. Guest identities are not a strong identity boundary.

Thirty achievements track games, knowledge, streaks and multiplayer milestones. Practice prioritizes previously missed country/concept pairs. XP achievements require multiplayer XP.


## Side by Side

Ten pairs of countries share one comparison subject. Choose the country with the greater value (or the more northerly latitude). Both figures and the metric definition appear immediately. All ten comparisons can be reviewed after completion. No lives, timer, points, XP or competitive ranking apply.

The daily subject rotates through 14 topics using a deterministic shuffled 14-day cycle anchored in UTC. The UTC date seeds the ten questions; practice accepts any of the 14 subjects and uses a fresh session seed. Statistical observations are pinned to 2023. Stable catalog comparisons state that they use a source snapshot. Missing values and exact/display-rounded ties are excluded. No future pairs are sent during the game.

## Country Mosaic

Four countries each contribute a flag, a name and a silhouette. Four-clue games add a fact; five-clue games also add the country’s capital(s). That produces 12, 16 or 20 shuffled tiles. A correct set contains exactly the chosen number of distinct tiles belonging to one country. Solved tiles leave the board and reveal the country. Facts are chosen to be distinct among the four board countries; shared languages or currencies cannot create an ambiguous set.

There is no mistake limit. An incorrect set stays selected so individual tiles can be swapped. A set with all but one tile belonging together receives a gentle near-match hint. Shuffle changes only visual order. The optional hint selects two correct tiles from an unsolved country. All four solved sets finish the game, after which the full country/clue combinations can be reviewed. Accuracy reflects successful sets divided by submitted sets; hints carry no points or penalties because this is unranked learning.

The daily board has four clue types and is identical for the UTC date. Practice allows three, four or five. Country shapes are north-up simplified main landmasses, not exhaustive sovereignty claims. Current board solutions are available to the browser for immediate feedback, but every submitted set and result is validated independently on the server. Repeated/unknown tiles and attempts to reuse solved tiles are rejected. Server revision checks prevent duplicate submissions. Saved daily sessions resume even after their original UTC date ends.


### Side by Side, rolling comparisons (1.3)
A fresh country appears on the left, then becomes the right baseline next round, regardless of the selected answer. The previous right baseline retires. Values reveal immediately; the carried value stays visible. Automatic continuation can be disabled and never imposes a deadline. Resumed legacy sessions retain their answered history and regenerate only the remaining comparisons.

### Mosaic selection (1.3)
Select one clue per category. Selecting another clue of the same category replaces the existing selection, even when all slots are filled. Solved clues stay in place. Hints progressively complete a single group. No lives, timer, or points.


### Error explanations (1.4)
Mosaic uses the selected country-name tile as the feedback anchor. After checking a mixed set, each selected clue from another country is marked red and labelled with its actual country. Matching clues are green. Changing the selection clears the prior verdict. Side by Side continues automatically only after a correct answer; a wrong answer remains visible until Next. Ordered-country answers show each misplaced row in red with its correct rank, followed by the correct ordering.

## 1.5 rules

Clue Trail saves revealed clues (region, neighbour/isolation, flag, capital). One guess per question; clue count has no score penalty in untimed solo play. Multiplayer shows all clues. Historical 1.5 Mosaic facts used subregions; the current numeric edition is specified below. Side by Side excludes ties and displayed rounding ties and preserves its local auto-next preference. Daily snapshots and completed results are immutable across deployments. See `docs/RELEASE_1_5.md` for merging, editorial exclusions and practice rules.


## Follow-up practice and passport (1.6)

A finished game offers one optional next step. Personal retries contain at most five missed knowledge points, have no timer or points and cannot alter the official daily result. Targeted comparison retries revisit selected missed pairs without the normal carry-forward chain. Other companion rounds contain five questions. Repeating a follow-up request resumes that same follow-up.

A country stamp requires one recorded correct answer. A knowledge seal requires correct answers in the same mode in three distinct sessions. A region stamp requires five different discovered countries. Awards are derived from immutable answer records and are not lost through inactivity. Reloading cannot multiply awards.

### Mosaic fact edition (1.7)
New standard 4/5-clue boards use curated, bilingual facts about 40 countries, with two fact variants selected deterministically per country and seed. At least two countries share a continent when an eligible companion exists. No universal one-country-per-region rule remains. Solving a group unlocks a sourced learning explanation; it is never required to proceed. Three-clue boards contain flags, names and outlines only. Legacy targeted practice may use a country-catalogue area/border clue outside the curated pool. Published daily snapshots and existing sessions retain their original content.


### Mosaic numerical fact edition (1.8)

Four/five-clue boards now use one numerical observation per country, selected from the country's available subjects by UTC date. The 15 subject categories include highest point, average terrain elevation, coastline, median age, area and the ten existing WDI indicators. Reference years and estimate labels remain visible; definitions and source links are revealed after matching. Missing data are not filled with guesses. Equally displayed clues are avoided within a board. A practice board keeps its creation date; an official daily keeps its UTC date.

**Clue-only compatibility upgrade:** a saved board lacking `factEdition: metrics-v2` is projected into the new numerical presentation on the server. Tile IDs, country IDs, tile order, solved groups, answer history, session date and optimistic concurrency version remain unchanged. No saved answer is rescored. This deliberate exception fixes old “Find me in” hints that otherwise persisted after content updates. Other daily questions and scoring remain frozen. The old raw snapshot is retained for audit; existing results stay valid.

The interface adds an explicit clue-type checklist, structured number cards and a dated freshness line. Wrong selected clues retain the existing red outline, cross icon and actual-country explanation. No timer or point system has been reintroduced for solo play.


## Rank Radar (1.9)

Each daily contains six distinct countries, four subjects per country and six different winning subjects. The user chooses the subject where the country has the strongest relative position. Subject pool: population, forest percentage, total area, life expectancy, urban percentage, GDP/person, internet use, fertility, agricultural land percentage, total GDP, exports/GDP, highest point, mean elevation, coastline and median age.

Higher numeric values rank first. Competition ranks are `1 + count(values strictly greater)`, so ties share a place. Comparison position is `(rank - 1) / (coverage - 1)`, lower being closer to the top; displayed “top %” is `ceil(rank / coverage * 100)`. Missing observations never become zero. Coverage is restricted to the existing 195-country catalogue and actual observations, and is displayed for every option. Questions require at least an eight-percentage-point separation from the winning option, as well as a strictly lower absolute rank, avoiding contradictory-looking answers across unequal coverage. Winner categories vary within a set, and politically sensitive question targets follow the central policy. Numeric ranking expresses no judgment about a country's worth.

Each World Bank indicator uses only the 2023 snapshot. Median ages all use the 2025 estimate. Geographic records without a stated source year say so. The archived status and full source links remain visible. Source corrections, such as Germany's mountain height, keep their own attribution.

The server generates and freezes a set once per UTC day. A player resumes their first daily session; practice uses a new seed. Only the current question is sent before completion; its solution is included for instant unranked feedback, as in the other learning games. After a choice, all four values and ranks are shown. An incorrect choice is specifically marked red with a cross; the strongest subject is green with a check. Both ranks are explained in words. The final recap is available only after all six reveals. Shares contain a result trail, never country/subject answers.

Server validation, session ownership, optimistic version checks and immutable answer rows protect the record. A lost response triggers state reconciliation, not an automatic repeated guess. No timer, points, XP or competitive leaderboard is attached. Completed games contribute to personal accuracy, stamps and daily attendance. The native SwiftUI client uses the same `/api/ranks` contract.

## World Duel (Wereldduel)

The player holds five country cards. Each of five rounds shows one subject from the Rank Radar pool and one country played by Roviko; the player picks an unused card from their hand, and the higher value wins the duel. Each card is played once. Boards are generated deterministically per seed (`roviko:duel:v1:<UTC date>` for the daily, a random nonce for practice) from the same sourced observations as Rank Radar. The generator only accepts boards where every card–round pairing differs by at least 12%, exactly one assignment wins all five rounds, and at least three rounds can be won by more than one card. After every play both values, world ranks, the subject explanation, source and reference year are shown; a lost round names the card that would have won it. The result screen shows the unique perfect route. No timer, points or XP. Progress is kept per board in the browser; results are not yet stored on the server or counted toward streaks and stamps.
