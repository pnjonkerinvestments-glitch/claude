# Nieuw in Roviko 1.12.0 en 1.13.0 ten opzichte van 1.11.0

Datum: 24 september 2026.

**Basis.** Deze versie is de export van 1.11.0 (broncommit `55047534…`, zie `EXPORT_MANIFEST.json`). Daarop zijn de verbeteringen van Claude uit v4/v5 samengevoegd, plus nieuwe onderdelen die geïnspireerd zijn op Duolingo. 1.11 was gebouwd op v3; v4 en v5 ontbraken daarin.

**Belangrijk voor de hosting.**
- Er is **geen nieuwe databasemigratie**. De laatste blijft `drizzle/0003_gorgeous_arachne.sql`.
- Er zijn geen nieuwe geheimen en geen nieuwe externe diensten.
- De API is alleen uitgebreid, niet gewijzigd: er zijn nieuwe routes bijgekomen en één extra veld. Oude clients blijven werken.
- De cacheversie van de service worker is `roviko-shell-v1.12.0`, zodat terugkerende spelers de nieuwe code laden.

## Behouden uit 1.11

- De dagcompetitie met punten (maximaal 1.000 per spel, 5.000 per dag) en de puntentelling op de server.
- De dagelijkse Clue Trail.
- Spaans (ES).
- Knijpzoom en slepen op de kaart.
- De bevestigknoppen bij Size Shuffle en Rank Radar.
- Multiplayer: een vroege onthulling als iedereen heeft geantwoord, en de keuze welke spelmodi meedoen.
- Alle tests en migraties uit 1.11.

## Toegevoegd of teruggezet

**Wereldduel** (extra spel, zonder punten)
- Je hebt 5 landenkaarten tegen Roviko en elke kaart mag maar één keer. Elke dag is er een nieuw duel.
- API: `GET /api/duel/today` en `GET /api/duel/practice/:nonce`. Deze antwoorden zijn cachebaar en er komen geen databasegegevens bij.

**Uitleg per spel**
- Elk spel heeft drie stappen en een tip, in het Engels, Nederlands en Spaans.
- De uitleg opent automatisch de eerste keer dat je een spel speelt. Met het ?-knopje in elk spel open je hem opnieuw.
- Nieuwe pagina `/how-to-play` ("Uitleg" in het menu).

**Rank Radar-medailles**
- Je krijgt 🥇🥈🥉⚪ voor de 1e tot 4e beste keuze, met een medaillespoor en delen als medaillerij.
- De dagpunten veranderen niet.
- `GET /api/ranks/:id` bevat nu `places`, alleen voor rondes die al beantwoord zijn.

**Nieuwe homepage**
- Een warme achtergrond.
- Grote gekleurde speltegels (geleerd van Geotrivia). De hele tegel start het spel. Onder elke tegel staan een oefenknop en een ?-knop.
- Vijf tegels, afhankelijk van de schermbreedte: 5 naast elkaar, 3 + 2, of 2 + 2 + 1 breed.
- Wereldduel en het mysterieland staan samen onder "Extra's".

**Dagdoelen en kronen** (Duolingo)
- Drie doelen per dag. Wie alle drie haalt, opent een kroonkist.
- Het levert geen punten of XP op en telt niet mee voor de ranglijst.
- De voortgang staat ook na elk dagspel in het "wat nu"-blok.

**De scorekaart onder de speltegels**
- Die staat nu naast de dagdoelen, zodat het eerste wat je ziet iets is om te spelen.

**"Oefen je lastige landen"**
- Een kaart boven de klassieke spellen, zodra je eerder fouten maakte. De oefening zelf bestond al, maar zat verstopt in het profiel.

**App-herinnering**
- Zeven afwisselende berichten, één per weekdag, in plaats van steeds dezelfde zin.

## Fouten die zijn opgelost

- **"Rank" in plaats van "Rank Radar"** in de hero-knop, op de dagtegel en in de scorekaart.
- **De Start-knop van de dagelijkse Clue Trail had geen kleur.**
- **Medailles in de verkeerde volgorde.** Een oude CSS-regel van het multiplayer-podium (`.place-1/2/3 { order }`) gold ook voor de medailles. Daardoor stond de eerste medaille achteraan.
- **Rank Radar-kop op de telefoon.** De titel werd samengedrukt en lange onderwerpen braken midden in een woord af.
- **Het getal in de scoreregel tijdens een spel** gebruikt nu de taal van de pagina (1.000 in plaats van 1,000).

## Beoordeling van 1.11 (door Claude)

**Goed**
- Spaans is erbij, en de puntentelling op de server is netjes: oplossingen worden niet vooraf meegestuurd en je kunt geen punten "farmen".
- De dagelijkse Clue Trail heeft een slim hintsysteem.
- Het aanraakgedrag van de kaart is beter geworden.
- De tests zijn uitgebreid.

**Verbeterd in 1.12**
- Op de homepage stond de scorekaart met lege "—/1.000"-vakjes vóór de spellen. Voor een nieuwe speler was dat een drempel.
- De vijfde dagtegel stond op de telefoon alleen op een halve breedte, en de Start-knop van Clue Trail had geen kleur.
- Er was geen visuele controle gedaan (dat staat ook in QA_1_11). In 1.12 is lokaal gekeken in een headless browser.

**Aandachtspunt voor de eigenaar**
- Een wereldwijde ranglijst kan jonge spelers ontmoedigen ("#5.231"). Zie `docs/DUOLINGO_ANALYSE.md` voor het advies over een weekcompetitie in kleine groepen.

Zie `docs/QA_1_12.md` voor de testresultaten en wat nog op echte apparaten gecontroleerd moet worden.

## Toegevoegd in 1.13.0

**Reeksschild**
- Elke 7 speeldagen levert een schild op, met maximaal 2 op voorraad. Mis je een dag, dan houdt een schild automatisch je reeks in stand.
- De schilden worden berekend uit de opgeslagen dagresultaten. Er is **geen migratie** nodig, het werkt op elk apparaat hetzelfde en je kunt ze niet kopen of opsparen.
- Ze tellen pas vanaf 25 september 2026, zodat bestaande reeksen niet opeens veranderen.
- Te zien in:
  - de reekskaart op de homepage;
  - een badge bij de reeksteller in de hero;
  - het "wat nu"-blok na een spel;
  - het weekoverzicht (❄ op geredde dagen);
  - een tekstballon van Roviko als de schild je reeks gisteren heeft gered.

**Eén tik is je antwoord**
- In singleplayer is er geen bevestigknop meer bij Rank Radar en Pinpoint.
- De gekozen kaart krijgt meteen een duidelijke rand, die ook na de uitslag blijft staan.
- Multiplayer en Size Shuffle houden hun bevestigknop.

**Side by Side**
- Het land dat blijft staan ("Nog één ronde") toont in het dagspel weer zijn waarde. Daar stond "NaN", omdat de server in 1.11 alle waarden verborg.
- De waarde van het nieuwe land blijft verborgen tot je antwoord is opgeslagen.

**Professionele afwerking**
- Een nieuwe laatste stijllaag, `app/polish.css`: rustige witte kaarten met dunne randen en zachte schaduwen. Dagdoelen, scorekaart, mysterieland, uitleg, klassieke spellen en de spelkoppen hebben daardoor dezelfde vormtaal.
- Alle emoji in de interface zijn vervangen door consistente lijniconen in een eigen kleur per spel (`components/atelier/GameIcon.tsx`).
- De dagdoelen zijn een strakke lijst met dunne voortgangsbalken. Knoppen hebben een ingetogen diepte.

**Tests**
- Nieuw: `tests/streak.test.mjs`.
- Aangepast: drie tests voor de nieuwe regels (één tik is het antwoord, en de waarde van het land dat blijft staan is zichtbaar).
- `npm test`: 121 van 121 geslaagd.

## Toegevoegd in 1.13.2 (multiplayer)

- **Aftellen:** eindigt nu op "Go!" in plaats van twee keer "1".
- **Na elke ronde:** de ranglijst toont per speler het gegeven antwoord met ✓ of ✗ en de punten voor die ronde. Die punten waren eerst verborgen zodra iemand een reeks had.
- **Aan het eind:** "Kijk elke ronde terug", met per ronde de vraag, het goede antwoord en van iedere speler het antwoord en de punten.
- **Clue Trail in multiplayer:** de hints verschijnen één voor één, om de 2 seconden, in plaats van alle vier tegelijk.
- **Server:** er zijn twee extra velden bij de kamerstatus, `roundAnswers` (tijdens de uitslag van een ronde) en `history` (aan het eind van de match). Antwoorden blijven geheim tot de uitslag. Geen migratie nodig.
- **Tests:** de multiplayertest controleert nu ook de antwoorden per ronde en het overzicht aan het eind.


## 1.14.0: redesign

Een volledige UX- en visuele redesign, zonder de spelregels of de puntentelling te veranderen. Geen migratie, geen nieuwe API-routes en geen nieuwe geheimen.

- **Designsysteem.** Een nieuwe laatste laag, `app/design.css`: papieren achtergrond, bosgroen, één merkgroen (#1F806B) en een vleugje goud. Alleen Fredoka en Manrope. Vaste schalen voor tekst, ruimte en afronding, en één schaduw.
- **Navigatie.** Spelen, Ontdekken en Vrienden, met rechts de reeks, de instellingen en het paspoort. Op mobiel een tabbalk onderin.
- **Homepage.** Eén uitgelichte dagreis met één knop, een statusbalk, drie kaarten "Meer om te ontdekken", een route van de vijf dagspellen en "Samen spelen". Scoreregels staan niet meer op de homepage.
- **Nieuw en herbouwd.**
  - `/daily` is nu "Alle spellen".
  - Nieuwe pagina `/scoring`.
  - Herbouwd: Ontdekken, Ranglijst, Paspoort (met gastvoorbeeld), Vrienden en kamers (met fouten in gewone taal), en Uitleg (met tabs).
  - Privacy en voorwaarden hebben een inhoudsopgave en TODO's voor de eigenaar; de conceptzin is weg.
  - Bronnen staan nu in datasetkaarten.
- **Staten.** Skeletons in plaats van "Loading…", en vriendelijke lege en foutschermen.
- **Na een dagspel.** Een getrapte viering (punten, record, reeks, doel), met respect voor reduced motion. Resettijden staan er als "over 3 u 42 min".
- **Opruiming.**
  - 1.191 ongebruikte CSS-regels weg.
  - Vier lettertypes weg: bestanden, npm-pakketten en licenties.
  - Ongebruikte bestanden weg: afbeeldingen en `SpanishInfo`.
  - `RovikoApp` opgesplitst in `components/app`, `ds`, `home`, `shell` en `pages`.

Details en openstaande punten: `docs/REDESIGN_1_14.md`. Tests: `docs/QA_1_14.md`.

## 1.15.0: vrienden, motivatie, spelschermen

**Let op bij de hosting.** Er is een **nieuwe migratie**: `drizzle/0004_daffy_tusk.sql`. Die voegt twee tabellen toe, `user_presence` en `room_invites`. Het is alleen een toevoeging; bestaande data verandert niet. Er zijn geen nieuwe geheimen.

- **Vrienden uitnodigen**
  - Op `/friends` zie je wie van je vrienden online is, en of ze in een kamer zitten.
  - Met één tik op "Uitnodigen" maak je een kamer en krijgt je vriend direct een uitnodiging. Zit je al in een kamer, dan nodig je in de lobby uit via "Vrienden uitnodigen".
  - Wie uitgenodigd is, krijgt een melding met "Meedoen". Er is geen link of code meer nodig.
  - Zit een vriend al in een kamer, dan kun je met "Meedoen" direct aansluiten.
  - Online-status is alleen zichtbaar voor geaccepteerde vrienden.
- **Homepage die laat terugkomen**
  - De mascotte met ring is terug, zoals in 1.13. Elke boog is een dagspel en kleurt als dat spel klaar is.
  - De tekstballon zegt hoeveel spellen er nog zijn, waarschuwt als je reeks in gevaar is en meldt het als een schild je reeks heeft gered.
  - De reeks staat groot bovenaan, met een voortgangsbalk naar de volgende mijlpaal en het aantal schilden.
  - "Versla gisteren" en "je beste dag" als doel om punten te halen.
  - De dagdoelen en een weekoverzicht (gespeeld, gered door een schild, vandaag) staan direct op de homepage.
- **De reis van vandaag is een mix.** Vijf stops, vijf verschillende spellen, als kaarten met hun illustratie, status en punten.
- **Persoonlijk record.** De server geeft per dagspel je beste eerdere score terug, plus je beste dag en je totaal van gisteren. De viering toont "Persoonlijk record" alleen als je dat echt verbetert. Op de uitslagkaart staat "Je beste tot nu toe" of "Nieuw persoonlijk record! Vorige: …".
- **Mascotte met stemmingen:** blij, juichend, knipogend, bezorgd, slaperig en nieuwsgierig. Te zien op de homepage, bij uitslagen, bij het duel en op de uitlegpagina.
- **Uitlegpagina.** Elk spel heeft nu ook een uitgewerkt voorbeeld, in het Engels, Nederlands en Spaans.
- **Spelschermen.** Alle spellen gebruiken nu één gedeelde spelkop (`components/game/GameHeader.tsx`): sluiten, het spelicoon met de naam en de editie, de teller, uitleg en een voortgangsbalk in de spelkleur. Antwoordkaarten, feedback en uitslagen zijn in dezelfde rustige stijl gezet. Emoji zijn vervangen door de mascotte en lijniconen.
- **Tests.** Er zijn drie tests bij gekomen: persoonlijke records, uitnodigingen en online-status, en de voorbeelden op de uitlegpagina. **124 van 124 geslaagd.**

## 1.15.1: sneller

Geen migratie en geen spelregelwijzigingen.

**Vlaggen**
- **De vlag van de volgende vraag laadt al op de achtergrond** terwijl je de uitleg bij je antwoord leest. Klik je op "Volgende", dan staat hij er direct.
  - Dit werkt alleen voor gewone vlagvragen. De verborgen vlag-hint van Clue Trail blijft geheim.
  - Een vlag uit een toekomstige ronde blijft onbereikbaar zolang de huidige vraag nog open staat (getest).
- **De eerste vlag van een spel** begint te laden zodra je op Start tikt, tegelijk met het openen van het spel.
- **Vlaggen van officiële dagspellen** mag de browser nu privé bewaren. Het adres geldt voor één sessie en één ronde, en de afbeelding verandert nooit. Eerder stond dit op `no-store`, waardoor elke keer de server én de database nodig waren.
- **Negen zware vlaggen** met ingewikkelde wapens (Servië, Mexico, Bolivia, Spanje, El Salvador, Montenegro, Guatemala, Kroatië en de Dominicaanse Republiek) zijn omgezet naar een scherpe WebP binnen hetzelfde `.svg`-pad. Gecomprimeerd gaan ze van 196 KB naar 87 KB, en een telefoon hoeft die ingewikkelde tekeningen niet meer te renderen.
  - Het script is `scripts/optimize-flags.mjs`. Het leest de originelen uit `flag-icons` en zet alleen om als het echt kleiner wordt.

**JavaScript en CSS**
- **Serverdata kwam per ongeluk in de browserbundel.** Ongeveer 290 KB aan landen- en statistiekdata kwam mee via het Wereldduel. De helpers staan nu in `lib/puzzles/duel-shared.ts`.
- **Pagina's en spellen laden pas als je ze opent.** Dat geldt voor Ontdekken, Ranglijst, Paspoort, Punten, privacy, voorwaarden, bronnen, Rank Radar, Side by Side, Mosaic en Wereldduel.
- **Het resultaat:**

| | Vóór | Na |
| --- | --- | --- |
| Hoofdbundel | 945 KB | 291 KB |
| Alle JavaScript bij het openen van de homepage | ruim 1,2 MB | ongeveer 750 KB |
| CSS | 438 KB | 313 KB |

  Aan de CSS-kant komt de winst van twee dingen: Tailwind scant alleen nog de gebruikte componenten, en 141 ongebruikte regels zijn weg.

**Cache en scrollen**
- **De service worker** bewaart nu ook illustraties, lettertypen, landvormen en de mascotte, naast vlaggen en data.
- **`public/_headers`** geeft lange cache-tijden voor statische bestanden. Of de host dit bestand gebruikt, hangt af van de hostingconfiguratie. De service worker werkt hoe dan ook.
- **Soepeler scrollen:** de vaste balken gebruiken geen achtergrond-blur meer. Die was zwaar op goedkopere telefoons.

**Tests:** 125 van 125 geslaagd, waarvan één nieuwe test voor het vooraf laden van vlaggen.
