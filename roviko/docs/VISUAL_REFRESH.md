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

---

# Overzichtelijk en kindvriendelijk (ronde 3)

Doel: een rustige homepage met één duidelijke route voor dagelijks gebruik, geschikt voor kinderen en voor grote aantallen spelers.

- **Eén route per bezoek:** hero met één knop, dan de 4 dagspellen, het mysterieland, meer spellen en tot slot samen spelen. Het aantal blokken op de homepage ging van 11 naar 6.
- **Dubbele informatie weg:** de losse voortgangsbalk ("0 van 4") stond er al in de hero en de ring. Ook de paspoort-teaser en de linkregel "195 Verkennen / Ranglijst" (die ook in de navigatie staan) zijn verwijderd. Via de teller "Landen ontdekt" kom je nu bij je paspoort.
- **Rustige dagkaarten:** in een raster van 4 kolommen op desktop en 2 op mobiel. Per kaart alleen een plaatje, een naam, één regel uitleg en één knop. De labels ("Ontdek", "6 landen") en de detailregel zijn weg.
- **Weekoverzicht, badge-voortgang en de uitleg over de reset** staan alleen nog op de pagina Dagelijks (`/daily`).
- **Oefenopties:** één rustige rij met chips en een label.
- **Kindvriendelijk:** tekst 17 px, knoppen minimaal 48–50 px hoog, minder decoratie (stickers en stippellijn weg) en minder doorlopende animaties. Dat is ook zuiniger op goedkope telefoons.
- **Schaal:** er zijn geen extra API-aanroepen op de homepage bijgekomen. Het mysterieland laadt twee statische, cachebare JSON-bestanden.

---

# Rustige tegels, uitleg per spel en Rank Radar-medailles (ronde 5)

Doel: een fijnere, rustigere site waar elke speler snapt hoe elk spel werkt, zonder extra spelvormen op de homepage. Geleerd van Geotrivia: een warme, rustige achtergrond en grote gekleurde speltegels die in hun geheel klikbaar zijn, met kleine knoppen eronder. Er is niets overgenomen: eigen kleuren, eigen artwork, eigen teksten.

- **Warme achtergrond:** de lichte modus is gebroken wit (`#f7f3ee`) met warme randen in plaats van koel blauwgrijs. Het stippenpatroon is weg. De donkere modus blijft navy.
- **Dagspellen als gekleurde tegels:** de hele tegel is de knop (plaatje, naam, één regel en een witte "Start"-pil). De tegelkleur loopt over in de achtergrond van het artwork. Onder elke tegel staan twee knoppen in dezelfde kleur: **oefenen** ("Nog een ronde", "Vrij oefenen", "Ontdek alle 14 onderwerpen", "Nieuw mozaïek") en **?** (uitleg). De losse oefenrij is daarmee weg. Het raster is 4 kolommen tot 900 px breed, daaronder 2.
- **Extra's in één rij:** Wereldduel als paarse tegel naast het mysterieland (onder elkaar op mobiel). Geen nieuwe spelvormen; het aantal blokken op de homepage blijft 6.
- **Klassieke spellen:** zachte pasteltegels per spel, rustiger dan de vier dagspellen, zodat de volgorde van belangrijkheid duidelijk is.

## Uitleg: elke speler snapt elk spel

- **"?"-knop in elk spel:** Rank Radar, Wereldreis, Side by Side, Country Mosaic, Wereldduel, alle klassieke spellen en het mysterieland. De knop opent een venster met 3 genummerde stappen (met icoon), een tip en de knop "Snap ik, spelen!".
- **Automatisch de eerste keer:** speel je een spel voor het eerst, dan opent de uitleg vanzelf (één keer per spel, onthouden in de browser via `roviko:howto:<spel>`). Bij "Rond de wereld" (gemengd) en in kamers opent hij niet vanzelf, om het spel niet te onderbreken.
- **Uitlegpagina `/how-to-play`:** in de hoofdnavigatie ("Uitleg"). Alle 13 spelvormen in de groepen Dagspellen, Extra's, Klassieke spellen en Met vrienden, met snelkoppelingen bovenaan en per spel een knop om direct te spelen. De pagina staat ook in de sitemap.
- **Op de homepage:** "Nieuw hier? Zo werkt elk spel" in de hero (zolang je vandaag nog niets gespeeld hebt) en het ?-knopje onder elke dagtegel.
- **Toegankelijk:** Radix-dialoog (focus blijft in het venster, Esc sluit, de sneltoetsen 1–4 van het spel erachter reageren niet zolang de uitleg open is). Teksten zijn in het Engels en Nederlands en maximaal 160 tekens per stap.

Bestanden: `lib/how-to-play.ts` (inhoud), `i18n/howto.ts` (interfaceteksten), `components/atelier/HowToPlay.tsx` (knop, dialoog en pagina) en `tests/how-to-play.test.mjs`.

## Rank Radar: meer zoals een rangspel, zonder punten

- **Medailles per keuze:** de beste keuze is 🥇, de 2e beste 🥈, de 3e 🥉 en de zwakste ⚪. Ook "net niet" voelt nu als vooruitgang, wat vriendelijker is voor kinderen. Gelijke posities delen een medaille.
- **Medaillespoor** onder de voortgangsbalk, een **medaille-samenvatting** op het eindscherm ("4× beste · 1× 2e · 1× 3e"), "Perfecte radar!" bij zes keer goud, en medailles in het overzicht.
- **Delen** als medaillerij (🥇🥈🥇🥇🥉🥇), zonder landen of antwoorden te verklappen.
- De server stuurt de plaatsen mee (`places` in `/api/ranks`), zodat medailles na herladen blijven staan. Dit is een extra veld; de iOS-client blijft werken.
- Nog steeds **geen timer, punten of XP**, volgens de productregels.

## Testresultaten (lokaal, Linux, Node 22)

- Typecheck en build geslaagd. `npm test`: 90/90 geslaagd, met 6 nieuwe tests (2 voor de medailles, 4 voor de uitleg). In `tests/rank.test.mjs` en `tests/puzzle-ui.test.mjs` staat `radix-ui` nu als externe module in de testbundel, omdat de spelkoppen de uitlegdialoog gebruiken; de controles zelf zijn niet veranderd.
- ESLint: geen nieuwe fouten ten opzichte van de vorige commit in de gewijzigde bestanden.
- Handmatig in headless Chromium: homepage, `/daily`, `/multiplayer` en `/how-to-play` op 1440, 1024 en 390 px, licht en donker. De uitleg opent automatisch de eerste keer in Rank Radar, Side by Side, Flag Signal en Wereldduel (Engels licht en Nederlands donker op mobiel), gaat niet opnieuw open na "Snap ik", is opnieuw te openen via ? en sluit met Esc.

## Nog niet gecontroleerd

- Echte telefoons (iOS Safari, Android Chrome) en de Capacitor-app. Controleer vooral de ?-knoppen onder de tegels en de horizontale snelkoppelingen op de uitlegpagina.
- Schermlezers (VoiceOver, TalkBack) op de nieuwe tegels en de uitlegdialoog.
- De Wereldreis-, Mosaic- en klassieke spellen zijn niet allemaal volledig uitgespeeld in deze ronde; alleen de uitleg en de koppen zijn gecontroleerd.
