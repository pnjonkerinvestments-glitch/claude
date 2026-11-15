# Roviko contentweek 5 · ma 16 – zo 22 nov 2026

4 posts per dag, 28 in totaal. Per dag één map en één zip, met de posts in de volgorde waarin je ze plaatst.

## Elke dag

| Tijd | Post | Wat |
|---|---|---|
| 08:00 | **What flag is this?** (16 slides) | Nieuw, in Roviko-paspoortstijl: cover met niveau, 7 vlaggen, bij elk antwoord een paspoortstempel met het land in de vorm van de vlag en een feitje, als laatste je score. |
| 12:30 | **Map challenge** (12 slides) | Nieuwe lay-out: bij elk land drie opties, A, B of C. Mensen zetten hun letters in de reacties. |
| 17:30 | **Roviko explains** (video) | Nieuw: één uitlegvideo per dag op een Roviko-kaart, met labels, ondertitels, muziek en een feitje. |
| 19:00 | **Flag twins** (5 slides) | De vorm van onze best bekeken post. Nieuw: de titel noemt de landen in een andere volgorde dan A, B, C, zodat de eerste slide niets verklapt. |

## Per dag

| Dag | What flag is this? | Map challenge | Roviko explains | Flag twins |
|---|---|---|---|---|
| ma 16 | Medium | 49 Europe | Latin America vs South America | Senegal, Mali, Cameroon, Guinea |
| di 17 | Hard | 50 Africa | Scandinavia vs the Nordic countries | Latvia, Canada, Austria, Peru |
| wo 18 | Medium (Europe) | 51 Asia | Where does Europe end and Asia begin? | Russia, France, Netherlands |
| do 19 | Hard (Asia) | 52 The Americas | Africa is way bigger than you think | Azerbaijan, Tunisia, Türkiye |
| vr 20 | Medium (Americas) | 53 Islands only | The 13 countries on the equator | El Salvador, Honduras, Nicaragua |
| za 21 | Hard (Africa) | 54 Europe | Australia, Australasia or Oceania? | Uganda, Belgium, Germany |
| zo 22 | Legend (Pacific) | 55 Around the world | Countries inside other countries | Pakistan, Mauritania, Algeria |

Captions: één tekst per post, kopiëren en plakken. Elke caption heeft **5 hashtags, altijd met #fyp**.

De uitlegvideo's hebben een Engelse voice-over (Kokoro-82M, open model onder Apache-2.0, stem "af_heart"), met muziek eronder en ondertitels in beeld.

## Bronbestanden

- `roviko-shorts/data/w5.js` (vlaggen), `data/w5ex.js` (uitlegvideo's), `roviko-carousels/data/posts.js` 49–55
- Sjablonen: `src/w2-car.js` (?w=5), `src/w5-gtf.js`, `src/w5-explain.js`, kaartchallenge `roviko-carousels/carousel.html`
- Bouwen: `build/w5ex.sh`, daarna `python3 build/w5_pack.py`; captions in `build/w5_posts.py`
