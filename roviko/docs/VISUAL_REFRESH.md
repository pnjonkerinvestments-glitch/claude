# Visuele opfrisbeurt ("playful")

Doel: Roviko speelser en vrolijker maken, met behoud van alle functies, productkeuzes en voortgang. Inspiratie komt uit wat succesvolle trivia- en leerspellen gemeen hebben (Geotrivia, Duolingo, Wordle/Worldle): één duidelijke startknop, een mascotte, een eigen kleur per spel, dikke "drukbare" knoppen en direct voelbare feedback. Er zijn geen assets, teksten of layouts van die sites overgenomen.

## Wat is er veranderd

**Nieuwe stijllaag** — `app/playful.css`, geladen na `rank.css`. Deze laag stylet alleen bestaande markup; alle gedrag blijft in de componenten.
- Lettertypen: Nunito (tekst) en Fredoka (koppen), zelf gehost onder OFL 1.1.
- Nieuw palet voor licht en donker (oceaanblauw, zonnegeel, per spel een eigen kleur: Rank koraal, World Trip groen, Side by Side oranje, Mosaic paars). Alle tekstparen zijn ≥ 4.5:1 en de contrasttest leest nu ook dit bestand.
- Knoppen, kaarten, antwoordopties, Mosaic-tegels en Rank-opties hebben een 3D-onderrand die inzakt bij klikken.
- Feedback: goed antwoord krijgt een pop-animatie en een kleine confetti-burst, fout antwoord schudt kort. De rood/groen-markering met tekst en iconen blijft zoals vereist.
- Voortgangsbalken, route-stops van World Trip, resultatenscherm (score-stempels), paspoort, multiplayer- en ranglijstpagina's volgen dezelfde stijl.
- De header blijft zichtbaar tijdens scrollen.
- Alle nieuwe animaties staan uit bij `prefers-reduced-motion: reduce`.

**Nieuwe hero op Spelen en Dagelijks** (`components/puzzles/PuzzleDeck.tsx`)
- De globe-mascotte met tekstballon en zwevende stickers.
- Eén gele hoofdknop die het eerste onafgeronde dagspel start of hervat ("Begin met …" / "Verder met …"). Als alles klaar is, scrollt hij naar de andere spellen.
- Drie tellers: dagen op rij, vandaag x/4, landen ontdekt. Die komen uit bestaande data (`boot.stats`, `/puzzles/today`).
- Nieuwe teksten in het Engels en Nederlands (`hero*`-sleutels in `i18n/messages.ts`).

**Bugfixes**
- De routebalk van World Trip was zwart: een losse `.compact`-regel voor het join-formulier gold voor elk element met die klasse. De regel geldt nu alleen voor `.join-form.compact`.
- In de header van Rank stond de teller tegen het label aan ("1 / 6Countries"). De span heeft nu de klasse `puzzle-count`.
- Vlag-afbeeldingen via `/api/flag` gaven lokaal (Vite dev) een 503, omdat daar geen `ASSETS`-binding is. Er is nu een fallback die alleen werkt als `env.ASSETS` ontbreekt. In productie verandert er niets.
- De skip-link had onvoldoende contrast.

## Testresultaten (lokaal, Linux, Node 22)

- `npm run typecheck`: geslaagd
- `npm run build`: geslaagd
- `npm test`: 75/75 geslaagd (inclusief de contrasttest over het nieuwe bestand)
- ESLint op de gewijzigde bestanden: geen nieuwe meldingen ten opzichte van de originele code. De bestaande `no-explicit-any`-meldingen staan er nog.
- Visueel gecontroleerd met headless Chromium (Playwright) op 1440, 390 en 320 px, licht en donker, EN en NL: homepage, alle vier de dagspellen (voor en na een antwoord), Flag Signal van begin tot resultatenscherm, instellingenvenster, multiplayer, paspoort, verkennen en ranglijst.

## Nog niet gecontroleerd

- Echte iPhone/Android-apparaten, aanraking en VoiceOver/TalkBack.
- Safari/WebKit en Firefox.
- De live omgeving (niet bereikbaar vanuit deze ontwikkelomgeving).

---

# Terugkeer-lus (ronde 2)

Doel: spelers elke dag laten terugkomen en langer laten spelen, maar op een eerlijke manier. Er zijn dus geen nep-meldingen, geen schuldgevoel-teksten en geen eindeloze feed. Punten en XP in solo blijven uit, zoals `START_HERE_CLAUDE.md` voorschrijft.

| Psychologisch principe | Wat het doet in Roviko |
| --- | --- |
| Zeigarnik-effect (onafgemaakte taken blijven trekken) | Voortgangsring rond de mascotte met 4 bogen, één per dagspel. Afgeronde spellen kleuren in en op de kaart komt een ✓-stempel. |
| Doelgradiënt (hoe dichter bij het doel, hoe meer motivatie) | Balkje onder de reeks naar de volgende mijlpaal (3, 7, 14, 30 … dagen) en een kaart "Volgende badge" met voortgangsbalk (bestaande solo-prestaties). |
| Verliesaversie, mild ingezet | Als je reeks bestaat maar je vandaag nog niets hebt gespeeld: een gloeiende vlam en de tekst "Je reeks van N dagen wacht op je!". |
| Minder frictie tussen spellen | Na elk dagspel verschijnt een paneel met je reeks, de 4 dagspellen en een knop "Volgende: …". |
| Verwachting (het Wordle-effect) | Als alles af is: een live aftelklok tot de nieuwe puzzels om 00:00 UTC, plus het onderwerp van morgen. |
| Nieuwsgierigheidskloof en variabele beloning | "Mysterieland van de dag": raad het land bij een UNESCO-erfgoedfeit. Extra hints zijn optioneel, er komt direct feedback met uitleg en bron, en het spel wisselt dagelijks. De voortgang blijft bewaard in de browser. |
| Persoonlijke, reagerende mascotte | De tekstballon past zich aan: nieuw, bezig ("Nog 2 te gaan!"), reeks in gevaar, of alles gedaan. |

Nieuwe bestanden: `lib/daily-loop.ts` (pure logica, getest in `tests/daily-loop.test.mjs`), `components/atelier/DailyLoop.tsx`, `components/atelier/MysteryCountry.tsx` en `components/atelier/ResetCountdown.tsx`. Het mysterieland gebruikt de bestaande dataset `public/data/mosaic-facts.json` (UNESCO, CC BY-SA 3.0 IGO) en vermeldt de bron bij elk antwoord.

Tests: typecheck en build geslaagd, `npm test` 81/81 geslaagd (6 nieuw). Handmatig in headless Chromium: een volledig Rank-dagspel, de lus erna, de homepage met 1/4 klaar, het mysterieland (hint, fout antwoord, herladen), op desktop en 390 px, licht en donker.

Nog open, vooral voor de app: echte pushmeldingen ("je reeks wacht"), een reeks-bevriezer en vrienden-reeksen. Die vragen server-opslag en expliciete toestemming van de speler.
