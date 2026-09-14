# De TradingView-route

## Wat TradingView wél en niet kan

| Wil je... | Kan dat in TradingView? |
|---|---|
| Een lijst zien van alle premarket-stijgers | **Ja** — Stock Screener, kolom *Pre-market Change %* |
| Een alert op één specifiek aandeel bij >50% premarket | **Ja** — met het Pine-script hieronder |
| Automatisch gemaild worden zodra *welk* Amerikaans aandeel dan ook >50% stijgt | **Nee** |

Dat laatste is de kern van het probleem. TradingView-alerts hangen altijd aan één
symbool. Een Premium-account geeft je 400 alerts; de Amerikaanse markt heeft
ruim 6.000 noteringen. Je kunt dus niet de hele markt afdekken — en juist de
aandelen die 50%+ springen zijn meestal de kleine namen die niet op je
watchlist staan.

Daarom twee sporen: de screener + Pine-alerts voor namen die je al volgt, en het
script in deze repo voor de hele markt.

## Screener handmatig instellen

1. Open de [Stock Screener](https://www.tradingview.com/screener/) en zet hem op **America**.
2. Voeg via *Filters* de kolom **Pre-market Change %** toe en zet die op `greater than 50`.
3. Voeg **Pre-market Volume** toe (`greater than 50000`) — zonder volumefilter zie je vooral
   ruis van één enkele trade van 100 aandelen.
4. Voeg **Price** toe (`greater than 1`) om sub-dollar aandelen eruit te houden.
5. Sorteer aflopend op *Pre-market Change %* en sla op als screener-preset.

Handig om 's ochtends bij te hebben, maar het waarschuwt je niet uit zichzelf.

## Pine-script alert per aandeel

`pine/premarket_move.pine` in deze repo. Zo gebruik je het:

1. Open een chart en klik onderin op **Pine Editor**.
2. Plak de inhoud van het bestand en klik **Add to chart**.
3. **Belangrijk:** rechtermuisknop op de chart → *Settings* → *Symbol* → zet
   **Extended trading hours** aan. Zonder dat ziet het script geen premarket-bars
   en gebeurt er niets.
4. Zet de chart op een intraday-timeframe (1 of 5 minuten).
5. Klik op de wekker (**Alert**) → *Condition*: het script → **Any alert() function call**.
6. Bij *Trigger*: **Once per bar close**. Bij *Notifications*: vink **Send email** aan.
7. Herhaal per aandeel dat je wilt volgen.

De drempel, minimale koers en het minimale premarket-volume stel je in via de
instellingen van de indicator.

Twee dingen om te weten:

- Alerts van TradingView verlopen. Op een betaald abonnement kun je ze op
  *Open-ended* zetten; controleer dat, anders vallen ze na een paar maanden stil.
- Het script is hier niet in TradingView gecompileerd (deze omgeving heeft geen
  toegang tot TradingView). Klik na het plakken één keer op *Add to chart* om te
  zien of de editor geen foutmelding geeft.

## Waarom het script in deze repo

Dat gebruikt hetzelfde screener-endpoint als de website, maar dan elke vijf
minuten automatisch, over de hele markt, met een mail als resultaat. Zie de
[README](../README.md).
