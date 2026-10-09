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

Geen migratie. Cacheversie `roviko-shell-v1.19.2`. Roviko is (nog) geen ingeschreven bedrijf: privacy en voorwaarden noemen nu P. Jonker als verantwoordelijke ("Roviko is een privéproject van P. Jonker"), met hetzelfde adres en support@roviko.app. Na een KvK-inschrijving alleen `OPERATOR` in `components/pages/InfoPages.tsx` aanpassen.

## 1.19.3: geen postadres

Het adres Herengracht 584 is niet van de eigenaar en is weggehaald. Privacy en voorwaarden noemen P. Jonker en support@roviko.app. Voeg een adres pas toe (veld `at` in `OPERATOR`) als het echt in gebruik is.

## 1.19.4: initiaal in plaats van volledige naam

Op verzoek van de eigenaar noemen privacy en voorwaarden "P. Jonker" in plaats van de volledige naam.

## 1.20.0: multiplayer-fixes, snellere vlaggen, sitecontrole

Geen nieuwe migratie. Cacheversie `roviko-shell-v1.20.0`. Nieuwe route `GET /api/version`.

**Multiplayer**
- Landen op grootte (en de kaart): liep de tijd af voordat je op "Bevestig volgorde" drukte, dan telde de ronde als fout, terwijl het scherm jouw lijst met groene vinkjes liet zien. Nu wordt een lijst die je hebt gesorteerd (of een pin die je hebt gezet) vlak voor het einde automatisch verstuurd. Zonder antwoord toont de onthulling de juiste volgorde, met de uitleg dat de tijd om was.
- Clue Trail: elke hint heeft vanaf het begin een vaste plek en de vlag staat als vierde hint klein in de lijst. De antwoorden schuiven daardoor niet meer omlaag (gemeten: 0 px verschuiving op telefoon en desktop).
- De vlag van de volgende vraag wordt al tijdens het aftellen geladen.

**Snelheid**
- `/api/flag` zoekt het land op in een vooraf gemaakte tabel, zet het antwoord in de Cloudflare-edgecache en laat browsers het een jaar bewaren (`immutable`). De vlag in een vraag laadt met voorrang.

**Sitecontrole (uit VERBETERPLAN_1.20, alleen wat klopte)**
- Scoring- en uitlegpagina: Wereldduel werd nog als "geen punten" genoemd; nu klopt het overal (200 per duel). Uitlegpagina toont bij Wereldduel de eigen puntenregel.
- Homepage-reis: zes stops (Omweg + vijf dagspellen), "0 van 6", "Zes stops, tot 6.000 punten".
- Omweg-omschrijving: "20 gemengde vragen: vlaggen, hoofdsteden, de kaart en meer" (was "uit alle spellen").
- Teksten: "five-character code", "Play against a random player", "Gets about two in three right", "in een paar korte regels" in plaats van "in drie stappen".
- Wereldduel past op een kleine telefoon (375×667): compacte arena, alle kaarten in beeld.
- Eigen meta-omschrijving per pagina, deelafbeelding 1200×630 (`/og/roviko-1200x630.png`), Open Graph en Twitter-card op alle pagina's, canonical altijd naar roviko.app, geen canonical op privépagina's, robots.txt met sitemap, sitemap met absolute roviko.app-URL's.
- Onbekende routes geven HTTP 404 met de vriendelijke pagina.
- Service worker was al in orde (pagina's altijd van het netwerk, oude caches worden verwijderd).
- Secrets-scan over de hele git-historie: niets gevonden.

### 1.20.0 (vervolg): melden en blokkeren, stabiele verbinding, klaar voor Apple

**Nieuwe migratie: `drizzle/0006_gifted_psylocke.sql`** (tabellen `player_blocks` en `player_reports`). Het deployscript past die toe.

- **Verbinding in multiplayer:** een kamer-verbinding is één lange Worker-aanroep, en Cloudflare staat per aanroep een beperkt aantal databasevragen toe (50 op het gratis plan). Na 20 tot 40 seconden bleef het daarom stil, tot de browser na 22 seconden opnieuw verbond. Nu telt de server zijn vragen (`countingDB`) en geeft hij de speler vóór de grens door aan een nieuwe verbinding (`{type:'reconnect'}`). De browser verbindt stil opnieuw; wat je in die tussentijd verstuurt, gaat mee.
  - Gemeten: 7 overdrachten in 90 seconden spelen, 0 seconden "opnieuw verbinden" in beeld, alle antwoorden geteld.
- **Melden en blokkeren (Apple 1.2):**
  - namenfilter EN/NL/ES op de server (`lib/name-filter.ts`);
  - knop ⋯ bij spelers in de wachtruimte, de eindstand en de vriendenlijst, met vier meldredenen en blokkeren;
  - blokkades gelden op de server: geen gedeelde kamer, geen koppeling bij een willekeurige tegenstander, geen vriendschap, uitnodigingen of online-status;
  - lijst met geblokkeerde spelers in het Paspoort;
  - gemelde spelers staan in `/admin`, met reset van de naam en blokkeren van het account. Zie `docs/MODERATIE.md`.
- **Voorwaarden en privacy:** regels tegen aanstootgevende namen, opvolging binnen 24 uur, en wat er bij melden of blokkeren wordt bewaard.
- **Contact:** support@roviko.app in de footer en in het Paspoort, met ook een link naar de privacyverklaring.
- **Wachtruimte van een kamer op de telefoon:** liep rechts buiten beeld. Opgelost en gecontroleerd op 320 en 390 px.
- **Documenten voor de stores:** `docs/APP_REVIEW_NOTES.md` (tekst voor de reviewer) en `docs/STORE_PRIVACY.md` (privacylabels, Data safety, leeftijd).

## 1.21.0: menu, account, Multiplayer-tab, eerlijke kaartvragen, competitie

**Niet live zetten voordat Apple de app heeft goedgekeurd.** Nieuwe migratie: `drizzle/0007_yummy_dragon_lord.sql` (kolom `users.email_verified`, tabel `email_tokens`); de deployworkflow past hem vanzelf toe. Nieuwe optionele geheimen: `RESEND_API_KEY`, `MAIL_FROM`. Cacheversie `roviko-shell-v1.21.0`, dataset `atlas-2026-09-25-r6`.

- **Menu (☰)** met Mijn account, Vrienden, Instellingen, Ranglijsten, Hoe speel je en Puntentelling.
- **Mijn account** (`/account`): e-mail met bevestigd-badge en knop om te bevestigen, wachtwoord wijzigen, wachtwoord vergeten (via e-mail), vriendcode, gegevens downloaden, contact, privacy, uitloggen, account verwijderen, geblokkeerde spelers. Het Paspoort linkt ernaartoe ("Account en privacy").
- **Instellingen** (`/settings`): geluidseffecten, zachte achtergrondmuziek (Web Audio, geen bestanden), taal, thema, dagherinnering in de app, optionele metingen.
- **Huisknop in spellen** op de telefoon, zodat je altijd terug kunt naar het hoofdmenu.
- **Multiplayer-tab** (was Friends): bovenaan vrienden die online zijn met uitnodigen, verzoeken en vriend toevoegen met code; daaronder spelen tegen een willekeurige speler en tegen de computer; daaronder een privékamer.
- **Kaartvragen**: geen piepkleine eilanden meer (minimaal 3.000 km²); kleine landen openen ingezoomd met een korte hint; de regelregel onder de kaart is weg (staat in de uitleg).
- **Daily Detour** begint makkelijk: vlag, dan hoofdstad, bekende landen in de eerste drie vragen, geen klein land op de kaart in de eerste vijf.
- **Country Mosaic** compact: 4×4-raster zonder scrollen, opgeloste groepen als gekleurde balken, lange namen kleiner, op desktop maximaal 600px breed.
- **Nieuwste data**: 2025/2024 waar betrouwbaar, anders 2023 (zie START_HERE).
- **Competitie**: weekranglijst, vriendenranglijst, en overal "nog X punten tot plek N". Na de Detour zie je je dagplek en je doel.
- **Uit het Grok-plan** (alleen wat nuttig was): nieuwe homepagetekst en een welkomstregel voor nieuwe spelers, delen via het deelmenu van de telefoon, een eenmalige vraag aan gasten om hun voortgang te bewaren na de eerste Detour, "lokale dag" in plaats van "middernacht (UTC)", vriendelijkere gastnamen (bijv. "Brave Otter 42"), en Ontdekken toont bij elk land de juiste afbeelding (of een neutrale kaart). Niet overgenomen: "Detour-first in plaats van 6/6" (botst met het competitie-element) en "Friends niet hernoemen" (de eigenaar wil Multiplayer).

- **Bonustour**: zodra de zes spellen met punten klaar zijn, wijst de homepage (knop, mascotte en een uitgelicht blok bovenaan) naar zes klassieke spellen met elke dag andere landen, dezelfde voor iedereen. Na elk bonusspel zie je hoe je het deed ten opzichte van de spelers van vandaag en ga je met één knop door naar het volgende; na het laatste dagspel verwijst het resultaat direct naar de bonustour. Geen ranglijstpunten. Nieuwe migratie `drizzle/0008_rainy_amphibian.sql` (alleen een index voor die vergelijking).
- **Rondleiding** bij het eerste bezoek (4 stappen, voor gasten een 5e over het gratis account), ook via het menu. Het aanmeldvenster toont wat een account oplevert, en gasten die al spelen zien op de homepage een blok "Je reeks staat alleen op dit apparaat".

- **Na feedback (1 oktober):**
  - Downloadscherm voor iPhone-bezoekers in de browser en een link "Download de iPhone-app" onderaan.
  - Snellere antwoorden in de dagspellen: de server verwerkte na elk antwoord alle eerdere antwoorden opnieuw (bij vraag 20 tientallen databaseacties); nu één bundel per antwoord.
  - Next Door: het gevraagde land blauw, het buurland oranje, met legenda.
  - "Run it back" werkt voor iedereen en start direct een nieuwe wedstrijd.
  - Multiplayer stabieler: geen herverbinding meer elke ~25 seconden en geen foutmeldingen bij tijdelijke drukte.
  - Kaartvragen vanaf 3.000 km² (dus ook Fiji, Vanuatu, de Salomonseilanden, Cyprus).

- **Na feedback (spelelement, 1 oktober):**
  - **Rank Radar** opnieuw ontworpen (naar GeoRankle, maar beter): acht landen en acht onderwerpen per dag, elk onderwerp één keer. Je ziet alle landen vooraf, na elke keuze de plek van dat land in alle acht onderwerpen, tot 125 punten per land en aan het eind de best mogelijke score van de dag.
  - **Side by Side**: 15 vragen, van makkelijk naar moeilijk; één fout en je run is voorbij.
  - **World Duel**: 7 landen, en je ziet pas na je laatste kaart wie er won, in een overzicht per land waarin je elk duel kunt openen en doorklikken.
  - **Overleven** (nieuw blok op de homepage en bij Alle spellen): drie dagelijkse runs waarin één fout je eruit gooit: Size Shuffle, Next Door en het nieuwe **Vormenjacht** (land herkennen aan zijn omtrek). Elke run wordt per vraag moeilijker. Je ziet hoeveel spelers je verslaat en de langste run van vandaag.
  - Alle zes dagspellen geven elk account dezelfde vragen (dat was al zo; nu ook voor de nieuwe borden gecontroleerd en getest).
  - Eindscherm van de dagspellen duidelijker, menu-knoppen goed uitgelijnd, elk land bij "Today's picks" een herkenbaar plaatje (vorm van het land als er geen foto is), alle afbeeldingen opnieuw scherp gemaakt (2×).

Getest: `npx tsc`, `npm run build`, `npm test` (146/146), schermafbeeldingen op 390×844 en 1280×800 van home, Multiplayer (gast en account), Account, Instellingen, Ranglijsten, Ontdekken, menu en Country Mosaic. Nog fysiek te controleren: muziek en geluid op een echte iPhone, e-mails zodra Resend is ingesteld.

## 1.22.0: de social-stijl op de hele site (2 oktober 2026)

**Waarom.** De video's en posts (shorts, Flag a Day, "Sounds fake", de Guess the country-carrousels) hebben een eigen, herkenbare beeldtaal gekregen. De website spreekt nu dezelfde taal, zodat iemand die via een video binnenkomt meteen herkent waar hij is.

**Wat er verandert (alleen presentatie).**
- Nieuwe laatste CSS-laag `app/social.css`, geladen na `design.css` (`app/layout.tsx`). De spellen, het spelverloop, de puntentelling en de API zijn niet veranderd.
- **Knoppen en labels:** pillen. Knoppen in Fredoka met een zachte lift en een verende hover; kleine labels (kickers, eyebrows) als witte pillen in gespatieerde hoofdletters, zoals "SOUNDS FAKE · #1" in de video's.
- **Kaarten:** grotere hoeken, de zachte dubbele schaduw uit de video's, spelkaarten die verend omhoog komen bij hover.
- **Spelschermen:** elke vraag op een donkergroene kaart met witte tekst. De vlag staat in een witte lijst. De antwoorden zijn pillen met een rond cijferbolletje, en bij een antwoord loopt de pil groen (goed) of rood (fout) vol vanaf het bolletje, met een vinkje of kruisje en een kort schudje bij fout. Nieuwe antwoorden komen één voor één binnen. Feedback met een rond icoon, gekleurde kop en neutrale tekst. Sorteerlijsten en hints als pillen met ronde nummers.
- **Kaart (Pinpoint, Daily Detour):** postkleuren: lichtblauwe zee, mintgroen land, witte grenzen, in een witte lijst. Donkere modus: diepblauwe zee, groen land.
- **Homepage:** Roviko praat in een witte tekstballon (springt binnen), maakt kleine sprongetjes, de kernwoorden van de kop staan in merkgroen (`homeTitleHl` in `i18n/v121.ts`, EN/NL/ES), een kleurhalo achter de mascotte.
- **Paginakoppen:** de illustratie staat in een zachte mintgroene halo.
- **Navigatie:** de actieve tab is een donkergroene pil; op de telefoon zweeft de tabbalk als pil boven de pagina.
- **Niveaus** (spelen tegen de computer): Easy groen, Medium blauw, Hard rood, zoals de niveaupillen in de carrousels.
- **Achtergrond:** zachte groene, blauwe en gouden halo's op het crèmekleurige canvas, zoals in de video's.
- **Uitslag:** de dagscore in merkgroen, een verlopende balk, de mascotte springt.
- **Opgelost:** in de kamerinstellingen op de telefoon liepen de spelkiezer en de rondes over elkaar heen (bestond al in 1.21); ze krijgen nu de volle breedte.
- Service worker-cache: `roviko-shell-v1.22.0`.

**Tweede ronde (2 oktober 2026): de scènes uit de video's.**
- **Roviko met armen en benen** (`components/ds/Character.tsx`): dezelfde tekening als in de video's (`social/roviko-shorts/lib/core.js`), met gezichten (blij, juichen, knipoog, bezorgd, geschrokken, verdrietig, nieuwsgierig, slaperig, cool) en houdingen (zwaaien, juichen, schouders ophalen, wijzen, handen in de zij). Het lichaam is `public/mascot-body.svg`. Staat in de hero, in elke paginakop, in de dagdoelen en de reeks, in de footer en in de feedback na elk antwoord (juicht bij goed, schrikt bij fout).
- **Eindschermen** (`components/ds/FinishStage.tsx`): elk eind van een spel is een scène zoals in de video's: een donkergroen podium (goud bij een topscore, met confetti; een rood accent als een run voorbij is), het kopje als witte tekstballon met een gekleurd woord, Roviko die reageert, de score groot in wit, de cijfers als donkere pillen en het antwoordspoor als bolletjes. Geldt voor alle dagspellen (`DailyFinish`/`DailyResult`), de klassieke spellen, Overleven, oefenpuzzels, World Duel-oefening en het multiplayerpodium.
- **Paginakoppen en de hero**: dezelfde donkergroene scène op elke pagina (`PageHeader` in `components/ds/States.tsx`), met Roviko in een houding die bij de pagina past; de hero van de homepage is groen met een gouden knop en Roviko in de voortgangsring. De wachtkamer van een kamer krijgt dezelfde kop. De footer is groen, Roviko staat erop.
- **Spelcovers als vector** (`components/ds/GameScene.tsx`): de oude covers waren opgeschaalde, sterk gecomprimeerde bitmaps en daardoor wazig. Nu zijn het getekende scènes (scherp op elk scherm) voor de zes dagspellen, de zes klassieke spellen, de drie Overleven-runs, het mysterieland, de klassieke spellen en Multiplayer. Echte vlaggen uit `/flags/`. De bitmaps blijven staan voor de iOS-assets.
- **Vlaggen in echte verhoudingen**: de 4:3-vlaggen van flag-icons zijn vervangen door de Wikipedia-vlaggen (publiek domein) uit svg-country-flags 1.2.10, met svgo geoptimaliseerd; elf vlaggen met een gedetailleerd wapen als scherpe WebP in een SVG (`scripts/import-flags.mjs`). Nepal, Zwitserland, Qatar en de rest hebben nu hun echte vorm; vlaggen worden nergens meer bijgesneden. De grote vlag in de vlaggenspellen staat er los en scherp, zonder lijst. `/api/flag/…` heeft `?v=2` gekregen zodat oude, een jaar gecachete vlaggen niet blijven hangen. Licentie: `public/licenses/flags-PD.txt`.
- **Rank Radar zoals GeoRankle** (zie `GAME_RULES.md`): de landen komen één voor één en je weet nooit welk land hierna komt (de browser krijgt alleen gespeelde landen en het huidige land). Na een keuze zie je alleen de wereldplek (#) van het gekozen onderwerp, met de vlag van het land in de onderwerpenlijst; na twee seconden komt het volgende land (of meteen met de knop). Alle plekken, het beste onderwerp per land en de best mogelijke score zie je pas aan het eind. Puntentelling ongewijzigd.
- Service worker-cache: `roviko-shell-v1.22.1`.

**Geen migratie, geen nieuwe geheimen, geen API-wijziging.**

Getest: zie `docs/QA_1_22.md`.

## 1.23.0: spelgevoel, delen en een reden om morgen terug te komen (6–7 oktober 2026, live sinds 7 oktober)

**Nieuwe migratie: `drizzle/0009_quiet_leagues.sql`** (alleen de tabel `league_members` met twee indexen; de deployworkflow past hem toe). Geen nieuwe geheimen. Nieuwe route `GET /api/league`. De puntentelling van dagspellen is niet veranderd. Cacheversie `roviko-shell-v1.23.0`, `/api/version` geeft `1.23.0`. De dataset-sleutel blijft `atlas-2026-09-25-r6`, zodat de dagpuzzels dezelfde landen houden. Plan en onderbouwing: `docs/VERBETERPLAN_1_23.md`. Tests: `docs/QA_1_23.md`.

**Bugs**
- **Hoofdsteden in het Nederlands.** "Vienna", "Lisbon" en "Warsaw" stonden als antwoorden in de Nederlandse versie. Nu Wenen, Lissabon, Warschau en de rest (`i18n/capitals-nl.ts`), in vragen, uitleg, Clue Trail, Mosaic en Ontdekken. Typantwoorden accepteren de Nederlandse, Engelse en Spaanse naam. Dagpuzzels die al in de database staan, krijgen de Nederlandse naam bij het tonen (`withSpanish` in `i18n/content.ts`); er wordt niets in de database veranderd.
- **Eswatini** heette in het Nederlands nog Swaziland en in het Spaans Suazilandia; nu Eswatini en Esuatini. Hoofdsteden: Mbabane (bestuurlijk) en Lobamba (koninklijk en wetgevend).
- **Bolivia:** La Paz telt als getypt antwoord.
- **Wereldduel** maakte geluid terwijl geluid uit stond.
- **Getallen** volgden de taal van het toestel in plaats van die van Roviko ("1,493" op een Nederlandse pagina).
- **Enkelvoud:** "1 dagen", "1 spelers" en "1 aanwijzingen" zijn nu "1 dag", "1 speler" en "1 aanwijzing" (EN/NL/ES).
- **De homepagekop** brak af als "aardrijkskunderei / s."; nu "aardrijkskunde- / reis.".
- **Na een fout antwoord** viel op de telefoon het goede antwoord of de uitleg achter de vaste knop. Het scherm schuift nu precies genoeg.
- **Country Mosaic** zei altijd "Perfect!", ook met 0 punten.
- **Side by Side:** "Eén fout. Run voorbij." stond in een smal kolommetje naast de knop.
- Kleinere: contrast van de copyrightregel (WCAG AA), een dubbel ranglijstverzoek op de homepage, plakkende hover-rand op touchschermen, `/api/version` stond nog op 1.21.0.

**Spelgevoel**
- Warme, afwisselende koppen na een antwoord ("Top!", "Net niet!", "4 op rij!", "Bijna! 240 km ernaast") en eindkoppen naar je score ("Wereldklasse!", "Sterk gespeeld!", "Mooie reis!", "Morgen weer een kans!").
- Geluid: een stijgend toontje bij goede antwoorden op rij en een fanfare op het eindscherm. In de app staat geluid standaard aan.
- **Trillen in de app** (Capacitor Haptics, zat al in de app maar werd niet gebruikt): bij goed, fout en het einde. Uit te zetten in Instellingen.
- Het antwoord en de kop springen even op; uit bij `prefers-reduced-motion`.
- Enter of spatie gaat naar de volgende vraag.

**Terugkomen en delen**
- **Reeksmoment:** na het eerste dagspel van de dag een kort scherm met de vlam, "5 dagen op rij!", je week en hoe ver het volgende reeksschild is.
- **Deeltekst als Wordle:** "Roviko #12 · Dagelijkse Omweg", 🟩🟥-vierkantjes, je punten en je reeks.
- **Deelbeeld:** op telefoons gaat er een afbeelding mee in het deelmenu (in de browser getekend, geen server).
- **Uitdaging:** wie een gedeelde link opent, ziet "Een vriend haalde 820 punten in Dagelijkse Omweg" en "Kun jij het beter?" met één knop.
- "Beter dan 0% van de spelers" is "Iedereen begint ergens. Morgen een nieuwe kans!".

**Eerste bezoek**
- Taal en licht/donker volgen het toestel, tot je zelf iets kiest.

**Snelheid**
- Het logo in de kop is 10 KB in plaats van 35 KB; de homepage doet één ranglijstverzoek minder.

**Bestanden:** nieuw `lib/feel-copy.ts`, `lib/haptics.ts`, `lib/plural.ts`, `lib/share-image.ts`, `i18n/v123.ts`, `i18n/capitals-nl.ts`, `components/ds/StreakMoment.tsx`, `components/home/ChallengeBanner.tsx`, `tests/v123.test.mjs`. CSS in `app/stage.css` (onderaan, gemarkeerd met 1.23).

### Tweede deel: overzichtelijker, Multiplayer zoals het ontwerp, weekgroepen (keuzes van de eigenaar, 6 oktober)

**Homepage, rustig.** Roviko in de ring met één knop en drie tellers; daaronder "Vandaag" als korte lijst van zes spellen en één kolom met de weekgroep (of de ranglijst voor gasten) en de dagdoelen (ingeklapt). Bonustour en Overleven pas na 6/6. Weg van de homepage: "Meer ontdekken", het weekblok, de puntenregel, de detourregel en de uitleglink. Kortere kop: "Elke dag een kleine wereldreis."

**Multiplayer zoals het ontwerp van de eigenaar.**
- De tab is één kaart: vijf Roviko-vrienden bij een meer (vector), "Samen spelen", drie keuzes (met vrienden, willekeurige speler, tegen de computer) en de kamercode.
- De wachtkamer: "Kamer K7QMA", 1/12, "Jij bent host · tot 12 spelers", rondes en niveau als pillen, de spelers als ronde avatars met kroon voor de host, één grote knop. Spelsoort, tijd en regio onder "Meer instellingen".
- Avatars zijn wereldbolletjes met een accessoire (zonnebril, muts, bloem, pet, bril, koptelefoon, safarihoed; de computer is een robotje) in plaats van emoji.
- Opgelost: de moeilijkheid "Gemengd" heette "Rond de Wereld"; "room" heet in het Nederlands overal "kamer".

**Weekcompetitie in groepen (alleen accounts).** Elke week groepen van maximaal 20 binnen Brons, Zilver, Goud, Smaragd of Diamant. Top 5 stijgt, onderste 5 daalt (groepen vanaf 10). Telt de gewone dagpunten van die week. Op de homepage één regel ("Bronsgroep · #4 van 20 · nog 3 dagen"), op de ranglijst een groepskaart met promotie- en degradatiezone. Gasten zien een uitnodiging.

**Verder.**
- Eerste bezoek: één welkomstkaart met "Speel je eerste vraag" in plaats van de rondleiding (die blijft in het menu).
- Dagoverzicht na het zesde dagspel met "Deel je dag"; een gedeelde dag opent als uitdaging.
- Alle spellen: bonustour, overleven en oefenen achter tabs. Paspoort: minder tegelijk.
- Schone kleuren: paarse en blauwe interface-accenten (vastgezet antwoord, Mosaic, Clue Trail, ranglijsttabs, schildje) zijn merkgroen.
- Belarus in plaats van Wit-Rusland (keuze van de eigenaar), ook in al opgeslagen puzzels.
- Sri Lanka had in de bron een landgrens met India; die is weg. Gevonden door de nieuwe datacontrole `tests/data-sanity.test.mjs`.
- Account- en instellingenpagina laden pas als je ze opent. Twee ongebruikte illustraties verwijderd.

**Tests:** 166/166. Nieuw: `tests/v123.test.mjs` (10), `tests/league.test.mjs` (5, echte D1), `tests/data-sanity.test.mjs` (2). Aangepast aan bewuste wijzigingen: de deeltekst (`rank.test`, `reliability.test`), de feedbackkoppen (`learning-ui.test`) en de homepage (`rendered-html.test`).

### Derde deel: de trip-stijl naar de voorbeelden van de eigenaar (7 oktober)

De eigenaar vond de beeldtaal van het tweede deel geen verbetering en stuurde vijf voorbeelden: een spelscherm met vlag, een kaartvraag, een multiplayerronde, de multiplayeruitslag en een eindscherm. Alles volgt nu die stijl. Spelregels, punten, tijden en wat de server stuurt zijn niet veranderd.

**De basis (`app/trip.css`).** Crème achtergrond zonder kleurhalo's, witte afgeronde kaarten, koppen in donkergroen, knoppen als donkergroene pillen. Bovenaan elke pagina een gouden reekspil ("🔥 7 dagen reeks"; zonder reeks "Begin je reeks"); op de telefoon logo links, pil in het midden, menu rechts. De zwevende tabbalk heeft een mintgroene pil voor de pagina waar je bent.

**Spelen.** Elk spel heeft dezelfde bovenbalk: een rond sluitkruisje, een dunne voortgangsbalk en een witte pil met een gouden munt en je punten. Die pil wipt op en toont "+50" als er punten bijkomen. De vraag staat op een witte kaart met een groen regeltje ("Dagelijkse Omweg · 1/20") en een grote vraag; Roviko gluurt over de rand, kijkt vrolijk, juicht bij goed en schrikt bij fout. Vlaggen staan groot met een schaduw op de kaart. Antwoorden zijn mintgroene pillen over de hele breedte, zonder cijferbolletje (toetsen 1–4 werken nog); goed wordt donkergroen met ✓, een fout gekozen antwoord zacht rood met ✗. Kaarten staan in een lichtblauwe kaart. Na een antwoord één compacte witte kaart met de kop, gouden punten en het weetje. De regels staan achter de ?-knop, ook op desktop.

**Dagspellen met een eigen scherm.** Rank Radar, Wereldduel, Side by Side, Country Mosaic, Clue Trail, Overleven, Size Shuffle en getypte hoofdsteden zijn één familie met de vraagkaart: witte kaart met Roviko, mintgroene keuzes, donkergroen voor gekozen en goed, zacht rood voor fout, gouden "+67 pt" bij punten. Bij het Wereldduel is het overzicht per land op het eindscherm ingeklapt. Mosaic past op 320 px, ook met lange Spaanse en Nederlandse woorden. De oude Rank Radar van vóór 1.21 (alleen nog voor opgeslagen spellen) ziet er hetzelfde uit.

**Eindschermen.** Geen gekleurd podium meer, maar Roviko groot op crème, de kop in donkergroen, je punten met een munt, je antwoorden als stipjes, daaronder één witte kaart met je plek en één knop "Volgende: <spel>" met het spellogo. Delen en Klaar zijn rustige tekstknoppen. Na het zesde spel: "Mooie reis. Morgen weer?", je dagtotaal van 6.000, je plek, de zes spellen met punten, een knop "Bonustour" en een omlijnde knop "Daag een vriend uit". Het reeksmoment heeft een gouden vlam, je aantal dagen en de week als stipjes. Na een lage score staat er "Elke reis telt!" in plaats van "Morgen weer een kans!" (er staan dan vaak nog spellen klaar).

**Multiplayer.** Een ronde: sluitkruisje, voortgang, een tijdpil (rood onder 6 seconden) en je punten; op de vraagkaart "RONDE 1/10 · GEMIDDELD" met een stipje per ronde; na de onthulling staan de avatars van de spelers op het antwoord dat ze kozen en krijg je je punten als gouden pil. De tussenstand is een witte kaart (op desktop ernaast, op de telefoon compact). De uitslag: alle avatars bovenaan, "EINDSTAND · 10 RONDES", "Jij wint!" of je plaats, "1e van 12 spelers", je punten, een juichende Roviko boven een podium (goud in het midden, mint links, crème rechts) en "Nog een keer". De terugblik per ronde en alle spelers zijn ingeklapt. De Multiplayer-tab, het zoeken naar een tegenstander en de wachtkamer volgen dezelfde stijl; gasten in de wachtkamer zien de instellingen als vaste pillen.

**Homepage.** Geen donkergroen blok meer: Roviko zwaait met een tekstballon, de kop, één knop ("Begin de reis van vandaag" of "Verder: <spel>"). Daaronder "Reis van vandaag": één witte kaart met de resettijd, zes balkjes, de zes spellen als route (vinkje en punten met munt bij gespeelde spellen, "Speel" bij het volgende). Daarnaast de weekgroep of ranglijst en de dagdoelen. Een gedeelde uitdaging staat in de tekstballon. Alle spellen (`/daily`) heeft dezelfde kop en kaarten.

**Overige pagina's.** Ontdekken, Paspoort, Ranglijst, Instellingen, Account, Vrienden, Uitleg, Punten, privacy/voorwaarden/bronnen, de quizpagina's en 404: lichte paginakop met een klein label, een grote donkergroene titel en één korte regel, witte kaarten, tabs met een mintgroene pil. Het aanmeldvenster heeft een zwaaiende Roviko. Paspoort: elk van de 30 prestaties een eigen icoon (spellen met hun logo), en de doelen staan er goed ("10 spellen gespeeld" in plaats van "1 Games played"). Lege blokken zijn verborgen.

**Fouten gevonden en opgelost.**
- De puntenuitleg (`/scoring` en de notities in spellen) beschreef Rank Radar en Side by Side nog zoals vóór 1.21 (zes landen, tien vergelijkingen). Nu: acht landen tot 125 punten, en vijftien vergelijkingen waarbij de eerste fout stopt.
- Nederlands: overal "kamer" in plaats van "room" ("Gewonnen kamers", "Kopieer kamercode").
- Schakelaars staken uit hun baan als ze aan stonden; dialoogtitels liepen onder het sluitkruisje.
- Multiplayeruitslag met precies 1 punt toonde "1 1 punt"; de knop naar huis heette in het Spaans hetzelfde als opnieuw spelen.
- In donker waren Roviko's armen en benen bijna onzichtbaar.

**Bestanden.** Nieuw: `app/trip.css`, `app/trip-home.css`, `trip-puzzles.css`, `trip-mp.css`, `trip-finish.css`, `trip-pages.css`, `i18n/trip.ts`, `components/ds/Coin.tsx` (munt, muntpil, vlam), `components/multiplayer/Live.tsx`, `components/multiplayer/MatchResults.tsx`. `Peek` in `components/ds/Character.tsx`. Aangepast: `GameHeader`, `Question`, de eindschermen, de homepage, de dagspellen en de pagina's. Geen nieuwe migratie, geen nieuwe afbeeldingen.

**Tests:** 166/166. Aangepast aan bewuste wijzigingen: de homepagetest (`rendered-html.test`, de nieuwe opzet) en twee testnabootsingen die nu ook `formatScore` nodig hebben (`puzzle-ui.test`, `rank.test`).

## 1.32.0 (nog niet live; op de preview)

- **Daily Detour: 10 vragen in plaats van 20.** Twee van elk type (vlag, hoofdstad, kaart, buren, grootte), nog steeds makkelijk beginnend. Elke vraag is nu 100 punten waard, dus het maximum blijft 1.000. De vragen van een dag liggen vast zodra de eerste speler begint: de dag waarop 1.32 live gaat houdt nog 20 vragen, de dag erna zijn het er 10. Teksten, uitleg en puntenuitleg zeggen overal 10.
- **Altijd licht.** Roviko start altijd in de lichte kleuren en blijft licht, ook als de telefoon op donker staat. De keuze licht/donker is uit Instellingen gehaald. De iOS-app krijgt bij de volgende build ook `UIUserInterfaceStyle` = Light; de app laadt roviko.app, dus de website-wijziging werkt daar meteen.
- **Rondleiding bij de eerste start.** In plaats van de ene welkomstkaart krijgt een nieuwe speler meteen een korte, vriendelijke rondleiding van 9 kaartjes, in de volgorde van spelen: wat Roviko is, de Daily Detour, de vijf dagspellen, reeks en reeksschild, de ranglijst en weekcompetitie, de bonustour en klassiekers, landen ontdekken met paspoort en continentstempels, multiplayer en vrienden. Elk kaartje heeft een plaatje of Roviko en "Te vinden onder" met het tabblad. Gasten eindigen op "Bewaar je voortgang, gratis" met een gouden knop voor een gratis account (of eerst als gast spelen) en kunnen op het eerste kaartje meteen inloggen. Overslaan kan altijd; via menu → Rondleiding zie je hem opnieuw.
- Geen migratie. Service worker `roviko-shell-v1.32.0`.
- Getest: volledige testset (de drie Detour-tests aangepast aan 10 vragen en 100 punten), typecheck, build, en in de browser op een telefoonformaat: de rondleiding in het Nederlands en Engels, alle 9 stappen, een telefoon op donker blijft licht, "Eerst als gast spelen" start de Omweg met "1/10", "Maak een gratis account" en "Ik heb al een account" openen het juiste venster, daarna komt de rondleiding niet terug. Niet getest: op een echte iPhone en in de App Store-app.

## 1.31.0 (live sinds 8 oktober 2026)

- **Lucia neemt even de tijd.** Een vriendschapsverzoek aan Lucia 👽 staat eerst een minuut "in afwachting"; daarna accepteert ze vanzelf (binnen 60 tot 75 seconden, bij de volgende controle van de site). Pas dan staat ze online en kan ze je uitnodigen.
- Geen migratie. Service worker `roviko-shell-v1.31.0`.
- Getest: build en volledige testset (het verzoek blijft eerst in afwachting, geen uitnodiging vooraf, na een minuut geaccepteerd). Niet getest: in de browser en op een echte iPhone.

## 1.30.0 (live sinds 8 oktober 2026)

- **Lucia 👽, de computervriend.** Voeg haar toe met vriendcode **CAFE1C1A** (ze staat niet automatisch bij iedereen). Ze accepteert meteen en staat altijd online.
- **Altijd een tegenstander.** Nodig je Lucia uit in je kamer, dan doet ze direct mee als computerspeler op gemiddeld niveau.
- **Lucia nodigt zelf uit.** Ben je online, niet in een kamer en niet midden in een spel, dan nodigt Lucia je uit voor een potje in haar eigen kamer (zij is host, gemiddeld, 15 vragen), met de gewone uitnodigingskaart bovenin. Hooguit eens per 3 uur. Met het vinkje start het potje meteen. Wil je geen uitnodigingen meer, verwijder haar dan als vriend.
- **Eerlijk.** Ze heet overal "Lucia 👽" (eerst 🤖; de eigenaar koos 👽 omdat een alien beter bij de aardbol past). In kamers staat onder elke computerspeler nu "Computer · gemiddeld" in plaats van alleen "Gemiddeld". Potjes met haar tellen als oefenen, niet voor de ranglijsten.
- **Migratie `0011_lucia.sql`**: voegt alleen het account van Lucia toe (zonder e-mail of wachtwoord). Service worker `roviko-shell-v1.30.0`.
- Getest: build, volledige testset met een nieuwe test (toevoegen met code, meteen vrienden, altijd online, geen uitnodiging tijdens een spel, één uitnodiging per keer, haar kamer start bij binnenkomst met 15 vragen op gemiddeld, ze komt direct in jouw kamer); in de browser op 390 px: vriend toevoegen, uitnodiging van Lucia 👽 bovenin, vinkje, potje van 15 vragen met Lucia 👽 in de tussenstand. Niet getest: echte iPhone.

## 1.29.0 (live sinds 8 oktober 2026)

- **Naam vaster.** Een account kan zijn naam nog maar eens per 30 dagen wijzigen, alleen op de accountpagina en na een bevestiging ("Daarna kan dat pas weer over 30 dagen"). Is de naam vergrendeld, dan staat er vanaf welke datum het weer kan. De naam die je bij het aanmelden kiest telt als wijziging. Gasten kiezen hun naam nog steeds vrij (ook in de wachtkamer). Avatar en vindbaarheid kun je altijd aanpassen.
- **Welkomstmail.** Direct na het aanmelden stuurt Roviko een welkomstmail in de taal van de app (NL, EN of ES), met een knop om het e-mailadres te bevestigen, uitleg over het spel en je vriendcode. Verstuurt alleen als e-mail is ingesteld (`RESEND_API_KEY`); anders gaat het aanmelden gewoon door zonder mail.
- **Wachtwoord minimaal 8 tekens** in plaats van 12 (aanmelden, wijzigen, herstellen).
- **Migratie `0010_name_lock.sql`**: voegt alleen de kolom `users.name_changed_at` toe. Geen bestaande gegevens worden gewijzigd.
- Service worker `roviko-shell-v1.29.0`.
- Getest: build, volledige testset met nieuwe tests (7 tekens geweigerd, 8 goed; naam vergrendeld na aanmelden, na 30 dagen weer één keer; gasten vrij; welkomstmail met link, vriendcode en veilige naam). De mail zelf is als plaatje bekeken, niet echt verstuurd: op de live site staat e-mail nog niet aan.

## 1.28.0 (live sinds 8 oktober 2026)

- **Rode teller voor vriendschapsverzoeken.** Wacht er een verzoek, dan staat er een rode cirkel met het aantal op Multiplayer in de tabbalk (en bovenaan op de computer), in het menu bij Vrienden en in het vriendenblok. "1 friend request(s) waiting" is nu netjes enkelvoud of meervoud.
- **Uitnodiging als melding bovenin.** Nodigt een vriend je uit, dan valt er overal in de app een kaart in beeld: avatar van de vriend, "Uitnodiging voor multiplayer", "Ollie nodigt je uit voor een potje!", de kamercode, een rond kruisje om af te wijzen en een rond groen vinkje om mee te doen. Met een korte toon en trilling. Uitnodigingen komen sneller binnen (elke 15 in plaats van 40 seconden).
- Geen migratie, geen nieuwe geheimen. Service worker `roviko-shell-v1.28.0`.
- Getest: build, volledige testset (met nieuwe controle op de teller), in de browser met twee spelers: verzoek sturen (rode 1 op Multiplayer), accepteren, uitnodigen (kaart bovenin, ook boven een open venster) en via het vinkje de kamer in. Niet getest: echte iPhone (trillen, notch).

## 1.27.0 (live sinds 8 oktober 2026)

- **Rustiger deelbericht.** Geen blokjes en geen losse regels meer, maar drie korte regels: "Ollie scored 900/1,000 pts in Daily Detour 🌍", "🏆 Number 1 in the world today (3 players)" en "Can you beat that?" met de link. Zonder naam: "I scored …". Oefenspellen en kamers: "Roviko · Flag Signal: 8/10" en de link. Het deelplaatje houdt de blokjes, het editienummer en de reeks.
- **Gebruikscijfers op /admin.** Per dag (UTC, laatste 14 dagen): dagspelers en dagspellen, gestarte spellen en spelers, nieuwe spelers en accounts, plus het totaal. Alleen lezen. App-downloads staan in App Store Connect.
- Geen migratie, geen nieuwe geheimen. Service worker `roviko-shell-v1.27.0`.
- Getest: build, volledige testset, nieuwe tests voor het deelbericht (met en zonder naam of plek) en voor oude deelteksten in het plaatje. Niet getest: de beheerpagina met echte live cijfers (alleen met een lege testdatabase).

## 1.26.0 (live sinds 8 oktober 2026)

- **Delen met je plek.** De deeltekst van elk dagspel (Daily Detour, Clue Trail, Size Shuffle, Side by Side, Rank Radar, Wereldduel), van het dagtotaal en van de ranglijst van vandaag noemt nu je naam en je plek van vandaag, bijvoorbeeld "🏆 Pietje: nummer 1 van de wereld vandaag (230 spelers) · Kun jij dat verslaan?". De deelafbeelding toont dat als gouden balk.
- **De link vertelt het verder.** Naam, plek en taal reizen mee in de link. Wie hem opent, ziet op de homepage "Pietje haalde vandaag 3.879 punten · Nummer 1 van de wereld vandaag. Kun jij dat verslaan?", en WhatsApp en iMessage tonen dat al in de linkvoorvertoning. Het is een vriendelijke claim uit de link; er wordt niets opgeslagen. Grove of vreemde namen in een link worden genegeerd.
- **Grote deelknop.** Op het eindscherm van elk dagspel is "Daag je vrienden uit" nu een grote knop; op de ranglijstpagina staat dezelfde knop bij je plek van vandaag.
- **Sneller door.** Na een goed antwoord gaat het spel na 0,8 seconde door in plaats van na 3 seconden (Side by Side, Daily Detour, Clue Trail, Size Shuffle en de oefenspellen); Rank Radar na 1,3 in plaats van 2,2 seconden. Na een fout antwoord wacht het spel op jou, zodat je kunt lezen waarom.
- **Clue Trail.** De nieuwe hints van 1.25 staan sinds 8 oktober live, maar de dagelijkse Clue Trail van 8 oktober was al vóór de update aangemaakt en blijft die dag gelijk voor iedereen. Vanaf 9 oktober wisselen de hints ook in het dagspel.
- Geen migratie, geen nieuwe geheimen. Service worker `roviko-shell-v1.26.0`.
- Getest: build, volledige testset (alles geslaagd, 1 bewust overgeslagen), nieuwe test voor de deeltekst, de link en het naamfilter; in de browser op 390 px: eindscherm van Side by Side met de grote knop en de gekopieerde tekst, de homepage via een gedeelde link, de linkvoorvertoning (og:title/og:description) en de deelafbeelding. Niet getest: delen op een echte iPhone (deelvenster met afbeelding) en de voorvertoning in WhatsApp zelf.

## 1.25.0 (live sinds 8 oktober 2026)

- **Moeilijkheid.** Makkelijk, gemiddeld en moeilijk verschillen nu duidelijk. Makkelijk (na feedback "niet te makkelijk"): bekende landen plus de grootste andere (ongeveer 60), één fout antwoord uit hetzelfde continent en twee van elders, Size Shuffle-groottes minstens zo'n 2,4× uit elkaar, op de kaart landen vanaf 50.000 km². Moeilijk: minder bekende landen, foute antwoorden uit dezelfde regio die erop lijken, groottes dicht bij elkaar. Gemiddeld is ongewijzigd (de dagspellen gebruiken dat). Gemengd geeft elke vraag een eigen niveau. De wachtkamer zet onder de keuze één zin uitleg.
- **Speel opnieuw.** Na een multiplayerwedstrijd stuurt de tik van de host iedereen meteen terug naar de wachtkamer; de host kan rondes, moeilijkheid en de rest aanpassen. Gasten tikken "Ik doe mee" en tellen dan als klaar. Bij oefenspellen opent het het instelscherm met de vorige instellingen.
- **Spelers verwijderen.** De host kan in de wachtkamer spelers verwijderen (eerst een bevestiging). Wie verwijderd is, ziet dat netjes en kan die kamer niet meer in.
- **Eigen naam.** Iedereen, ook gasten, kan in de wachtkamer een eigen naam kiezen (zelfde naamfilter als bij accounts).
- **Leukere onderwerpen.** Side by Side, Rank Radar en het Wereldduel gebruiken alleen nog leuke onderwerpen. Nieuw: hoogste punt en kustlijn (ook in Side by Side), defensiebudget, alcohol, vliegvelden en spoorwegen (uit het Factbook-archief, CC0; defensiebudget is een schatting: deel van het bbp maal het bbp van de Wereldbank). Uit: bos, stadsleven, internet, kinderen per vrouw, landbouwgrond, export, gemiddelde hoogte en mediane leeftijd (oude spellen blijven leesbaar). Moordcijfers niet: er was geen open bron bereikbaar. Bronnenpagina en downloadbestand `/data/fun-metrics.json` bijgewerkt.
- **Clue Trail.** De eerste hint is niet meer altijd het continent: hij wisselt tussen continent, deel van de wereld, ligging ten opzichte van evenaar en Greenwich, oppervlakte en aantal buurlanden. Hint 2 is een andere vage hint of de beginletter van de hoofdstad, hint 3 een buurland of de hoofdstad, hint 4 blijft de vlag. Het continent valt alleen nog weg als hint als hij meer dan één antwoord zou wegstrepen; op gemiddeld komt nog maar één fout antwoord van een ander continent.
- Geen migratie, geen nieuwe geheimen. Service worker `roviko-shell-v1.25.0`.
- Getest: build, volledige testset (alles geslaagd, 1 bewust overgeslagen: de oude Mosaic-dagtest), nieuwe tests voor de niveaus, voor verwijderen uit de kamer en voor de nieuwe onderwerpen; in de browser op 390 px: wachtkamer met uitleg, verwijderen (gast ziet de melding), naam kiezen als gast (host ziet de nieuwe naam meteen; een grove naam wordt geweigerd), Rank Radar met de nieuwe onderwerpen. Niet getest: een volledige wedstrijd met "Speel opnieuw" in de browser (wel in de servertests), echte iPhone.

## 1.24.0 (live sinds 7 oktober 2026; Size Shuffle dagspel vanaf 8 oktober)

### Dagelijkse Size Shuffle in plaats van Country Mosaic

Op verzoek van de eigenaar is Country Mosaic geen dagspel meer; de **dagelijkse Size Shuffle** neemt de vierde plek in: Rank Radar, Wereldduel, Side by Side, Size Shuffle, Clue Trail (plus de Omweg). Nog steeds zes spellen en maximaal 6.000 punten per dag.

- **Spel.** Vijf rondes van vier landen, op oppervlakte sorteren (grootste bovenaan), van makkelijk (bekende landen, grootte ver uit elkaar) naar moeilijk (grootte dicht bij elkaar); geen land twee keer. Dezelfde landen voor iedereen per UTC-datum (`lib/puzzles/size-shuffle.ts`, opgeslagen in `daily_content`). Geen timer, één poging, hervatbaar.
- **Punten.** 50 per land op de goede plek, dus 200 per ronde en 1.000 in totaal (`placesRight`/`shufflePoints` in `lib/daily-scoring.ts`). De server rekent met de opgeslagen lijst; de volgorde en de oppervlaktes gaan pas na het bevestigen naar de browser. Het eindscherm telt "landen op de goede plek" (x/20) en foutloze rondes.
- **Hoe het werkt.** Een solo-sessie zoals de dagelijkse Clue Trail: `settings.mode: 'daily-order'`, soort `daily-order:competitive-v1`, competitiemodus `order` (naam, logo en uitleg van Size Shuffle). Oude clients merken niets: hun verzoeken veranderen niet.
- **Overgang per datum.** `SHUFFLE_FROM` in `lib/daily-loop.ts` (nu `2026-10-09`): datums ervoor houden Mosaic, vanaf die datum Size Shuffle (`dailyModesFor`/`dayModesFor`). Niemand krijgt op de wisseldag zeven dagspellen; een Mosaic die vóór middernacht begon, telt nog mee. **De lead zet `SHUFFLE_FROM` op de eerste UTC-dag na de release en verandert hem daarna nooit meer.**
- **Geen migratie.** `daily_scores` staat via een CHECK alleen de zes modi van 1.21 toe. De Size Shuffle gebruikt daarom de plek van Mosaic: opgeslagen als `mosaic` op datums vanaf `SHUFFLE_FROM`, teruggelezen als `order` (`ledgerMode` en de `CASE` in `server/competition.ts`). Totalen, weken en groepen tellen alleen op en merken niets. Oude Mosaic-resultaten blijven in de geschiedenis en de totalen.
- **Mosaic als extra.** Op Alle spellen onder Extra's en onder "Dagspellen oefenen", zonder punten. Een gedeelde Mosaic-link of een vraag om de gerangschikte Mosaic van vandaag opent na de wissel de ongescoorde editie van de dag.

### Rustiger Alle spellen (`/daily`)

De zes dagspellen staan als één witte lijstkaart zoals "Reis van vandaag" op de homepage (logo, naam, één korte regel, punten met munt / "Verder" / één donkergroene "Speel"-pil), met onderaan "Hoe speel je" en "Hoe punten werken". Daarna de extra's (Country Mosaic, Samen spelen, Mysterieland) als compacte rijen; op desktop staan beide kaarten naast elkaar. De tabs Bonustour / Overleven / Oefenen bleven, maar zonder grote illustraties: de bonustour en overleven tonen alleen logo's, Oefenen een rustige lijst met de klassieke spellen (met instellingen) en "Dagspellen oefenen" (Omweg vrij oefenen, Rank Radar, oefenduel, Side by Side met onderwerpkeuze, Mosaic met bordgrootte).

**Tests.** Nieuw `tests/daily-shuffle.test.mjs` (generatie, puntentelling met deelpunten, niets uitlekken vóór het antwoord, ledgerplek). Nieuwe integratietest voor de dagelijkse Size Shuffle die aan beide kanten van `SHUFFLE_FROM` werkt; de Mosaic-dagtest en de homepagevolgorde hangen nu van de datum af. Lokaal ook met `SHUFFLE_FROM` op vandaag gedraaid (daarna teruggezet).

### 1.24.0: verder (iconen, kaarten, punten)
- **Logo's en iconen in Roviko-stijl.** Alle spellogo's zijn opnieuw getekend als kleine volkleurige tafereeltjes in de stijl van de spelillustraties (`GameIcon.tsx`, `RovikoArt.tsx`). Tabbalk, Multiplayer-keuzes, Paspoort, dagdoelen, menu, instellingen, account en vrienden gebruiken nieuwe getekende iconen (`RovikoIcons.tsx`).
- **Goed antwoord:** frissere Roviko-groen met een licht verloop en zachte gloed (`--t-right` in `trip.css`), in alle spellen en multiplayer; de donkergroene knoppen blijven.
- **Buurlanden:** na het antwoord toont de kaart het hele werelddeel met alle grenzen; het gevraagde land, het goede antwoord en een foute keuze zijn gemarkeerd, kleine landen krijgen een ring.
- **Size Shuffle:** rijen zijn te slepen met vinger of muis (pijltjes en toetsenbord blijven).
- **Kaartvragen:** de kaart opent altijd op de hele wereld.
- **Multiplayer:** een half goede Size Shuffle-lijst levert een deel van de punten op (goede plekken ÷ 4 × de gewone punten, zonder reeksbonus). De Dagelijkse Omweg blijft 50 per volledig goede vraag.
- **Bewust niet:** extra punten voor een reeks in de Omweg. Kaartvragen geven gedeeltelijke punten (wat is dan "goed"?), en oude dagscores zouden niet meer vergelijkbaar zijn; "3 op rij!" en het oplopende geluid blijven.
- **Tests:** 179/179 (nieuw: `order-partial.test.mjs`, `daily-shuffle.test.mjs`).
- **Rank Radar:** het eindoverzicht toont per land hoe goed je keuze was ("Beste keuze", "3e beste van 8") met de punten; tik op een land voor alle acht onderwerpen op volgorde, met jouw keuze en de beste gemarkeerd. Op de telefoon staan de onderwerpen in twee kolommen, zodat land, onderwerpen en knop zonder scrollen op één scherm passen (ook op 320×568).
