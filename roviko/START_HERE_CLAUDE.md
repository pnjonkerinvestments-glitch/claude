# Roviko — overdracht aan Claude

Versie: 1.9.0. Broncommit: `7036a22c8686cdcc5d0a623ed770c2329eca0768`. Export: 23 september 2026.
Live website: https://roviko.info960133.chatgpt.site

## Opdracht van de eigenaar

Verbeter dit bestaande product daadwerkelijk, met behoud van werkende functies en voortgang. Maak het strak, vriendelijk, speels en visueel verzorgd. Begin met een kritische inspectie van de code en een werkende lokale versie; voer vervolgens concrete verbeteringen uit. Geen statische vervanging of nepknoppen.

Behoud deze productkeuzes:
- Eigen Roviko-identiteit; bestaande geography-sites mogen algemene inspiratie geven, maar kopieer geen branding, teksten, assets, datasets of specifieke creatieve uitwerking.
- Singleplayer, dagelijkse spellen en oefenen hebben GEEN timer, punten of XP. Multiplayer behoudt gesynchroniseerde timers en server-side scores.
- Toon antwoordfeedback onmiddellijk. Markeer de daadwerkelijk verkeerde keuze rood, de juiste keuze groen, met tekst en iconen; leg uit waarom het fout is.
- Vier dagelijkse spellen: Rank Radar, World Trip, Side by Side en Country Mosaic. De dag wisselt om 00:00 UTC. Bewaar reeds gestarte dagpuzzels en resultaten.
- Rank Radar: zes landen, vier onderwerpen per vraag, vijftien mogelijke onderwerpen. Rangposities, waarnemingsdekking, meetwaarden en bronjaren horen bij de uitleg. De kleinste relatieve positie wint, volgens GAME_RULES.md.
- Mosaic verbindt vlag, naam, vorm, feit en eventueel hoofdstad. Feiten zijn gevarieerde cijfers zoals hoogste punt, mediane leeftijd, kustlijn en bbp; geen makkelijke continent-hints. Feitonderwerp wisselt per UTC-dag.
- Side by Side: na een keuze schuift het linker land naar rechts en blijft het één extra vergelijking staan; het nieuw toegevoegde land verschijnt links.
- Behoud accountloze gastspelers, Nederlands/Engels, light/dark mode, toetsenbordbediening en toegankelijke foutfeedback.
- Nieuwe data alleen met passende licentie en provenance. Behoud DATA_SOURCES.md, bronjaren en attributie.

## Validatiestatus van deze bronversie

De websiteproductiebuild, TypeScriptcontrole en 75 automatische tests zijn geslaagd. Lees docs/QA_1_9.md (of VERIFICATION.md in het app-pakket) voor exact bewijs en beperkingen. De browserpreview was niet beschikbaar: mobiele layout, aanraking, toetsenbord-E2E en VoiceOver zijn niet visueel afgevinkt. Controleer die eerst op echte browsers/apparaten.

De SwiftUI-app is echte native broncode, maar is nog NIET met Xcode gecompileerd, op een simulator/iPhone getest, ondertekend of bij Apple ingediend. Presenteer die niet als een goedgekeurde of geteste App Store-binary.

Dit pakket bevat code, publieke assets, open geografische data en documentatie. Geen live gebruikersdatabase, sessiecookies, productie-credentials, signingcertificaten, node_modules, buildoutput of Git-geschiedenis. Testfixtures kunnen expliciet fictieve testaccounts/wachtwoorden bevatten. Project-ID's en de publieke backend-URL zijn configuratie, geen toegangstokens.

## Gewenste werkwijze

1. Lees de actuele overdracht en relevante architectuur/spelregels. Oudere release-documenten zijn historisch; de huidige versie heeft vier dagelijkse spellen.
2. Maak eerst een nulmeting van de werkende versie. Controleer mobiel (320–430 px), tablet en desktop, beide talen en thema's, lange landnamen en foutgevallen.
3. Pak echte UX- en functionele problemen aan; behoud de eigen stijl met rustige typografie, goede hiërarchie, originele illustraties en speelse details.
4. Test gewijzigde flows, hervatten, dubbele antwoorden en netwerkonderbrekingen. Claims over uitgevoerde tests moeten controleerbaar zijn.
5. Lever alle gewijzigde bronbestanden, een korte changelog en testresultaten. Verander geen productiehosting of live data zonder opdracht van de eigenaar.

## Dit pakket: volledige website en backend

De bronboom is intact, behalve dat `ios/` in het aparte app-pakket staat. De backend staat dus WEL in dit website-pakket. Om beide samen te gebruiken: plaats de inhoud van het app-pakket terug in `ios/` van de website-repository. `scripts/prepare-ios-assets.mjs` verwacht die map.

### Stack en belangrijke bestanden

- React 19, TypeScript, Vinext (Next.js App Router-API's bovenop Vite), Cloudflare Workers, D1/SQLite, Drizzle en WebSockets. Dit is geen standaard standalone Next.js/Vercel-app en gebruikt momenteel geen PostgreSQL/Supabase.
- `components/RovikoApp.tsx`: hoofdrouter, navigatie, homepage, accounts en veel gedeelde schermen.
- `components/puzzles/`: Mosaic, Side by Side, Rank Radar en de dagelijkse spelkaarten.
- `lib/puzzles/rank.ts`, `server/ranks.ts`: rangschikgenerator en server-authoritative sessies.
- `lib/puzzles/country-facts.ts`: dagelijks wisselende numerieke Mosaic-feiten.
- `server/api.ts`, `server/multiplayer.ts`, `lib/realtime/`: API en echte realtime rooms.
- `app/globals.css`, `app/revamp.css`, `app/atelier.css`, `app/rank.css`: CSS in die laadvolgorde. Onderzoek overlappende overrides voordat je nieuwe toevoegt.
- `i18n/`: Engelse/Nederlandse interfacecopy. `lib/config.ts`: centraal merk en feature flags.
- `lib/data/`, `public/data/`, `public/flags/`, `public/art/`: data en lokale assets; licenties behouden.
- `drizzle/`: alle bestaande migraties; `db/seed.sql`: geografische seed, geen gebruikersdump.
- `tests/`: 75 geautomatiseerde tests. `README.md`, `ARCHITECTURE.md`, `SECURITY.md`, `GAME_RULES.md`, `MULTIPLAYER.md`, `DATA_SOURCES.md`: technische context.

### Installatie en lokaal werken

Gebruik Node >=22.13. De meegeleverde install/build-shellscripts richten zich op Linux en gebruiken onder meer GNU timeout en flock.

```sh
npm run install:ci
npm run typecheck
npm run dev
```

Een gewone `npm ci` kan buiten de beheerde omgeving worden gebruikt om de vastgelegde dependencies te installeren. De lockfile is leidend; vervang de stack niet alleen om een installatieprobleem te omzeilen. macOS/Windows kunnen aanpassing van de Linux-shellwrappers vereisen; WSL/Linux is de meest directe match. Start niet gedachteloos met `next dev`: deze applicatie gebruikt Vinext/Vite.

Richt de lokale D1-binding `DB` in volgens `vite.config.ts` en pas ALLE SQL-migraties in journaalvolgorde toe; het historische README-voorbeeld toont niet noodzakelijk alle latere migraties. Gebruik de bestaande migraties, genereer geen vervangende databaseschema's voor een gewone codewijziging. De tests richten automatisch een geïsoleerde D1-testdatabase in.

De configuratie in `.openai/hosting.json` en `build/sites-vite-plugin.ts` hoort bij de bestaande hosting. De project-ID verleent Claude geen deploymentrechten. Voor een aparte Cloudflare-omgeving zijn een eigen database, Wrangler-configuratie en secrets nodig. Gebruik daarvoor eerst een aparte ontwikkelomgeving. Er zitten geen live databasegegevens in dit pakket. `.env.example` bevat alleen voorbeelden; Google OAuth is optioneel en vereist eigen providerconfiguratie.

### Testen

```sh
npm run typecheck
npm run test:unit
npm run test:integration
npm run build
npm test
```

De volledige suite bevat een test die `dist/server/index.js` importeert: voer daarom eerst de build uit. `npm run build` gebruikt een Linux-wrapper; de onderliggende build is Vinext. Browsershots, echte viewportcontrole en iPhone-tests staan nog open. De geteste status geldt voor de aangeleverde commit, niet automatisch voor Claude's wijzigingen.

### Hosting en gedeelde API

De live site is al gepubliceerd. Deze download is een broncode-overdracht, geen toegang tot het hostingaccount. De app gebruikt dezelfde backend: behoud route-/JSON-compatibiliteit of wijzig en test beide clients samen. Live databasegegevens migreren is een aparte handeling en geen onderdeel van dit pakket.
