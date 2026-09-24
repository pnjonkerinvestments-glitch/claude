# Audit voor de redesign 1.14 (24 september 2026)

Dit is een korte audit vóór de redesign. De uitvoering staat in `docs/REDESIGN_1_14.md`.

## Structuur

**Stack.** React 19, TypeScript en Vinext (de App Router van Next bovenop Vite), op Cloudflare Workers met D1. Er is één clientcomponent, `components/RovikoApp.tsx` (83 KB in 421 regels). Die doet alles:
- de router, met `path`-state en `history.pushState`;
- navigatie, home, solo, multiplayer, ranglijst, profiel, vrienden, verkennen, admin en de info- en SEO-pagina's.

**Routes.** `app/page.tsx` en `app/[...slug]/page.tsx` renderen allebei `RovikoApp` met `initialPath`. Daardoor rendert de server elke route. De data (`/bootstrap`, `/puzzles/today`, `/competition`) wordt pas in de browser geladen.

**Gedeelde state.** Die staat in `AppContext`: `t`, `boot` (gebruiker en statistieken), `go`, `start`, `modal` en `busy`.

**shadcn-componenten.** Van de 60 in `components/ui/` worden er zeven gebruikt:
- dialog, alert-dialog, select, switch, tabs, progress;
- sonner (via `sonner`).

De rest wordt door tree-shaking niet meegebundeld. Weghalen kan, maar het levert geen kleinere bundel op, dus dat heeft geen prioriteit.

## Styling

Er zijn **zeven CSS-lagen, samen 382 KB aan bron**: globals (117 KB), revamp (36), atelier (26), rank (10), playful (82), competition (6) en polish (21). Elke laag overschrijft de vorige.

Gevolgen:
- **Zes lettertypen.** Er zijn `@font-face`-regels voor DM Sans, Space Grotesk, Nunito, Fredoka, Manrope en Outfit. Nunito en Fredoka worden echt gebruikt. Daarnaast staan er nog harde verwijzingen naar DM Sans, Space Grotesk en Outfit.
- **Tokens drie keer gedefinieerd.** De kleurtokens staan in globals, in playful en (gedeeltelijk) in polish. De primaire kleur is blauw (#2f5bea), met blauw-paarse hero-gradiënten. Dat past niet bij de gevraagde groene reisidentiteit.
- **Veel harde kleuren** buiten de tokens, vooral in playful.css (speltegels, medailles en de donkere modus).
- **Geen vaste schaal.** Er zijn veel verschillende schaduwen (`--lift`, `--shadow`, `--shadow-1/2/3` en losse `box-shadow`s) en radii. De ruimtes liggen tussen .25 en 3 rem.

## Homepage (voor de redesign)

De homepage bestaat uit:
- een hero met mascotte, ring en drie statistieken;
- vijf gekleurde speltegels, elk met een oefenknop en een ?-knop;
- dagdoelen, een reekskaart met uitleg over het reeksschild, en een scorekaart met regels en ranglijst;
- extra's (duel en mysterieland), een app-herinnering, en zes klassieke spellen met filter en "verras me";
- een blok om met vrienden te spelen.

**Dat zijn meer dan 15 blokken en minstens 8 even belangrijke knoppen.** Scoreregels en de uitleg over het reeksschild staan gewoon open. Er is geen duidelijke primaire actie. In de navigatie staan Spelen, Met vrienden, Verkennen en Uitleg. Taal, thema en geluid staan er direct naast.

## Laad-, leeg- en foutstaten

- **Laden.** `Loading` is een kompas met de tekst "Loading…". Hij staat in zes routes en in de ranglijsttabel. De scorekaart toont een losse "Loading…"-tekst. Er zijn geen skeletons, dus de pagina verspringt als de data binnenkomt (CLS).
- **Leeg.** `Empty` heeft een icoon, een titel en een tekst. Hij wordt consequent gebruikt, maar ziet er kaal uit.
- **Fout.** Er zijn meestal een retry-knop en een menselijke tekst. Bij sommige fouten verschijnt alleen een toast.

## Client-side rendering en hydration

- **`/leaderboard`, `/profile`, `/friends`, `/admin`** tonen `Loading` tot `/bootstrap` klaar is. Daarna springt de hele pagina in beeld.
- **`/explore`** haalt `countries.json` op (195 landen) en toont tot dan alleen de laadtekst.
- **De homevoortgang** wordt gerenderd met `PUBLIC_BOOT` (streak 0) en de status "wordt geladen". Na het laden verspringen de knoppen en de tellers.
- **Reset-aftelling en dagdoelen.** De reset-aftelling rendert eerst `--:--:--`. De dagdoelen gebruiken `useSyncExternalStore` met een server-snapshot. Beide zijn hydration-veilig.

## Toegankelijkheid

**Wat goed is.** Er is een skip-link, `aria-current` in de navigatie, dialogen via Radix, een focus-ring in polish, toetsen 1–4 in Rank Radar en een reduced-motion-blok in playful.

**Wat ontbreekt of beter kan:**
- De skip-link heet "Play" in plaats van "Naar de inhoud".
- De taalkeuze is een native select van 24 px (touch target).
- Medailles en de "is-you"-rij gebruiken vooral kleur.
- Er zijn geen `h1`'s op sommige subpagina's.

## Prestaties

- **Afbeeldingen en SVG.** De illustraties zijn webp (480/960) met srcset. `globe.webp` (97 KB), `globe.svg`, `file.svg` en `window.svg` worden niet gebruikt. `globe.png` (1,5 MB) is alleen voor het iOS-script.
- **Fonts.** Er worden zes families gedeclareerd. Er zijn zeven fontbestanden die niet nodig zijn.
- **CSS.** Er is ongeveer 380 KB aan bron met veel dode regels van eerdere ontwerpen (v3, revamp, atelier).

## SEO en juridische pagina's

- **SEO.** Er zijn titels, descriptions, canonical en OG via `lib/site-metadata.ts`. Er is `robots.txt`. De sitemap wordt door de worker gegenereerd. `noindex` staat al op spel- en profielroutes.
- **"Draft policy for this first release…"** staat letterlijk in productie (`privacyNote`, EN/NL/ES).
- **De privacy- en voorwaardenpagina's** zijn één lange kolom zonder inhoudsopgave. Entiteit, contactadres, bewaartermijnen en subverwerkers ontbreken. Die worden niet verzonnen, maar als TODO gemarkeerd.

## Terminologie: de canonieke lijst

| Begrip | EN | NL | ES | Niet gebruiken |
| --- | --- | --- | --- | --- |
| Samen spelen (menu en pagina) | Friends / Play together | Vrienden / Samen spelen | Amigos / Jugar juntos | "Multiplayer" als menulabel (mag als technische subtitel) |
| Vijf dagspellen | Today's trip / daily games | Reis van vandaag / dagspellen | Viaje de hoy / juegos diarios | "Daily expedition" |
| Wereldreis | World Trip | Wereldreis | Viaje por el mundo | |
| Clue Trail (dag) | Daily Clue Trail | Dagelijkse Clue Trail | Clue Trail diario | "Trail" los |
| Rank Radar | Rank Radar | Rank Radar | Rank Radar | "Rank" los |
| Side by Side / Country Mosaic | ongewijzigd | ongewijzigd | ongewijzigd | |
| Wat je verdient | points (dagspellen, multiplayer) | punten | puntos | "score" als eenheid |
| Resultaat van een ronde | score = aantal punten van één spel | score | puntuación | |
| Profiel | Passport | Paspoort | Pasaporte | "Profile" in de interface |
| Ranglijst | Rankings | Ranglijst | Clasificación | "Leaderboard" in de interface |
| Reeksschild | streak shield | reeksschild | escudo de racha | "freeze" in de interface |
