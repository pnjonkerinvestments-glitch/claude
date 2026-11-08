# Roviko contentweek 4 · ma 9 – zo 15 nov 2026

5 posts per dag, 35 in totaal. Per dag één zip, plus één zip met de hele week.

## Opzet

Dezelfde formats als week 2 en 3, gebouwd op wat viraal ging: **vlaggen die op elkaar lijken** (Monaco/Indonesia/Poland, 10.3K) en **echte feitjes**.

Captions: één tekst per post, kopiëren en plakken. Elke caption heeft **precies 5 hashtags, altijd met #fyp**.

| Dag | P1 Flag twins (carrousel, 19:00) | P2 Map challenge (12 slides, 15:00) | P3 Flag twins reel (12:30) | P4 3 facts reel (08:00) | P5 Map facts reel (21:00) |
|---|---|---|---|---|---|
| ma 9 | Sweden, Kazakhstan, Ukraine | 42 Europe | Indonesia vs Poland | Iceland | Vind Botswana |
| di 10 | Liberia, Malaysia, USA | 43 Africa | Colombia vs Ecuador | India | Poland vs Philippines (maps lie) |
| wo 11 | China, Morocco, Vietnam | 44 Asia | Sudan vs Jordan | Chile | Vind Kyrgyzstan |
| do 12 | Malawi, South Sudan, Kenya | 45 The Americas | Germany vs Belgium | Greece | Sweden vs Cameroon (maps lie) |
| vr 13 | Hungary, Mexico, Italy | 46 Islands only | Norway vs Iceland | Philippines | Vind El Salvador |
| za 14 | DR Congo, Tanzania, Congo | 47 Europe | Andorra vs Moldova | Switzerland | Vind Togo |
| zo 15 | Ethiopia, Ghana, Bolivia | 48 Around the world | Myanmar vs Lithuania | Russia | Spain vs Thailand (maps lie) |

De tijden zijn een voorstel. Zet P1 op je beste moment.

## Feiten

Oppervlaktes, hoofdsteden en buurlanden komen uit de Roviko-data (`roviko/lib/data/countries.json`). De andere feiten zijn bekende, controleerbare feiten, zoals de 11 strepen van Liberia, de Atacama-woestijn en Samoa dat in 2011 een dag oversloeg.

## Bronbestanden

- Data van deze week: `roviko-shorts/data/w4.js` (reels en carrousels), `roviko-carousels/data/posts.js` 42–48
- Sjablonen: `src/w2-flag.js`, `w2-clue.js`, `w2-map.js`, `w2-car.js` met `?w=4`; bouwen met `WEEK=4 build/week2.sh`
- Captions: `build/w4_posts.py`; bundelen: `WEEK=4 python3 build/w2_pack.py`
