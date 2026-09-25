# Roviko lanceren in de App Store en Google Play

Deze checklist hoort bij versie 1.19 van de website. Wat klaarstaat, staat bovenaan. Wat alleen jij kunt doen (accounts, betalingen, juridische gegevens, ondertekenen), staat daaronder, in de volgorde waarin je het doet.

## ✅ Klaar in deze map

| Onderdeel | Waar |
| --- | --- |
| iOS- en Android-project (Capacitor 8), app-ID `com.roviko.app`, versie 1.0.0 | `ios/`, `android/`, `capacitor.config.json` |
| App-icoon en opstartscherm in de 1.16-stijl (crème met de wereldbol; donkergroen in donkere modus) | `assets/`, gegenereerd met `npm run assets` |
| Offline-scherm in de nieuwe stijl, in het Nederlands, Engels en Spaans | `www/offline.html` |
| Winkelteksten NL/EN/ES, binnen de tekenlimieten, plus privacytabel | `store-listing.md` |
| iPhone-screenshots 6,9" (1320×2868), 5 per taal (NL, EN) | `store/ios-iphone-6.9/` |
| iPad-screenshots 13" (2064×2752), 5 per taal | `store/ios-ipad-13/` |
| Google Play-screenshots (1080×1920), 5 per taal | `store/google-play-phone/` |
| Google Play-banner (1024×500), NL en EN | `store/google-play-feature-graphic-*.png` |
| Icoon voor de App Store (1024 px) en Google Play (512 px) | `store/app-store-icon-1024.png`, `store/google-play-icon-512.png` |
| Android-build (test-APK en, met jouw sleutel, de `.aab` voor Google Play) | GitHub Actions: workflow **Roviko app** |
| Account verwijderen in de app (verplicht bij Apple en Google) | Paspoort → "Verwijder mijn account" |
| Dagelijkse herinnering (lokale melding, geen server nodig) | Website: `components/atelier/NativeReminder.tsx` |

## ⚠️ Eerst

1. **Zet 1.19.1 live op roviko.app** (privacy en voorwaarden zijn daarin compleet). De app laadt de live website.
2. ✅ Privacyverklaring en voorwaarden: ingevuld (privéproject van P. Jonker, contact support@roviko.app; postadres volgt). Publiceer via een persoonlijk (Individual) Apple Developer-account: geen KvK of D-U-N-S nodig.
3. ✅ Support-adres: `support@roviko.app` (Cloudflare Email Routing, doorgestuurd naar de eigenaar).
4. Werk de winkelteksten en screenshots bij naar 1.19 (Dagelijkse Omweg + vijf dagspellen, 6.000 punten) voordat je indient.

## Google Play (Android)

1. **Ontwikkelaarsaccount:** <https://play.google.com/console>, eenmalig $25, met identiteitscontrole. Kies bij voorkeur een **organisatie**-account als je een bedrijf hebt. Bij een nieuw **persoonlijk** account eist Google eerst een gesloten test met minstens 12 testers die 14 dagen meedoen.
2. **Uploadsleutel** maken en de vier GitHub-secrets zetten: zie `README.md`, stap "Google Play".
3. **Workflow draaien:** GitHub → Actions → *Roviko app* → *Run workflow*. Download het artifact `roviko-android`. Test eerst `app-debug.apk` op een Android-telefoon.
4. **App aanmaken in de Play Console:**
   - Naam, korte en volledige beschrijving: `store-listing.md`.
   - Icoon 512 px, banner 1024×500 en telefoonscreenshots uit `store/`.
   - Categorie: *Onderwijs* (of *Spellen → Trivia*).
   - Invullen: **Data safety** (tabel in `store-listing.md`), **inhoudsclassificatie** (geen geweld, geen chat, geen aankopen, geen advertenties), **doelgroep** en **advertenties: nee**.
   - Privacybeleid-URL: `https://roviko.app/privacy`.
5. **Upload** `app-release.aab` bij *Gesloten testen*, en na de testperiode bij *Productie*. Een beoordeling duurt meestal 1 tot 7 dagen.

## App Store (iPhone en iPad), zonder eigen Mac

GitHub bouwt, ondertekent en uploadt de app voor je (workflow **Roviko app**, taak `ios-release`).

1. **Apple Developer Program** (persoonlijk account, €99 per jaar).
2. **App-ID registreren:** developer.apple.com → Certificates, Identifiers & Profiles → Identifiers → **+** → App IDs → App. Beschrijving `Roviko`, Bundle ID (explicit) `com.roviko.app`. Geen extra capabilities.
3. **App aanmaken in App Store Connect:** Apps → **+** → Nieuwe app.
   - Platform iOS, naam `Roviko – Aardrijkskunde quiz`, taal Nederlands.
   - Bundle ID `com.roviko.app`, SKU `roviko`.
4. **API-sleutel maken:** App Store Connect → Gebruikers en toegang → Integraties → App Store Connect API → Teamsleutels → **+**.
   - Naam `GitHub`, rol **Admin** (nodig om automatisch certificaten te maken).
   - Download het `.p8`-bestand; dat kan maar één keer.
   - Noteer de **Key ID** en de **Issuer ID** (die staat boven de lijst).
5. **Team ID opzoeken:** developer.apple.com → Account → Membership details (10 tekens).
6. **Vier GitHub-secrets zetten:** repository → Settings → Secrets and variables → Actions → New repository secret.
   - `APPSTORE_KEY_P8`: de volledige inhoud van het `.p8`-bestand (open het met Kladblok en kopieer alles, inclusief de BEGIN- en END-regels).
   - `APPSTORE_KEY_ID`
   - `APPSTORE_ISSUER_ID`
   - `APPLE_TEAM_ID`
7. **Bouwen:** GitHub → Actions → *Roviko app* → *Run workflow*. Na ongeveer 15 tot 30 minuten staat de build in App Store Connect onder **TestFlight**.
8. **Testen via TestFlight** op je eigen iPhone (TestFlight-app, jezelf toevoegen als interne tester).
9. **Winkelpagina invullen** in App Store Connect:
   - teksten uit `store-listing.md` (versie 1.19);
   - screenshots uit `store/ios-iphone-6.9/` en `store/ios-ipad-13/`;
   - privacylabels volgens de tabel, leeftijd 4+, categorie Onderwijs;
   - privacy-URL `https://roviko.app/privacy`, support-URL `https://roviko.app` (contact `support@roviko.app`);
   - kies bij de build de TestFlight-build en dien de app in.

Met een Mac kan het ook: `cd roviko-app && npm ci && npx cap sync ios && npx cap open ios`, daarna in Xcode *Product → Archive → Distribute App*.

### Aandachtspunten bij Apple

- **Richtlijn 4.2 (minimale functionaliteit):** Apple wijst soms apps af die "alleen een website" zijn. Roviko heeft een eigen icoon en opstartscherm, een offline-scherm, dagelijkse herinneringen en opent externe links buiten de app. Dat helpt, maar goedkeuring is niet gegarandeerd. Wordt de app afgewezen, dan zijn de volgende stappen haptische feedback bij antwoorden en een widget met je reeks.
- **Richtlijn 4.8 (inloggen):** zet je Google-login aan op de site (`GOOGLE_CLIENT_ID`), dan eist Apple ook "Inloggen met Apple". Zolang alleen gastspel en e-mail-login aanstaan, is dat niet nodig.
- **Reviewer-account:** geef in *App Review Information* een testaccount (e-mail en wachtwoord) op. Dan kan de reviewer ook de vrienden- en paspoortfuncties zien.

## Later bijwerken

- **Website bijgewerkt?** Dan is de app automatisch bijgewerkt, want die laadt roviko.app.
- **Nieuw icoon of opstartscherm?** Draai `npm run assets && npx cap sync` en maak een nieuwe build met een hogere versie.
- **Nieuwe screenshots?** Het script staat beschreven in `store/README.md`.
