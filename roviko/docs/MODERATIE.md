# Moderatie: meldingen en blokkades

Roviko toont alleen één soort tekst van spelers aan andere spelers: de **spelersnaam**. Er is geen chat en geen vrije tekst in multiplayer. Kamernamen zijn afgeleid van de naam van de host ("Naam's room").

## Wat al automatisch gebeurt

- **Namenfilter** op de server (`lib/name-filter.ts`):
  - Het filter werkt in het Engels, Nederlands en Spaans.
  - Het kijkt door hoofdletters, accenten, spaties, puntjes, herhaalde letters en leetspeak heen (K4nk3r, f.u.c.k, fuuuck).
  - Links en e-mailadressen in namen worden ook geweigerd.
  - Een geweigerde naam geeft de melding "Die naam kan niet".
  - Oudere namen die het filter niet halen, worden in kamers als "Explorer" getoond.
- **Blokkeren** (`server/moderation.ts`, tabel `player_blocks`). Geblokkeerde spelers:
  - komen nooit in dezelfde kamer: de kamer is dan "niet beschikbaar", zonder te zeggen waarom;
  - worden nooit aan elkaar gekoppeld bij "Speel tegen een willekeurige speler";
  - kunnen elkaar niet als vriend toevoegen of uitnodigen, en zien elkaars online-status niet. Een bestaande vriendschap wordt verwijderd.
- **Melden** (tabel `player_reports`):
  - Er zijn vier redenen: aanstootgevende naam, valsspelen, vervelend gedrag, iets anders. Er is geen vrije tekst.
  - Maximaal 20 meldingen per speler per dag.
  - De gemelde speler ziet nooit wie de melding deed.

Spelers vinden **Melden / Blokkeren** via de knop **⋯** bij een speler:
- in de wachtruimte van een kamer;
- in de eindstand van een potje;
- in de vriendenlijst.

Hun blokkades beheren ze in het Paspoort, onder "Geblokkeerde spelers".

## Wat jij doet: binnen 24 uur reageren

Apple verwacht dat je meldingen snel opvolgt. De voorwaarden beloven **binnen 24 uur**.

### Via de beheerpagina `/admin` (aanbevolen)

1. **Eenmalig:** zet je eigen spelers-ID als beheerder.
   - Zoek je ID op door ingelogd `https://roviko.app/api/export` te openen en te kijken bij `profile.id`.
   - Voeg in Cloudflare een variabele toe: Workers & Pages → `roviko` → Settings → Variables and Secrets → Add. Naam `ADMIN_USER_IDS`, waarde je ID. Meerdere ID's scheid je met komma's.
2. Open `https://roviko.app/admin` en ga naar **Gemelde spelers**. Per melding kun je kiezen uit:
   - **Afgehandeld**: je hebt de melding bekeken.
   - **Naam resetten**: de naam wordt "Explorer 1234".
   - **Account blokkeren**: de speler kan niet meer spelen.

### Zonder beheerpagina (met wrangler)

```bash
# Open meldingen
npx wrangler d1 execute roviko-db --remote -c wrangler.cloudflare.jsonc --command \
  "SELECT r.created_at, r.reason, r.reported_id, r.reported_name, u.name AS huidige_naam, r.room_code FROM player_reports r LEFT JOIN users u ON u.id=r.reported_id WHERE r.status='open' ORDER BY r.created_at DESC"

# Naam resetten
npx wrangler d1 execute roviko-db --remote -c wrangler.cloudflare.jsonc --command \
  "UPDATE users SET name='Explorer 1234' WHERE id='<spelers-id>'"

# Account blokkeren
npx wrangler d1 execute roviko-db --remote -c wrangler.cloudflare.jsonc --command \
  "UPDATE users SET blocked=1 WHERE id='<spelers-id>'"

# Melding afhandelen
npx wrangler d1 execute roviko-db --remote -c wrangler.cloudflare.jsonc --command \
  "UPDATE player_reports SET status='resolved' WHERE id='<melding-id>'"
```

## Het filter uitbreiden

- Voeg woorden (klein, zonder accenten) toe aan `BLOCKED` in `lib/name-filter.ts`.
- Komt het woord ook in gewone namen voor, zet het dan in `WHOLE_WORD_ONLY` of in `ALLOWED` (het "Scunthorpe-probleem").
- Voeg bij elke wijziging een voorbeeld toe aan `tests/moderation.test.mjs`.
