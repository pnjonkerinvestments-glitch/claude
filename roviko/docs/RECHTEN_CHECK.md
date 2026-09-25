# Controle op auteursrecht en merken — 24 september 2026 (versie 1.13.1)

Dit is een praktische controle van de broncode en de bestanden, geen juridisch advies. Laat de onderdelen onder "Open risico's" door een merken- of IE-jurist bekijken.

## Gecontroleerd en in orde

- **Softwarebibliotheken (154 pakketten):** alle licenties zijn ruim, namelijk MIT, ISC, Apache-2.0, BSD, 0BSD en OFL. Er zit geen GPL, AGPL of andere "copyleft"-licentie voor software tussen.
- **Data:**
  - landen en grenzen: `world-countries` (ODbL 1.0), met de afgeleide data te downloaden onder `/data` en `/shapes`, zoals de share-alike-plicht vraagt;
  - wereldkaart: Natural Earth (publiek domein) en world-atlas (ISC);
  - cijfers: World Bank WDI (CC BY 4.0) en het CIA World Factbook-archief (publiek domein / CC0);
  - mysterieland-teksten: UNESCO (CC BY-SA 3.0 IGO; de bewerkingen staan onder dezelfde licentie).
- **Bronvermelding:** staat bij elk getal en op de pagina "Data & credits". In 1.13.1 zijn UNESCO en het Factbook daar ook in het Engels en Nederlands toegevoegd.
- **Vlaggen en iconen:** flag-icons (MIT) en Lucide (ISC). De licentiebestanden staan in `/licenses`.
- **Lettertypen:** Nunito, Fredoka, Manrope, Outfit, DM Sans en Space Grotesk, allemaal SIL Open Font License. Ze worden zelf gehost en de licentiebestanden staan in `/fonts`.
- **Beeld:** het logo, de mascotte en de spelillustraties zijn eigen, gegenereerd of zelf getekend werk. Er zijn geen beelden, schermafbeeldingen of iconen van andere sites gebruikt.
- **Teksten en vragen:** alles is eigen werk. Er is geen vragenbank van een ander overgenomen.
- **Concurrenten (Geotrivia, Duolingo):**
  - Er is niets overgenomen: geen code, teksten, namen, kleuren of beelden.
  - Spelmechanismen zoals "kies het sterkste onderwerp", een reeks of dagelijkse doelen zijn ideeën en niet auteursrechtelijk beschermd.
  - Hun namen komen nergens voor in wat spelers zien. Ze staan alleen in interne analysedocumenten.
  - "Streak freeze" is de productnaam van Duolingo. Onze functie heet daarom "Streak shield" / "Reeksschild" / "Escudo de racha".

## Open risico's (niet door code op te lossen)

1. **De merknaam "Roviko" is niet gecontroleerd.** Zoek bij BOIP (Benelux), EUIPO (EU) en eventueel WIPO naar gelijke of gelijkende merken in klasse 9 (apps) en 41 (spellen en onderwijs). Registreer de naam zelf voordat de app groot wordt.
2. **De spelnaam "Pinpoint"** wordt ook gebruikt door een bekend woordspel van LinkedIn. De kans op problemen is klein, omdat het een ander soort spel is en het woord algemeen is, maar kies bij twijfel een eigen naam (bijvoorbeeld "Map Drop" of "Speldenprik"). De andere namen (Rank Radar, World Trip, Side by Side, Country Mosaic, Clue Trail, City Circuit, Flag Signal, Next Door, Size Shuffle, Wereldduel) zijn beschrijvend of eigen. Een snelle merkcheck blijft verstandig.
3. **AI-gegenereerde afbeeldingen** (mascotte en spelillustraties) maken inbreuk op niemand. Wel kan het eigen auteursrecht erop beperkt zijn. Bescherm het logo en de mascotte daarom ook als merk (beeldmerk).
4. **Vlaggen en wapens:** vlaggen zijn meestal vrij te gebruiken, maar sommige landen beschermen hun wapen of embleem. Voor een quiz is dat normaal geen probleem. Gebruik vlaggen niet als logo of in reclame alsof een land Roviko steunt.
5. **Advertenties:** gebruik in advertenties en zoekwoorden geen merknamen van anderen, zoals Geotrivia, Duolingo of GeoGuessr.
