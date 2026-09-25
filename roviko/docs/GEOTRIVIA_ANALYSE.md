# Geotrivia vergeleken met Roviko (23 september 2026)

Bron: de publieke pagina's van geotrivia.com. Van elk spel zijn de speluitleg en de interfaceteksten gelezen. Er is niets overgenomen: geen code, teksten, namen, afbeeldingen of data.

## Spelvormen naast elkaar

| Geotrivia | Wat het is | Roviko nu |
| --- | --- | --- |
| GeoRankle | 8 rondes met elk één land; je kiest het onderwerp (bijv. bbp, bevolking) waarop het land het hoogst scoort. Totaalscore, "Nde beste keuze", vergelijking met andere spelers. | **Rank Radar** (zelfde idee, 6 landen, 4 onderwerpen per land) en nu ook **Wereldduel** (nieuw, zie hieronder) |
| GeoDecide | Hoger of lager op het onderwerp van de dag; één fout en je run is voorbij (maximaal 15). | **Side by Side** (10 vergelijkingen, zonder "één fout en klaar") |
| Geodle | Raad het verborgen land met aanwijzingen over continent, bevolking, oppervlakte en bbp. | **Clue Trail** (aanwijzingen) en het **Mysterieland van de dag** |
| GeoConnections | Vind groepen van 4 bij elkaar horende items, 4 fouten toegestaan. | **Country Mosaic** (koppel vlag, naam, vorm en feit) |
| GeoPaint | Stel de hoofdkleuren van een vlag na met schuifjes. | — (geen equivalent) |
| Quiz by Region | Vlaggen, hoofdsteden en vormen per werelddeel. | **Klassieke spellen** met regiofilter |

**Conclusie:** Roviko dekt al bijna elk Geotrivia-concept. Winst zit niet in nóg een kopie, maar in iets wat Geotrivia niet heeft. Dat is Wereldduel.

## Nieuw: Wereldduel ("World Duel")

**Spelregels:**
- Je krijgt 5 landenkaarten. Roviko speelt in elke ronde een land op een onderwerp.
- Jij kiest een kaart uit je hand die hoger scoort. Elke kaart mag maar één keer.
- Elke dag is er één gedeeld duel om 00:00 UTC. Daarnaast kun je onbeperkt oefenduels spelen.

**Waarom dit beter is dan GeoRankle:**
- **Strategie in plaats van alleen kennis.** Speel je je sterkste kaart te vroeg, dan verlies je later. Denk vooruit, net als bij een kaartspel.
- **Altijd eerlijk en oplosbaar.** De generator garandeert dat er **precies één perfecte route** bestaat (5–0). Elk mogelijk duel is duidelijk beslist, met minimaal 12% verschil, dus nooit op een haar of door afronding. Minstens 3 rondes bieden een echte keuze.
- **Een tegenstander met karakter.** Je speelt tegen de mascotte, niet tegen een puntentelling. Dat is kindvriendelijk en persoonlijk.
- **Leren bij elke ronde.** Je ziet beide waarden als balken, met de wereldpositie (#rang / aantal landen), de uitleg van het onderwerp en de bron met het jaartal. Na afloop volgt de **perfecte route**, met jouw keuzes erbij.
- **Geen punten, geen timer, geen XP**, zoals de productregels van Roviko voorschrijven. De uitslag is "4 van de 5 duels gewonnen".
- **Delen zonder spoilers:** 🟢🔴🟢🟢🟢 4/5.
- **Schaalbaar:** het duel komt van één openbaar, cachebaar API-antwoord (`GET /api/duel/today`). Er komen geen database-aanroepen of sessies bij. De voortgang blijft in de browser bewaard.

**Techniek:**
- `lib/puzzles/duel.ts` bevat de generator en de controles (`perfectRoutes`, `duelWon`).
- `server/api.ts` bevat `/api/duel/today` en `/api/duel/practice/:nonce`, met een geheugencache per seed.
- `components/puzzles/DuelGame.tsx` is het spelscherm op `/duel`. De homepage heeft een opvallende knop naar het duel.
- `tests/duel.test.mjs` controleert dat elke dag hetzelfde duel geeft, dat er één perfecte route is, dat de marges kloppen en dat de bronnen erbij staan.
- De data komt uit dezelfde bronnen als Rank Radar (World Bank CC BY 4.0, Factbook-archief CC0 en World countries ODbL). Er is geen nieuwe data toegevoegd.

**Nog niet in deze versie:** de uitslag telt nog niet mee voor de dagelijkse reeks, het paspoort of prestaties, omdat er niets op de server wordt opgeslagen. Dat kan later via een server-sessie zoals bij Rank Radar.

## Zo blijven we juridisch veilig

- **Spelregels en ideeën zijn niet auteursrechtelijk beschermd**, de uitwerking wel. Daarom hebben we eigen namen (geen "Geo…"-namen), eigen teksten, een eigen vormgeving, een eigen mascotte en eigen illustraties.
- **Geen overgenomen data.** Roviko gebruikt alleen eigen, gelicentieerde bronnen, met de licentie- en bronvermelding bij elk getal.
- **Geen merknamen van anderen** in teksten, advertenties of zoekwoorden (dus niet "Geotrivia" of "GeoRankle" in Meta- of App Store-teksten).
- Dit is een praktische richtlijn, geen juridisch advies. Laat bij twijfel (bijvoorbeeld over een merknaam) een jurist meekijken.

## Wat we verder van Geotrivia kunnen leren (roadmap)

Op volgorde van verwachte impact voor het terugkeren van spelers:

1. **"Je deed het beter dan X% van de spelers vandaag"** voor de dagspellen. Dat is een sterke sociale prikkel zonder punten. Het vraagt een eenvoudige, anonieme telling per dag op de server.
2. **Archief van eerdere dagpuzzels.** Bij Geotrivia is dat Pro; bij Roviko kan het gratis. Goed voor mensen die een dag hebben gemist, en het versterkt de terugkeer.
3. ~~**Graduele feedback in Rank Radar**~~ **Gedaan (ronde 5):** medailles 🥇🥈🥉⚪ per keuze, een medaillespoor en delen als medaillerij.
4. **Een "blijf-staan"-modus voor Side by Side:** hoe ver kom je zonder fout? Kort en verslavend, en goed voor Reels-advertenties.
5. **Statistieken per spel** (gespeeld, gemiddelde, perfecte rondes) in het paspoort.
6. **Spelers laten meebeslissen:** onderwerpen van de dag beoordelen met sterren, en een nieuw onderwerp voorstellen. Dat geeft betrokkenheid en gratis productfeedback.
7. **Een eigen kleurenspel** als tegenhanger van GeoPaint, met een andere invalshoek. Bijvoorbeeld: "Welke kleur ontbreekt er in deze vlag?", met kleurvlakken om uit te kiezen in plaats van schuifjes. Dat is makkelijker voor kinderen.

**Waar Roviko al sterker is dan Geotrivia:** geen advertenties, één duidelijke dagroute met voortgangsring, een mascotte, Nederlands en Engels, bronnen bij elk getal, samen spelen in kamers, en een native app met dagelijkse herinnering.

## Ronde 5: wat we visueel van Geotrivia leerden

- **Rust:** een warme, gebroken witte achtergrond zonder patroon. De kleur zit in de speltegels, niet in de pagina.
- **Grote tegels die in hun geheel klikbaar zijn**, met kleine knoppen in dezelfde kleur eronder. Bij Geotrivia zijn dat "Random" en "Archive"; bij Roviko "oefenen" en "?" (uitleg).
- **Uitleg per spel** ("How to Play" bij Geotrivia): bij Roviko drie genummerde stappen met een tip, automatisch de eerste keer, plus één overzichtspagina.
- **Bewust niet overgenomen:** hun namen, teksten, iconen, kleuren en de Pro/archief-opzet. Er zijn ook geen nieuwe spelvormen bijgekomen: overzicht gaat voor.
