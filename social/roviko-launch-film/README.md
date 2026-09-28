# Roviko launch film (motion studio)

A 36.5-second launch film for roviko.app, 1920×1080 and 1080×1920 at 60 fps. It's one continuous take at 110 BPM, with Roviko the globe as the hero.
- v2 played everything at 85% of v1's speed, gave the Detour questions more room, and added a multiplayer scene. It uses visuals from the Roviko brand kit.
- v3 keeps v2's first half and gives everything after the streak more time.
- v3 also explains multiplayer fully:
  - the host picks the rounds and the difficulty while 12 players join;
  - everyone answers the same question;
  - a live leaderboard runs through all 10 rounds;
  - a podium ends the match.
- v3 has new music: "Aerobic Fashion" (Mixkit), pop-house.
The timeline, beat by beat, is in [`BEATMAP.md`](BEATMAP.md).

- `out/roviko-launch-16x9.mp4`: landscape, 36.5 s, 1920×1080 at 60 fps, H.264 + AAC 320k, −14.0 LUFS integrated, −1.2 dBTP
- `out/roviko-launch-9x16.mp4`: vertical cut for Reels, 1080×1920, with its own camera keys so the phone and text stay centred. The multiplayer explanation lives inside the phone (host settings, "ROUND n/10 · MEDIUM", "Live leaderboard", "Final results"); the 16:9 cut adds a three-step headline beside the phone
- `out/final-stills/`, `out/contact-sheet-*.png`: frames taken from the finished masters
- `out/checkpoint/`: the four stills approved before the full render
- `out/qa-16x9/`, `out/qa-9x16/`: glitch-scan reports, a frame-change plot, and filmstrips of every fast moment

## QA results

- Both masters: 1,538 frames at 60 fps, 25.64 s. 0 sudden jumps.
- Single-frame pops: the scanner compares each frame with the average of its neighbours after a blur, per block. Every frame it still flags was checked by eye at full resolution with the frames around it (`build/qa_zoom.py`). All of them are genuine fast motion (the "+50" chips flying into the counter, the map zoom, the leaderboard swap), not glitches.
- Glitches found and fixed along the way: the flag and the answer pills appearing at full size (now grow from a dot); the button label vanishing a few frames early; ghost bands on fast edges (slower pointer, pull-back and wordmark; 32 subframes on the six fastest moments); the vertical push into the button reduced from 5× to 3.6×.
- Audio: every effect's measured peak lands on its cue with 0.00 ms error (`audio/mix-report.json`).

## How it's built

| Step | File | What it does |
|---|---|---|
| Film | `film.html` | One seekable HTML file. `window.seek(t)` computes the whole frame from `t`, with no CSS transitions, timers or state between frames. A single camera transform keyed `[beat, zoom, x, y]` uses eased segments and log-space zoom. Closed-form springs drive every pop and settle. The mascot is redrawn in SVG with a face, arms and legs. `?format=vertical` switches to 9:16 |
| Music | `build/music_edit.py` | Cuts "Aerobic Fashion" (Mixkit) to picture on bar lines. The song's one-bar break falls under Q4–Q5 and its drop on film beat 16. Four identical chorus bars are skipped, so the chorus stops under the end card (beat 62) and the breakdown starts on Roviko's hop (beat 64). (`build/music.py` is v1's original synthesised score, kept for reference) |
| Analysis | `build/analyze_music.py` | Blind tempo, beat grid and drop detection, written to `audio/music/beatgrid.json` |
| Effects | `build/sfx.py` | Builds `audio/sfx/*.wav` and measures each effect's peak into `audio/sfx/peaks.json` |
| Events | `build/events.mjs` | Exports the film's own sound cues (`window.EVENTS`) to `audio/events.json` |
| Mix | `build/mix.py` | Places each effect so its peak lands on its cue and balances it against the music under it. Then normalises to −14 LUFS with a −1 dBTP true-peak ceiling |
| Render | `build/render.mjs` | Playwright + Chromium renders 8 subframes per frame over a 180° shutter. ffmpeg `tmix` blends them (motion blur) into a lossless FFV1 master. The six fastest moments get 32 subframes (the pull-back, both floods, the gold-to-flame shrink, the button-to-page growth and the map reveal), because their edges move over 100 px per frame and 8 samples leave visible bands there. Moves that could be slowed were slowed instead. A pool of four workers, each with its own browser, renders short work units |
| QA | `build/qa.py` | Scans every frame for single-frame pops and sudden jumps, and writes filmstrips of every fast moment |
| Export | `build/export.sh` | Encodes the master and the mix to MP4 (BT.709) |

```sh
npm install                      # playwright 1.56.1 (uses the preinstalled Chromium), uisfx
pip install numpy scipy matplotlib
curl -L https://assets.mixkit.co/music/327/327.mp3 -o audio/music/mixkit-aerobic-fashion.mp3   # not stored in the repo (Mixkit licence)
python3 build/analyze_music.py audio/music/mixkit-aerobic-fashion.mp3 && python3 build/music_edit.py
python3 build/sfx.py && node build/events.mjs && python3 build/mix.py
FAST=196-256,520-557,644-675,914-940,1088-1110,1405-1430,1525-1578,1728-1750,1823-1882   # frames that get 32 subframes
node build/render.mjs film.html out/master-16x9.mkv --dur 36.545 --fast $FAST --fastsub 32
node build/render.mjs film.html out/master-9x16.mkv --dur 36.545 --w 1080 --h 1920 --query format=vertical --fast $FAST --fastsub 32
python3 build/qa.py out/master-16x9.mkv out/qa-16x9
build/export.sh out/master-16x9.mkv out/roviko-launch-16x9.mp4
node build/render.mjs film.html out/stills --stills 1.5,10.4,17.3,22.0,24.3,32.1    # quick stills, no blur
```

Open `film.html?t=5.6` in a browser to look at any single moment.

## Sources and licences

- **Mascot**: Roviko's own vector globe (`assets/roviko-globe.svg`, from `social/roviko-posts`). The face is redrawn from its geometry so it can blink and change mood. The arms and legs are new.
- **Fonts**: Fredoka and Manrope (SIL OFL 1.1), the same self-hosted files as roviko.app.
- **Flags**: `svg-country-flags` 1.2.10 (public domain, from Wikimedia), used for their real aspect ratios: Portugal 3:2, Australia 2:1, Japan 3:2. The flag-icons files the site uses are redrawn at 4:3.
- **Map**: roviko.app's own world map (`roviko/public/data/world-map.json`, Natural Earth 1:110m via world-atlas). One fix in `assets/map.js`: two pieces of Russia's Far East ring are joined, so the fill doesn't close with a straight line across the Sea of Okhotsk. The source file on the site has the same seam.
- **Music**: "Aerobic Fashion" by Arulo, [Mixkit](https://mixkit.co/free-stock-music/), under the Mixkit Stock Music Free License (commercial use allowed), 110.0 BPM. v1 used an original score (`build/music.py`); v2 used "Swings and Slides" (Mixkit).
- **Brand-kit visuals** (Roviko-visuals.zip, Roviko's own artwork): the five illustrated globe players in `assets/avatars/`, cut from `friends-row.png`, on the leaderboard and in multiplayer, and `assets/art/lobby-create.png` as the lounge banner.
- **Sound effects**: [uisfx](https://www.npmjs.com/package/uisfx) 0.4.0, audio CC0 1.0 (mostly the "soft" pack; `peaks.json` names each file's pack and cue). The coin tick (tuned to the score), the whoosh and the drop impact are synthesised in `build/sfx.py`. (v1 was built while mixkit.co was still blocked; the music is Mixkit from v2.)

## Content rules followed

- The geography facts are checked against `roviko/public/data/countries.json` (see `BEATMAP.md`).
- Player names are made up (Lucas, Amara, Emma, Yuki, Mateo, Sofia, Kenji, Lina, Omar, Zoe, Noah).
- The only call to action is roviko.app. There are no store badges and no "ad-free" claims.
