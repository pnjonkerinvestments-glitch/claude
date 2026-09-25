# Roviko publiceren — kiezen per release

Bij elke nieuwe versie kies je zelf hoe Roviko live gaat:

| | **Optie A — ChatGPT** | **Optie B — eigen Cloudflare** |
|---|---|---|
| Wie publiceert | Jij, door een zip bij ChatGPT te uploaden | GitHub Actions, na een merge door Claude |
| Adres | https://roviko.app (de live site) | https://roviko.pnjonkerinvestments.workers.dev (testadres) |
| Spelersdata | De echte, bestaande spelers | Eigen, aparte database `roviko-db` (begon leeg) |
| Commando | `npm run export:chatgpt` | `npm run deploy:cloudflare` |

Zolang roviko.app naar ChatGPT wijst, is **optie A de live site** en is optie B een testomgeving. Je kunt ze ook allebei doen: eerst B om te testen, daarna A om live te zetten.

---

## Optie A — ChatGPT (zoals tot nu toe)

1. Zorg dat alle wijzigingen gecommit zijn.
2. Maak de zip:
   ```sh
   npm ci                         # alleen de eerste keer
   npm run export:chatgpt         # versie uit EXPORT_MANIFEST.json
   npm run export:chatgpt -- 1.16.0   # of met een nieuw versienummer
   ```
   Het script draait typecheck, build en alle tests. Mislukt een test, dan komt er geen zip.
3. Resultaat: `outputs/roviko-<versie>-chatgpt.zip`. Daarin:
   - alle bestanden van de map `roviko/` uit de laatste commit (`git archive` van HEAD), direct in de zip-root;
   - een nieuw `EXPORT_MANIFEST.json` met versie, broncommit, elk bestand met grootte en sha256, de testuitslag, en de vereiste laatste migratie (`required_latest_migration`) plus alle migraties in volgorde.
4. Upload de zip bij ChatGPT in het Roviko-project en vraag om de site bij te werken. Handige zin:
   > "Hier is Roviko versie X. Lees eerst START_HERE_CLAUDE.md en EXPORT_MANIFEST.json. Pas alle nog niet toegepaste migraties uit `drizzle/` toe in journaalvolgorde, tot en met `required_latest_migration`, bouw en publiceer naar roviko.app. Verwijder geen bestaande data."
5. Het bijgewerkte `EXPORT_MANIFEST.json` staat ook in je werkmap. Commit het als je het wilt bewaren.

Belangrijk: `.openai/hosting.json` hoort bij de ChatGPT-hosting en moet blijven staan.

---

## Optie B — eigen Cloudflare-account

### Eenmalig (is al gedaan op 24 september 2026)

- Database `roviko-db` aangemaakt (id `846202e3-4f55-4149-978b-44a39e439d74`), migraties 0000–0004 toegepast.
- Worker `roviko` gedeployed naar https://roviko.pnjonkerinvestments.workers.dev.
- Configuratie: `wrangler.cloudflare.jsonc`. Die heet bewust **niet** `wrangler.jsonc`, omdat de bouwstap dat bestand anders automatisch oppakt en daarmee de ChatGPT-build zou veranderen.

### Normale route: via GitHub (geen token in de Claude-sessie nodig)

Sinds 25 september 2026 publiceert GitHub Actions automatisch
(`.github/workflows/roviko-deploy.yml`):

1. Claude werkt op een eigen branch en opent een pull request naar de standaardbranch.
2. Na akkoord van de eigenaar mergt Claude de PR.
3. De workflow **Roviko naar Cloudflare** draait dan vanzelf: `npm ci`, typecheck en
   `npm run deploy:cloudflare` (bouwen, testen, migraties, deploy). Faalt een test,
   dan wordt er niets gepubliceerd.
4. Met de hand opnieuw deployen: *Actions → Roviko naar Cloudflare → Run workflow*.

De workflow gebruikt de repository secrets `CLOUDFLARE_API_TOKEN` en
`CLOUDFLARE_ACCOUNT_ID`. Het token moet *Workers Scripts: Edit*, *D1: Edit* en
*Account Settings: Read* hebben.

### Nodig (alleen voor publiceren vanaf je eigen computer)

- Een Cloudflare API-token als omgevingsvariabele `CLOUDFLARE_API_TOKEN` (nooit in een bestand of in git), met: *Workers Scripts: Edit*, *D1: Edit*, *Account Settings: Read*.
- `CLOUDFLARE_ACCOUNT_ID=d3e59f712dc36fea587bc5be0ebf58ec` (staat ook in de config).

### Publiceren

```sh
npm ci                        # alleen de eerste keer
npm run deploy:cloudflare
```

Dat doet in deze volgorde:
1. `npm run build`
2. `npm test` (stopt bij een fout; er wordt dan niets gepubliceerd)
3. `wrangler d1 migrations apply roviko-db --remote` — past alleen **nieuwe** migraties toe; wat al gedaan is wordt overgeslagen
4. `wrangler deploy` naar workers.dev, met versie en commit als omschrijving

Daarna controleren (vanaf een computer die het testadres kan bereiken):

```sh
npm run smoke -- https://roviko.pnjonkerinvestments.workers.dev
```

De rooktest opent de homepage, /daily, /explore en /friends, controleert service worker, offlinepagina, vlaggen en afbeeldingen, speelt een volledige Rank Radar als gast, maakt een multiplayerkamer aan en opent die via WebSocket.

Let op: de rooktest speelt echt een dagspel met een gastaccount, dus op de testdatabase komt één gastresultaat bij. Draai hem daarom **niet** tegen roviko.app.

### Optionele instellingen

Geen enkel geheim is verplicht. Wil je ze toch (zie `.env.example`):

```sh
npx wrangler secret put ADMIN_USER_IDS -c wrangler.cloudflare.jsonc
npx wrangler secret put GOOGLE_CLIENT_ID -c wrangler.cloudflare.jsonc
npx wrangler secret put GOOGLE_CLIENT_SECRET -c wrangler.cloudflare.jsonc
```

Voor Google-inloggen moet het testadres ook als toegestane redirect in de Google-console staan.

### Terugdraaien

Elke deploy is een aparte versie. Terug naar de vorige:

```sh
npx wrangler deployments list -c wrangler.cloudflare.jsonc   # overzicht met Version ID's
npx wrangler rollback -c wrangler.cloudflare.jsonc            # naar de vorige versie
npx wrangler rollback <version-id> -c wrangler.cloudflare.jsonc   # naar een specifieke versie
```

Of in het Cloudflare-dashboard: Workers & Pages → roviko → Deployments → *Rollback*.

Let op: een rollback zet alleen de **code** terug, niet de database. Migraties zijn in Roviko altijd toevoegingen (nieuwe tabellen/kolommen), dus oude code werkt gewoon met een nieuwere database. Schrijf nooit een migratie die data weggooit zonder dat apart te bespreken.

---

## Later: roviko.app overzetten naar Cloudflare (NOG NIET UITGEVOERD)

Dit is een aparte stap die alleen gebeurt als jij dat uitdrukkelijk vraagt. Er is nu **niets** aan roviko.app, de DNS of routes veranderd.

1. **Spelersdata ophalen bij ChatGPT.** De echte accounts, reeksen en punten staan in de database van de ChatGPT-hosting. Vraag ChatGPT om een volledige SQL-export (D1 `export` / SQLite-dump) van die database. Zonder die export begint iedereen op Cloudflare opnieuw.
2. **Token uitbreiden** met rechten op de zone roviko.app:
   - *Zone: Workers Routes: Edit*
   - *Zone: DNS: Edit*
3. **Onderhoudsmoment kiezen.** Tussen export en overstap mogen er geen nieuwe spelresultaten bij ChatGPT bijkomen, anders gaan die verloren. Kies een rustig moment (bijv. vlak na middernacht UTC).
4. **Data importeren** in `roviko-db` (of een nieuwe, lege productiedatabase) met `wrangler d1 execute roviko-db --remote --file=export.sql`, daarna controleren dat aantallen spelers en resultaten kloppen.
5. **Domein koppelen**: in `wrangler.cloudflare.jsonc` `"routes": [{ "pattern": "roviko.app", "custom_domain": true }]` toevoegen en deployen. Cloudflare past dan zelf de DNS aan. Zet ook `APPLICATION_URL=https://roviko.app` als variabele.
6. **Controleren** met de browser (niet met de rooktest, die schrijft data).

**Terugschakelen naar ChatGPT:** de route/custom domain in Cloudflare verwijderen (Workers & Pages → roviko → Settings → Domains & Routes) en de DNS-records van roviko.app terugzetten naar wat ChatGPT voorschrijft. Maak **vóór** stap 5 een schermafdruk of export van de huidige DNS-records van roviko.app, zodat terugzetten precies kan. Let op: spelresultaten die in de tussentijd op Cloudflare zijn gemaakt, staan dan niet in de ChatGPT-database.
