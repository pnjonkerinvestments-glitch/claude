# Roviko publiceren

**Sinds 25 september 2026 draait roviko.app op het eigen Cloudflare-account.** Publiceren
gaat via GitHub Actions (zie *Normale route* hieronder). De ChatGPT-hosting (optie A) wordt
niet meer gebruikt en blijft alleen nog een paar dagen bestaan als terugvaloptie.

| | |
|---|---|
| Live adres | https://roviko.app (custom domain op de worker `roviko`) |
| Zelfde site, ander adres | https://roviko.pnjonkerinvestments.workers.dev |
| Database | `roviko-db`: de **live** spelersdata, voor beide adressen |
| Publiceren | merge naar de standaardbranch → workflow *Roviko naar Cloudflare* |

Er is geen aparte testomgeving meer: het workers.dev-adres gebruikt dezelfde worker en
database als roviko.app.

---

## Optie A — ChatGPT (vervallen sinds 25 september 2026)

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

Daarna controleren: open https://roviko.app in de browser.

De rooktest (`npm run smoke -- <adres>`) schrijft in de database. Omdat workers.dev en
roviko.app sinds 25 september dezelfde live database delen, draai je hem alleen nog na
uitdrukkelijk akkoord van de eigenaar.

De rooktest opent de homepage, /daily, /explore en /friends, controleert service worker, offlinepagina, vlaggen en afbeeldingen, speelt een volledige Rank Radar als gast, maakt een multiplayerkamer aan en opent die via WebSocket.

Let op: de rooktest speelt echt een dagspel met een gastaccount, dus in de live database komt één gastresultaat bij, ook als je hem op het workers.dev-adres draait.

### Optionele instellingen

Geen enkel geheim is verplicht. Wil je ze toch (zie `.env.example`):

```sh
npx wrangler secret put ADMIN_USER_IDS -c wrangler.cloudflare.jsonc
npx wrangler secret put GOOGLE_CLIENT_ID -c wrangler.cloudflare.jsonc
npx wrangler secret put GOOGLE_CLIENT_SECRET -c wrangler.cloudflare.jsonc
```

Voor Google-inloggen moet `https://roviko.app/api/auth/google` als toegestane redirect in de Google-console staan.

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

## roviko.app overgezet naar Cloudflare (25 september 2026)

Zo is het gedaan, met akkoord van de eigenaar:

1. **Spelersdata:** niet overgezet. De eigenaar koos ervoor opnieuw te beginnen; de
   accounts en scores van de ChatGPT-hosting zijn niet meegenomen.
2. **Domein:** de eigenaar heeft in het dashboard de oude A/AAAA/CNAME-records van
   roviko.app verwijderd en `roviko.app` als *custom domain* aan de worker `roviko` gekoppeld
   (Workers & Pages → roviko → Settings → Domains & Routes). MX- en TXT-records voor de
   e-mail zijn blijven staan.
   - `wrangler.cloudflare.jsonc` bevat bewust geen `routes`: het token heeft geen
     zonerechten, en wrangler laat een in het dashboard gekoppeld domein staan zolang de
     config geen routes noemt.
3. **Privacy:** `HOSTING` in `components/pages/InfoPages.tsx` staat op Cloudflare.
4. **Controle:** roviko.app/privacy noemt Cloudflare en `/api/me` antwoordt.

**Terugschakelen naar ChatGPT** (alleen zolang die hosting nog bestaat): het custom domain
verwijderen en de DNS-records van roviko.app terugzetten volgens de schermafdruk die de
eigenaar vóór de overstap heeft gemaakt. Spelresultaten die intussen op Cloudflare zijn
gemaakt, gaan dan niet mee.
