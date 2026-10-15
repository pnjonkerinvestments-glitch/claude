# Winkelafbeeldingen

## Google Play, telefoon (versie 1.41)

De set in `google-play-phone/nl/` en `google-play-phone/en/` is gemaakt van versie 1.41 (app-modus) op een lokale ontwikkelserver, met Playwright:

1. Een voorbeeldspeler (Sanne in het Nederlands, Sofia in het Engels) krijgt een reeks van 23 dagen, 3.450 punten en vier van de zes dagspellen van vandaag, voortgang bij Leren (vlaggen en hoofdsteden van Europa), drie vrienden en een plek in de Goudgroep. Elf andere voorbeeldspelers vullen de ranglijsten. Alles stond alleen in de lokale testdatabase; die is daarna teruggezet.
2. Voor de nieuwe opstelling (Vormenjacht in plaats van Wereldduel) stond `SHAPE_FROM` tijdens het opnemen tijdelijk op de dag zelf; die wijziging is teruggedraaid.
3. Elk scherm wordt opgenomen op 400×866 bij 3×. Rank Radar (vier rondes, telkens het beste onderwerp: "Perfecte keuze!") en Vormenjacht (drie goede antwoorden, dan vraag 4) worden echt gespeeld; in de kamer zitten echte voorbeeldspelers en een computerspeler.
4. Daarna komt er een kop in Fredoka en een ondertitel in Manrope boven, op een crème-mintachtergrond, 1080×1920. Het scherm staat helemaal zichtbaar in een donkergroen toestel.

| # | Bestand | Wat je ziet | NL | EN |
| --- | --- | --- | --- | --- |
| 1 | `1-home.jpg` | Startscherm: reeks van 23 dagen, reis van vandaag 4/6 met 3.450 punten, volgende spel Size Shuffle | Elke dag een kleine wereldreis · *Korte spellen · elke dag nieuw* | A little trip around the world, every day · *Short games · new every day* |
| 2 | `2-learn.jpg` | Leren: vlaggen, hoofdsteden en kaart per continent, 21/45 vlaggen met brons/zilver/goud, de route met lessen | Leer vlaggen, hoofdsteden en de kaart · *Per continent, in korte lessen* | Learn flags, capitals and the map · *Continent by continent, in short lessons* |
| 3 | `3-rank-radar.jpg` | Rank Radar, land 4/8 net gekozen: "Perfecte keuze!", 4 perfect op rij | Waar staat elk land het hoogst? · *Rank Radar* | Where does each country rank highest? · *Rank Radar* |
| 4 | `4-shape-shift.jpg` | Vormenjacht (dagspel), vraag 4/10 met 300 punten en een reeks van 3 | Herken landen aan hun vorm · *Vormenjacht* | Know countries by their shape · *Shape Shift* |
| 5 | `5-multiplayer.jpg` | Wachtkamer 6/12 met vier vrienden en een computerspeler | Speel live met vrienden · *Tot 12 spelers per kamer* | Play live with friends · *Up to 12 players per room* |
| 6 | `6-rankings.jpg` | Ranglijst: Goudgroep (net gepromoveerd), jij op #1 van 12 | Klim in de ranglijst · *Vandaag, deze week en in je liga* | Climb the rankings · *Today, this week and in your league* |

## App Store (versie 1.41)

De App Store-sets tonen dezelfde zes schermen met dezelfde koppen als de Google Play-set hierboven, in het Nederlands (Sanne) en het Engels (Sofia). Ze zijn op dezelfde manier gemaakt: dezelfde voorbeeldgegevens in de lokale testdatabase (daarna teruggezet), `SHAPE_FROM` tijdelijk op de dag zelf (teruggedraaid), Rank Radar en Vormenjacht echt gespeeld.

- iPhone: opgenomen op 400×869 bij 3,3× (1320×2868), in hetzelfde donkergroene toestel als de Google Play-set.
- iPad: opgenomen op 1032×1376 bij 2× (2064×2752), dus met de tabletopmaak (menubalk bovenaan, twee kolommen op het startscherm), in een donkergroen tabletkader.
- Kop in Fredoka en ondertitel in Manrope op dezelfde crème-mintachtergrond. JPEG, RGB zonder alfakanaal, sRGB, precies op maat.

| Map | Formaat | Voor |
| --- | --- | --- |
| `ios-iphone-6.9/` | 1320×2868 | App Store, 6,9" iPhone |
| `ios-iphone-6.5/` | 1284×2778 | App Store, 6,5" iPhone |
| `ios-ipad-13/` | 2064×2752 | App Store, 13" iPad |
| `roviko-screenshots.zip` | | Alle App Store-sets (EN en NL) in één download |
| `google-play-phone/` | 1080×1920 | Google Play, telefoon (1.41, zie boven) |
| `google-play-feature-graphic-*.png` | 1024×500 | Google Play-banner |
| `app-store-icon-1024.png`, `google-play-icon-512.png` | 1024 / 512 | Winkeliconen (ondoorzichtig) |

Elke map heeft `nl/` en `en/` met dezelfde zes bestanden:

| # | Bestand | Wat je ziet (iPhone) | Op de iPad | NL | EN |
| --- | --- | --- | --- | --- | --- |
| 1 | `1-home.jpg` | Startscherm: reeks van 23 dagen, reis van vandaag 4/6 met 3.450 punten, volgende spel Size Shuffle | Daarnaast deze week, Goudgroep, Leren en dagdoelen | Elke dag een kleine wereldreis · *Korte spellen · elke dag nieuw* | A little trip around the world, every day · *Short games · new every day* |
| 2 | `2-learn.jpg` | Leren: vlaggen, hoofdsteden en kaart per continent, 21/45 vlaggen met brons/zilver/goud, de route met lessen | Bovenaan de pagina: "Vlaggen van Europa" met alle continenten | Leer vlaggen, hoofdsteden en de kaart · *Per continent, in korte lessen* | Learn flags, capitals and the map · *Continent by continent, in short lessons* |
| 3 | `3-rank-radar.jpg` | Rank Radar, land 4/8 net gekozen: "Perfecte keuze!", 4 perfect op rij (NL Saoedi-Arabië, internetgebruik #1; EN Zweden, levensverwachting #7) | NL Nepal, hoogste punt #1; EN Frankrijk, vliegvelden #6 | Waar staat elk land het hoogst? · *Rank Radar* | Where does each country rank highest? · *Rank Radar* |
| 4 | `4-shape-shift.jpg` | Vormenjacht (dagspel), vraag 4/10 met 300 punten en een reeks van 3 | Idem, vier antwoorden in twee kolommen | Herken landen aan hun vorm · *Vormenjacht* | Know countries by their shape · *Shape Shift* |
| 5 | `5-multiplayer.jpg` | Wachtkamer 6/12 met vier vrienden en een computerspeler | Idem, met de hele spelerslijst | Speel live met vrienden · *Tot 12 spelers per kamer* | Play live with friends · *Up to 12 players per room* |
| 6 | `6-rankings.jpg` | Ranglijst: Goudgroep (net gepromoveerd), jij op #1 van 12 | Idem, de hele groep van 12 en de dagranglijst | Klim in de ranglijst · *Vandaag, deze week en in je liga* | Climb the rankings · *Today, this week and in your league* |

De koppen noemen bewust geen aantal spellen.
