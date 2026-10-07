# Roviko shorts (TikTok / Instagram Reels)

The first three vertical 1080×1920 videos at 60 fps, each with a different joke and a different song.
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
- **Music:** "Funkee Monkeee", "Take this Higher" and "Life is a Dream" by Michael Ramir C., [Mixkit](https://mixkit.co/free-stock-music/), under the Mixkit Stock Music Free License (commercial use allowed). Shorts 6 and 8 use "Aerobic Fashion" by Arulo, also from Mixkit under the same licence.
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

## Funny shorts 4–10 (one a week's worth)
Seven more vertical 1080×1920 videos at 60 fps, one funny short per day next to Flag a Day and the "Guess the country" carousel. Captions, pinned comments and hashtags are in `FUNNY-SHORTS-CAPTIONS.md`.

| | File | Length | Hook | Song |
|---|---|---|---|---|
| 4 | `out/roviko-short-4-greenland.mp4` | 15.0 s | "POV: you find out how big Greenland really is" | "Life is a Dream" |
| 5 | `out/roviko-short-5-wronganswers.mp4` | 14.0 s | "Wrong answers only: capital of Brazil?" | "Funkee Monkeee" |
| 6 | `out/roviko-short-6-austria.mp4` | 14.2 s | "POV: you tell your friend you're going to Austria" | "Aerobic Fashion" |
| 7 | `out/roviko-short-7-stages.mp4` | 16.9 s | "The 5 stages of a Legend-level question" | "Funkee Monkeee" |
| 8 | `out/roviko-short-8-moon.mp4` | 13.1 s | "A fact that sounds fake: Australia is wider than the Moon" | "Aerobic Fashion" |
| 9 | `out/roviko-short-9-lobby.mp4` | 20.0 s | "Every Roviko lobby has these 5 players" | "Life is a Dream" |
| 10 | `out/roviko-short-10-uk.mp4` | 15.0 s | "England, Britain, the UK… explained in 10 seconds" | "Funkee Monkeee" |

**Built for engagement.** Every short ends on a question that is easy to answer in one comment:
- which country to shrink next;
- wrong answers only;
- tag a friend;
- pick your stage or player number;
- drop a fake-sounding fact;
- explain Holland vs the Netherlands.

The formats are ones that keep doing well on TikTok and Reels: the true-size map reveal, "wrong answers only", the "5 stages" meme, "every group has these 5 people", a fact that sounds fake, and an explainer that ends on a confused mascot. Every short is 13–20 s long, so people watch to the end and replay.

**How they work.**
- **Short 4:** Greenland slides from the Mercator pole to the equator on a turning globe and shrinks to its true size next to Africa.
- **Short 6:** the map flies 15,900 km along the great circle from Vienna to Australia.
- **Short 8:** two bars: Australia about 4,000 km wide, the Moon 3,475 km across.
- **Short 10:** Great Britain and the United Kingdom are drawn as frames around the four nations, with Ireland outside both.

**Build:**
- `build/funny7.sh [name …]`: sound cues, mix, render and MP4 per short.
- `build/patch.sh <name> <file> <dur> A B`: re-renders frames A–B at 32 subframes and splices them into the master losslessly.
- The music cuts are the `greenland`, `wronganswers`, `austria`, `stages`, `moon`, `lobby` and `uk` entries in `build/music_cut.py`.

**QA:**
- Every master was scanned with `build/qa.py`, and every flagged frame was zoomed.
- Fast exits (captions, bubbles, cards), the map zoom and flight in short 6, and the end-card wipes were re-rendered at 32 subframes and spliced back.
- In short 6, Australia used to turn green in a single frame. It now floods green from the landing kangaroo.
- Short 9's cards now collapse into the end card over 0.6 beats instead of 0.3.

**Facts:** see the bottom of `FUNNY-SHORTS-CAPTIONS.md`. Short 8 was first going to be "Russia is bigger than Pluto". It was replaced because, with New Horizons' radius of 1,188 km, Pluto's surface (about 17.7 million km²) is larger than Russia (17.1 million km²).

## "Sounds fake, but it's true" (5 fun-fact videos)
`out/fun-facts/fun-fact-1.mp4` … `-5.mp4`: 19.6 s each, 1080×1920, 60 fps. Each one is a country fact played as a quiz. Captions, pinned comments, hashtags, the bio and the research are in `FUN-FACTS-CAPTIONS.md`.

| # | Question | Answer | Bonus |
|---|---|---|---|
| 1 | France's longest land border is with which country? | Brazil (French Guiana, 730 km) | France also borders the Netherlands (Saint Martin) |
| 2 | Which country has the most pyramids? | Sudan (200+ vs Egypt ~120) | Sudan's pyramids are steeper (~70° vs 52°) |
| 3 | Which country has zero permanent rivers? | Saudi Arabia | It makes drinking water from the sea |
| 4 | Which country has more lakes than the rest of the world combined? | Canada (~880,000, 62%) | The world's longest coastline |
| 5 | Which country needs to cross 2 borders to reach the sea? | Liechtenstein (and Uzbekistan) | No airport |

**Format.** Frame 1 shows the hook, the question and A/B/C. It is also the thumbnail.
- **The open loop:** the pill "BONUS FACT AT THE END 👀" is on screen from frame 1.
- **Countdown:** "Comment A, B or C" with a 3-2-1 timer.
- **Knock-outs:** "Time's up" lands on the song's break, then the wrong answers are knocked out one by one, the tempting one last.
- **Reveal:** the answer floods green on the drop ("WHAT?! 🤯"), and the fact is shown on a map.
- **Ending:** the bonus fact, then "Got it right? ✅ or ❌", then the end card.

**Build:**
- `data/funfacts.js`: the 5 facts.
- `fun-fact.html?n=N`: a shared quiz with one map explainer per fact. The map comes from `../roviko-carousels/data/geo.js`, plus French Guiana from Natural Earth 1:110m.
- `build/funfacts.sh [first] [last]`: sound cues, mix, render and MP4.
- Music: "Aerobic Fashion" from song beat 50 (the `funfact` entry in `build/music_cut.py`).

## Real-app films (5) for roviko.app 1.24
`viral.html?v=1..5`, built from `src/viral.js`: a big phone with real screens of roviko.app 1.24 (`screens/`, captured from a local copy of the site at 390x844 with local test data only, never the live database), a pointer that taps, circle wipes between screens, punch-ins, Roviko reacting next to the phone, and the end card. `build/viral.sh` builds `out/viral/roviko-real-1.mp4` … `-5.mp4`. Captions: `social/daily-posts/viral.py`.

| | Film | Screens |
|---|---|---|
| 1 | "This site makes you better at geography in 5 min a day" | home, flags, Next Door + continent map, Rank Radar, Side by Side, multiplayer, streak |
| 2 | "POV: you get it wrong… and it shows you exactly where" | Next Door (Bolivia), the continent map |
| 3 | "Guess the flag before I do (I'm bad at this)" | four flag questions, Roviko gets 1/4 |
| 4 | "Game night idea: a geography battle" | room, round, reveal with avatars, podium |
| 5 | "Where does Austria rank highest? I said forest. #52." | Rank Radar |
