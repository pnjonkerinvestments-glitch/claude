# Roviko contentweek 2 · ma 26 okt – zo 1 nov 2026

5 posts per dag, 35 in totaal. Per dag één zip met alle posts, banners en captions.

## Wat de vorige week ons leerde (TikTok @playroviko, weergaven per post)

| Post | Weergaven | Wat het was |
|---|---|---|
| Monaco, Indonesia or Poland? Name all 3 | **10.3K** | carrousel: drie bijna-gelijke vlaggen, antwoorden met uitleg, een feit, "welke tweeling hierna?" |
| Number 4. Trust me. (vind Laos) | 957 | kaart met genummerde punten, Roviko zit ernaast |
| One is Romania, one is Chad | 924 | vlaggen-tweeling als reel |
| Quick. Which one is Ireland? | 849 | vlaggen-tweeling als reel |
| Haunted house of geography | 797 | Halloween-feiten |
| Bhutan, Morocco (3 hints) | 774–784 | land raden met feiten |
| Map challenges #22–25 | 451–719 | 12 slides |
| POV-chat, You vs Roviko, Not a capital, Swipe to zoom out, Chile | 319–435 | de "domme" posts |

Conclusie: **vlaggen die op elkaar lijken** en **echte feitjes** werken. Losse grapjes, chats en te makkelijke quizzen werken niet.

## Wat er verandert

1. **Elke dag een vlaggen-tweeling-carrousel (P1)**, precies opgebouwd als de 10.3K-post: grote kop "X, Y or Z? Name all 3", grote vlaggen in witte kaarten, dan *how to tell*, een vergrootglas op het detail, één verrassend feit en "welke tweeling hierna?" (reacties).
2. **Elke cover en banner in die stijl**: logo + serie-label, grote tweekleurige kop links, grote kaarten. Het eerste frame van elke reel ís de cover, dus ook in het profielraster leesbaar.
3. **Meer feiten**: elke reel eindigt met een *Did you know*, elke kaartchallenge heeft een feit per antwoord.
4. **Weg**: POV-chats, duels tegen Roviko, "not a capital", "zoom out".
5. **Captions**: één tekst per post, alleen **#fyp**. Kopiëren, plakken, klaar.

## Het schema

| Dag | P1 Flag twins (carrousel, 19:00) | P2 Map challenge (12 slides, 15:00) | P3 Flag twins reel (12:30) | P4 3 facts reel (08:00) | P5 Map facts (21:00) |
|---|---|---|---|---|---|
| ma 26 | Romania, Andorra, Chad, Moldova (4) | #28 Europe | Haiti vs Liechtenstein | South Africa | Vind Uruguay |
| di 27 | Ivory Coast, Italy, Ireland | #29 Africa | Bahrain vs Qatar | Japan | France vs Madagascar (maps lie) |
| wo 28 | Venezuela, Colombia, Ecuador | #30 Asia | Nicaragua vs Honduras | Kazakhstan | Vind Malawi |
| do 29 | Iceland, Denmark, Norway | #31 The Americas | Türkiye vs Tunisia | Italy | UK vs Ecuador (maps lie) |
| vr 30 | Luxembourg, Paraguay, Netherlands | #32 Islands only | Senegal vs Cameroon | Brazil | Vind Austria |
| za 31 🎃 | Slovakia, Russia, Slovenia | #33 Europe | Lithuania vs Bolivia | Romania (Halloween) | Halloween: 5 echte enge plekken (carrousel) |
| zo 1 | New Zealand, Tuvalu, Australia, Fiji (4) | #34 Around the world | Austria vs Latvia | Indonesia | Vind Bosnia and Herzegovina |

De tijden zijn een voorstel; zet P1 op je beste moment, dat is de post met de meeste kans.

## Feiten

Oppervlaktes, hoofdsteden en buurlanden komen uit de Roviko-data (`roviko/lib/data/countries.json`). De overige feiten zijn algemeen bekende, controleerbare feiten (bijv. Olympische Spelen 1936 Haïti/Liechtenstein, 14.125 eilanden van Japan bij de hertelling van 2023, Death Valley 56,7 °C in 1913). Geen verzonnen cijfers of claims over accounts.

## Opbouw van elke zip

```
Roviko-D1-ma-26-okt/
  CAPTIONS.txt                     alle 5 captions van die dag, met voorstel-tijd
  D1P1-flag-twins/                 01–05.png (1080x1350) + caption.txt
  D1P2-map-challenge-28/           tiktok/ (3:4) en instagram/ (4:5), 12 slides + caption.txt
  D1P3-flag-twins-reel/            D1P3.mp4 + D1P3-cover.jpg + caption.txt
  D1P4-3-facts-reel/               idem
  D1P5-map-facts-reel/             idem (za: D6P5-halloween/, 7 slides)
  banners/                         D1P1–D1P5-banner.png (1080x1920)
```

## Bronbestanden

- Reels: `roviko-shorts/src/w2-flag.js`, `w2-clue.js`, `w2-map.js` (stijl: `lib/w2.js`), bouwen met `build/week2.sh`
- Carrousels: `src/w2-car.js` → `build/w2-car.mjs`; kaartchallenges: `roviko-carousels/data/posts.js` #28–34
- Captions en bannerteksten: `build/w2_posts.py`; bundelen: `build/w2_pack.py`
