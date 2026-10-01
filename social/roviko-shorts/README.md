# Roviko shorts (TikTok / Instagram Reels)

Three vertical 1080×1920 videos at 60 fps, each with a different joke and a different song.
They use the same style and the same engine rules as the launch film (`social/roviko-launch-film`):
- one continuous take;
- nothing fades; shapes spring and morph;
- one camera move per scene;
- every event has a real sound.

| | File | Length | Hook | Song |
|---|---|---|---|---|
| 1 | `out/roviko-short-1-sydney.mp4` | 7.5 s | "POV: you're 100% sure it's Sydney" | "Funkee Monkeee" (funk, 120 BPM) |
| 2 | `out/roviko-short-2-streak.mp4` | 15.5 s | "Me remembering my 47-day streak at 23:58" | "Take this Higher" (EDM, 124 BPM) |
| 3 | `out/roviko-short-3-gamenight.mp4` | 27 s | "POV: your friend says he's 'elite at geography'" | "Life is a Dream" (disco, 120 BPM) |

## Why these three
What performs on TikTok and Reels right now:

- **The hook comes in the first half second, as on-screen text.** Up to half of viewers drop off in the first 3 seconds. Every short opens on its joke's setup caption at frame 1, over a scene that already has something moving.
- **Lengths.** 7–15 s is the viral sweet spot, and 15–30 s works for humor and skits. So there's one of each: 7.5 s, 15.5 s and 27 s.
- **Mascot-led, relatable POV humor that entertains first and sells second.** The mascot plays a character with a flaw everyone recognises:
  - overconfidence (Sydney);
  - streak panic (23:58);
  - the friend who trash-talks and loses (game night).

  The product shows up as the stage for the joke, and the call to action is only the end card.
- **Pattern interrupts.** The song tape-stops on the wrong answer and the camera punches in on the face (1). A silent song break under "23:59:57… 58… 59" (2). The song dips when Lucas rage-quits (3).
- **Safe zones.** On 1080×1920, TikTok covers about 130 px at the top, 484 px at the bottom and 140 px on the right. All captions, chat, answers and the end card sit inside the clear area (`SAFE` in `lib/core.js`).

Sources: [quso.ai: video length 2026](https://quso.ai/blog/social-media-video-length-best-practices) · [quso.ai: Reels best practices](https://quso.ai/blog/instagram-reels-best-practices) · [joyspace: ideal length per platform](https://joyspace.ai/ideal-video-length-social-platform-2026) · [heyorca: hooks for 2026](https://www.heyorca.com/blog/the-best-social-media-hooks-for-2026) · [Hootsuite: TikTok trends 2026](https://blog.hootsuite.com/tiktok-trends/) · [Duolingo mascot strategy case study](https://www.enrichlabs.ai/case-study/duolingo-social-media-strategy) · [TikTok Creative Center: humor on TikTok](https://ads.tiktok.com/business/creativecenter/quicktok/online/Understanding-humor-on-TikTok/pc/en) · [TikTok safe zone in pixels](https://cadenus.io/resources/blog/tiktok-safe-zone/)

## The three shorts, beat by beat

**1. Sydney (15 beats at 120.4 BPM)**
- **0:** "POV: you're 100% sure it's Sydney". Roviko wears sunglasses, hands on hips, and grooves on the beat.
- **3:** He taps Sydney. It fills red and shakes, the song tape-stops, and the camera punches in on his face. Hands on cheeks; the sunglasses slide down his nose; one sweat drop.
- **4.6:** Canberra turns green. "It's Canberra." / "Sydney is just the famous one."
- **6:** Deadpan stare into the camera, then a slow blink.
- **7:** The song comes back in. He pushes the shades back up, finger raised: "I knew that."
- **9:** End card: "Fewer Sydney moments. Every day."

**2. 23:58 (32 beats at 124 BPM)**
- **0:** Asleep in bed, z's rising.
- **1:** The alarm goes off: "Your 47-day streak ends at midnight!" His eyes snap open.
- **1.5:** He leaps out of bed and the blanket flies off. The phone grows off the nightstand and the lock screen floods into the app.
- **4–15:** Questions 17–19 of the Daily Detour at double speed: Pacific, Ottawa, Peru. The clock races and the "left" timer runs down.
- **18–21:** The song's break. 23:59:57, 58, 59, one tick per beat. He hesitates between Canada and the USA, biting his nails, then taps Canada.
- **22:** The drop: gold floods out of the flame chip and the streak flips from 47 to 48. "Saved. With 1 second left." He cheers, then collapses on his back.
- **24.5:** 00:00. "Your new Daily Detour is ready." His eyes twitch. "It's already tomorrow."
- **28:** End card: "5 minutes a day. Ideally before 23:58."

**3. Game night (54 beats at 120 BPM)**
- **0:** The group chat. Lucas: "I'm honestly elite at geography." Emma: "Prove it. Roviko, 8 pm." You: "Loser buys pizza." Lucas: "Easy money."
- **8:** The phone rises and 4 players join room K7QMA. Start.
- **12:** Round 1/10: Japan's flag. You, Emma and Amara pick Japan; Lucas locks in Bangladesh ("ez").
- **17:** Reveal: Japan is right, Bangladesh turns red, and Roviko laughs.
- **18.5:** "LUCAS." Lucas: "In my defence, it ALSO has a red circle."
- **22:** A "Spot the difference" card: Japan next to Bangladesh. "Lucas. It's green."
- **26:** Rounds 2–10 tick by and Lucas stays last. Final results: You 12,940, "4th of 4" for Lucas.
- **32.5:** "Rematch." "Pizza first." "Extra cheese, Lucas."
- **40:** "Lucas left the room", and the song dips.
- **45:** "Lucas joined the room." "Best of three." The song comes back.
- **48:** End card: "Game night for up to 12 friends."

## Facts on screen
- Canberra is the capital of Australia.
- The Pacific is the largest ocean. Ottawa is the capital of Canada. Machu Picchu is in Peru.
- Canada (9.98 million km²) is bigger than the USA (9.83 million km²).
- Japan's flag is a red disc on white (3:2). Bangladesh's flag is a red disc on bottle green (10:6), set slightly toward the hoist.
- Multiplayer rooms hold up to 12 players.
- All names are made up. There are no other brands, no store badges and no "ad-free" claims. The only call to action is roviko.app.

## QA
- Every frame of every master was scanned with the launch film's scanner (`build/qa.py`). 0 sudden jumps in all three.
- Short 1: 0 flagged frames.
- Shorts 2 and 3: every flagged frame was checked at full resolution with `qa_zoom.py`. They're genuine fast motion: the blanket flying off, the lock screen flooding into the app, players flying onto their answers.
- Two exits left stepped copies at 8 subframes: the 23:58 caption shrinking away and the "Spot the difference" card collapsing.
  - Both were slowed from 0.3 to 0.5 beats and re-rendered at 32 subframes.
  - They were spliced back into the masters losslessly, and the seams were checked by frame hash.
- Audio: every effect's peak lands on its cue (0.00 ms error), −14.0 LUFS integrated, true peak ≤ −1.2 dBTP (`audio/<short>/mix-report.json`).

## How it's built
| Step | File | What it does |
|---|---|---|
| Engine | `lib/core.js` | The launch film's springs, masks, pills, avatars and mascot, pulled out into one file. It adds new mascot expressions for the jokes: sunglasses that slide, deadpan, worried brows, sweat, shock eyes and running feet. It also has TikTok-style captions, the phone, a pointer, the end card and the safe zone |
| Shorts | `short-1-sydney.html`, `short-2-streak.html`, `short-3-gamenight.html` | Each is one seekable page: `window.seek(t)` draws the whole frame from `t` |
| Music | `build/music_cut.py` | Cuts each song to picture on beat lines. Every short plays at its song's measured tempo, so one film beat is one song beat. Includes the tape-stop in short 1 and a seamless 16-beat skip in short 3 (similarity 0.91) |
| Effects | `build/sfx.py` | The launch film's library plus error, chat, notification, room join/leave, clock tick, alarm (synthesised) and thud (synthesised) |
| Mix | `build/mix.py <short>` | The launch film's mixer: every effect's peak lands on its cue, balanced against the song, −14 LUFS / −1.2 dBTP |
| Render | `../roviko-launch-film/build/render.mjs` | 8 subframes per frame for motion blur, 32 on floods and fast moves |
| Export | `build/export.sh` | H.264 High, BT.709, 60 fps, AAC 320k |

```sh
# songs (not stored in the repo, Mixkit licence)
curl -L https://assets.mixkit.co/music/1140/1140.mp3 -o audio/music/mixkit-funkee-monkeee.mp3
curl -L https://assets.mixkit.co/music/1012/1012.mp3 -o audio/music/mixkit-take-this-higher.mp3
curl -L https://assets.mixkit.co/music/837/837.mp3 -o audio/music/mixkit-life-is-a-dream.mp3
for s in funkee-monkeee take-this-higher life-is-a-dream; do
  python3 ../roviko-launch-film/build/analyze_music.py audio/music/mixkit-$s.mp3 && mv audio/music/beatgrid.json audio/music/beatgrid-$s.json; done
python3 build/sfx.py
python3 build/music_cut.py sydney && node build/events.mjs short-1-sydney.html sydney && python3 build/mix.py sydney
node ../roviko-launch-film/build/render.mjs short-1-sydney.html out/master-1-sydney.mkv --dur 7.476 --w 1080 --h 1920 --fast 95-116,266-286
build/export.sh out/master-1-sydney.mkv audio/sydney/mix.wav out/roviko-short-1-sydney.mp4
# short 2: streak, --dur 15.483 --fast 43-100,636-654,810-828 ; short 3: gamenight, --dur 27.001 --fast 238-262,1438-1456
```

Open `short-2-streak.html?t=10` in a browser to see any single moment.

## Licences
- **Music:** "Funkee Monkeee", "Take this Higher" and "Life is a Dream" by Michael Ramir C., [Mixkit](https://mixkit.co/free-stock-music/), under the Mixkit Stock Music Free License (commercial use allowed).
- **Sound effects:** [uisfx](https://www.npmjs.com/package/uisfx) 0.4.0 (audio CC0 1.0). The coin, whoosh, impact, alarm and thud are synthesised.
- **Mascot, fonts, avatars and flags:** the same sources as the launch film (see its README).

## Flag a Day (30 videos)
`out/flag-a-day/flag-a-day-01.mp4` … `-30.mp4`: 7.3 s each, 1080×1920, one a day. Captions are in `FLAG-A-DAY-CAPTIONS.md`.

**Format: guess the flag in 3 seconds**
- **Frame 1 (the thumbnail):** the hook ("Guess the flag in 3 seconds"), the flag and the timer at 3, with a series pill ("FLAG A DAY · DAY 7") and a level pill (Easy / Medium / Hard / Trap).
- **3-2-1 on the beat:** the ring drains over 3 seconds while Roviko gets nervous and starts sweating.
- **Time's up:** the timer morphs into "Time's up!" just as the song hits its break (near silence, ticking clock). Roviko covers his eyes, then peeks.
- **The drop:** gold floods out of the flag. The flag flips over into the country's shape, filled with the flag, which ties into the "Guess the country" carousels. Then the name, a fact about the flag, and on trap days the look-alike ("Not Romania!"). Roviko cheers. "Got it? Comment your flag streak."
- **Sound:** the same song as short 2 ("Take this Higher"), so the series has one recognisable sound.

**Why it can get views**
- It's 7 seconds long, so people finish it and replay it.
- The answer comes in the comments during the 3 seconds.
- A daily streak brings people back.
- Trap days (Chad/Romania, Ireland/Ivory Coast, Indonesia/Monaco, Australia/New Zealand, Colombia/Ecuador, Norway/Iceland, Slovakia/Slovenia) start "team A or team B" debates.
- The difficulty varies, so nobody drops out.

**Build:** `data/flagaday.js` (30 days, facts checked), `flag-a-day.html?day=N`, `build/flagaday.sh [first] [last]` (sound cues → mix → render → MP4 per day). The country shapes come from `../roviko-carousels/data/geo.js`, and the flags are the app's own.
