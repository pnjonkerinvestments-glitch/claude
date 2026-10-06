# Nieuwsmelder

Stuurt een Telegram-bericht zodra TradingView nieuws heeft over een aandeel op je lijst, en
(screener) zodra een kop over een Europese small cap een van je filterwoorden bevat, zoals
"Sonderdividende" of "special dividend".
Bijvoorbeeld: innoscripta (XETR:1INN) reageert om 19:46 op slecht nieuws, en binnen een
minuut heb je de kop, een korte samenvatting en de link naar het originele artikel op je telefoon.

```
📰 1INN · innoscripta SE

innoscripta SE: Update zu den Ermittlungen der Steuerbehörden – Geschäftsbetrieb läuft weiter – …

🕒 vr 2 okt, 19:46 · EQS
Origineel artikel · TradingView · Grafiek
```

Komt hetzelfde nieuws in dezelfde minuut in meerdere varianten binnen (Duits en Engels
persbericht, Reuters, TradingView-samenvatting), dan krijg je die samen in één bericht.

Daarnaast elke werkdag om 08:40 een **ochtendoverzicht** met alles wat sinds gisteren nieuw is:
speciaal dividend van minstens 25% van de koers, nieuwe beursgangen en dubbele noteringen,
overnames met hun deadline, FDA-nieuws, insiders, vroege koersen en een agenda van de komende
dagen. Zie [Ochtendoverzicht](#ochtendoverzicht-werkdagen-0840).

## Screener: filterwoorden op Europese small caps

```
🔎 Filter: dividend · "Sonderdividende"
📰 PFSE · Pfisterer Holding SE
Duitsland · marktwaarde €312,0 mln

Pfisterer Holding SE: Vorstand schlägt Sonderdividende vor
🕒 za 3 okt, 12:30 · EQS
Origineel artikel · TradingView

Grafiek
```

- **Selectie:** alle primaire aandelen in Duitsland, Frankrijk, Italië, Spanje, Portugal,
  Nederland, België, Luxemburg, Denemarken, Zweden, Noorwegen, Finland, het VK, Zwitserland en
  Oostenrijk met een marktwaarde tussen €2,5 mln en €500 mln (± 2.750 aandelen). Het gaat om
  het land van het bedrijf zelf: een Iers, Cypriotisch of Amerikaans bedrijf met een notering
  in Londen of Stockholm valt erbuiten. Wordt elke dag opnieuw opgehaald bij de
  TradingView-screener, marktwaarde omgerekend naar euro.
- **Nieuws:** elke minuut de nieuwsstromen van TradingView voor die landen: één Engelse voor
  alles, plus Duits, Frans, Italiaans, Spaans en Portugees. Zweeds en Nederlands kent
  TradingView niet als nieuwstaal; dat nieuws komt in het Engels binnen.
- **Filters:** een filter is een naam met een lijst woorden. Standaard zijn er drie, elk in alle
  relevante talen en getest tegen ruim 8.000 echte koppen:
  - `dividend`: speciaal dividend (Sonderdividende, dividende exceptionnel, ...)
  - `insolventie`: faillissement en surseance (Insolvenz, redressement judiciaire, composizione
    negoziata, administrators, ...)
  - `emissie`: aandelenemissies (placing, rights issue, Kapitalerhöhung, augmentation de capital, ...)
  - `ipo`: beursgangen (IPO, Börsengang, introduction en bourse, quotazione in borsa, ...). Werkt over
    al het nieuws uit de gekozen landen, niet alleen de selectie: een bedrijf dat naar de beurs
    gaat staat nog niet in de screener. Instelbaar per filter met `/bereik <filter> europa|selectie`.

  Alleen in het ochtendoverzicht (tenzij `/direct <filter> aan`), getest tegen ruim 12.000 koppen:
  - `overname`: biedingen, squeeze-outs en delistings (takeover, Rule 2.7, Übernahmeangebot,
    Annahmefrist, OPA, retrait obligatoire, offerta pubblica di acquisto, ...)
  - `splitsing`: spin-offs, splits en reverse splits (Abspaltung, regroupement d'actions, contrasplit, ...)
  - `handelsstop`: handelsstops en hervatting (trading halt, Handel ausgesetzt, suspension de cotation, ...)
  - `adhoc`: koersgevoelige informatie (PTA-Adhoc, inside information, Insiderinformation, ...)
  - `insider`: directors' dealings (Director/PDMR, Managers' transactions, Eigengeschäfte; EQS-koppen
    als "Bedrijf: Persoon, Kauf" via een vast patroon)
  - `index`: opname in of verwijdering uit een index (INDEX-MONITOR, in den SDax, intègre l'indice, ...)
  - `fda`: FDA, EMA, CHMP, PDUFA, fase 2/3-resultaten
  - `notering`: dubbele noteringen, overstap naar een andere beurs of ander segment, aangekondigde
    noteringen. Werkt, net als `ipo`, over al het Europese nieuws.

  Woorden van hoogstens 4 letters (zoals `IPO`, `OPV`) tellen alleen als heel woord, zodat
  `IPO` niet het Italiaanse "ipotesi" vindt.

  Een nieuw standaardfilter komt er bij een bestaande installatie vanzelf bij; een filter dat de
  groep zelf heeft weggehaald, komt niet terug. Hoofdletters en accenten maken niet uit, en een
  woord vindt ook langere vormen ("Sonderdividende" vindt "Sonderdividenden").
- Hetzelfde nieuws in meerdere talen in dezelfde minuut wordt één bericht. Wat al via de
  volglijst gemeld is, komt niet nog eens.

## Ochtendoverzicht (werkdagen 08:40)

Elke werkdag om 08:40, twintig minuten voor de opening, één overzicht van alles wat sinds het
vorige overzicht nieuw is, in een eigen onderwerp (*☀️ Ochtendoverzicht*). Bovenaan staat de agenda
van de komende dagen.

```
☀️ Ochtendoverzicht di 6 okt
Alles sinds ma 5 okt, 08:40

⏰ Agenda komende 7 dagen
• do 8 okt (over 2 dagen) DVD Deep Value Driller AS · ex-dividend 20,60 NOK (94% van de koers)
• vr 9 okt (over 3 dagen) PFSE Pfisterer Holding SE · einde aanmeldtermijn · Übernahmeangebot …

💰 Speciaal dividend ≥ 25% van de koers
• DVD Deep Value Driller AS: 20,60 NOK bij koers 21,85 NOK = 94% · ex do 8 okt

🆕 Nieuw op de beurs
• INFOM Infomaniak Network SA (SIX, Zwitserland) · nieuw op de beurs

🔁 Nieuwe en dubbele noteringen
• DSFIR DSM-Firmenich AG (SIX, Zwitserland) · tweede notering, al genoteerd als EURONEXT:DSFIR

🤝 Overnames, squeeze-outs en delistings
• PFSE Pfisterer Holding SE: Übernahmeangebot von ABB zu 30 EUR
   ⏰ einde aanmeldtermijn: vr 9 okt (over 3 dagen)
…
```

| Blok | Waar het vandaan komt |
| --- | --- |
| ⏰ Agenda | Datums uit persberichten (deadline van een bod, PDUFA-datum, eerste handelsdag, ex-dividend, vergadering, squeeze-out), ex-dividenddatums ≥ 25%, de IPO-kalender en wat je zelf toevoegt met `/agenda` |
| 💰 Speciaal dividend ≥ 25% | Aangekondigd dividend uit de TradingView-screener (alle Europese aandelen, in eigen munt, gedeeld door de koers), plus speciaal-dividendnieuws: het bedrag uit het bericht naast de koers. Kleiner dan 25% wordt weggelaten; zonder bedrag staat het er met "bedrag niet gevonden" |
| 🆕 Nieuw op de beurs / 🔁 Dubbele noteringen | Elke ochtend alle noteringen op de Europese beurzen vergelijken met gisteren. Nieuw bedrijf (onbekend ISIN) = beursgang; bekend ISIN op een nieuwe hoofdbeurs = dubbele notering |
| 📅 Beursgangen op komst | IPO-kalender van TradingView (status "pending") |
| 🤝 Overnames · ⛔ Handelsstops · 📣 Ad-hoc · 💊 FDA/EMA/studies · ✂️ Spin-offs en splits · 📊 Indexwijzigingen · 🚀/🔁 Noteringen in het nieuws · 💶 Emissies · ⚠️ Insolventie | Woordfilters op de nieuwsstromen (zie hieronder). Ad-hoc alleen sinds het slot van gisteren (17:30) |
| 👔 Insiders | Directors' dealings per aandeel; 🟢 *cluster* bij twee of meer aankopen in 14 dagen |
| 📈 Vroege koersen | Lang & Schwarz en Tradegate om 08:28: bewegingen van ≥ 4% t.o.v. gisteravond (Tradegate loopt 15 minuten achter) |
| 🗓️ Cijfers vandaag | Aandelen uit de selectie die vandaag cijfers publiceren (voorbeurs/nabeurs) |

De nieuwe filters (`overname`, `splitsing`, `handelsstop`, `adhoc`, `insider`, `index`, `fda`,
`notering`) melden niet meteen: ze staan alleen in het ochtendoverzicht. Met `/direct overname aan`
meldt een filter ook direct. De bestaande filters (dividend, emissie, insolventie, IPO) melden
gewoon direct en staan daarnaast ook in het overzicht.

**Agenda.** Van berichten over overnames, FDA, noteringen, IPO's, splitsingen, indexwijzigingen
en speciaal dividend leest de bot het hele persbericht en zet de datums die nog komen in de agenda,
met wat voor datum het is ("Annahmefrist endet am 23. Oktober" → *einde aanmeldtermijn*, "PDUFA
target action date of March 15" → *PDUFA-datum*). Zelf toevoegen kan ook:
`/agenda 23-10 PFSE einde aanmeldtermijn`. Wat binnen 7 dagen valt staat bovenaan het overzicht,
`/agenda` toont alles.

**Opzetten.** Heb je de onderwerpen al aangemaakt, stuur dan nog eens `/onderwerpen maak`: alleen
het onderwerp *☀️ Ochtendoverzicht* komt erbij. Of maak het zelf en stuur daarin
`/hier ochtend`. `/ochtend` toont het overzicht zoals het er nu uitziet.

Hoe het werkt: de bot doet vanaf 07:00 per minuut één stap (noteringen, dividend, cijfers,
IPO-kalender, koersen voor het dividendnieuws, om 08:28 de vroege koersen) en leest tussendoor
persberichten. Om 08:40 gaat het overzicht, ook als een stap mislukte; dat staat er dan onderaan.
De eerste ochtend legt alleen vast welke noteringen er al zijn; nieuwe noteringen zie je vanaf de
dag erna.

## Koersdoelen: street high / street low

Elk half uur legt de bot de analistenkoersdoelen vast van de ± 1.300 aandelen in de selectie
die analistendekking hebben. Stijgt het hoogste koersdoel (een analist zit boven de rest: nieuwe
street high) of daalt het laagste (nieuwe street low), dan volgt een melding met het oude en
nieuwe doel, het gemiddelde, het aantal analisten en het potentieel vanaf de huidige koers.

Dit kijkt naar de cijfers, niet naar koppen: "street-high" komt in nieuws over Europese small
caps vrijwel nooit voor. TradingView rekent koersdoelen om naar euro; de bot rekent terug naar de
eigen munt van het aandeel, zodat een wisselkoersbeweging geen valse melding geeft. Aan/uit met
`/koersdoel aan` of `/koersdoel uit`.

## Onderwerpen (Telegram Topics)

In een groep met Topics kan elke soort melding een eigen onderwerp krijgen:

1. Groepsinstellingen → Bewerken → **Topics** aanzetten (de groep wordt dan een supergroep; de
   bot volgt het nieuwe chat-id vanzelf).
2. De bot beheerder maken met het recht **Onderwerpen beheren**.
3. In de groep `/onderwerpen maak` sturen. De bot maakt *📰 Volglijst*, *💶 Emissies*, *🚀 IPO's*,
   *🎯 Koersdoelen* en *☀️ Ochtendoverzicht* aan (wat al bestaat, slaat hij over); al het andere
   (dividend, insolventie, ...) komt in *Algemeen*.

Zonder beheerdersrecht kan het ook met de hand: zelf een onderwerp maken en daarin
`/hier <soort>` sturen (`/hier volglijst`, `/hier emissie`, `/hier ipo`, `/hier koersdoel`,
`/hier dividend`, ...). `/hier <soort> uit` zet een soort terug naar de standaardplek, en
`/onderwerpen` laat de indeling zien. Raakt een melding meerdere filters met elk een eigen
onderwerp, dan komt hij in elk van die onderwerpen.

## Delen in een Telegram-groep

1. Maak in Telegram een groep en voeg de bot en de anderen toe.
2. Stuur in de groep `/hier`. Vanaf dan gaan alle meldingen (volglijst en screener) naar de groep.
3. Iedereen in de groep ziet de meldingen en kan aandelen volgen (`/volg`, `/stop`) en
   filterwoorden beheren (`/woord`, `/woordweg`). Alleen de eigenaar (wie als eerste `/start`
   stuurde) kan `/hier`, `/filterweg` en `/marktwaarde` met nieuwe waarden gebruiken.
   Buiten de meldingengroep reageert de bot alleen op de eigenaar.
4. Reageert de bot niet in de groep, gebruik dan `/hier@gebruikersnaamvandebot`.

`/hier` in je eigen chat met de bot zet de meldingen weer terug naar daar.

## Hoe het werkt

- Draait als losse Cloudflare Worker **`nieuws-alert`** (niet Roviko), elke minuut, dag en nacht,
  in drie delen met elk een eigen budget: volglijst, screener en ochtendoverzicht.
- Haalt per aandeel het nieuws op dat je ook op TradingView ziet (Duits en Engels).
- Onthoudt in een D1-database wat al gemeld is, dus elk bericht komt één keer.
- Nieuws dat er al stond toen je een aandeel toevoegde, wordt niet gemeld.
- Gratis binnen het Cloudflare Free-plan.

## Eenmalig opzetten (± 5 minuten)

1. **Telegram-bot maken.** Open Telegram, zoek **@BotFather**, stuur `/newbot`, kies een
   naam en een gebruikersnaam die op `bot` eindigt. Je krijgt een token zoals
   `123456789:AA...`.
2. **Token in GitHub zetten.** Repo → Settings → Secrets and variables → Actions →
   New repository secret: naam `TELEGRAM_BOT_TOKEN`, waarde het token.
   (`CLOUDFLARE_API_TOKEN` en `CLOUDFLARE_ACCOUNT_ID` staan er al voor Roviko.)
3. **Mergen** naar de standaardbranch. De workflow *Nieuwsmelder* zet de Worker live.
4. **Koppelen.** Open je bot in Telegram en stuur `/start`. Wie dat als eerste doet, wordt
   eigenaar; anderen krijgen geen antwoord. (Wil je dat vastleggen: zet ook
   `TELEGRAM_CHAT_ID` als secret.)

## Bediening in Telegram

| Commando | Wat |
| --- | --- |
| `/volg 1INN` | aandeel toevoegen (ticker of naam; meerdere met komma's) |
| `/volg XETR:1INN` | precies deze notering |
| `/stop 1INN` | weghalen |
| `/lijst` | wat er gevolgd wordt |
| `/laatste 1INN` | de laatste drie koppen, handig om te testen |
| `/status` | wanneer er voor het laatst gekeken is, en eventuele fouten |
| `/hier` | meldingen voortaan naar deze chat of groep |
| `/filters` | alle filters en hun woorden |
| `/woord dividend Superdividende` | woord toevoegen (nieuwe filternaam = nieuwe filter) |
| `/woordweg dividend Superdividende` | woord weghalen |
| `/filterweg dividend` | hele filter weghalen |
| `/filtertest` | treffers in de huidige nieuwsstromen tonen, zonder te melden |
| `/koersdoel aan` / `uit` | street high/low-meldingen aan- of uitzetten |
| `/bereik ipo europa` / `selectie` | filter over al het Europese nieuws of alleen de selectie (eigenaar) |
| `/onderwerpen` / `/onderwerpen maak` | indeling bekijken / onderwerpen aanmaken (eigenaar) |
| `/hier emissie` | deze soort melding naar dit onderwerp (eigenaar) |
| `/marktwaarde 2,5 500` | bandbreedte in miljoen euro |
| `/screener` | grootte van de selectie en wanneer die is bijgewerkt |
| `/ochtend` | het ochtendoverzicht zoals het er nu uitziet, en wanneer het volgende komt |
| `/ochtend aan` / `uit` | ochtendoverzicht aan- of uitzetten (eigenaar) |
| `/agenda` | alles wat gepland staat (komende 4 maanden), met nummers |
| `/agenda 23-10 PFSE einde bod` | zelf iets in de agenda zetten (ook `23-10-2026`, `2026-10-23`, `23 okt`) |
| `/agendaweg 12` | agendapunt weghalen |
| `/direct overname aan` / `uit` | filter ook direct melden, of alleen in het ochtendoverzicht (eigenaar) |
| `/hier ochtend` | ochtendoverzicht naar dit onderwerp (eigenaar) |

Commando's worden elke minuut opgehaald, dus een antwoord kan tot een minuut duren.
De startlijst (`WATCHLIST` in `wrangler.jsonc`) wordt alleen bij de allereerste run gebruikt.

## Instellingen (`wrangler.jsonc` → `vars`)

| Naam | Standaard | |
| --- | --- | --- |
| `NEWS_LANGS` | `de,en` | talen van de nieuwsfeed |
| `TIMEZONE` | `Europe/Amsterdam` | tijd in de melding |
| `MAX_AGE_HOURS` | `24` | ouder nieuws niet meer melden (na een storing) |
| `MAX_REQUESTS` | `30` | TradingView-verzoeken per minuut voor de volglijst; bij een lange lijst wisselt het door |
| `SCREEN_MARKETS` | 15 landen | screener-markten van TradingView (`germany`, `uk`, ...) |
| `SCREEN_COUNTRIES` | zie `src/config.ts` | land van het bedrijf zelf, in het Engels zoals TradingView het noemt |
| `SCREEN_FEEDS` | zie `src/config.ts` | nieuwsstromen per taal en land |
| `SCREEN_CAP_MIN_EUR` / `SCREEN_CAP_MAX_EUR` | 2,5 mln / 500 mln | standaardbandbreedte; `/marktwaarde` gaat voor |
| `MAX_ALERTS_PER_SYMBOL` | `5` | hoogstens zoveel koppen per bericht; de rest wordt als aantal genoemd |
| `STORY_DETAILS` | `true` | samenvatting en bronlink ophalen |
| `OCHTEND_TIJD` | `08:40` | tijd van het ochtendoverzicht (lokale tijd, werkdagen) |
| `OCHTEND_DIVIDEND_PCT` | `25` | speciaal dividend vanaf dit percentage van de koers |
| `OCHTEND_KOERS_PCT` | `4` | vroege koersen vanaf deze beweging |
| `AGENDA_DAGEN` | `7` | zoveel dagen vooruit staat de agenda in het overzicht |

Met twee talen past een volglijst van 15 aandelen in één minuut. Bij meer aandelen worden ze
om de beurt bekeken (bij 30 aandelen dus elk aandeel om de twee minuten). De screener kost
daarnaast maar zes verzoeken per minuut, hoe groot de selectie ook is.

## Ontwikkelen

```
cd nieuws
npm ci
npm test            # unit-tests met nep-TradingView en nep-Telegram
npm run typecheck
npm run probe       # echt nieuws ophalen bij TradingView (geen Telegram)
```

## Kanttekeningen

- TradingView heeft geen officiële nieuws-API; dit gebruikt dezelfde endpoints als de site.
  Verandert TradingView iets, dan faalt de *probe*-stap in de workflow en meldt `/status` fouten.
- De melding is zo snel als TradingView het bericht oppikt, plus maximaal een minuut.
- Geen handelsadvies.
