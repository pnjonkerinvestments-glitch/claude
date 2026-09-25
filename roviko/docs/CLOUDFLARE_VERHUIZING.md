# Verhuizing roviko.app naar het eigen Cloudflare-account

Besluit van de eigenaar (P. Jonker), 25 september 2026: Roviko verhuist van de ChatGPT-hosting naar zijn eigen Cloudflare-account ("optie 1": Claude voert het uit).

## Toegang

- `api.cloudflare.com` staat bij de toegestane domeinen van de omgeving.
- Het API-token staat als **API credential** in de omgeving. Het wordt voor `api.cloudflare.com` als header `Authorization: Bearer …` toegevoegd.
  - Het staat niet in een omgevingsvariabele. Vraag er nooit om in de chat en schrijf het nooit naar een bestand.
  - Rechten: D1 Edit, Workers Scripts Edit, Account Settings Read. Geen DNS-rechten.
- Het account-ID staat in `scripts/deploy-cloudflare.sh`. De worker heet `roviko`, de database `roviko-db` (zie `wrangler.cloudflare.jsonc`).
- `scripts/deploy-cloudflare.sh` eist `CLOUDFLARE_API_TOKEN`. Met een credential in de proxy moet dat mogelijk een plaatshouder zijn.
  - Controleer eerst met `curl https://api.cloudflare.com/client/v4/user/tokens/verify` of het token wordt meegestuurd. Verwacht: `"status":"active"`.
  - Test daarna of wrangler zijn eigen `Authorization`-header laat vervangen.

## Stappen (in deze volgorde)

1. **Deploy naar workers.dev.** Gebruik de huidige versie (1.19.3 of nieuwer): `npm run deploy:cloudflare`. Dit raakt roviko.app niet. Controleer met `npm run smoke -- https://roviko.pnjonkerinvestments.workers.dev`. Laat de eigenaar het tijdelijke adres testen.
2. **Spelersgegevens overzetten.**
   - De live database draait bij de ChatGPT-hosting. Bepaal eerst hoe je die exporteert: een export via ChatGPT, of een beheer-/exportroute. Verzin geen toegang.
   - Importeer daarna in `roviko-db` en controleer de aantallen per tabel (users, game_sessions, daily_scores, game_results).
   - Er zijn nog weinig spelers. Doe dit vlak voor stap 3, zodat er tussendoor bijna niets verloren gaat.
3. **Domein omzetten, alleen met uitdrukkelijk akkoord van de eigenaar.** roviko.app (DNS staat al bij Cloudflare, mail loopt via Cloudflare Email Routing) gaat naar de worker `roviko`, als custom domain of route.
   - Het token heeft geen DNS-rechten: de eigenaar doet dit zelf in het dashboard, of geeft er apart toestemming voor.
   - Laat de MX- en TXT-records van de e-mail staan.
4. **Privacy bijwerken.** Pas `HOSTING` in `components/pages/InfoPages.tsx` aan naar Cloudflare, zet `LEGAL_UPDATED` op de nieuwe datum en deploy opnieuw.
5. **Nazorg.** Houd de ChatGPT-hosting een paar dagen als terugvaloptie. Update `START_HERE_CLAUDE.md` ("Live domein" en "Publiceren").

## Harde regels

- roviko.app pas omzetten nadat de gegevens zijn overgezet en de eigenaar akkoord heeft gegeven.
- Nooit tokens loggen, tonen of vragen.
