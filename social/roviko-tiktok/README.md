# Roviko TikTok films (tt.html?v=1..5)

Five vertical films (1080x1920, 60 fps) that show the real roviko.app 1.31 screens in a phone, with Roviko reacting next to it.
No emoji anywhere in the films (captions, bubbles, the fake scroll feed), on purpose: it keeps the look clean.
Post texts, hashtags and pinned comments: `TIKTOK-TEKSTEN.md`.

| # | Idea | Song (Mixkit, free licence) |
|---|------|------|
| 1 | Doomscroll: "You scrolled for 3 hours today. Name ONE thing you learned" | Take This Higher |
| 2 | Rage bait: "Put these in order by size" (China beats the USA) | Funkee Monkeee |
| 3 | One wrong answer and it's over (Side by Side, the run ends at number 7) | Life Is a Dream |
| 4 | Day 1 vs day 30 of Roviko instead of scrolling | Aerobic Fashion |
| 5 | Play along: guess the country before clue 4 (Clue Trail) | Funkee Monkeee |

## How to build

The film engine (`lib/core.js`, `lib/extras.js`, `build/*.py`, `build/events.mjs`, `build/export.sh`) and the render
tool (`roviko-launch-film/build/render.mjs`) live in `social/roviko-shorts` on branch `claude/bold-maxwell-1hf6d2`.
Copy `src/tt.js` and `build/tt.sh` into that folder, put the screen captures in `screens131/` (Side by Side screens as `sbs-*.jpg`), add the `tt-1`..`tt-5`
entries to `build/music_cut.py` (see below) and run `build/tt.sh` (or `build/tt.sh 2` for one film).

```python
'tt-1': dict(song='take-this-higher', end=36, fade=1.0, pieces=[(0, 38, None)]),
'tt-2': dict(song='funkee-monkeee', end=29, fade=1.0, pieces=[(0, 48, None)]),
'tt-3': dict(song='life-is-a-dream', end=36, fade=1.0, pieces=[(0, 48, None)]),
'tt-4': dict(song='aerobic-fashion', end=31, fade=1.0, pieces=[(0, 31, None)]),
'tt-5': dict(song='funkee-monkeee', end=29, fade=1.0, pieces=[(0, 16, None)]),
```

The screens were captured from a local copy of the site with local test accounts and test scores only (the
"#3 of 413" ranking is test data). The live database was never touched. The MP4s are not in git (too big).
