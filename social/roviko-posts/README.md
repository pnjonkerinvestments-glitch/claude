# Roviko social posts: first 9

Visuals for the first nine Roviko posts. They are built from the brand kit (`Roviko-visuals.zip`) and the styling of roviko.app.

- Overview of all slides: `overview.png`.
- Format: **1080 × 1350 px (4:5)**, PNG, no metadata. Carousels are numbered `01.png`, `02.png`, and so on, in posting order.
- Style: cream `#F6F3E9`, forest green `#163B32`, Roviko green `#1F806B`, mint `#DDEDE6`, gold `#F6B84B`. Fredoka for headings, Manrope for body text. The globe mascot uses the site's own moods (`Mascot.tsx`).
- Art: the illustrations come from the zip (`assets/art/`). The mascot is the vector logo (`assets/roviko-globe.svg`), so it stays sharp at any size. Country shapes come from `roviko/public/data/silhouettes.json`, the same data the site uses.

## Regenerating

```sh
cd social/roviko-posts
python3 build/data.py                   # optional: re-reads shapes and icons from roviko/
python3 build/slides.py                 # writes build/slides.html
node build/render.mjs                   # all slides -> PNG (needs Playwright + Chromium)
node build/render.mjs post-04           # only one post
```

To change text or layout, edit `build/slides.py`. Each post has its own function (`post1()` to `post9()`).

---

## POST 1: Meet Roviko
`post-01-meet-roviko/01.png` (single image)

**Caption**
> Meet Roviko. 🌍
>
> A free daily geography game with flags, capitals, maps and a little trip around the world.
>
> A few curious minutes. Every day.
>
> Play at roviko.app
>
> #geography #geographyquiz #dailypuzzle #roviko

**Alt text:** Illustration of the smiling Roviko globe mascot on a warm cream background with the words "A small geography trip. Every day."

## POST 2: Meet the Daily Detour
`post-02-daily-detour/01-04.png`

**Caption**
> One Detour. Twenty questions. 🌍
>
> Flags, capitals, maps, neighbours and sizes — mixed into one daily trip.
>
> No rush. Just see where the world takes you.
>
> #geography #geographyquiz #dailypuzzle #roviko

**Alt text:** Four-slide carousel introducing Roviko's Daily Detour, a daily set of 20 mixed geography questions.

Checked against `roviko/GAME_RULES.md`: 20 questions (flags, capitals, map, borders, area order). No question from any specific day appears.

## POST 3: Guess the flag
`post-03-guess-the-flag/01.png` (single image)

**Caption**
> Three colours. One country. 🌍
>
> Where are we?
>
> Guess it in the comments ↓
>
> Answer tomorrow.
>
> #flags #geographyquiz #geography #roviko

**Reply after 24 hours:** 🇪🇪 Estonia.

**Alt text:** A horizontal flag with three equal bands of blue, black and white, presented as a country guessing game.

The flag uses the official 7:11 proportions and blue PMS 285C (`#0072CE`). The file name and image contain no country name.

## POST 4: Which has more people?
`post-04-canada-or-australia/01-05.png`

**Caption**
> Big countries. Different populations.
>
> Canada or Australia — what was your first guess?
>
> Population, 2024.
> Source: World Bank, World Development Indicators.
>
> #geography #geographyquiz #worldfacts #roviko

**Alt text:** Carousel asking whether Canada or Australia has the larger population, followed by 2024 World Bank population figures.

Figures (World Bank WDI, SP.POP.TOTL, 2024): Canada 41,288,599 (41.3 million), Australia about 27.2 million. The bars share a zero baseline, so their lengths are to scale. ⚠️ These are the figures from the brief. **Check them once more on data.worldbank.org before posting** (the build environment could not reach the World Bank).

## POST 5: Meet Rank Radar
`post-05-rank-radar/01-04.png`

> ⚠️ **Copy changed.** The brief describes Rank Radar as "put the countries in the right order". That is **not** how the game works; that game is Size Shuffle. According to `GAME_RULES.md` and How to Play, in Rank Radar you get one country and four subjects, and you tap the subject where that country ranks highest in the world (gold, silver, bronze). The slides therefore say:
> 1. Think you know where a country ranks? 📡
> 2. Meet Rank Radar.
> 3. One country. Four subjects.
> 4. Tap where it ranks highest. Then see how close your radar was.
>
> The example subjects (population, forest, coastline, area) are generic. No country or live puzzle is shown.

**Caption (adjusted to match the game)**
> Some geography questions have one answer.
>
> Rank Radar asks something trickier: where does this country rank highest in the world? 📡🌍
>
> Population? Forest? Coastline? Trust your radar.
>
> #geography #geographygame #dailypuzzle #roviko

**Alt text:** Roviko illustration for Rank Radar, a geography game about finding the subject where a country ranks highest in the world.

## POST 6: Fact of the day (Lesotho)
`post-06-country-inside-a-country/01-03.png`

**Caption**
> Geography has some lovely little surprises.
>
> Lesotho is completely surrounded by South Africa.
>
> That makes tomorrow's mental map just a little sharper. 🌍
>
> Source: South African Government, accessed 2026.
>
> #geography #worldfacts #learngeography #roviko

**Alt text:** Simple illustrated map showing Lesotho enclosed by South Africa.

The map on slide 2 is drawn from Roviko's own country shapes (`roviko/public/shapes/ZAF` and `LSO`) and is marked "Simplified illustration, not to scale".

## POST 7: Meet Country Mosaic
`post-07-country-mosaic/01-04.png`

**Caption**
> One country. A few pieces of information.
>
> Country Mosaic is about spotting the pattern before the whole picture feels obvious. 🧩🌍
>
> #geographygame #geographyquiz #dailypuzzle #roviko

**Alt text:** Roviko Country Mosaic illustration with rounded information tiles forming clues about a mystery country.

The tiles are deliberately abstract: a made-up tricolour, a blob instead of a real outline, and "?,??? m" instead of a real value. Nothing is taken from a live Mosaic.

## POST 8: Guess the country
`post-08-guess-the-country/shape-a.png`, `shape-b.png`, `shape-c.png` (choose **one**)

There are three versions, so you can pick a shape that **is not an answer in that day's Daily Detour**:

| File | Country (answer) |
|---|---|
| `shape-a.png` | Iceland 🇮🇸 |
| `shape-b.png` | Italy 🇮🇹 |
| `shape-c.png` | Madagascar 🇲🇬 |

**Caption**
> No flag. No capital. Just the shape.
>
> Where are we? 🌍
>
> Guess it in the comments.
>
> Answer tomorrow.
>
> #geography #mapquiz #geographyquiz #roviko

**Alt text:** Dark green silhouette of a country on a cream background in a geography guessing game.

To add another country: put its ISO3 code in `KEEP` in `build/data.py`, run `python3 build/data.py`, and add `post8('<ISO3>', '<letter>')` to `build/slides.py`.

## POST 9: Geography is better together
`post-09-better-together/01-04.png`

**Caption**
> A little geography rivalry?
>
> Play Roviko with friends, a random player or the computer. 🌍
>
> Just for fun.
>
> roviko.app
>
> #geography #quizgame #multiplayer #roviko

**Alt text:** Roviko multiplayer illustration showing ways to play geography games with friends, another player or the computer.

Slide 2 says "2 to 12 players", taken from the site's How to Play. Slide 3 shows the Quick match. Slide 4 shows the World Duel illustration.

---

# Instagram Stories for Highlights

Folder `stories/`: 28 stories at **1080 × 1920 (9:16)**, split over six Highlights, plus a cover per Highlight. Overview: `stories/overview.png`.

All text sits between y=250 and y=1600, so Instagram's own header and reply bar never cover it. Places marked "↓" are empty on purpose, for an Instagram sticker.

Regenerate: `python3 build/stories.py && node build/render.mjs stories/`.

| Highlight | Cover | Stories | Contents |
|---|---|---|---|
| **Start** | `covers/1-start.png` | `1-start/01-04` | Hi, I'm Roviko · six games, new every day · no timer · link to roviko.app |
| **Games** | `covers/2-games.png` | `2-games/01-07` | Today's trip (six stops) + one story per daily game, in the site's order: Daily Detour, Rank Radar, World Duel, Side by Side, Country Mosaic, Clue Trail |
| **Quiz** | `covers/3-quiz.png` | `3-quiz/01-06` | Three question + answer pairs: flag (Estonia), Canada or Australia, shape (Chile) |
| **Facts** | `covers/4-facts.png` | `4-facts/01-03` | Lesotho inside South Africa (question + map), Canada vs Australia population |
| **Explore** | `covers/5-explore.png` | `5-explore/01-03` | 195 countries · browse by region (with country counts) · link |
| **Friends** | `covers/6-friends.png` | `6-friends/01-05` | Better together · rooms with friends · quick match · against the computer · link |

**Stickers to add when posting**
- Link sticker (roviko.app) on `1-start/04`, `3-quiz/06`, `5-explore/03`, `6-friends/05`, under "Tap the link ↓" or the pill.
- Quiz sticker on `3-quiz/01` (Estonia / Latvia / Austria / Lithuania, for example) and `3-quiz/05` (Chile / Argentina / Peru / Norway, for example), under "Your guess ↓".
- Poll sticker on `3-quiz/03` (Canada / Australia), under "Vote ↓".
- Post the answer story right after the question story, or the next day.

**Covers:** when you add a Highlight, pick "Edit cover" and choose the matching `covers/*.png`. Instagram crops it to the centred circle.

**Checked against the site:** the six daily games, the How to Play steps, "up to 1,000 points per game", no timer in solo play, 2 to 12 players per room, computer at three levels without ranking points (`MULTIPLAYER.md`), and 195 countries with their region counts (`public/data/countries.json`). The Estonia and Chile answers also appear in the stories, so avoid posting the feed version of post 3 on the same day. The same goes for post 8 if it uses the same shape.
