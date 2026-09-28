# Roviko launch film (motion studio)

A 15-second launch film for roviko.app, 1920×1080 and 1080×1920 at 60 fps. It's one continuous take at 130 BPM, with Roviko the globe as the hero.
The timeline, beat by beat, is in [`BEATMAP.md`](BEATMAP.md).

- `out/roviko-launch-16x9.mp4`: landscape, 1920×1080 at 60 fps, H.264 + AAC 320k, −14.0 LUFS integrated, −1.2 dBTP
- `out/roviko-launch-9x16.mp4`: vertical cut for Reels, 1080×1920, with its own camera keys so the phone and text stay centred
- `out/final-stills/`, `out/contact-sheet-*.png`: frames taken from the finished masters
- `out/checkpoint/`: the four stills approved before the full render
- `out/qa-16x9/`, `out/qa-9x16/`: glitch-scan reports, a frame-change plot, and filmstrips of every fast moment

## QA results

- Both masters: 900 frames at 60 fps, 15.000 s. 0 sudden jumps.
- Single-frame pops: the scanner compares each frame with the average of its neighbours after a blur, per block. Every frame it still flags was checked by eye at full resolution with the frames around it (`build/qa_zoom.py`). All of them are genuine fast motion (the "+50" chips flying into the counter, the map zoom, the leaderboard swap), not glitches.
- Glitches found and fixed along the way: the flag and the answer pills appearing at full size (now grow from a dot); the button label vanishing a few frames early; ghost bands on fast edges (slower pointer, pull-back and wordmark; 32 subframes on the six fastest moments); the vertical push into the button reduced from 5× to 3.6×.
- Audio: every effect's measured peak lands on its cue with 0.00 ms error (`audio/mix-report.json`).

## How it's built

| Step | File | What it does |
|---|---|---|
| Film | `film.html` | One seekable HTML file. `window.seek(t)` computes the whole frame from `t`, with no CSS transitions, timers or state between frames. A single camera transform keyed `[beat, zoom, x, y]` uses eased segments and log-space zoom. Closed-form springs drive every pop and settle. The mascot is redrawn in SVG with a face, arms and legs. `?format=vertical` switches to 9:16 |
| Music | `build/music.py` | "Small Trip", an original 130 BPM score in C major, synthesised in numpy (no samples, so royalty-free). The drop lands on beat 12 |
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
python3 build/music.py && python3 build/analyze_music.py audio/music/small-trip-130.wav
python3 build/sfx.py && node build/events.mjs && python3 build/mix.py
FAST=166-216,331-362,432-462,588-628,714-736,774-826   # frames that get 32 subframes
node build/render.mjs film.html out/master-16x9.mkv --dur 15 --fast $FAST --fastsub 32
node build/render.mjs film.html out/master-9x16.mkv --dur 15 --w 1080 --h 1920 --query format=vertical --fast $FAST --fastsub 32
python3 build/qa.py out/master-16x9.mkv out/qa-16x9
build/export.sh out/master-16x9.mkv out/roviko-launch-16x9.mp4
node build/render.mjs film.html out/stills --stills 1.5,7.1,9.1,14.45    # quick stills, no blur
```

Open `film.html?t=5.6` in a browser to look at any single moment.

## Sources and licences

- **Mascot**: Roviko's own vector globe (`assets/roviko-globe.svg`, from `social/roviko-posts`). The face is redrawn from its geometry so it can blink and change mood. The arms and legs are new.
- **Fonts**: Fredoka and Manrope (SIL OFL 1.1), the same self-hosted files as roviko.app.
- **Flags**: `svg-country-flags` 1.2.10 (public domain, from Wikimedia), used for their real aspect ratios: Portugal 3:2, Australia 2:1, Japan 3:2. The flag-icons files the site uses are redrawn at 4:3.
- **Map**: roviko.app's own world map (`roviko/public/data/world-map.json`, Natural Earth 1:110m via world-atlas). One fix in `assets/map.js`: two pieces of Russia's Far East ring are joined, so the fill doesn't close with a straight line across the Sea of Okhotsk. The source file on the site has the same seam.
- **Music**: original score, `build/music.py`.
- **Sound effects**: [uisfx](https://www.npmjs.com/package/uisfx) 0.4.0, audio CC0 1.0 (mostly the "soft" pack; `peaks.json` names each file's pack and cue). The coin tick (tuned to the score), the whoosh and the drop impact are synthesised in `build/sfx.py`. Mixkit was the first choice but mixkit.co isn't reachable from the build environment. Any Mixkit track or effect can be dropped in: the analysis and mixer work on any file.

## Content rules followed

- The geography facts are checked against `roviko/public/data/countries.json` (see `BEATMAP.md`).
- Player names are made up (Lucas, Amara, Emma, Yuki).
- The only call to action is roviko.app. There are no store badges and no "ad-free" claims.
