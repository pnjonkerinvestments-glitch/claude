# Roviko — volledige websiteoverdracht aan Claude

**Versie 1.19.3 · 25 september 2026** (1.11.0 van ChatGPT + de verbeteringen van Claude, zie `docs/CHANGES_SINCE_1_11.md`; de redesign van 1.14 staat in `docs/REDESIGN_1_14.md`, 1.15 in `docs/CHANGES_SINCE_1_11.md`). Live domein: https://roviko.app
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
- **Alleen de Dagelijkse Omweg en de vijf dagspellen leveren dagelijkse ranglijstpunten op (1.19).** Maximaal 1.000 per spel/6.000 per dag. De Omweg is de hoofdreis op de homepage (de knop "Begin de reis van vandaag" start hem); de vijf dagspellen zijn in deze volgorde: Rank Radar, Wereldduel, Side by Side, Country Mosaic, Clue Trail (`DAILY_MODES` in `lib/daily-loop.ts`, `DAY_MODES` = Omweg + die vijf). Geen tijdsbonus of timer. Cumulatieve totalen zijn de som over alle dagen.
- Practice, bonus-warm-up en persoonlijke herkansingen blijven zonder punten/timer. Multiplayer behoudt eigen matchpunten/XP, gescheiden van dagtotalen.
- Daily Detour (1.18, was Wereldreis): 20 vragen, vier van elk type (vlag, hoofdstad, kaart, buren, grootte), geschud en nooit twee keer hetzelfde type na elkaar; 50 punten per vraag, kaart naar nauwkeurigheid. Punten per vraag = 1000 ÷ aantal vragen, zodat oudere edities met vijf stops (200 per stop) gelijk blijven.
- Dagelijkse Clue Trail: vijf landen; hints continent, grens, hoofdstad, vlag; opties zonder vlaggen. Correct na 1/2/3/4 hints = 200/150/100/50, fout = 0.
- Rank Radar: zes landen, vier onderwerpen per vraag; expliciet bevestigen, daarna alle cijfers/rangen uitleggen.
- Mosaic: dagelijkse numerieke feiten, duidelijk geselecteerde categorieën, rood gemarkeerde mismatches; server-gevalideerde dagpunten en betaalde hints volgens GAME_RULES.md.
- Side by Side: links schuift naar rechts voor één extra vergelijking, ongeacht de keuze.
- Dagspelresultaten zijn eenmalig en hervatbaar per speler/UTC-datum/spel. Geen herhaalpunten, geen retroactieve scores voor oude edities.
- EN/NL/ES, light/dark mode, gasten zonder account, responsief en toetsenbordbedienbaar.
- Elke spelvorm heeft een uitleg (3 stappen + tip, EN/NL/ES) die de eerste keer vanzelf opent, een ?-knop in elk spel en de pagina `/how-to-play`. Nieuwe spelvormen krijgen altijd een uitleg in `lib/how-to-play.ts`.
- Dagdoelen (3 per dag, kroonkist) en Rank Radar-medailles zijn motivatie zonder punten: ze veranderen nooit dagpunten, ranglijsten of reeksen.
- In singleplayer is een tik meteen het antwoord (geen bevestigknop), met een duidelijke rand om de gekozen kaart. Alleen multiplayer en Size Shuffle hebben een bevestigknop.
- Reeksschilden worden afgeleid uit de opgeslagen dagresultaten (`lib/streak.ts`); geen aparte opslag, niet te kopen.
- Visueel systeem in `app/design.css` (laatste laag, 1.14): tokens (canvas #F6F3E9, ink #18211D, forest #163B32, brand #1F806B, mint #DDEDE6, gold #F6B84B), alleen Fredoka + Manrope, vaste schalen, één schaduw. Nieuwe schermen gebruiken `components/ds` (States, Celebration) en de tokens, geen nieuwe losse kleuren. Eén primaire actie per scherm; scoreregels horen op `/scoring`, niet op de homepage. Lijniconen via `GameIcon` in plaats van emoji in de interface.
- Vrienden (alleen accounts) zien elkaars online-status (heartbeat `/api/presence`, 90 s venster) en kunnen elkaar direct in een kamer uitnodigen (`/api/rooms/:code/invite`, `/api/invites/:id`). Online-status is alleen zichtbaar voor geaccepteerde vrienden; gasten schrijven geen presence.
- Elke spelvorm heeft een eigen logo in `components/atelier/GameIcon.tsx` (getekende SVG, tweekleurig via `currentColor`); nieuwe spelvormen krijgen daar ook een logo. Gebruik altijd `<GameIcon mode=…/>` waar een spel genoemd wordt, geen emoji of losse iconen.
- Na een dagspel toont het resultaat alleen je punten, je plek tussen de spelers van vandaag en één knop naar het volgende spel (`components/atelier/DailyResult.tsx`); de terugblik is ingeklapt. Tijdens een spel op de telefoon staat de knop om verder te gaan altijd vast onderin en verdwijnt de bovenbalk; houd dat zo bij nieuwe spellen.
- Lay-out 1.17 volgt de ontwerpen van de eigenaar (ChatGPT, september 2026): veel witruimte, kleur in de illustraties en logo's, niet in achtergronden; lichte kaarten in plaats van donkere blokken; op mobiel een zwevende tabbalk. Nieuwe pagina's gebruiken dezelfde kaarttaal (illustratie boven, logo op de rand, titel, één regel, één actie).
- Illustraties (1.16/1.17) zijn vlakke cartoons met Roviko de wereldbol, in `public/art/` (WebP). Nieuwe illustraties volgen die stijl; paginakoppen krijgen ze via `PageHeader art="..."`. Scènes zijn decoratie: vlaggen en vormen in vragen en antwoorden komen altijd uit de data, nooit uit een illustratie.
- De homepage heeft de mascotte met ring (één boog per dagspel) en een tekstballon die zegt hoeveel spellen er nog zijn; de reeks, dagdoelen en week met reeksschild staan zichtbaar op de homepage. De mascotte-stemmingen staan in `components/ds/Mascot.tsx`.
- Wereldduel is sinds 1.19 dagspel 2 met punten: 200 per gewonnen duel, server-gezaghebbend (`server/duel.ts`, `/api/duels`); de waarden en de perfecte route van een ronde gaan pas naar de browser nadat je een kaart hebt gespeeld. Oefenduels (`/duel/practice`) blijven lokaal en zonder punten. Het mysterieland is een extra zonder punten. Houd het aantal zichtbare spelvormen klein; voeg liever uitleg of variatie toe dan nieuwe modi.
- Multiplayer (1.19): snel spelen tegen een willekeurige speler (`POST /api/match/quick`); na 3 minuten zonder tegenstander krijgt de speler een knop om tegen de computer te spelen. Computerspelers (makkelijk/gemiddeld/moeilijk, `lib/game-engine/bots.ts`) kunnen ook in elke kamer worden toegevoegd (max. 5). Potjes met een computerspeler tellen nooit mee voor de ranglijsten.
- Toon feedback zodra de server heeft bevestigd. Verstuur nooit dagspeloplossingen vooraf om feedback sneller te laten lijken. Ongescoord oefenen mag lokaal onmiddellijk reageren.
- Privacy en voorwaarden (1.19.3): Roviko is een privéproject van Pepijn Jonker (nog geen KvK), contact support@roviko.app; nog geen postadres (alleen een echt, eigen adres toevoegen); account vanaf 16 jaar (jonger met toestemming), gastspel voor iedereen; Nederlands recht. Gegevens staan in `OPERATOR` en `HOSTING` in `components/pages/InfoPages.tsx`. Gastvoortgang wordt na 12 maanden zonder spel automatisch verwijderd (`server/retention.ts`); pas de hostingregel aan bij een verhuizing.
- Behoud bronnen, meetjaren, licenties, opgeslagen voortgang en de oorspronkelijke v3-vormgeving.

## Stack en bestanden

React 19 + TypeScript + Vinext (Next.js App Router-API's bovenop Vite), Cloudflare Workers, D1/SQLite, Drizzle, native WebSockets. **Geen gewone standalone Next.js/Vercel-app en geen PostgreSQL/Supabase.**

- `components/RovikoApp.tsx`: router, solo, accounts, kamers. `components/shell/SiteHeader.tsx`: navigatie. `components/home/`: homepage. `components/pages/`: Ontdekken, Ranglijst, Paspoort, Vrienden, Punten, privacy/voorwaarden/bronnen. `components/app/`: context en gedeelde bouwstenen. `components/ds/`: laad-, leeg-, fout- en vieringscomponenten.
- `components/puzzles/`: dagelijkse spellen en kaarten; `components/atelier/Competition.tsx`: scores/ranglijsten.
- `lib/daily-scoring.ts`, `server/competition.ts`: regels en serverledger.
- `server/solo.ts`, `server/puzzles.ts`, `server/ranks.ts`: serverautoritair spelverloop.
- `server/api.ts`, `server/multiplayer.ts`, `lib/realtime/`: API en kamers.
- `lib/game-engine/`, `lib/puzzles/`: generators/validatie, gelicenseerde gegevens.
- `i18n/messages.ts`, `es.ts`, `content.ts`, `competition.ts`: vertalingen.
- CSS wordt in `app/layout.tsx` geladen; `design.css` is de laatste laag. De oudere lagen bevatten nog regels voor de spellen; controleer overrides bij visuele wijzigingen.
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

**Nieuwe migratie vereist (1.15):** pas alle SQL-bestanden uit `drizzle/` in journaalvolgorde toe, tot en met `0004_daffy_tusk.sql`. `0003` voegt `daily_scores` toe; `0004` voegt `user_presence` (wie is online) en `room_invites` (directe kameruitnodigingen) toe. Beide zijn alleen toevoegingen; bestaande tabellen en data veranderen niet. Niet bestaande migraties herschrijven; geen lege database over productie zetten. De hostingbuild neemt de migraties mee. Geen nieuw geheim nodig. `.env.example` bevat voorbeelden; Google OAuth vereist eigen providerconfiguratie.

`.openai/hosting.json` hoort bij de bestaande site en moet behouden blijven. Het project-ID is geen deploymentcredential. Een andere Cloudflare-omgeving vereist eigen hostingrechten/database/configuratie. Een code-ZIP geeft op zichzelf geen rechten om de live site te wijzigen.

## Publiceren: ChatGPT of eigen Cloudflare

De eigenaar kiest per release. **Optie A** (`npm run export:chatgpt`): exportzip voor de ChatGPT-hosting, die roviko.app bedient. **Optie B** (`npm run deploy:cloudflare`): bouwen, testen, nieuwe migraties en deploy naar het eigen Cloudflare-account op https://roviko.pnjonkerinvestments.workers.dev (eigen database `roviko-db`, zonder de live spelersdata). Config: `wrangler.cloudflare.jsonc` — bewust niet `wrangler.jsonc`, anders pakt de Vite-plugin hem op en verandert de ChatGPT-build. Zonder uitdrukkelijke toestemming geen DNS, routes of custom domains voor roviko.app. Alles stap voor stap in `docs/PUBLICEREN.md`.

## Native compatibiliteit

De App Store-/Google Play-app staat in `../roviko-app` (Capacitor; laadt https://roviko.app). Lanceerchecklist: `roviko-app/LANCERING.md`.


De website stuurt `competition:true` voor officiële dagspellen en gebruikt `/puzzles/today?competition=1`. Oude native requests behouden de ongescoorde editie en volledige huidige-vraagdata. Verander dit contract niet zonder de native client mee te bouwen/testen. Deze ZIP bevat geen nieuwe App Store-binary. Native bouw, toesteltests, signing en Apple-indiening vereisen een Mac en de eigenaar zijn Apple Developer-account.

## Gewenste werkwijze bij verdere verbetering

Maak eerst een werkende nulmeting. Controleer echte mobiele browsers (320/375/390/430 px), desktop, alle talen/thema's, lange landnamen, fouten en reconnect. Bouw vervolgens concrete verbeteringen met behoud van serverautorisatie en dagelijkse puntintegriteit. Lever gewijzigde bronnen, testresultaten en een korte changelog. Vraag de eigenaar om de beoogde wijziging als die ontbreekt; deze overdracht geeft geen opdracht om willekeurig spelregels te herschrijven.
