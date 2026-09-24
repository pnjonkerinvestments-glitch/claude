# Roviko — volledige websiteoverdracht aan Claude

**Versie 1.12.0 · 24 september 2026** (1.11.0 van ChatGPT + samenvoeging met de verbeteringen van Claude). Live domein: https://roviko.app
Hostingadres: https://roviko.info960133.chatgpt.site
De exacte broncommit en pakketinhoud staan in `EXPORT_MANIFEST.json` van de ZIP.

## Eerst lezen

1. `docs/CHANGES_SINCE_1_11.md`: wat 1.12 toevoegt aan 1.11 (geen nieuwe migratie). Daarna `docs/CHANGES_SINCE_V3.md` voor 1.10/1.11.
2. `GAME_RULES.md`: actuele regels en puntentelling, leidend boven oude releasedocumenten.
3. `ARCHITECTURE.md`, `SECURITY.md`, `DATA_SOURCES.md`, `MULTIPLAYER.md`.
4. `docs/QA_1_11.md`: wat getest is en wat nog fysiek gecontroleerd moet worden.

Dit is de volledige websitebron inclusief backend, lokale geografische data, illustraties, fonts, vlaggen, tests, lockfile en migraties. Het is geen screenshot/demo. De bestaande SwiftUI-map `ios/` is niet opgenomen: die hoort bij het aparte app-project. Geen live database, credentials, sessiecookies, dependencies, buildoutput of Git-geschiedenis zit in deze ZIP. Fictieve testwachtwoorden zijn alleen fixtures.

## Huidige productkeuzes — behouden

- Eigen Roviko-identiteit; geen code, vragen, illustraties of herkenbare creatieve uitwerking van concurrerende quizsites kopiëren.
- **Alleen vijf officiële dagspellen leveren dagelijkse ranglijstpunten op.** Maximaal 1.000 per spel/5.000 per dag. Geen tijdsbonus of timer. Cumulatieve totalen zijn de som over alle dagen.
- Practice, bonus-warm-up en persoonlijke herkansingen blijven zonder punten/timer. Multiplayer behoudt eigen matchpunten/XP, gescheiden van dagtotalen.
- Dagelijkse Clue Trail: vijf landen; hints continent, grens, hoofdstad, vlag; opties zonder vlaggen. Correct na 1/2/3/4 hints = 200/150/100/50, fout = 0.
- Rank Radar: zes landen, vier onderwerpen per vraag; expliciet bevestigen, daarna alle cijfers/rangen uitleggen.
- Mosaic: dagelijkse numerieke feiten, duidelijk geselecteerde categorieën, rood gemarkeerde mismatches; server-gevalideerde dagpunten en betaalde hints volgens GAME_RULES.md.
- Side by Side: links schuift naar rechts voor één extra vergelijking, ongeacht de keuze.
- Dagspelresultaten zijn eenmalig en hervatbaar per speler/UTC-datum/spel. Geen herhaalpunten, geen retroactieve scores voor oude edities.
- EN/NL/ES, light/dark mode, gasten zonder account, responsief en toetsenbordbedienbaar.
- Elke spelvorm heeft een uitleg (3 stappen + tip, EN/NL/ES) die de eerste keer vanzelf opent, een ?-knop in elk spel en de pagina `/how-to-play`. Nieuwe spelvormen krijgen altijd een uitleg in `lib/how-to-play.ts`.
- Dagdoelen (3 per dag, kroonkist) en Rank Radar-medailles zijn motivatie zonder punten: ze veranderen nooit dagpunten, ranglijsten of reeksen.
- Wereldduel en het mysterieland zijn extra's zonder punten. Houd het aantal zichtbare spelvormen klein; voeg liever uitleg of variatie toe dan nieuwe modi.
- Toon feedback zodra de server heeft bevestigd. Verstuur nooit dagspeloplossingen vooraf om feedback sneller te laten lijken. Ongescoord oefenen mag lokaal onmiddellijk reageren.
- Behoud bronnen, meetjaren, licenties, opgeslagen voortgang en de oorspronkelijke v3-vormgeving.

## Stack en bestanden

React 19 + TypeScript + Vinext (Next.js App Router-API's bovenop Vite), Cloudflare Workers, D1/SQLite, Drizzle, native WebSockets. **Geen gewone standalone Next.js/Vercel-app en geen PostgreSQL/Supabase.**

- `components/RovikoApp.tsx`: router, navigatie, solo, accounts, multiplayer.
- `components/puzzles/`: dagelijkse spellen en kaarten; `components/atelier/Competition.tsx`: scores/ranglijsten.
- `lib/daily-scoring.ts`, `server/competition.ts`: regels en serverledger.
- `server/solo.ts`, `server/puzzles.ts`, `server/ranks.ts`: serverautoritair spelverloop.
- `server/api.ts`, `server/multiplayer.ts`, `lib/realtime/`: API en kamers.
- `lib/game-engine/`, `lib/puzzles/`: generators/validatie, gelicenseerde gegevens.
- `i18n/messages.ts`, `es.ts`, `content.ts`, `competition.ts`: vertalingen.
- CSS wordt in `app/layout.tsx` geladen; `competition.css` is de laatste laag. Controleer bestaande overrides bij visuele wijzigingen.
- `drizzle/`, `db/schema.ts`: schema/migraties; `db/seed.sql` bevat geografie, geen gebruikersgegevens.

## Installeren en controleren

Node >=22.13. Bundelscripts gebruiken Linux, GNU timeout en flock; WSL/Linux is de directe match. Een standaard `npm ci` kan buiten de beheerde omgeving de lockfile installeren. Pas wrappers voor macOS indien nodig aan; vervang de stack niet om een scriptprobleem te omzeilen.

```sh
npm ci
npm run typecheck
npm run build
npm test
```

De volledige testsuite gebruikt de buildoutput: daarom eerst bouwen. `npm run dev` start de Vinext/Vite-ontwikkelomgeving; lees README.md voor de D1-binding. Tests maken een eigen geïsoleerde Workerd/D1-database met alle migraties.

**Nieuwe migratie vereist:** pas alle SQL-bestanden uit `drizzle/` in journaalvolgorde toe, inclusief `0003_gorgeous_arachne.sql`. Dit voegt `daily_scores` toe. Niet bestaande migraties herschrijven; geen lege database over productie zetten. De hostingbuild neemt de migraties mee. Geen nieuw geheim nodig. `.env.example` bevat voorbeelden; Google OAuth vereist eigen providerconfiguratie.

`.openai/hosting.json` hoort bij de bestaande site en moet behouden blijven. Het project-ID is geen deploymentcredential. Een andere Cloudflare-omgeving vereist eigen hostingrechten/database/configuratie. Een code-ZIP geeft op zichzelf geen rechten om de live site te wijzigen.

## Native compatibiliteit

De website stuurt `competition:true` voor officiële dagspellen en gebruikt `/puzzles/today?competition=1`. Oude native requests behouden de ongescoorde editie en volledige huidige-vraagdata. Verander dit contract niet zonder de native client mee te bouwen/testen. Deze ZIP bevat geen nieuwe App Store-binary. Native bouw, toesteltests, signing en Apple-indiening vereisen een Mac en de eigenaar zijn Apple Developer-account.

## Gewenste werkwijze bij verdere verbetering

Maak eerst een werkende nulmeting. Controleer echte mobiele browsers (320/375/390/430 px), desktop, alle talen/thema's, lange landnamen, fouten en reconnect. Bouw vervolgens concrete verbeteringen met behoud van serverautorisatie en dagelijkse puntintegriteit. Lever gewijzigde bronnen, testresultaten en een korte changelog. Vraag de eigenaar om de beoogde wijziging als die ontbreekt; deze overdracht geeft geen opdracht om willekeurig spelregels te herschrijven.
