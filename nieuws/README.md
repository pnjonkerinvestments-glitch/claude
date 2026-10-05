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

  Een nieuw standaardfilter komt er bij een bestaande installatie vanzelf bij; een filter dat de
  groep zelf heeft weggehaald, komt niet terug. Hoofdletters en accenten maken niet uit, en een
  woord vindt ook langere vormen ("Sonderdividende" vindt "Sonderdividenden").
- Hetzelfde nieuws in meerdere talen in dezelfde minuut wordt één bericht. Wat al via de
  volglijst gemeld is, komt niet nog eens.

## Koersdoelen: street high / street low

Elk half uur legt de bot de analistenkoersdoelen vast van de ± 1.300 aandelen in de selectie
die analistendekking hebben. Stijgt het hoogste koersdoel (een analist zit boven de rest: nieuwe
street high) of daalt het laagste (nieuwe street low), dan volgt een melding met het oude en
nieuwe doel, het gemiddelde, het aantal analisten en het potentieel vanaf de huidige koers.

Dit kijkt naar de cijfers, niet naar koppen: "street-high" komt in nieuws over Europese small
caps vrijwel nooit voor. TradingView rekent koersdoelen om naar euro; de bot rekent terug naar de
eigen munt van het aandeel, zodat een wisselkoersbeweging geen valse melding geeft. Aan/uit met
`/koersdoel aan` of `/koersdoel uit`.

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

- Draait als losse Cloudflare Worker **`nieuws-alert`** (niet Roviko), elke minuut, dag en nacht.
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
| `/marktwaarde 2,5 500` | bandbreedte in miljoen euro |
| `/screener` | grootte van de selectie en wanneer die is bijgewerkt |

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
