# Nieuw in Roviko 1.12.0 ten opzichte van 1.11.0

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
