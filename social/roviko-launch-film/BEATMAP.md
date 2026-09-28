# Roviko launch film: beat map

130 BPM, 1 beat = 0.4615 s, 32 beats = 14.77 s, film = 15.00 s (900 frames at 60 fps).
The score ("Small Trip", written for this film) starts 12 beats before its drop.
Measured blind by `build/analyze_music.py`: **130.1 BPM, drop on beat 12 at 5.544 s**
(written at 130.000 BPM with the drop at 5.538 s: 6 ms apart, under half a frame).

Sound column: the effect's measured peak lands exactly on that moment (`audio/sfx/peaks.json`).
Camera column: one eased move per scene, zoom in log space, no move reverses direction.

| Beat | Time | Picture | Sound | Camera |
|---|---|---|---|---|
| 0 | 0.00 | Close on the question card (2.9x). Label "Daily Detour · 1/20". Headline starts typing on two fixed lines | 29 keystrokes, each on its key (fast-typist rhythm, pitch varied) | Holds close, drifts slightly |
| 0.45 | 0.21 | Roviko peeks over the card's top edge, hands gripping it, curious brow, eyes on the typing | small pop | |
| 1–2.9 | 0.46–1.34 | "Which country flies / this flag?" finishes; caret blinks, then goes | keys | |
| 3 | 1.38 | Portugal's flag (3:2) springs in from nothing and lands on the card with a squash | flag landing | |
| 3.5 / 4 / 4.5 / 5 | 1.62–2.31 | Four answers grow from a dot into a circle into a pill: Spain, Portugal, Italy, Morocco | four pops, rising pitch | 2.3 → 5.85: one tilt-and-push down to the answers (3.1x) |
| 4.35–5.8 | 2.01–2.68 | Round pointer appears and glides to "Portugal" | | |
| **6** | **2.77** | Tap: pill presses, green ripples out of the tap, white check, gold "+50" pops | tap, correct chime | **Pull-back** (3.1x → 1.1x, beats 6–7.75): the phone grows around the card, 9:41 status bar, tab bar |
| 6.5–7 | 3.00–3.23 | Roviko's eyes smile, then Roviko ducks behind the card. Other pills shrink away. The green pill grows into the map card; the world map floods out of its centre. "+50" waits, then flies into the points counter on the off-beat, 7.5 (50) | morph, coin | |
| 7.5–7.98 | 3.46–3.68 | Map zooms in on East Asia | | |
| **8** | **3.69** | Red pin drops onto Japan with a ripple; Japan fills green from the pin. "+50" → counter 100 | pin drop, coin | Slow push to 1.14x |
| 8.5 → **9** | 3.92 → 4.15 | Map collapses into a chip: "Capital of Australia?" Sydney / **Canberra** turns green. "+50" → 150 | morph, tick, coin | |
| 9.5 → **10** | 4.38 → 4.62 | The Canberra chip becomes Australia's flag (2:1, floods out of the chip). "Whose flag is this?" New Zealand / **Australia** turns green. "+50" → 200 | morph, tick, coin | |
| 10.5 → **11** | 4.85 → 5.08 | "Which is bigger?" Mexico / **Argentina** turns green (2,780,400 vs 1,964,375 km²). "+50" → 250. Progress bar 5/20 | morph, tick, coin | |
| 11.5–12 | 5.31–5.54 | Counter swells; the music takes a quaver breath | | |
| **12 DROP** | **5.54** | The gold coin in the counter floods out edge to edge in 0.36 s | impact + drop | 12 → 16: push to 1.3x |
| 12.15–12.9 | 5.61–5.95 | Forest-green leaderboard cards burst from the centre, middle first: Lucas 5,420 · Amara 5,180 · Emma 4,960 · You 4,880 · Yuki 4,610; ranks 1–5 rise | swoosh | |
| 13.25 | 6.12 | "+81 to pass Emma" rises next to You | tiny pop | |
| 14–14.8 | 6.46–6.83 | You ticks 4,880 → 5,130 (the 250 just earned) and swaps past Emma into 3rd, lifting | reorder | |
| **15** | **6.92** | Gold "Today #3" pill pops onto You's card | level-up | |
| 15.75–16.5 | 7.27–7.62 | The gold shrinks back into a flame chip at the top of the phone (the cards are cut away by its edge) | collapse | |
| **17** | **7.85** | Flame chip flips 6 → 7 and widens to "7-day streak". Roviko pops up, arms up, cheering, then bops on every beat | streak, cheer sparkle | 16 → 21.25: push to 1.38x, drifting down |
| 18 / 18.5 | 8.31 / 8.54 | "Nice trip." / "Same time tomorrow?" rise | | |
| 19 / 19.25 | 8.77 / 8.88 | "Bonus tour" (green) and "Challenge a friend" (outline) pop; the pointer glides in (18.9–19.85) | two pops | |
| **20** | **9.23** | Pointer clicks "Challenge a friend": it fills green; Bonus tour shrinks away; the room card "K7QMA" rises out of the button | tap, open | |
| 20.75 | 9.58 | Emma's avatar pops in: "✓ Emma joined" | join | |
| **21.25** | **9.81** | The green button leaves the phone and grows into the page, staying a pill until it passes the edges; turns forest green; its label grows to headline size | whoosh (peak at 10.27 s) | **Push into the button** (1.38x → 3.2x) |
| 22.2 | 10.25 | Label slides up out of its mask line | | |
| 22.55–24.05 | 10.41–11.10 | "The world, one trip at a time." rises word by word (92 px, cream on forest) | | Outro: one slow push (1.0 → 1.05) to the end |
| 24.25–25.2 | 11.19–11.63 | "Five minutes. Every day." word by word | | |
| 25.85 | 11.93 | Lines slide out; a map floods out from Lisbon | | |
| **26** | **12.02** | Red pin drops on Lisbon | pin drop | |
| 26.35–27.7 | 12.16–12.78 | Paper plane takes off from New York, drawing a dashed route across the Atlantic to the pin | send | |
| **28** | **12.92** | The pin's head opens into Roviko: legs spring out, arms pop, eyes open | sparkle | |
| 28.12 | 12.98 | Cream floods out of Roviko edge to edge | | |
| 28.7 | 13.25 | Wordmark "roviko" wipes out from behind Roviko (eased to keep the motion blur clean) | expand | |
| 29.45 / 29.95 | 13.59 / 13.82 | "A small geography trip. Every day." / "roviko.app" rise | | |
| **30** | **13.85** | Final chord: Roviko hops and starts waving | | |
| 30.55 | 14.10 | Blink | | |
| **31** | **14.31** | Wink and blush | glockenspiel ding (in the score) | |
| 32 | 14.77 | Chord rings out to 15.00 s | | |

Every visual beat from 0 to 31 has an event. The longest hold (end card) is 0.69 s.

## Facts on screen, checked against `roviko/public/data/countries.json`
- Portugal's flag: green/red at 2:5 with the armillary sphere (real 3:2 ratio).
- Canberra is the capital of Australia. Australia's flag is shown at its real 2:1 ratio.
- The pin lands on central Honshu, Japan (36.3° N, 138.4° E).
- Argentina (2,780,400 km²) is bigger than Mexico (1,964,375 km²).
- The route runs New York → Lisbon, and the pin sits on Lisbon.
- Leaderboard maths: 4,960 − 4,880 = 80, so +81 passes Emma; 4,880 + 250 = 5,130 passes Emma but not Amara (5,180), so You finishes 3rd.
