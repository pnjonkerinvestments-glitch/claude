# Roviko launch film: beat map (v2)

110 BPM, 1 beat = 0.545 s, 47 beats = 25.64 s (1,538 frames at 60 fps).
Music: **"Swings and Slides" by Ahjay Stelino** (Mixkit, Mixkit Stock Music Free License), cut to picture by
`build/music_edit.py`. Film beat 0 is the song's bar 32, the build into its drop. At film beat 40 it cuts on a downbeat into
the song's own ending, so the last chord lands on the end card at beat 44.
Measured blind by `build/analyze_music.py`: **110.0 BPM, drop on film beat 16 at 8.72 s.**

v2 changes: everything plays at 85% of v1's speed (110/130; springs and durations included). The Detour questions get
2 beats each instead of 1, and there's a new multiplayer scene. The five illustrated players and the lobby
illustration come from the Roviko brand kit.

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
| 12.25 → **13** | 6.68 → 7.09 | The Canberra chip becomes Australia's flag (2:1): "Whose flag is this?" **Australia** | morph, tick, coin | |
| 14.25 → **15** | 7.77 → 8.18 | "Which is bigger?" Mexico / **Argentina** (2,780,400 vs 1,964,375 km²). Counter 250 | morph, tick, coin | |
| **16 DROP** | **8.73** | Gold floods out of the counter coin. Leaderboard cards burst in with illustrated players: Lucas 5,420 · Amara 5,180 · Emma 4,960 · You 4,880 · Yuki 4,610 | impact + the song's drop | push to 1.24x |
| 17.25–19 | 9.41–10.36 | "+81 to pass Emma"; You ticks to 5,130, climbs past Emma, and gets "Today #3" | reorder, level-up | |
| 19.75–21 | 10.77–11.45 | The gold shrinks back into the flame chip: 6 → 7, "7-day streak"; Roviko pops up cheering | collapse, streak, cheer | |
| 22–23.25 | 12.00–12.68 | "Nice trip. Same time tomorrow?", "Bonus tour", "Challenge a friend" | pops | |
| **24** | **13.09** | Tap "Challenge a friend": room card K7QMA rises out of it; Emma joins | tap, open, join | |
| **25** | **13.64** | **Multiplayer.** The room card grows into the lobby (brand-kit illustration). 16:9: "Play live with up to 12 friends." rises beside the phone | expand | drifts left to balance the headline |
| 25.25–27.5 | 13.77–15.00 | Ten more players pop in, one per quaver: the counter runs 2/12 → **12/12** and turns gold | ten rising pops, "room full" | |
| 27.75–28.25 | 15.14–15.41 | "Start match", tapped | pop, tap | |
| 28.45–29.35 | 15.52–16.01 | The illustration folds away and the 12 avatars fly up into a player strip. "Round 1/10 · Flags of the world": Japan's flag (3:2) and four answers | start, flag landing, pops | |
| 29.2–30.3 | 15.93–16.53 | Every player's avatar flies onto their answer: You first, 8 on Japan, 2 South Korea, 1 China, 1 Bangladesh | a snap per player | |
| **30.2** | **16.47** | Japan turns green; right answers hop, wrong ones shake; "+1,583" for You | correct chime, coin | |
| **31.1** | **16.96** | "You win!": avatars fly back to the strip and do a wave of hops; Roviko cheers; "1st of 12 players · +1,583 points" | win | |
| 32–32.9 | 17.45–17.95 | "Play again", tapped | pop, tap | |
| **33.25** | **18.14** | "Play again" leaves the phone and grows into the page (forest green), label to headline size | whoosh | **Push into the button** |
| 34.55–36.9 | 18.85–20.13 | "The world, one trip at a time." / "Five minutes. Every day." word by word | | outro: one slow push to the end |
| 37.85–39.7 | 20.65–21.65 | The map floods out from Lisbon; the pin drops; a paper plane flies New York → Lisbon | pin drop, send | |
| **40** | **21.82** | The pin opens into Roviko; cream floods out; the song cuts into its ending | sparkle | |
| 40.7–41.95 | 22.20–22.88 | Wordmark "roviko" wipes out from behind Roviko; tagline; roviko.app | expand | |
| 42–43 | 22.91–23.45 | Roviko starts waving, blinks, winks | | |
| **44** | **24.00** | The song's final chord: Roviko hops | (in the song) | |
| 45.4–47 | 24.76–25.64 | Blink; the chord rings out | | |

## Facts on screen, checked against `roviko/public/data/countries.json` and `roviko/MULTIPLAYER.md`
- Portugal's flag 3:2; Australia's flag 2:1; Japan's flag 3:2 (white with a red disc).
- Canberra is the capital of Australia. The pin lands on central Honshu, Japan. Argentina (2,780,400 km²) is bigger than Mexico (1,964,375 km²).
- Rooms hold at most 12 players (`MULTIPLAYER.md`: "maximum 12 players"). The social kit says "2 to 12 players".
- Leaderboard maths: 4,960 − 4,880 = 80, so +81 passes Emma; 4,880 + 250 = 5,130 passes Emma but not Amara.
- All player names are made up.
