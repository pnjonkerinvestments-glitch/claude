# Verbeterplan Roviko 1.23

Datum: 6 oktober 2026. Basis: 1.22.1 (live op roviko.app, gelijk aan de zip `roviko-1.22-scenes_1.zip` en aan de standaardbranch).

## Hoe dit plan tot stand kwam

- De site lokaal gedraaid (gebouwde worker + eigen lege D1 met alle migraties t/m `0008`) en met Playwright doorgespeeld op 390×844 (telefoon, 2×) en 1280×800 (desktop), licht en donker, vooral in het Nederlands.
- Volledig uitgespeeld als gast: Dagelijkse Omweg (20 vragen), Wereldduel, Clue Trail, Side by Side (run), Country Mosaic (deels), Rank Radar (begin), Vormenjacht (Overleven) en een multiplayerpotje tegen de computer. Daarna de homepage, Alle spellen, Ranglijst, Paspoort, Ontdekken, Instellingen en Uitleg bekeken.
- Gemeten: laadtijd van de homepage met een trage 4G-verbinding en een 4× tragere processor, bundelgroottes, API-verzoeken. Toegankelijkheid met axe-core (WCAG 2 A/AA) in licht en donker.
- Drie brillen: een **nieuwe speler** (eerste 10 seconden), een **terugkerende speler** (waarom morgen terug?) en een **fanatieke speler** (eerlijkheid, scores, delen).

**Kort oordeel.** De basis is sterk: eerlijke puntentelling op de server, zes gevarieerde dagspellen, een mascotte met karakter, nette eindscènes en geen schermlekken (axe vond één contrastfout). Wat Roviko nog mist om als een echte game te voelen, zit in de **momenten**: wat er gebeurt na een tik (geluid staat uit, geen trilling, droge feedbacktekst), na een fout (het juiste antwoord valt op de telefoon soms achter de knop), na het eerste spel van de dag (je reeks groeit zonder feest) en bij delen (alleen tekst met ●○, zonder je punten). Daarnaast een paar echte bugs, waarvan de Engelse hoofdsteden in het Nederlands de belangrijkste is.

## Status (6 oktober 2026, einde van de dag)

- **7 oktober, trip-stijl:** na "ik vind dit geen verbetering" stuurde de eigenaar vijf voorbeelden. De hele site en de app volgen nu die stijl (crème, witte kaarten, muntpil, mintgroene antwoorden, Roviko die meekijkt, podium in multiplayer, eindscherm "Mooie reis. Morgen weer?"). Zie `CHANGES_SINCE_1_11.md` (1.23.0, derde deel) en `QA_1_23.md`. Dit vervangt de beeldtaal van ronde 3–5; de functies van die rondes (weekgroepen, dagoverzicht, wachtkamer, datacontrole) blijven.

- **Gebouwd en getest:** alle punten van A (A1–A20); uit B: B1 (reeksmoment), B2 (deelbeeld), B3 (uitdaging), B5 (dagoverzicht), B8 (datacontrole, vond meteen de Sri Lanka-fout) en een deel van B6 (account en instellingen later laden).
- **Keuzes van de eigenaar (C), allemaal gebouwd:** C1 welkomstkaart; C2 rustige homepage; C3 weekgroepen met niveaus, alleen accounts; C4 Rank Radar houdt "Vastzetten" (regel aangepast); C5 geluid op de website blijft standaard uit; C6 Belarus. Plus: Multiplayer-tab en wachtkamer naar het ontwerp van de eigenaar, schone kleuren, avatars als wereldbolletjes.
- **Open:**
  - B4 grotere kaart op de telefoon. Onderzocht: de breedte van het scherm is de grens (de wereld is twee keer zo breed als hoog). Groter kan alleen door in te zoomen op een werelddeel, en dat verklapt het antwoord. Dat is een spelregelkeuze, dus eerst overleggen.
  - B6 rest: de teksten per taal apart laden (ongeveer 40 KB minder JavaScript), maar dan zie je bij het laden even Engels.
  - B7 CSS samenvoegen.

Impact: **hoog / middel / laag**. Moeite: **klein** (uren), **middel** (een dag), **groot** (meerdere dagen).

---

## A. Snelle winsten en bugfixes (worden nu gebouwd, ronde 1)

Geen van deze punten verandert spelregels, puntentelling of de opzet van de homepage.

| # | Probleem | Oplossing | Impact | Moeite |
|---|---|---|---|---|
| A1 | **Hoofdsteden staan in het Nederlands in het Engels**: "Vienna", "Lisbon", "Warsaw" als antwoordopties in de Omweg en City Circuit, in de uitleg en in Clue Trail. Wie "Wenen" typt, wordt fout gerekend. | Nederlandse namen voor alle hoofdsteden die een eigen Nederlandse naam hebben (Wenen, Lissabon, Warschau, Praag, Kopenhagen, Brussel, Boekarest, Peking, Moskou …). Typantwoorden accepteren de Nederlandse, Engelse en Spaanse naam. | hoog | klein |
| A2 | **Wereldduel maakt geluid terwijl geluid uit staat** (het duel controleerde de instelling niet). | Eén centrale geluidsfunctie die zelf de instelling leest; alle spellen gaan erdoorheen. | middel | klein |
| A3 | **Getallen in de verkeerde notatie**: in multiplayer "1,493" op een Nederlandse pagina (de telefoontaal werd gebruikt in plaats van de taal van Roviko). | Getallen volgen de gekozen taal (1.493 / 1,493 / 1493). | middel | klein |
| A4 | **Meervoudsfouten**: "Je reeks van 1 dagen", "1 spelers", "1 aanwijzingen gebruikt". | Enkelvoud en meervoud per taal (EN/NL/ES). | middel | klein |
| A5 | **De homepagekop breekt lelijk af**: "aardrijkskunderei / s." op telefoon én desktop (alleen browsers met een Nederlands woordenboek breken netjes af). | Een zacht afbreekstreepje in het woord ("aardrijkskunde-/reis"), zodat het overal goed afbreekt. | middel | klein |
| A6 | **Na een fout antwoord zie je op de telefoon het juiste antwoord niet**: in Vormenjacht stond het goede land (optie 4) achter de vaste knop "Volgende"; in de Omweg viel de uitleg erachter. Het leermoment gaat verloren. | Na het antwoord schuift het scherm precies zo ver dat het goede antwoord en de kop van de uitleg zichtbaar zijn, boven de vaste knop. | hoog | klein |
| A7 | **Feedbacktekst voelt als een foutmelding**: "Niet helemaal. Dit moet anders." en altijd hetzelfde "Helemaal goed!". | Korte, warme koppen die afwisselen ("Net mis!", "Bijna!", "Top!", "Knap gedaan!") in EN/NL/ES; bij de kaart "Bijna! 240 km ernaast". | middel | klein |
| A8 | **Eindschermen zeggen altijd "Mooie reis!"**, ook bij Clue Trail en ook bij 80 van de 1.000. Country Mosaic toont zelfs **altijd "Perfect!"** met een juichende Roviko, ook met 0 punten (bug). | Kop en houding van Roviko naar je score: Wereldklasse / Sterk gespeeld / Mooi gedaan / Morgen weer een kans. Mosaic kijkt naar de punten, niet naar "opgelost". | middel | klein |
| A9 | **Geen trilling in de iPhone-app**, terwijl de app de Haptics-plugin al heeft (alleen nog niet gebruikt). | In de app: korte tik bij een antwoord, "succes"-trilling bij goed, "fout"-trilling bij fout, een stevige bij het einde. Op de website niets. Helpt ook bij Apple-richtlijn 4.2 (meer dan een website). | hoog | klein |
| A10 | **Geluid staat standaard uit**; een nieuwe speler hoort nooit iets. | In de app staat geluid standaard aan (de stilteknop van de iPhone dempt het toch). Op de website blijft het standaard uit (klaslokalen, kantoren). Plus: een stijgend toontje bij elke goede vraag op rij (2, 3, 4 op rij klinkt steeds hoger) en een fanfare bij het eindscherm. | middel | klein |
| A11 | **De site kiest altijd Engels en licht** bij het eerste bezoek, ook op een Nederlandse telefoon in donkere modus. | Eerste bezoek: taal van de telefoon (NL/ES, anders EN) en het thema van de telefoon. Een eigen keuze blijft altijd voorgaan. In de app werkt het net zo. | hoog | klein |
| A12 | **Delen is mager**: alleen tekst met ●○, zonder je punten, met een datum als 2026-10-06. | Deeltekst als Wordle: "Roviko #12 · Dagelijkse Omweg", je punten "820/1.000", 🟩🟥-rij, je reeks 🔥 en de link. Het editienummer telt de dagen sinds 25 september 2026 (#1). Rank Radar noemt nog steeds geen landen of onderwerpen. | hoog | klein |
| A13 | **Toetsenbord**: na een antwoord moet je met Tab naar "Volgende". | Enter of spatie gaat naar de volgende vraag zodra het antwoord er is. | laag | klein |
| A14 | **Side by Side op de telefoon**: "Eén fout. Run voorbij." wordt naast de knop in een smal kolommetje geperst. | Tekst boven de knop, op één regel. | laag | klein |
| A15 | **Eswatini** heet in het Nederlands nog "Swaziland" (sinds 2018 Eswatini) en in het Spaans "Suazilandia" (Fundéu: Esuatini). Als hoofdstad staat alleen Lobamba; Mbabane is de bestuurlijke hoofdstad. | Naam aangepast; de vraag wordt "Welke stad is een hoofdstad van Eswatini?" met Mbabane / Lobamba als goede antwoorden. Vastgelegd in `scripts/prepare-data.mjs`, zodat een nieuwe import het niet terugzet. | middel | klein |
| A16 | **Bolivia**: wie "La Paz" typt (de regeringszetel), wordt fout gerekend. | La Paz als geaccepteerd typantwoord; de vraag en het hoofdantwoord (Sucre, grondwettelijke hoofdstad) blijven. | laag | klein |
| A17 | **Versienummer**: `/api/version` zegt nog 1.21.0 terwijl 1.22.1 live staat. | Versie 1.23.0 en een nieuwe cacheversie van de service worker. | laag | klein |
| A18 | **Contrast**: de copyrightregel in de footer haalt 4,32:1 (minimaal 4,5:1 nodig). | Iets lichtere tekstkleur. | laag | klein |
| A19 | **Logo**: het wereldbolletje in de kop is 35 KB voor een plaatje van 40 px. | Hetzelfde plaatje, opnieuw gecomprimeerd. | laag | klein |
| A20 | **Dubbel verzoek**: de homepage vraagt de ranglijst van vandaag twee keer op. | Eén verzoek. | laag | klein |

## B. Middelgrote verbeteringen (ronde 2, ook zonder regelwijziging)

| # | Probleem | Oplossing | Impact | Moeite |
|---|---|---|---|---|
| B1 | **Je reeks groeit zonder feest.** Na het eerste spel van de dag gaat de reeks van 4 naar 5 zonder dat je het merkt. Bij Duolingo is dit hét moment dat mensen terugbrengt. | Na het eerste afgeronde spel van de dag een kort reeksmoment: vlam die oplaait, "5 dagen op rij!", de week met bolletjes, één knop verder. Eén keer per dag. | hoog | middel |
| B2 | **Geen deelbeeld.** Een tekst valt weg in een groepsapp. | Een deelafbeelding (in de browser getekend, geen server nodig): Roviko, je dagscore, de zes spellen met hun punten, je reeks. Via het deelmenu van de telefoon, anders downloaden. | hoog | middel |
| B3 | **Een gedeelde link doet niets.** Wie op een gedeelde link tikt, komt op een gewone homepage. | Uitdaging bovenaan: "Je vriend haalde 820 punten in de Omweg. Kun jij het beter?" met één knop. | hoog | middel |
| B4 | **De wereldkaart is op de telefoon klein** (ongeveer 270×135 px), met lege ruimte eronder. Pinpoint is daardoor lastig. | Kaart hoger en zonder Antarctica, zodat het land meer ruimte krijgt. | middel | middel |
| B5 | **Dagoverzicht na zes spellen.** Na het laatste dagspel zie je alleen dat spel. | Een samenvatting van de dag (zes scores, totaal, plek, reeks) met delen en wanneer de nieuwe spellen komen. | middel | middel |
| B6 | **Laadsnelheid.** De homepage laadt ~296 KB JavaScript en 79 KB CSS (gecomprimeerd); op een trage telefoon met 4G staat de grootste afbeelding na 2,7 s. Account, Instellingen, Multiplayer, Vrienden en het eindscherm zitten in de eerste bundel. | Die pagina's pas laden als je ze opent; de drie talen apart laden. Verwachting: 25–35% minder JavaScript bij het openen. | middel | middel |
| B7 | **CSS in tien lagen** (445 KB ongecomprimeerd), elke versie een nieuwe laag erbovenop. Traag te parsen en lastig te onderhouden. | Ongebruikte regels weghalen en lagen samenvoegen, met schermafbeelding-vergelijking per pagina. | middel | groot |
| B8 | **Feiten automatisch bewaken.** Uitschieters (bijv. Koeweit 84,6 jaar levensverwachting in WDI 2024) zijn niet fout, maar verdienen een check. | Een test die bij elke data-import opvallende sprongen en onmogelijke waarden meldt. | middel | middel |

## C. Grote kansen (akkoord van de eigenaar nodig)

| # | Idee | Waarom | Impact | Moeite |
|---|---|---|---|---|
| C1 | **Eerste bezoek: meteen spelen.** Nu opent eerst een rondleiding van 5 stappen over de pagina heen. | De eerste 10 seconden bepalen of iemand blijft. Beter: één welkomstkaart met "Speel je eerste vraag" en de uitleg ín het spel (de ?-uitleg bestaat al). De rondleiding blijft in het menu. | hoog | klein |
| C2 | **Homepage rustiger voor wie nog bezig is.** Onder de hoofdknop staan nu de reis, de bonustour (6 kaarten), Overleven (3), dagdoelen en "Meer ontdekken". | Tot de zes dagspellen klaar zijn: bonustour en Overleven als twee compacte rijen; daarna groot. Eén duidelijke volgende stap. | hoog | middel |
| C3 | **Wekelijkse competitie in kleine groepen** (zoals Duolingo-competities): groepjes van ~20 spelers met vergelijkbaar niveau, top 5 promoveert. | Een wereldranglijst "#5.231" ontmoedigt; een groep van 20 geeft elke dag een kans. Raakt de ranglijsten en de opzet, dus jouw beslissing. | hoog | groot |
| C4 | **Rank Radar met één tik.** Rank Radar heeft sinds 1.22 een knop "Vastzetten", terwijl de regel is dat in singleplayer een tik het antwoord is. | Omdat elk onderwerp maar één keer mag, voorkomt de knop vergissingen. Mijn advies: knop houden, maar de regel in START_HERE aanpassen. Jij kiest. | laag | klein |
| C5 | **Geluid ook op de website standaard aan.** | Meer "game feel", maar risico in klaslokalen. Mijn advies: niet doen; in de app wel (A10). | laag | klein |
| C6 | **Belarus in plaats van Wit-Rusland.** | Beide namen zijn in het Nederlands in gebruik. Graag jouw voorkeur voordat ik iets verander. | laag | klein |

## D. Bewust niet (nu)

- **Pushmeldingen op de website**: de site vraagt nooit om meldingen (productkeuze). In de app bestaan de herinneringen al.
- **Tijdsdruk in dagspellen of punten voor snelheid**: botst met de rustige, eerlijke dagcompetitie.
- **Chat of vrije tekst**: bewust niet (moderatie, Apple 1.2, doelgroep vanaf 10 jaar).
- **Nieuwe spelvormen**: liever meer gevoel en variatie in de bestaande spellen.
- **De Koeweit-waarde aanpassen**: komt rechtstreeks uit de officiële WDI-import; niet met de hand veranderen. Wel controleren bij de volgende import (B8).
