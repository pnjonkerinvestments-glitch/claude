# Nieuw ten opzichte van Roviko website v3

Vergelijkingsbasis: de aangeleverde v3-broncode op commit `65890864ca0bfdebe0da9481d3f8bbbe3c8bdc29`.
Nieuwe websiteversie: **1.11.0**, 24 september 2026. De eerdere update 1.10.0 is hierin inbegrepen.

## Dagelijkse competitie

- Vijf officiële dagspellen: World Trip, Daily Clue Trail, Side by Side, Country Mosaic en Rank Radar.
- Maximaal 1.000 punten per spel, 5.000 per dag. Geen timer of snelheidsbonus.
- Na een spel: echte opgeslagen score en positie, bijvoorbeeld “#23 van 100 spelers”. Geen verzonnen spelersaantallen of percentielen.
- Homepage: dagtotaal, totale punten over alle dagen, dagrang en cumulatieve rang, plus overzicht per dagspel.
- Ranglijsten bevatten alleen afgeronde spellen; ook een nulscore telt als deelname. Gelijke scores delen een plaats.
- Opnieuw openen hervat hetzelfde spel/resultaat. Onbeperkt oefenen, bonusvragen en multiplayer leveren geen punten voor deze totalen op.
- Puntentelling gebeurt op de server. Oplossingen van competitieve dagspellen worden niet vooraf meegestuurd.
- Punten verhuizen veilig mee bij het koppelen van een gast aan een account, zonder dubbeltelling. Exporteren en account verwijderen omvatten ook de puntenhistorie.
- Nieuwe lichte scorekaarten, score-uitleg, duidelijke hintkosten en een eigen Clue Trail-illustratie. Werkt met light/dark mode en EN/NL/ES.

## Clue Trail

- Nieuwe officiële dagronde met vijf landen.
- Antwoordopties zonder vlaggen.
- De continenthint is bruikbaar: naast twee landen uit het betreffende continent staan twee landen van elders.
- Hints: continent → grens → hoofdstad → vlag.
- Goed met 1/2/3/4 hints: 200/150/100/50 punten. Fout: 0.
- Hintgebruik wordt opgeslagen. Een refresh geeft geen punten terug; de vlag kan niet voortijdig worden opgevraagd.
- Landen waarvan de hoofdstad de landnaam al verklapt worden weggefilterd.

## Spaans en spelbediening (1.10.0)

- **ES · Español** toegevoegd aan het taalmenu. Interface, dynamische vragen, landnamen en feitfragmenten zijn vertaald; de keuze blijft bewaard.
- Multiplayer onthult één seconde nadat de laatste actieve speler heeft geantwoord, met behoud van de ingestelde deadline.
- Host kiest duidelijk 5, 10, 15 of 20 vragen; bij Mixed kunnen afzonderlijke spelmodi worden uitgezet. Standaard doen alle zes mee.
- Size Shuffle heeft een expliciete bevestigingsknop; Rank Radar eveneens.
- Pinpoint heeft beter zoomen met twee vingers, pannen en zoomen rond het aangeraakte punt. Een knijpbeweging plaatst geen onbedoelde pin.
- Kaartpunten lopen af met de afstand tot de landsgrens. De feedback benoemt een buurland of hetzelfde continent. Binnen de officiële World Trip telt dit mee voor maximaal 200 punten van die ronde; oefenen toont alleen afstand en juistheid.
- Extra controles tegen antwoordverklappers in hoofdsteden, vlagkeuzes en grensvragen.

## Wat behouden is

De door Claude aangeleverde v3-stijl, het bestaande logo, de appnaam, oorspronkelijke spelillustraties, accounts, opgeslagen voortgang, dagelijkse snapshots, bronnen/licenties, realtime kamers en native API-compatibiliteit zijn behouden. Er is geen nieuw betaalmodel of verplichte tracking toegevoegd.

## Technische overdracht

Er is **wel één nieuwe databasemigratie** voor versie 1.11: `drizzle/0003_gorgeous_arachne.sql` (`daily_scores`). Versie 1.10 had geen nieuwe migratie. Pas alle migraties in volgorde toe; vervang nooit de live database met een lege ontwikkeldatabase.

Oude, ongescoorde resultaten blijven historisch bewaard en krijgen geen achteraf verzonnen punten. De competitieve editie begint met deze release. Bestaande native clients blijven hun oude ongescoorde contract gebruiken; deze website-overdracht is geen nieuwe gesigneerde iOS-release.

Zie `GAME_RULES.md` voor exacte scores, `ARCHITECTURE.md` voor opslag/API en `docs/QA_1_11.md` voor testbewijs en beperkingen.
