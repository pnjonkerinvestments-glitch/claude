# Nieuwsmelder

Stuurt je een Telegram-bericht zodra TradingView nieuws heeft over een aandeel op je lijst.
Bijvoorbeeld: innoscripta (XETR:1INN) reageert om 19:46 op slecht nieuws, en binnen een
minuut heb je de kop, een korte samenvatting en de link naar het originele artikel op je telefoon.

```
📰 1INN · innoscripta SE

innoscripta SE: Stellungnahme zu ...

🕒 vr 2 okt 19:46 · EQS Newswire
Origineel artikel · TradingView · Grafiek
```

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

Commando's worden elke minuut opgehaald, dus een antwoord kan tot een minuut duren.
De startlijst (`WATCHLIST` in `wrangler.jsonc`) wordt alleen bij de allereerste run gebruikt.

## Instellingen (`wrangler.jsonc` → `vars`)

| Naam | Standaard | |
| --- | --- | --- |
| `NEWS_LANGS` | `de,en` | talen van de nieuwsfeed |
| `TIMEZONE` | `Europe/Amsterdam` | tijd in de melding |
| `MAX_AGE_HOURS` | `24` | ouder nieuws niet meer melden (na een storing) |
| `MAX_REQUESTS` | `40` | TradingView-verzoeken per minuut; bij een lange lijst wisselt het door |
| `MAX_ALERTS_PER_SYMBOL` | `5` | meer tegelijk wordt samengevat |
| `STORY_DETAILS` | `true` | samenvatting en bronlink ophalen |

Met twee talen past een lijst van 20 aandelen in één minuut. Bij meer aandelen worden ze
om de beurt bekeken (bij 40 aandelen dus elk aandeel om de twee minuten).

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
