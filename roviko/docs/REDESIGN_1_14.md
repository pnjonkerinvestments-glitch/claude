# Roviko 1.14: de redesign

*"A small daily trip around the world."* Rustig, nieuwsgierig, een klein dagelijks ritueel. Geen quiz-app, geen casino, geen dashboard.

De audit vooraf staat in `docs/AUDIT_1_14.md`.

## 1. Designsysteem (`app/design.css`, laatste CSS-laag)

**Kleuren**
- Tokens: `--color-canvas #F6F3E9`, `--color-surface #FFFFFF`, `--color-ink #18211D`, `--color-forest #163B32`, `--color-brand #1F806B`, `--color-mint #DDEDE6`, `--color-gold #F6B84B`.
- Donkere modus: dezelfde rollen, met een donkergroene ondergrond. Het merkgroen wordt `#5BC8A6` met donkere tekst.
- Oude namen (`--primary`, `--card`, `--background`, …) verwijzen nu naar deze tokens. Daardoor kleuren ook oudere onderdelen mee.
- De verhouding is ongeveer 70% neutraal (papier en wit), 20% groen (knoppen, route, bosgroene banden) en 10% accent (goud, spelkleuren).

**Spelkleuren.** Elk spel heeft één kleur (`--g`/`--g-soft`) en één lijnicoon (`GameIcon`). Die komen overal terug waar het spel genoemd wordt.

**Typografie.** Alleen Fredoka (koppen, speltitels, vieringen) en Manrope (tekst en interface). DM Sans, Space Grotesk, Nunito en Outfit zijn weg: bestanden, `@font-face`-regels, npm-pakketten en licentiebestanden. De tekstschaal is Display 48–64, H1 36–44, H2 26–32, H3 18–22, Body 16 en Small 14.

**Ruimte en vorm**
- Ruimteschaal: 4, 8, 12, 16, 24, 32, 48, 64 en 80 px.
- Afronding: knoppen 14 px, kaarten 22 px, hero 30 px, pillen 999 px.
- Eén schaduw: `0 1px 2px rgba(24,33,29,.04), 0 10px 30px rgba(24,33,29,.06)`.
- De "dikke" onderranden en onderschaduwen uit de playful-laag (76 stuks) en de gestippelde randen zijn weggehaald.

**Toestanden.** Knoppen (`primary`, `secondary`, `ghost`, `gold`, `text-link`, `icon-btn`) hebben dezelfde toestanden: default, hover, active, focus-visible, disabled en loading (`aria-busy` met spinner). De focusring is overal dubbel: een ring in de achtergrondkleur en een groene ring.

**Opruiming.** 1.191 CSS-regels waarvan geen enkele class nog in de code voorkomt, zijn automatisch verwijderd (script in de QA-notities hieronder). De oude lagen gingen van 295 KB naar 217 KB. Er zijn ook ongebruikte bestanden verwijderd: `globe.webp`, `globe.svg`, `file.svg`, `window.svg`, zeven lettertypebestanden en `SpanishInfo.tsx`.

## 2. Componenten

| Component | Bestand | Waarvoor |
| --- | --- | --- |
| `AppContext`, `useApp` | `components/app/context.tsx` | gedeelde app-state voor alle schermen |
| `A`, `Avatar`, `AvatarPicker`, `Choice`, `Logo`, `ModeEmoji` | `components/app/shared.tsx` | gedeelde bouwstenen |
| `Skeleton`, `PageSkeleton`, `EmptyState`, `ErrorState`, `SectionHeader`, `PageHeader` | `components/ds/States.tsx` | laden, leeg, fout, koppen |
| `Celebration`, `CountUp` | `components/ds/Celebration.tsx` | getrapte viering na een dagspel |
| `SiteHeader` (met `SettingsMenu` en de mobiele tabbalk) | `components/shell/SiteHeader.tsx` | navigatie |
| `HomePage` | `components/home/HomePage.tsx` | nieuwe homepage |
| `GameCard` | `components/home/GameCard.tsx` | spel als omslag: beeld, titel, zin, metadata, één actie |
| `CoverArt` | `components/home/CoverArt.tsx` | omslagen; nieuwe vectorscènes voor Wereldduel, mysterieland, klassiekers en kamers |
| `StatusBar`, `StreakIndicator`, `QuestIndicator` | `components/home/StatusBar.tsx` | 🔥 reeks · 👑 doelen · punten |
| `ProgressRoute` | `components/home/ProgressRoute.tsx` | de vijf dagspellen als route |
| `useToday`, `useCompetition`, `useResetLabel` | `components/home/useDay.ts` | dagdata; "Nieuwe spellen over 3 u 42 min" |
| `ExplorePage`, `RankingsPage`, `PassportPage`, `MultiplayerPage` (met `JoinForm` en `RoomProblem`), `ScoringPage`, `InfoPage` | `components/pages/` | herbouwde pagina's |

Dialogen, tabs, switches en popovers blijven de bestaande Radix/shadcn-componenten.

## 3. Wat er per pagina veranderde

**Navigatie**
- Bovenaan: logo, dan Spelen, Ontdekken en Vrienden. Rechts staan een reeks-chip, een instellingenmenu en het paspoort.
- In het instellingenmenu staan taal, weergave en geluid, plus links naar Uitleg, Punten, Ranglijst en Inloggen.
- Op mobiel staat onderin een tabbalk (Spelen, Ontdekken, Vrienden, Paspoort) met safe-area. Tijdens een spel is die verborgen.
- De skip-link heet nu "Naar de inhoud".

**Homepage (`/`)**
- Van boven naar beneden:
  - de kop "Je dagelijkse omweg / Waar gaan we vandaag heen?";
  - één uitgelichte dagkaart met één groene knop. De knop wisselt tussen *Begin de reis van vandaag*, *Verder: …* en, als alles klaar is, *Bekijk je resultaten*;
  - de statusbalk;
  - "Meer om te ontdekken" met drie kaarten en "Alle spellen";
  - "Je reis van vandaag" als route met "2 van 5 klaar" en de punten;
  - "Samen spelen".
- Scoreregels, uitleg over het reeksschild en de doelen in detail staan niet meer op de homepage. Ze zitten achter een dialoog (doelen), `/scoring` en `/daily`.

**Alle spellen (`/daily`).** Hier staan:
- de vijf dagtegels met oefenen en ?;
- de dagdoelen, de reekskaart, de scorekaart, het weekoverzicht en de volgende badge;
- de extra's (Wereldduel en het mysterieland);
- de zes klassiekers, met regio en "Verras me".

**Ontdekken (`/explore`)**
- Kop "Een hele wereld om te leren kennen / Waar wil je heen?", met zoeken, "Verras me" en regiochips.
- Daaronder volgen Verder ontdekken (lokaal), Tips van vandaag (elke dag drie landen), Per regio en Onlangs ontdekt (je stempels), plus een lijst met alle landen.
- Het landvenster heeft een knop "Oefen met deze regio".

**Ranglijst (`/leaderboard`)**
- Vandaag en Altijd, op basis van de dagpunten. Een week-periode bestaat niet in de dagcompetitie, dus die is niet verzonnen.
- Er is een kaart "Jouw plek". Geen plek? Dan verschijnt een knop om te beginnen.
- De top 10 heeft ingetogen medailles. Het plaatsnummer staat er altijd bij.
- Multiplayer staat er apart onder, als "Met vrienden", met de bestaande periodes.
- Er zijn staten voor laden, leeg en fout.

**Paspoort (`/profile`)**
- Een bosgroene omslag met je avatar, niveau en een reislog: dagen, landen, spellen, nauwkeurigheid en kronen.
- Gasten zien "Voorbeeld" en "Bewaar je voortgang". Een account aanmaken is nooit verplicht.
- Verder: stempels en kaart, oefenen, prestaties (eerst 12, de rest onder "Toon alles"), recente spellen, en "Account en privacy".

**Vrienden (`/multiplayer`, kamers)**
- Er zijn kaarten voor "Kamer maken" en "Doe mee".
- Het codeveld (`autocapitalize`, `enterkeyhint=go`, geen autocorrectie) geeft de fout ter plekke, niet in een toast.
- Voor een verkeerde code, een onbekende, volle of verlopen kamer is er een eigen leeg scherm met "Maak een kamer" en "Terug".
- In de lobby staan "Kopieer uitnodigingslink" en, als het apparaat dat ondersteunt, "Deel code". Dubbele namen krijgen een volgnummer (Sam · 1, Sam · 2), en je ziet "3 van 12 spelers" en "Opnieuw verbinden".

**Uitleg (`/how-to-play`)**
- "Kies een spel": tabs per groep, te bedienen met de pijltjestoetsen. Een deep link werkt, bijvoorbeeld `#trail`.
- Per spel staan er een illustratie, het doel, hoe je speelt, de punten, een tip en een speelknop.

**Punten (`/scoring`, nieuw)**
- Vier feitentegels (1.000 per spel, 5.000 per dag, één poging, geen timer), een verdeelbalk en de regel per dagspel.
- Daarnaast reeksen en schilden, dagdoelen, kamers en "geen punten".

**Privacy en voorwaarden**
- De zin "Draft policy…" / "Conceptbeleid…" / "Política provisional…" is uit de productie verwijderd.
- De pagina's hebben een inhoudsopgave, een leesbare kolom en in alle drie de talen dezelfde opbouw.
- Wat de eigenaar nog moet invullen staat als zichtbare TODO-melding (zie §6). Er zijn geen juridische feiten verzonnen.

**Data en bronnen (`/sources`).** Per dataset staat er een kaart met bron, jaar, licentie, waarvoor het gebruikt wordt, een link naar de bron en een download.

**Na een dagspel**
- Eerst een getrapte viering: +punten (optellend), dan een persoonlijk record (bij 1.000), dan "N dagen op reis", dan "Doel gehaald".
- Met reduced motion staat alles er meteen. Schermlezers horen één samenvatting.
- Het "wat nu"-blok is rustig bosgroen.

**Resettijd.** Alle aftellers zijn nu rustige tekst in plaats van `hh:mm:ss` of "12:00 AM UTC", bijvoorbeeld "Nieuwe spellen over 3 u 42 min". Tot de pagina geladen is staat er een lege plek, zodat server en browser hetzelfde tonen.

## 4. Terminologie

De canonieke lijst staat in `docs/AUDIT_1_14.md`.

- In het menu staat "Vrienden" (EN *Friends*), op de pagina "Samen spelen". "Multiplayer" komt alleen nog voor als technische term.
- Het profiel heet overal "Paspoort", de leaderboard overal "Ranglijst", het freeze-mechanisme "reeksschild".
- De reeks heet in de nieuwe onderdelen "N dagen op reis".

## 5. Getest

**Uitgevoerd in deze omgeving**
- `npm run build` en `npm test`. De resultaten staan in `docs/QA_1_14.md`.
- De homepage-rendertest is herschreven: één H1, de uitgelichte reis, drie kaarten, vijf routestops, "Samen spelen", en geen scoreregels.
- De uitlegtest controleert nu de tabs.
- De contrasttest leest nu ook `design.css`. Alle paren halen minstens 4,5:1 in licht en donker.
- Visueel met headless Chromium (Playwright): alle hoofdroutes op 320, 375, 430, 768, 1024, 1280 en 1440 px, zonder horizontaal scrollen. Ook de donkere modus op mobiel en EN, NL en ES.
- Een volledige Rank Radar gespeeld, met de viering, de doelen en de bijgewerkte route. World Trip, Wereldduel, het mysterieland en de kamerfoutschermen zijn geopend.
- ESLint: 423 problemen (268 fouten), tegenover 460 (281) vóór de redesign. De nieuwe bestanden voegen geen fouten toe.

## 6. Nog open (eerlijk)

1. **Juridisch (eigenaar).** Nog in te vullen:
   - de verwerkingsverantwoordelijke en het adres;
   - een contactadres;
   - bewaartermijnen voor resultaten en accounts;
   - hosting en subverwerkers, en de toezichthouder;
   - de aanbieder, een minimumleeftijd of toestemming van ouders, aansprakelijkheid, toepasselijk recht en hoe wijzigingen worden aangekondigd.

   Deze punten staan als gele TODO-blokken op `/privacy` en `/terms`.
2. **Persoonlijk record per spel.** De server geeft geen "vorige beste score" per dagspel terug. De stap "Persoonlijk record" verschijnt daarom alleen bij een perfecte 1.000. Een echt persoonlijk record vraagt een extra veld in `/competition`.
3. **Weekranglijst voor dagpunten.** Die bestaat niet in de server. Daarom zijn er alleen de tabs Vandaag en Altijd.
4. **Dubbele namen in kamers.** Worden alleen in de weergave onderscheiden met een volgnummer. De server staat ze nog steeds toe.
5. **"Voorbeeld" per spel op de uitlegpagina.** Er is gekozen voor doel, stappen, punten en tip. Een uitgewerkt voorbeeld per spel in drie talen is nog niet geschreven.
6. **Mascotte-varianten.** Er zijn nog geen nieuwe houdingen van de wereldbol. Dat vraagt nieuwe illustraties in de eigen stijl.
7. **Oude CSS-lagen.** globals, revamp, atelier, playful, competition en polish bestaan nog, met ongeveer 217 KB aan regels die wél gebruikt worden, vooral binnen de spellen. Samenvoegen tot één laag kan gefaseerd, spel voor spel.
8. **Echte apparaten.** Controleer op echte iOS- en Android-toestellen: de safe area van de tabbalk, het toetsenbord bij het codeveld en het delen via `navigator.share`. Controleer ook schermlezers: VoiceOver en TalkBack.
9. **Visuele regressie.** De screenshots zijn met de hand gemaakt en bekeken (zie `docs/QA_1_14.md`). Er is nog geen geautomatiseerde vergelijking in CI.

## Update 1.15

- **Opgelost in 1.15:** punt 2 (persoonlijk record per spel), punt 5 (voorbeeld per spel op de uitlegpagina) en punt 6 (mascottestemmingen).
- **Spelschermen:** alle spellen gebruiken nu dezelfde `GameHeader` en dezelfde rustige stijl.
- **Nog open:** de spelbalk tijdens een multiplayermatch (`GameTop`, met timer en score) is alleen via CSS in de nieuwe stijl gezet, nog niet omgebouwd naar `GameHeader`.
