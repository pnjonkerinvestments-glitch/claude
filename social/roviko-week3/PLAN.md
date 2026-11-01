# Roviko contentweek 3 · ma 2 – zo 8 nov 2026

5 posts per dag, 35 in totaal. Per dag één zip, plus één zip met de hele week.

## Opzet

Dezelfde formats als week 2, gebouwd op wat viraal ging: **vlaggen die op elkaar lijken** (Monaco/Indonesia/Poland, 10.3K) en **echte feitjes**. Op zondag komt "level 2" van de best bekeken post terug, met Singapore erbij.

Captions: één tekst per post, kopiëren en plakken. Elke caption heeft **precies 5 hashtags, altijd met #fyp**.

| Dag | P1 Flag twins (carrousel, 19:00) | P2 Map challenge (12 slides, 15:00) | P3 Flag twins reel (12:30) | P4 3 facts reel (08:00) | P5 Map facts reel (21:00) |
|---|---|---|---|---|---|
| ma 2 | Croatia, Russia, Serbia | #35 Europe | Indonesia vs Monaco | Canada | Vind Slovenia |
| di 3 | Bangladesh, Palau, Japan | #36 Africa | Mali vs Guinea | Egypt | Mongolia vs Iran (maps lie) |
| wo 4 | Uruguay, Argentina, Greece | #37 Asia | UAE vs Kuwait | Norway | Vind Nepal |
| do 5 | Philippines, Czechia, Chile | #38 The Americas | Iran vs Tajikistan | Mexico | Norway vs Vietnam (maps lie) |
| vr 6 | Niger, Ivory Coast, India | #39 Islands only | Thailand vs Costa Rica | Australia | Vind Belgium |
| za 7 | Iraq, Yemen, Egypt | #40 Europe | Hungary vs Bulgaria | Netherlands | Vind Moldova |
| zo 8 | Monaco, Indonesia, Poland, Singapore (level 2) | #41 Around the world | Pakistan vs Algeria | Saudi Arabia | Germany vs Zimbabwe (maps lie) |

De tijden zijn een voorstel. Zet P1 op je beste moment.

## Feiten

Oppervlaktes, hoofdsteden en buurlanden komen uit de Roviko-data (`roviko/lib/data/countries.json`). De andere feiten zijn bekende, controleerbare feiten, zoals de kustlijn van Canada (circa 243.000 km), de middernachtzon in Tromsø en Australië dat breder is dan de maan.

## Opbouw van elke dag-zip

```
Roviko-D1-ma-2-nov/
  CAPTIONS.txt                     alle 5 captions van die dag, met voorstel-tijd
  D1P1-flag-twins/                 01–05.png (1080x1350) + caption.txt
  D1P2-map-challenge-35/           tiktok/ (3:4) en instagram/ (4:5), 12 slides + caption.txt
  D1P3-flag-twins-reel/            D1P3.mp4 + D1P3-cover.jpg + caption.txt
  D1P4-3-facts-reel/               idem
  D1P5-map-facts-reel/             idem
  banners/                         D1P1–D1P5-banner.png (1080x1920)
```

## Bronbestanden

- Data van deze week: `roviko-shorts/data/w3.js` (reels en carrousels), `roviko-carousels/data/posts.js` #35–41
- Sjablonen: `src/w2-flag.js`, `w2-clue.js`, `w2-map.js`, `w2-car.js` met `?w=3`; bouwen met `WEEK=3 build/week2.sh`
- Captions: `build/w3_posts.py`; bundelen: `WEEK=3 python3 build/w2_pack.py`
