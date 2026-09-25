# Premarket alert

Mailt je zodra een Amerikaans aandeel in de premarket (04:00–09:30 ET) meer dan
50% stijgt ten opzichte van de vorige slotkoers.

Draait als Cloudflare Worker (Roviko) met een cron-trigger, kost niets, en heeft
geen runtime-dependencies. De oorspronkelijke Python-versie staat er nog naast
voor lokaal draaien of als noodroute via GitHub Actions.

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

### 1. Cloudflare klaarzetten

1. Maak een gratis account op <https://dash.cloudflare.com>.
2. Noteer je **Account ID** (rechts op *Workers & Pages*).
3. Maak een API-token via *My Profile → API Tokens → Create Token → Edit Cloudflare
   Workers*. Die template geeft onder meer *Workers Scripts: Edit* en
   *Workers KV Storage: Edit*, meer is niet nodig.

### 2. E-mail regelen

Met Gmail:

1. Zet tweestapsverificatie aan op je Google-account.
2. Maak een **app-wachtwoord** aan via <https://myaccount.google.com/apppasswords>.
3. Gebruik dat wachtwoord van 16 tekens, niet je gewone wachtwoord.

Elke SMTP-server werkt; poort 587 (STARTTLS) en 465 (SSL) worden allebei herkend.
Poort 25 werkt niet: die blokkeert Cloudflare voor uitgaand verkeer.

### 3. Secrets invullen

*GitHub: Settings → Secrets and variables → Actions → Secrets → New repository secret:*

| Secret | Voorbeeld |
|---|---|
| `CLOUDFLARE_API_TOKEN` | het token uit stap 1 |
| `CLOUDFLARE_ACCOUNT_ID` | het account-ID uit stap 1 |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | `jouwadres@gmail.com` |
| `SMTP_PASSWORD` | je app-wachtwoord |
| `MAIL_TO` | `jouwadres@gmail.com` (meerdere mag, komma-gescheiden) |
| `RUN_TOKEN` | optioneel: een lange willekeurige string om hem met de hand te starten |

`MAIL_FROM` is optioneel; standaard wordt `SMTP_USER` gebruikt. Had je de
Python-versie al draaien, dan staan de mail-secrets er al.

De deploy kopieert deze secrets naar de Worker. Filters staan in
[`worker/wrangler.jsonc`](worker/wrangler.jsonc); een repository *Variable* met
dezelfde naam (`THRESHOLD_PCT`, `MIN_PRICE`, `MIN_PREMARKET_VOLUME`,
`MIN_DOLLAR_VOLUME`, `EXCHANGES`, `RE_ALERT_STEP_PCT`, …) gaat daarvoor.

### 4. Deployen

*Actions → Deploy naar Cloudflare → Run workflow.* Daarna deployt hij vanzelf bij
elke push naar de standaardbranch die iets in `worker/` verandert. De eerste deploy
maakt ook de KV-namespace aan waarin hij onthoudt wat al gemaild is.

Liever vanaf je eigen machine:

```bash
cd worker
npm ci
npx wrangler login
npx wrangler secret put SMTP_HOST      # herhaal voor SMTP_PORT, SMTP_USER, SMTP_PASSWORD, MAIL_TO
npx wrangler deploy
```

### 5. Testen

Met `RUN_TOKEN` gezet kun je hem op elk moment starten. Standaard negeert hij dan
het premarket-venster, net als de oude *Run workflow*-knop:

```bash
URL=https://roviko.<jouw-subdomein>.workers.dev
curl -X POST -H "Authorization: Bearer $RUN_TOKEN" "$URL/run?self_test=1"   # alleen een testmail
curl -X POST -H "Authorization: Bearer $RUN_TOKEN" "$URL/run?dry_run=1"     # scannen, niet mailen
curl -X POST -H "Authorization: Bearer $RUN_TOKEN" "$URL/run?threshold=30"  # echt, lagere drempel
```

Je krijgt JSON terug met de status en het logboek van die run. Zonder `RUN_TOKEN`
staat `/run` uit. Logs van de geplande runs staan in het Cloudflare-dashboard onder
*Workers & Pages → roviko → Logs*.

Daarna loopt hij vanzelf: elke 5 minuten op werkdagen tussen 08:00 en 14:55 UTC.
Buiten de premarket stopt hij direct, en weekenden en Amerikaanse
beursfeestdagen slaat hij over.

## Lokaal draaien

De Worker (Node 22.18+):

```bash
cd worker
npm ci
npm test                 # unittests
npm run typecheck
echo 'DRY_RUN=true' > .dev.vars
npm run dev              # daarna in een tweede terminal:
curl "http://localhost:8787/__scheduled?cron=*/5+8-14+*+*+MON-FRI"
```

De Python-versie (3.11+, geen `pip install` nodig) doet hetzelfde en werkt nog steeds:

```bash
cp .env.example .env      # vul je gegevens in
set -a && source .env && set +a

python -m premarket_alert --dry-run --ignore-window   # print in plaats van mailen
python -m premarket_alert --threshold 30 --dry-run --ignore-window
python -m unittest discover -s tests -v
```

Draai je de Python-versie op een eigen server, zet dan de Worker-cron uit, anders
krijg je elke melding twee keer. De crontab-regel (server op UTC):

```cron
*/5 8-14 * * 1-5 cd /pad/naar/repo && /usr/bin/env -S bash -c 'set -a; source .env; set +a; python3 -m premarket_alert' >> premarket.log 2>&1
```

De workflow *Premarket alert (GitHub, handmatig)* draait de Python-versie op
GitHub Actions. Hij heeft geen schema meer; hij is er alleen als noodroute.

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

Het gratis Workers-plan is ruim genoeg. Ongeveer 84 runs per dag, elk één
uitgaande request en hooguit een paar KV-reads; het gratis plan staat 100.000
requests en 1.000 KV-writes per dag toe, en de Worker schrijft alleen als hij mailt.
Cron-triggers kosten niets extra.

## Waar je op moet letten

- **TradingView kan Cloudflare weigeren.** Het screener-endpoint is niet officieel,
  en verkeer vanuit datacenters wordt soms geblokkeerd. Zie je in de logs HTTP 403
  of 429 van `scanner.tradingview.com`, schakel dan over op `PROVIDER=polygon`.
- **Mail gaat via een TCP-socket.** De Worker praat zelf SMTP met je mailserver
  (STARTTLS op 587, TLS op 465). Weigert Gmail de login, controleer dan het
  app-wachtwoord; de foutmelding staat in de logs.
- **De status is "eventually consistent".** Workers KV kan tot een minuut achterlopen
  tussen locaties. Met runs om de 5 minuten merk je daar niets van.
- **Premarket-data is dun.** Een koers van +60% op 300 verhandelde aandelen zegt
  niets. Daar zijn de volumefilters voor, maar controleer altijd zelf het nieuws
  en de spread voordat je iets doet. Dit is geen handelsadvies.

Wat je kwijt bent ten opzichte van GitHub Actions: de vertraging van 5–15 minuten
op geplande runs, en het automatisch uitzetten na 60 dagen zonder commits.

## Hoe het in elkaar zit

```
premarket_alert/  de oorspronkelijke Python-versie
  cli.py         startpunt: venster bepalen, scannen, mailen
  clock.py       premarket-venster in ET + NYSE-feestdagen t/m 2030
  config.py      alle instellingen uit omgevingsvariabelen
  scanner.py     de filters
  state.py       onthoudt wat al gemeld is (dedupe per handelsdag)
  notifier.py    SMTP, platte tekst + HTML
  providers/     tradingview.py en polygon.py
pine/            Pine-script voor alerts per aandeel in TradingView
tests/           tests van de Python-versie, alleen stdlib

worker/          de Cloudflare Worker (TypeScript, zelfde logica)
  wrangler.jsonc   naam, cron-trigger, KV-binding en filters
  src/index.ts     cron-handler en het /run-endpoint
  src/run.ts       venster bepalen, scannen, dedupen, mailen
  src/smtp.ts      SMTP-client bovenop cloudflare:sockets
  src/state.ts     dedupe per handelsdag in Workers KV
  src/…            clock, config, scanner, notifier, providers/
  test/            node:test, geen extra dependencies
```
