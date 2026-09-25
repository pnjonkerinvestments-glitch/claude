# Wat Roviko van Duolingo leert (24 september 2026)

**Bronnen.** duolingo.com zelf kon vanuit de ontwikkelomgeving niet worden geopend (het netwerkbeleid blokkeert het domein). De analyse gebruikt openbare artikelen en het helpcentrum van Duolingo, gevonden via zoekresultaten:

- Deconstructor of Fun, over streaks.
- Lenny's Newsletter (Jorge Mazal), over de groei van Duolingo.
- Het Duolingo-helpcentrum, over streaks en leagues.
- Duolingo Wiki, over Duo.

Er is niets overgenomen: geen teksten, beelden, namen of vormgeving.

## Waarom Duolingo werkt

1. **De reeks (streak).** Elke dag iets doen, al is het maar één les. Wie een lange reeks heeft, wil die niet kwijt (verliesaversie). Een *streak freeze* vangt een gemiste dag op, zodat één slechte dag niet alles kapotmaakt.
2. **Kleine, duidelijke stappen.** Een les duurt een paar minuten. Het startscherm laat altijd één duidelijke volgende stap zien.
3. **Dagelijkse doelen (Daily Quests).** Drie kleine doelen per dag met een beloning (een kist). Volgens de gevonden bronnen steeg het aantal dagelijkse gebruikers daardoor met ongeveer 25%.
4. **Competitie in kleine groepen (leagues).** Je speelt elke week tegen ongeveer 30 vergelijkbare spelers en kunt promoveren of degraderen. Iedereen heeft zo een eerlijke kans, in plaats van een wereldranglijst waarop je nergens staat.
5. **Een mascotte met karakter.** Duo reageert op wat je doet: blij na een les, bezorgd als je reeks in gevaar is. Herinneringen zijn grappig en afwisselend, niet saai.
6. **Feest bij succes, vriendelijkheid bij fouten.** Direct groen of rood, met de uitleg erbij. Na een les volgt een feestelijk scherm met je voortgang.
7. **Oefenen wat je lastig vindt.** De app herhaalt vooral je eerdere fouten (spaced repetition).
8. **Eerst spelen, later een account.** Je kunt meteen beginnen. Een account komt pas later, om je voortgang te bewaren.

## Wat Roviko al had

- Een dagelijkse reeks met een doel (3, 7, 14 … dagen), een waarschuwing als je reeks in gevaar is, en een voortgangsring rond de mascotte.
- Eén duidelijke knop in de hero ("Begin met …") en na elk spel meteen "Volgende: …".
- Directe feedback in rood en groen, met uitleg en bron.
- Spelen als gast. In de app: een dagelijkse herinnering.
- Sinds 1.11: dagpunten en een ranglijst voor de vijf dagspellen.

## Wat in 1.12 is toegevoegd

| Duolingo-idee | In Roviko | Waarom zo |
| --- | --- | --- |
| Daily Quests met een kist | **Dagdoelen**: drie doelen per dag (één bepaald dagspel, een bonusspel, drie dagspellen). Haal je ze alle drie, dan open je de **kroonkist** en krijg je een 👑-kroon. | Het doel is haalbaar in 10–15 minuten en voor iedereen gelijk. Het levert geen punten of XP op, dus de dagranglijst blijft eerlijk. |
| Voortgang na elke les | Na elk dagspel staan de dagdoelen in het "wat nu"-blok, met de voortgangsbalken. | Je ziet meteen wat je bijna gehaald hebt. Dat nodigt uit tot nog één spel. |
| Eerst spelen | Op de homepage staat de scorekaart nu **onder** de speltegels, naast de dagdoelen. | Het eerste wat je ziet is iets om te spelen, niet een lijst met nullen. |
| Oefen je fouten | Kaart **"Oefen je lastige landen"** boven de klassieke spellen, zodra je eerder fouten maakte. | De oefening bestond al, maar was verstopt in je profiel. Zonder punten en zonder timer. |
| Afwisselende, grappige herinneringen | In de app zeven verschillende herinneringen, één per weekdag, met de stem van Roviko ("Psst… er wacht een nieuw mysterieland op je 🕵️"). | Dezelfde zin elke dag wordt snel genegeerd. |
| Uitleg bij elk onderdeel | (Ronde 5) een uitleg per spel die de eerste keer vanzelf opent, plus de pagina "Uitleg". | Niemand haakt af omdat een spel onduidelijk is. |

## Bewust (nog) niet gedaan, met advies

1. **Reeksschild (streak freeze).** Dit heeft de grootste impact op terugkeer. Omdat de reeks op de server wordt berekend, is er een kleine databasewijziging nodig: een tabel `streak_freezes` en een aanpassing in `stats.ts`. Advies: geef één schild per 7 speeldagen, gratis, maximaal 2 tegelijk.
2. **Weekcompetitie in kleine groepen.** De ranglijst uit 1.11 is wereldwijd. Voor kinderen is "#8 van 30 deze week" motiverender dan "#5.231 van 20.000". Dit vraagt server-werk: groepen van ongeveer 30 spelers en een wekelijkse reset. Doe dit pas als er genoeg dagelijkse spelers zijn.
3. **Reeksen met vrienden.** Vriendschappen bestaan al. Een gedeelde reeks ("jullie spelen allebei elke dag") is een sterke sociale prikkel, maar vraagt server-opslag.
4. **Een mascotte met emoties.** De tekstballon van Roviko reageert al (blij, of bezorgd bij een reeks in gevaar). Extra houdingen (juichen, slapen, bezorgd kijken) vragen nieuwe illustraties in de eigen Roviko-stijl.
5. **Geen hartjes/levens of betaalde versnellers.** Die zijn bij Duolingo vooral bedoeld om geld te verdienen. Voor een kindvriendelijk spel zonder advertenties past dat niet.

## Technisch

- `lib/daily-quests.ts` bevat de pure logica (getest in `tests/daily-quests.test.mjs`).
- `components/atelier/DailyQuests.tsx` is de kaart op de homepage en in het "wat nu"-blok.
- De bonusvoortgang (mysterieland, Wereldduel) en de kronen staan in de browser. Een gebeurtenis `roviko:progress` werkt de kaart direct bij, zonder herladen.
- Er is geen databasewijziging, geen nieuwe API-aanroep op de homepage en geen nieuw geheim nodig.
