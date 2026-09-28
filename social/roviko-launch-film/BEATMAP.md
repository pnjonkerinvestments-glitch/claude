# Roviko launch film: beat map (v3)

110 BPM, 1 beat = 0.545 s, 67 beats = 36.55 s (2,193 frames at 60 fps).
Music: **"Aerobic Fashion" by Arulo** (Mixkit, Mixkit Stock Music Free License), a pop-house track, cut to picture by
`build/music_edit.py`. Film beat 0 is the song's groove (song beat 47). The song's one-bar break falls under Q4 and Q5
(film beats 12–16), and its drop lands on film beat 16. At film beat 32 the edit skips four identical chorus bars
(similarity 0.99, so the cut can't be heard). The chorus stops on film beat 62 and the breakdown starts on beat 64,
where Roviko hops.
Measured blind by `build/analyze_music.py`: **110.0 BPM, drop on song beat 63 at 34.60 s = film beat 16 (8.73 s).**

v3 changes:
- The first 21 beats are unchanged.
- From "Nice trip. Same time tomorrow?" onward everything has more room.
- The multiplayer scene now shows the whole game mode: the host picks the rounds and the difficulty, 12 players join,
  everyone answers the same question, a live leaderboard runs through all 10 rounds, and the final podium closes it.
- The outro plays at about 75% of v2's speed.
- The music is new.

Sound column: the effect's measured peak lands exactly on that moment (`audio/sfx/peaks.json`).
Camera column: one eased move per scene, zoom in log space, no move reverses direction.

| Beat | Time | Picture | Sound | Camera |
|---|---|---|---|---|
| 0 | 0.00 | Close on the question card. "Daily Detour · 1/20". The headline types on two fixed lines; Roviko peeks over the card edge | keystrokes | Close (2.9x), drifting |
| 3 | 1.64 | Portugal's flag (3:2) springs in and lands with a squash | flag landing | |
| 3.5–5 | 1.91–2.73 | Four answers grow dot → circle → pill: Spain, Portugal, Italy, Morocco | pops | one tilt-and-push to the answers |
| **6** | **3.27** | Tap "Portugal": green ripple, check, "+50" | tap, correct chime | **Pull-back** (3.1x → 1.1x): the whole phone |
| 6.5–7.5 | 3.5–4.09 | The green pill grows into the map card and the map floods out of it; "+50" flies into the counter | morph, coin | |
| **9** | **4.91** | Map zooms in on East Asia, and a red pin drops onto Japan; Japan fills green | pin drop, coin | slow push |
| 10.25 → **11** | 5.59 → 6.00 | "Capital of Australia?": **Canberra** turns green | morph, tick, coin | |
| 12.25 → **13** | 6.68 → 7.09 | The Canberra chip becomes Australia's flag (2:1): "Whose flag is this?" **Australia** | morph, tick, coin (the song's break) | |
| 14.25 → **15** | 7.77 → 8.18 | "Which is bigger?" Mexico / **Argentina** (2,780,400 vs 1,964,375 km²). Counter 250 | morph, tick, coin | |
| **16 DROP** | **8.73** | Gold floods out of the counter coin. Leaderboard cards burst in: Lucas 5,420 · Amara 5,180 · Emma 4,960 · You 4,880 · Yuki 4,610 | impact + the song's drop | push to 1.24x |
| 17.25–19 | 9.41–10.36 | "+81 to pass Emma"; You ticks to 5,130, climbs past Emma, and gets "Today #3" | reorder, level-up | |
| 19.75–21 | 10.77–11.45 | The gold shrinks back into the flame chip: 6 → 7, "7-day streak"; Roviko pops up cheering | collapse, streak, cheer | |
| 22–22.5 | 12.00–12.27 | "Nice trip. Same time tomorrow?" (1.5 beats to read before anything else happens) | | |
| 23.5–24 | 12.82–13.09 | "Bonus tour", "Challenge a friend" | pops | |
| **26** | **14.18** | Tap "Challenge a friend": room card K7QMA rises out of it; Emma joins | tap, open, join | |
| **28** | **15.27** | **Multiplayer.** The room card grows into the lounge: brand-kit illustration, "Room K7QMA · You're the host · up to 12 players", the host crown on You. 16:9: "Host a party. Up to 12 friends. You pick the rounds and the difficulty." rises beside the phone | expand | one slow drift left over the whole multiplayer scene |
| 29.25 | 15.95 | The host taps **Rounds: 10** (5 / 10 / 15 / 20); the knob slides over | tap, snap | |
| 30.25 | 16.50 | The host taps **Difficulty: Medium** (Easy / Medium / Hard / Mixed) | tap, snap | |
| 29–31.5 | 15.82–17.18 | Meanwhile ten friends pop in, one per semiquaver: 2/12 → **12/12**, the counter turns gold | ten rising pops, "room full" | |
| 31.85–33 | 17.37–18.00 | "Start match", tapped | pop, tap | |
| 33.25 | 18.14 | The lounge folds away; the 12 avatars fly up into a player strip. "ROUND 1/10 · MEDIUM", ten round dots. 16:9: "Everyone plays the same questions. The fastest right answer scores the most." | start | |
| 33.85 | 18.46 | "Which country flies this flag?" Japan's flag (3:2) and four answers | flag landing, pops | |
| 34.55–35.85 | 18.85–19.55 | Every player's avatar flies onto their answer: You first, 8 on Japan, 2 South Korea, 1 China, 1 Bangladesh | a snap per player | |
| **35.9** | **19.58** | Japan turns green; right answers hop, wrong ones shake; "+1,583" for You | correct chime, coin | |
| **37** | **20.18** | The question makes way for the **live leaderboard** (top 5 of 12): You 1,583 · Emma 1,420 · Lucas 1,310 · Amara 1,190 · Yuki 1,050. 16:9: "Live leaderboard after every round. Most points after the last round wins." | swoosh | |
| 38.25–42.25 | 20.86–23.05 | Rounds 2 → 10, one per half beat: the round number rolls, the dots fill, points tick up, rows swap places. Emma takes the lead in round 2, Lucas passes You in round 5, You pass Lucas in round 8, and **You pass Emma in the last round** (+1,640) | a tick per round, reorder on every swap, coin | |
| **43** | **23.45** | **Final results.** Ranks 4–5 fold away; the top three rows morph into the podium (1st gold, 2nd, 3rd); You, Emma and Lucas fly down onto it. "You win! 1st of 12 players · 13,560 points"; Roviko cheers; the others wave in the strip | morph, win, cheer | |
| 45.2–46.25 | 24.65–25.23 | "Play again", tapped | pop, tap | |
| **46.6** | **25.42** | "Play again" leaves the phone and grows into the page (forest green), label to headline size | whoosh | **Push into the button** |
| 48.2–52.8 | 26.29–28.83 | "The world, one trip at a time." / "Five minutes. Every day." word by word | | outro: one slow push to the end |
| 52.85–55.3 | 28.83–30.16 | The map floods out from Lisbon; the pin drops; a paper plane flies New York → Lisbon | pin drop, send | |
| **55.7** | **30.38** | The pin opens into Roviko; cream floods out | sparkle | |
| 56.5–58.1 | 30.82–31.69 | Wordmark "roviko" wipes out from behind Roviko; tagline; roviko.app | expand | |
| 58.5–62 | 31.91–33.82 | Roviko waves and blinks; the chorus stops on beat 62 and Roviko winks | (in the song) | |
| **64** | **34.91** | The breakdown starts: Roviko hops | (in the song) | |
| 65.5–67 | 35.73–36.55 | Blink; the music fades out | | |

## Facts on screen, checked against `roviko/public/data/countries.json`, `roviko/MULTIPLAYER.md` and the app
- Portugal's flag 3:2; Australia's flag 2:1; Japan's flag 3:2 (white with a red disc).
- Canberra is the capital of Australia. The pin lands on central Honshu, Japan. Argentina (2,780,400 km²) is bigger than Mexico (1,964,375 km²).
- Rooms hold at most 12 players (`MULTIPLAYER.md`: "maximum 12 players").
- The host settings are the app's own: Rounds 5 / 10 / 15 / 20 and Difficulty Easy / Medium / Hard / Mixed
  (`GameSettings` in `components/RovikoApp.tsx`). Only the host changes them; the host has a crown, as in the app's lounge.
- Points depend on correctness and speed (`MULTIPLAYER.md`), and there's a leaderboard after every round (`leaderboard_updated`).
- Detour leaderboard maths: 4,960 − 4,880 = 80, so +81 passes Emma; 4,880 + 250 = 5,130 passes Emma but not Amara.
- Multiplayer standings: every total is the previous total plus that round's points (each round 980–1,640), and the order
  on screen follows the totals in every round. After round 10: You 13,560 (last round +1,640) · Emma 13,480 · Lucas 12,850 · Yuki 12,230 · Amara 11,940.
- All player names are made up.
