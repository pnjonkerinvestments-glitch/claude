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

## 1.16.0: getekende stijl en app-lancering

**Geen nieuwe migratie.** De laatste blijft `0004_daffy_tusk.sql`. Er zijn geen nieuwe geheimen en de API is niet gewijzigd. De cacheversie van de service worker is `roviko-shell-v1.16.0`.

**Nieuwe illustratiestijl.** De eigenaar leverde voorbeeldontwerpen aan in een vlakke cartoonstijl, met Roviko de wereldbol in elke illustratie. Die illustraties zijn uit de voorbeelden gehaald en als WebP in `public/art/` gezet:
- **Spelkaarten:** de vijf dagspellen (`rank-radar`, `world-trip`, `side-by-side`, `country-mosaic` en nu ook `clue-trail`), elk in 480 en 960 px. De extra's (`duel`, `mystery`, `classic`) zijn er in 480 en 720 px.
- **Paginakoppen:** `PageHeader` heeft een `art`-optie. Ontdekken en Samen spelen krijgen een scène (`explore-hero`, `friends-hero`). Ranglijst, Paspoort, Punten, Alle spellen en Vrienden krijgen een losse figuur (`spot-*`, `join-mascot`). Op de telefoon staat een scène onder de tekst en een figuur klein rechtsboven.
- **Ontdekken:**
  - De dagkeuzes staan op een ansichtkaartscène (`pick-tropical`, `pick-lake`, `pick-harbour`, gekozen per werelddeel), met de echte vlag op een kaartje erbovenop. De scène is decoratie, geen geografie.
  - De regiokaarten hebben een landschap met bezienswaardigheid (`region-*`).
- **Samen spelen:** een groepsscène op "Maak een kamer", een zwaaiende mascotte bij "Doe mee", cartoonvrienden en een nieuwsgierige gids bij de links.
- **Homepage:**
  - Gekleurde iconen bij reeks, vandaag en punten.
  - Bredere kaarten bij "Meer ontdekken".
  - Cartoonvrienden in het blok "Samen spelen" zolang er geen echte vrienden online zijn. Zijn er wel vrienden online, dan zie je hun eigen avatars.
- **Hoe speel je:** de nieuwsgierige gids met vraagteken.

**Mobiel hersteld.** Op de telefoon vielen de vlaggen van de regiokaarten over de tekst "45 landen". De tekst staat nu boven de illustratie en de kaart groeit mee. Getest op 390 px zonder horizontaal scrollen.

**Privacy.** Onder "Wat anderen zien" staat nu ook dat geaccepteerde vrienden je online-status zien. In NL, EN en ES.

**App Store en Google Play** (map `../roviko-app`):
- Icoon, opstartscherm, statusbalk en offline-scherm zijn in de 1.16-stijl: crème, met donkergroen in donkere modus. Het offline-scherm is er nu ook in het Spaans.
- Winkelteksten in NL, EN en ES.
- Captioned screenshots voor iPhone 6,9", iPad 13" en Google Play, plus een Play-banner en winkeliconen.
- De checklist staat in `roviko-app/LANCERING.md`.

**Tests:** 127 van 127. Nieuw: elke illustratie waarnaar de interface verwijst bestaat en blijft onder de 140 KB, en de regiokaarten houden hun tekst vrij van de illustratie.

## 1.17.0: rustige Roviko-lay-out uit de ChatGPT-ontwerpen

**Geen nieuwe migratie.** De laatste blijft `0004_daffy_tusk.sql`. Er zijn geen nieuwe geheimen en de API is niet gewijzigd. De cacheversie van de service worker is `roviko-shell-v1.17.0`.

**Basis.** De live site roviko.app draaide 1.15.1. De bundelnamen op roviko.app zijn identiek aan onze 1.15.1-build, dus de bron hier is precies de live versie, plus 1.16 en 1.17.

**Bron van de lay-out.** De eigenaar deelde acht ontwerpen via ChatGPT:
- desktop: Ontdekken en Samen spelen;
- mobiel: Punten, Hoe speel je, Dagdoelen en reis, Paspoort, Alle spellen en Klassieke spellen.

Die zijn per pagina nagebouwd, met meer witruimte en minder concurrerende kleuren, zoals gevraagd.

**Eén logo per spelvorm.** `components/atelier/GameIcon.tsx` tekent nu voor elke spelvorm een eigen logo als tweekleurige SVG, niet langer als los lijnicoon. Het gaat om 14 logo's:
- Rank Radar: radar;
- Wereldreis: wereldbol met vliegtuig;
- Side by Side: weegschaal;
- Country Mosaic: vier tegels;
- Clue Trail: kaart met speld;
- Wereldduel: kaarten;
- Mysterieland: vergrootglas;
- City Circuit: skyline;
- Flag Signal: vlag;
- Pinpoint: speld op doel;
- Next Door: wegwijzer;
- Size Shuffle: bollen op sokkels;
- Around the World: bol met baan;
- Kamers: twee spelers.

De logo's staan overal waar een spel genoemd wordt: dagkaarten, klassiekers, spelkoppen, tabs van Hoe speel je, dagdoelen, Punten, de spel-, kamer- en oefendialogen en recente spellen. Ze werken ook in de donkere modus.

**Per pagina**
- **Alle spellen:**
  - Dagspellen als kaarten met een illustratie, het logo op de rand, één regel tekst, "Tot 1.000 punten" en één duidelijke Start-knop. Oefenen en uitleg staan er rustig onder of in de hoek.
  - Extra's in twee kaarten.
  - Klassiekers als kaarten met een eigen scène: vergrootglas, stad, vlaggen, speld, wegwijzer en wereldbollen.
  - Regio en "Verras me" naast elkaar.
- **Ontdekken:**
  - Tips van vandaag op een landschap van het werelddeel, met de echte vlag als ansichtkaart.
  - Regio's als brede banners op desktop en als landschapskaarten op mobiel, met de tekst in de lucht zoals in het ontwerp.
  - Regio via `/explore#<regio>` te openen.
- **Paspoort:**
  - De regio's zijn dezelfde landschapskaarten, met x/5 en een link naar die regio.
  - De lege staat heeft de paspoort-illustratie.
  - De kaart staat in een eigen kaart.
- **Punten:**
  - Terug-knop.
  - Vier feitentegels met icoon en landschap: 1.000, 5.000, 1× en ∞.
  - De vijf dagspellen met hun logo's.
- **Hoe speel je:**
  - Kop met de nieuwsgierige wereldbol.
  - Tabs als pillen met logo.
  - Per spel de eigen illustratie; ook de klassiekers hebben er nu een.
- **Homepage:**
  - Dagdoelen met ondertitel, een groot logo per doel en doorklikken naar het spel.
  - Reiskaart met grote weekbolletjes en een schildregel die naar de uitleg linkt.
  - Samen spelen als lichte kaart in plaats van een donker blok.
- **Samen spelen:**
  - Kamerlogo bij "Maak een kamer" en meer ruimte.
  - Op mobiel één grote illustratie; de kop-illustratie en de gids-mascotte zijn daar weggelaten.
- **Ranglijst:** "Jouw plek" is een lichte kaart.
- **Documenten** (bronnen, privacy, voorwaarden): een Terug-knop.
- **Mobiel algemeen:**
  - Een zwevende, afgeronde tabbalk met een mint pil voor het actieve tabblad.
  - Kop-illustraties rechtsboven met de tekst eromheen.
  - Een warme vlam in de reeks-pil.
  - Op 320 px wordt niets meer afgekapt en scrolt er niets zijwaarts; dat is getest in EN, NL en ES.

**Illustraties.** Nieuw in `public/art/` (WebP, allemaal onder 140 KB):
- `scene-*`, `banner-*` en `pick-*` per werelddeel;
- `classic-*` per klassieker;
- `fact-*` (vier);
- `scoring-hero`, `howto-hero`, `quests-scene`, `journey-scene` en `passport-stamps`;
- een nieuwe `friends-hero` en `lobby-create`.

De tekst en knoppen die in de ontwerpen waren ingetekend, zijn weggehaald met inpainting. Elf oude illustraties die niet meer gebruikt worden, zijn verwijderd. In de donkere modus staan de illustraties op een klein papieren kaartje.

**Tests:** 128/128. Nieuw:
- alle illustraties bestaan en zijn licht, en er zijn geen ongebruikte bestanden;
- elke spelvorm heeft een eigen logo, en de logo's worden gebruikt;
- de regiokaarten houden hun tekstruimte.

## 1.18.0: Daily Detour, kort resultaat, spellen zonder scrollen

**Geen nieuwe migratie.** De laatste blijft `0004_daffy_tusk.sql`. De cacheversie van de service worker is `roviko-shell-v1.18.0`.

**Daily Detour (was Wereldreis).**
- Het dagspel "Wereldreis" heet nu **Daily Detour** (NL: Dagelijkse Omweg, ES: Desvío diario).
- Het zijn nu **20 vragen uit alle spelsoorten door elkaar**: vier keer vlaggen, hoofdsteden, de kaart, buurlanden en grootte. Ze zijn geschud, en hetzelfde type komt nooit twee keer achter elkaar.
- Elke vraag is 50 punten waard; op de kaart telt de nauwkeurigheid. Het maximum blijft 1.000.
- De punten per vraag zijn 1.000 gedeeld door het aantal vragen. Een editie die al met vijf stops is opgeslagen, houdt dus 200 per stop, en er verandert niets met terugwerkende kracht.
- De vijf-stoppenroute boven het spel is weg; de voortgangsbalk in de spelkop toont "3 / 20".

**Resultaat na een dagspel.** Eén kaart in Roviko-stijl:
- je punten;
- je plek tussen de spelers van vandaag ("#3 van 25 spelers") met een balk "Beter dan 88% van de spelers van vandaag";
- één knop naar het volgende dagspel, of wanneer de nieuwe spellen komen.

Het overzicht "nog x spellen", de dagdoelen, de reeks-uitleg en de lange scorekaart staan niet meer onder het resultaat. De terugblik op je antwoorden is ingeklapt.

**Spellen op de telefoon (en in de app).**
- De bovenbalk verdwijnt tijdens een spel.
- De knop om verder te gaan staat altijd vast onderin; je hoeft nooit te scrollen om door te gaan.
- Regels, puntenuitleg en "automatisch verder" staan achter de ?-knop, zodat het speelveld meer ruimte krijgt.
- Getest met een script dat elk spel uitspeelt op 390×844 en 375×667: Rank Radar, Daily Detour, Side by Side, Clue Trail, Wereldduel en vier klassiekers.

**Kortere pagina's.**
- Homepage: het blok "Samen spelen" is weg, want Vrienden heeft een eigen tabblad. Op mobiel verdwijnen ook de reiskaart (reeks en schild staan al bovenin) en de extra tekst.
- Alle spellen op mobiel: de dagspellen zijn compacte rijen met een Start-knop.
- De voettekst op mobiel toont alleen nog de kleine lettertjes.
- Paspoort: de kaart is lichter, met compacte statistieken; de wereldkaart is op mobiel weggelaten.

**Consistentie.**
- Het paspoort is een lichte kaart, zonder donker blok en zonder gouden knop.
- De tabs van Hoe speel je gebruiken dezelfde vierkante logotegels als de rest van de site.
- In de kamerinstellingen kies je het spel nu met logo's.
- De naam "Dagelijkse expeditie" is overal vervangen door de nieuwe naam.
- Op Punten stond de logorij dubbel met de regelkaarten; die rij is weg.

**App-modus.** In de App Store- en Google Play-app (Capacitor) en als thuisscherm-app krijgt de pagina de class `is-app`: geen voettekst en geen skip-link. `?app=1` toont deze modus in een browser.

**Tests:** 130/130. Nieuw:
- detour-puntentelling (20 × 50, oude editie 5 × 200);
- 20 gemengde vragen zonder herhaling na elkaar;
- resultaatkaart en vaste actiebalk.

## 1.19.0: Daily Detour als hoofdreis, Wereldduel met punten, spelen tegen de computer

**Nieuwe migratie: `drizzle/0005_wonderful_ikaris.sql`.** Die bouwt `daily_scores` opnieuw op met `duel` in de toegestane spellen (SQLite kan een CHECK niet aanpassen). Bestaande scores worden overgenomen. Zonder deze migratie worden duelpunten stil genegeerd. De cacheversie van de service worker is `roviko-shell-v1.19.0`.

**Dagspellen.**
- De Dagelijkse Omweg is de hoofdreis van de dag. De homeknop "Begin de reis van vandaag" start hem; daarna wijst dezelfde knop naar het volgende dagspel. Op Alle spellen staat hij als brede kaart boven de vijf dagspellen.
- Wereldduel is dagspel 2 (Rank Radar, Wereldduel, Side by Side, Country Mosaic, Clue Trail) en telt mee: 200 punten per gewonnen duel.
- Maximaal 6.000 punten per dag (Omweg + vijf dagspellen). De ring rond de mascotte heeft zes bogen; "Vandaag" telt tot 6.
- Het dagduel draait nu op de server (`POST /api/duels`, `POST /api/duels/:id/play`, `GET /api/duels/:id`). De browser krijgt de waarden en de perfecte route van een ronde pas na het spelen van een kaart. `GET /api/duel/today` is vervallen (gaf de oplossing vooraf). Oefenduels: `/duel/practice`, lokaal en zonder punten.
- Dagdoelen: het bonusdoel wisselt tussen het mysterieland en de Dagelijkse Omweg.

**Multiplayer.**
- Nu meteen spelen op `/multiplayer`: tegen een willekeurige speler (`POST /api/match/quick`) of tegen de computer (makkelijk, gemiddeld, moeilijk).
- Wie zoekt, ziet hoe lang het al duurt. Na 3 minuten zonder tegenstander verschijnt de knop "Speel tegen de computer" met een niveaukeuze; blijven wachten kan ook.
- In elke kamer kan de host computerspelers toevoegen en weghalen (max. 5).
- Potjes met een computerspeler tellen nooit mee voor de ranglijsten (geen matchscore, XP of winst), wel voor je eigen statistieken.

**Tests.** Nieuw: het gescoorde dagduel (verborgen waarden, eenmalig, 6.000 max), quick match en computer-na-wachten, computerspelers toevoegen/verwijderen, en `tests/bots.test.mjs` (geldige antwoorden voor elk vraagtype, moeilijker = vaker goed en sneller).

## 1.19.1: privacyverklaring en voorwaarden compleet

Geen nieuwe migratie. Cacheversie `roviko-shell-v1.19.1`.

- Privacy en voorwaarden zijn ingevuld met de gegevens van de eigenaar: Roviko, Herengracht 584, 1018 CJ Amsterdam, support@roviko.app. Geen gele "nog in te vullen"-blokken meer.
- Nieuw in de privacyverklaring: bewaartermijnen, hosting (nu OpenAI/ChatGPT-hosting), Google-login, de Autoriteit Persoonsgegevens. Nieuw in de voorwaarden: leeftijd (account vanaf 16, jonger met toestemming; gastspel voor iedereen), aansprakelijkheid, wijzigingen en Nederlands recht. Beide pagina's tonen de datum van de laatste wijziging.
- Automatische opschoning (`server/retention.ts`, draait hooguit elke 6 uur mee met gewoon verkeer): gasten zonder spel en zonder geldige sessie in 12 maanden worden met hun gegevens verwijderd, verlopen sessies en kamers ook. Accounts worden alleen door de eigenaar zelf verwijderd. Getest in `tests/integration.test.mjs`.

## 1.19.2: aanbieder als particulier

Geen migratie. Cacheversie `roviko-shell-v1.19.2`. Roviko is (nog) geen ingeschreven bedrijf: privacy en voorwaarden noemen nu Pepijn Jonker als verantwoordelijke ("Roviko is een privéproject van Pepijn Jonker"), met hetzelfde adres en support@roviko.app. Na een KvK-inschrijving alleen `OPERATOR` in `components/pages/InfoPages.tsx` aanpassen.

## 1.19.3: geen postadres

Het adres Herengracht 584 is niet van de eigenaar en is weggehaald. Privacy en voorwaarden noemen Pepijn Jonker en support@roviko.app. Voeg een adres pas toe (veld `at` in `OPERATOR`) als het echt in gebruik is.
