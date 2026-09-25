# Privacy-labels (App Store) en Data safety (Google Play)

Afgeleid uit de code van versie 1.20.0: `db/schema.ts`, `server/*.ts`, `server/telemetry.ts` en de app in `roviko-app/`. Werk dit bij als er iets verandert aan wat Roviko bewaart.

## Wat Roviko verzamelt

| Gegeven | Waar | Doel | Gekoppeld aan de gebruiker | Tracking |
| --- | --- | --- | --- | --- |
| E-mailadres (alleen bij een account) | `users.email` | Inloggen, account | Ja | Nee |
| Wachtwoord (alleen als gezouten PBKDF2-hash) | `users.password` | Inloggen | Ja | Nee |
| Spelersnaam en avatar | `users` | Tonen in kamers en ranglijsten | Ja | Nee |
| Willekeurige gebruikers-ID en sessie (cookie) | `users.id`, `auth_sessions` | Voortgang bewaren, ook als gast | Ja | Nee |
| Spelresultaten, antwoorden, punten, reeks, dagscores | `game_sessions`, `game_results`, `answers`, `daily_scores` | Spelfunctionaliteit, ranglijst | Ja | Nee |
| Vriendschappen, uitnodigingen, online-status (laatste 90 seconden) | `friend_requests`, `room_invites`, `user_presence` | Samen spelen (alleen accounts) | Ja | Nee |
| Meldingen en blokkades van spelers | `player_reports`, `player_blocks` | Veiligheid, moderatie | Ja | Nee |
| Meldingen over vragen (categorie + korte toelichting) | `question_reports` | Fouten in vragen verbeteren | Ja | Nee |
| Optionele productmetingen (alleen na aanzetten in het Paspoort) | `analytics_events` | Welke onderdelen gebruikt worden | Nee (gebeurtenistype en een afgeschermde code, geen naam, e-mail of IP) | Nee |
| IP-adres (alleen als afgeschermde code voor limieten, na minuten weg) | `rate_limits` | Misbruik voorkomen | Nee | Nee |

**Niet verzameld:**
- locatie, contacten, foto's, advertentie-ID of gezondheidsgegevens;
- betalingen of aankopen;
- advertenties of trackers van derden.

**Derden:**
- Hosting: Cloudflare.
- Google, alleen als Google-login ooit wordt aangezet. Die staat nu uit.

**Verwijderen:** Paspoort → "Verwijder mijn account" (ook voor gasten) wist direct alle gegevens.
- Gastgegevens zonder spel worden na 12 maanden automatisch verwijderd (`server/retention.ts`).
- Meldingen over een speler verdwijnen samen met diens account.

## App Store Connect → App-privacy

- **Gegevensverzameling:** Ja.
- **Contactgegevens → E-mailadres:** App-functionaliteit. Gekoppeld aan identiteit. Geen tracking.
- **Identificatoren → Gebruikers-ID:** App-functionaliteit. Gekoppeld. Geen tracking.
- **Gebruiksgegevens → Productinteractie:** App-functionaliteit en analyse. Gekoppeld (spelresultaten). Geen tracking.
- **Overige gegevens → Overige inhoud van gebruikers (spelersnaam, meldingen):** App-functionaliteit. Gekoppeld. Geen tracking.
- **Tracking:** Nee.

## Google Play → Data safety

- **Verzamelt of deelt de app gegevens:** verzamelt, deelt niet.
- **Versleuteld tijdens verzending:** ja (HTTPS).
- **Gebruikers kunnen verwijdering aanvragen:** ja, in de app zelf.
- **Persoonlijke info:** e-mailadres (optioneel, alleen bij een account) en gebruikers-ID. Doel: app-functionaliteit, accountbeheer.
- **App-activiteit:** app-interacties (spelresultaten). Doel: app-functionaliteit, analyse (alleen als de speler dat aanzet).

## Leeftijdsvragenlijst (App Store) en contentclassificatie (IARC, Google Play)

- **Geweld, seks, drugs, gokken, grof taalgebruik:** geen.
- **Chat of vrije tekst tussen spelers:** nee. Wel ziet een speler de namen van medespelers en van willekeurige tegenstanders; die namen worden gefilterd.
- **Spelers kunnen met elkaar spelen:** ja (kamers met code, willekeurige tegenstander). Melden en blokkeren is aanwezig.
- **Aankopen of in-game valuta:** nee. **Advertenties:** nee.
- **Locatie delen:** nee.
- **Onbeperkte webtoegang:** nee. Externe links (bronnen, licenties) openen buiten de app.
- **Uitkomst bij Apple (1.0):** 13+, omdat "User-Generated Content" op Yes staat (spelersnamen), en "Contests" op Frequent. Niet verkocht in Afghanistan en Marokko (lokale regels), IARC volgens de vragenlijst, meestal 3 of 7. Kies bij Apple **niet** de categorie "Kinderen".
