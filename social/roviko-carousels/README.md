# Roviko map challenge carousels

Five "Guess the country" photo carousels for TikTok and Instagram, in Roviko style: brand colours, Fredoka/Manrope, and the globe mascot.
Each post has 12 slides:
- **Cover:** a hook and five "?" tiles, one per level (Easy → Legend).
- **Five question/answer pairs:** a country highlighted on a borderless map, then its name, flag and a fact.
- **Score slide:** "Comment your score below", plus the next challenge.

| Post | Region | Easy → Legend |
|---|---|---|
| 1 | Europe | Portugal, Poland, Hungary, Latvia, Moldova |
| 2 | Africa | Egypt, Madagascar, Nigeria, Zambia, Burkina Faso |
| 3 | Asia | Japan, Vietnam, Kazakhstan, Laos, Kyrgyzstan |
| 4 | The Americas | Chile, Peru, Paraguay, Guyana, Belize |
| 5 | Around the world | Norway, Mongolia, Namibia, Uruguay, Tajikistan |

## What makes people swipe
- **Levels:** every question has a level pill and progress dots, and the answer slide says "Next one's harder →".
- **Hints:** the hard questions get a hint, so nobody gives up halfway.
- **Answers one swipe later:** the answer always sits on the next slide.
- **Comments:** the score ladder (5/5 Geography legend … 0 Still packing) invites people to comment their score.
- **Series:** "Next: map challenge #2" makes it a series worth following.

## Formats
- `out/post-N/tiktok/01..12.png`: 1080×1920 (TikTok photo mode).
- `out/post-N/instagram/01..12.png`: 1080×1350 (Instagram 4:5), the band y 285–1635 of the same slide.
- All text sits in y 300–1440, inside both the Instagram crop and TikTok's overlay-free area.

## How it's built
```sh
python3 build/geo.py            # data/geo.js: roviko.app's own country outlines in lon/lat, gaps filled from the 1:110m map
node build/shots.mjs            # renders every slide of every post (or: node build/shots.mjs 3)
```
- `carousel.html?post=3&slide=4` draws one slide.
- The map uses a Lambert azimuthal equal-area projection centred on each country, so shapes aren't stretched the way a flat world map stretches them.

## Facts and sources
- Capitals, neighbours and areas are checked against `roviko/public/data/countries.json` (mledoze/countries, ODbL).
- Outlines: Natural Earth via world-atlas (public domain).
- Flags: flag-icons (MIT), the same files the app uses.
- Captions and hashtags: `CAPTIONS.md`.
