# Premarket alert

Mailt je zodra een Amerikaans aandeel in de premarket (04:00–09:30 ET) meer dan
50% stijgt ten opzichte van de vorige slotkoers.

Draait op GitHub Actions, kost niets, en heeft geen dependencies buiten de
Python-standaardbibliotheek.

```
[Premarket] ABCD +87% premarket

ABCD (NASDAQ)  +87.5%
  Testbedrijf Inc
  koers $6.00 (vorige slot $3.20)
  premarket volume 500,000 | omzet $3,000,000 | cap $120.0M
  https://www.tradingview.com/chart/?symbol=NASDAQ%3AABCD
```

## Waarom niet gewoon TradingView?

Omdat TradingView-alerts altijd aan één symbool hangen. Je kunt prima een alert
zetten op een aandeel dat je al volgt, maar niet op "welk Amerikaans aandeel dan
ook". En 50%-sprongen komen juist bij de kleine namen voor, die niet op je
watchlist staan.

Wat je met je betaalde TradingView-account wél moet doen — de screener-preset en
een Pine-script voor alerts per aandeel — staat in
**[docs/tradingview.md](docs/tradingview.md)**. Dat is complementair aan dit script.

## Opzetten

### 1. Repo klaarzetten

Fork of push deze repo naar je eigen GitHub-account. Een **private** repo werkt
prima; let dan wel op je Actions-minuten (zie [Kosten](#kosten)).

### 2. E-mail regelen

Met Gmail:

1. Zet tweestapsverificatie aan op je Google-account.
2. Maak een **app-wachtwoord** aan via <https://myaccount.google.com/apppasswords>.
3. Gebruik dat wachtwoord van 16 tekens, niet je gewone wachtwoord.

Elke SMTP-server werkt; poort 587 (STARTTLS) en 465 (SSL) worden allebei herkend.

### 3. Secrets invullen

*Settings → Secrets and variables → Actions → Secrets → New repository secret:*

| Secret | Voorbeeld |
|---|---|
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | `jouwadres@gmail.com` |
| `SMTP_PASSWORD` | je app-wachtwoord |
| `MAIL_TO` | `jouwadres@gmail.com` (meerdere mag, komma-gescheiden) |

`MAIL_FROM` is optioneel; standaard wordt `SMTP_USER` gebruikt.

Wil je de filters aanpassen, zet ze dan onder *Variables* (niet Secrets):
`THRESHOLD_PCT`, `MIN_PRICE`, `MIN_PREMARKET_VOLUME`, `MIN_DOLLAR_VOLUME`,
`EXCHANGES`, `RE_ALERT_STEP_PCT`. Alle opties staan in [`.env.example`](.env.example).

### 4. Testen

*Actions → Premarket alert → Run workflow.* Laat `ignore_window` op `true` staan,
zodat hij ook buiten de premarket draait. Krijg je geen mail, kijk dan in de
logs van de run.

Een losse testmail om alleen SMTP te controleren:

```bash
python -m premarket_alert --self-test
```

Daarna loopt hij vanzelf: elke 5 minuten op werkdagen tussen 08:00 en 14:55 UTC.
Buiten de premarket stopt het script direct, en weekenden en Amerikaanse
beursfeestdagen slaat hij over.

## Lokaal draaien

Python 3.11+, geen `pip install` nodig.

```bash
cp .env.example .env      # vul je gegevens in
set -a && source .env && set +a

python -m premarket_alert --dry-run --ignore-window   # print in plaats van mailen
python -m premarket_alert --threshold 30 --dry-run --ignore-window
python -m unittest discover -s tests -v
```

Wil je hem op een eigen server draaien in plaats van op GitHub, dan is dit de
crontab-regel (server op UTC):

```cron
*/5 8-14 * * 1-5 cd /pad/naar/repo && /usr/bin/env -S bash -c 'set -a; source .env; set +a; python3 -m premarket_alert' >> premarket.log 2>&1
```

## Databronnen

| `PROVIDER` | Kosten | Opmerking |
|---|---|---|
| `tradingview` (standaard) | gratis | Zelfde screener-endpoint als de website van TradingView |
| `polygon` | vanaf ±$29/mnd | Officieel gedocumenteerde API, vereist `POLYGON_API_KEY` |

Het TradingView-endpoint is niet officieel gedocumenteerd. Het werkt al jaren en
één request per vijf minuten is minder belasting dan de screener zelf, maar
TradingView kan het zonder aankondiging wijzigen. Merk je dat er niets meer
binnenkomt, schakel dan over op `polygon` — de rest van de code blijft gelijk.

## Filters

De standaardinstellingen zijn zo gekozen dat je vooral echte bewegingen ziet:

- **`THRESHOLD_PCT=50`** — stijging ten opzichte van de vorige officiële slotkoers.
- **`MIN_PRICE=1`** — sub-dollar aandelen springen zonder aanleiding 80%.
- **`MIN_PREMARKET_VOLUME=50000`** en **`MIN_DOLLAR_VOLUME=100000`** — in de premarket
  is één trade van 200 aandelen genoeg voor een "stijging" van 60%. Zonder deze
  twee filters bestaat je mail voornamelijk uit die ruis.
- **`EXCHANGES=NASDAQ,NYSE,AMEX`** — laat leeg om OTC mee te nemen (veel meer ruis).
- **`INSTRUMENT_TYPES=stock,dr`** — houdt ETF's en fondsen eruit.

Je krijgt per aandeel maximaal één mail per dag. Stijgt hij daarna nog eens 25
procentpunt verder, dan volgt er een tweede (`RE_ALERT_STEP_PCT`).

## Kosten

Publieke repo: gratis, onbeperkt.

Private repo: GitHub rekent per begonnen minuut. Ongeveer 84 runs per dag × 1
minuut × 21 handelsdagen ≈ **1.750 minuten per maand**, tegen 2.000 gratis in het
Free-plan. Dat past, maar krap. Wil je marge: zet de cron op `*/10` (halveert het),
of maak de repo publiek — er staan geen geheimen in de code.

## Waar je op moet letten

- **GitHub-cron loopt achter.** Geplande workflows starten regelmatig een paar
  minuten later dan gepland, soms 15 minuten bij drukte. Voor een alert die je
  vooral snel wilt hebben is dat de zwakste schakel. Wil je dat echt strak:
  draai hem op een eigen VPS of Raspberry Pi met de crontab-regel hierboven.
- **GitHub zet geplande workflows uit** na 60 dagen zonder activiteit in de repo.
  Je krijgt daar een mail over; één commit of een handmatige run zet hem weer aan.
- **Premarket-data is dun.** Een koers van +60% op 300 verhandelde aandelen zegt
  niets. Daar zijn de volumefilters voor, maar controleer altijd zelf het nieuws
  en de spread voordat je iets doet. Dit is geen handelsadvies.

## Hoe het in elkaar zit

```
premarket_alert/
  cli.py         startpunt: venster bepalen, scannen, mailen
  clock.py       premarket-venster in ET + NYSE-feestdagen t/m 2030
  config.py      alle instellingen uit omgevingsvariabelen
  scanner.py     de filters
  state.py       onthoudt wat al gemeld is (dedupe per handelsdag)
  notifier.py    SMTP, platte tekst + HTML
  providers/     tradingview.py en polygon.py
pine/            Pine-script voor alerts per aandeel in TradingView
tests/           51 tests, alleen stdlib
```
