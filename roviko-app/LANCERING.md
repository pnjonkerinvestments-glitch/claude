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

Bijgewerkt voor versie 1.41 (15 oktober 2026). Ontwikkelaar: organisatie-account **Jonker Studios** (handelsnaam en activiteit bij KVK goedgekeurd in oktober 2026). Contact: `support@roviko.app`.

### Stap 1. Uploadsleutel maken (eenmalig, op een computer)

De repository is **openbaar**, dus de sleutel mag nooit in GitHub zelf gemaakt of als bestand opgeslagen worden. Maak hem op je eigen computer:

1. Installeer Java (gratis): <https://adoptium.net> → *Temurin* → installeren.
2. Open Terminal (Mac) of PowerShell (Windows) en typ:
   ```sh
   keytool -genkeypair -v -keystore roviko-upload.jks -alias roviko -keyalg RSA -keysize 2048 -validity 10000
   ```
   Kies een sterk wachtwoord (gebruik hetzelfde voor de keystore en de sleutel). Naam: `P. Jonker`, organisatie: `Jonker Studios`, land: `NL`.
3. Maak er tekst van:
   - Mac: `base64 -i roviko-upload.jks -o roviko-upload.b64`
   - Windows (PowerShell): `[Convert]::ToBase64String([IO.File]::ReadAllBytes("roviko-upload.jks")) | Out-File roviko-upload.b64`
4. Bewaar `roviko-upload.jks` en het wachtwoord op een veilige plek (wachtwoordmanager + back-up). Kwijt is lastig: dan moet Google de sleutel resetten.

### Stap 2. Vier geheimen in GitHub

Repository → *Settings → Secrets and variables → Actions → New repository secret*:
- `ROVIKO_KEYSTORE_BASE64`: de hele inhoud van `roviko-upload.b64`
- `ROVIKO_KEYSTORE_PASSWORD`: je wachtwoord
- `ROVIKO_KEY_ALIAS`: `roviko`
- `ROVIKO_KEY_PASSWORD`: hetzelfde wachtwoord

Geheimen zijn ook in een openbare repository afgeschermd; niemand anders ziet ze.

### Stap 3. App bouwen

GitHub → *Actions* → **Roviko app** → *Run workflow* (branch `claude/us-premarket-alert-email-etdutq`). Na ongeveer 5 minuten: open de run → *Artifacts* → `roviko-android`. Daarin:
- `app-debug.apk`: om zelf op een Android-telefoon te testen;
- `app-release.aab`: dit upload je naar Google Play.

### Stap 4. App aanmaken in de Play Console

*Alle apps → App maken*: naam `Roviko – Aardrijkskunde quiz`, standaardtaal Nederlands, **Game**, **Gratis**, verklaringen aanvinken.

### Stap 5. App-content (Beleid → App-content)

- **Privacybeleid:** `https://roviko.app/privacy`
- **Advertenties:** *Nee, mijn app bevat geen advertenties* (klopt voor deze build; zie `store-listing.md` als dat verandert).
- **App-toegang:** *Alle functionaliteit is beschikbaar zonder speciale toegang* (spelen kan als gast).
- **Contentclassificatie (IARC):** categorie *Game* (quiz/trivia). Geweld, angst, seks, grof taalgebruik, drugs, gokken: allemaal **nee**. *Kunnen gebruikers met elkaar communiceren of content delen?* **Ja**: spelers zien elkaars gekozen naam in ranglijsten en multiplayer (er is geen chat; namen worden gefilterd, melden en blokkeren kan). *Deelt de app de locatie?* Nee. *Digitale aankopen?* Nee. Verwachte uitkomst: PEGI 3 of 7 / iedereen.
- **Doelgroep en content:** leeftijdsgroepen **13–15, 16–17 en 18+** (niet jonger: dan gelden de strengere Families-regels). *Kan de app kinderen onbedoeld aanspreken?* Nee.
- **Data safety:** volg de tabel in `store-listing.md`:
  - *Verzamelt de app gegevens?* Ja. *Versleuteld tijdens overdracht?* Ja (https). *Kunnen gebruikers verwijdering aanvragen?* Ja (in de app: Paspoort → Verwijder mijn account; ook via `support@roviko.app`).
  - Persoonlijke info → **E-mailadres** (optioneel, alleen bij een account; doel: accountbeheer) en **Gebruikers-ID's / naam** (doel: app-functionaliteit).
  - App-activiteit → **Andere door gebruikers gegenereerde content / app-interacties** (spelvoortgang; app-functionaliteit) en, alleen als de speler het aanzet, **analyse** (pseudoniem).
  - Niets gedeeld met derden. Geen locatie, contacten, foto's of advertentie-ID.
- **Nieuws-app:** nee. **Overheids-app:** nee. **Financiële functies:** geen. **Gezondheid:** nee.

### Stap 6. Winkelvermelding (Groei → Winkelvermelding)

- Teksten: `store-listing.md` (versie 1.41): naam, korte beschrijving (max. 80) en volledige beschrijving, NL en EN (en ES als extra vertaling).
- App-icoon 512×512: `store/google-play-icon-512.png`. Banner 1024×500: `store/google-play-feature-graphic-nl.png` / `-en.png`.
- Telefoonscreenshots: `store/google-play-phone/nl/` en `en/`.
- Categorie: **Spellen → Trivia** (of *Educatief*). Tags: Trivia, Aardrijkskunde, Educatief. Contact-e-mail `support@roviko.app`, website `https://roviko.app`.

### Stap 7. Testen en uitbrengen

1. *Testen → Interne test*: maak een release, upload `app-release.aab`, voeg jezelf toe als tester en installeer via de testlink.
2. Klopt alles: *Productie → Release maken* → dezelfde `.aab` → *Ter beoordeling verzenden*. Als organisatie-account geldt de regel van 12 testers × 14 dagen niet. Een eerste beoordeling duurt meestal een paar dagen tot een week.
3. Google Play App Signing (standaard aan) bewaart de echte ondertekeningssleutel; jouw uploadsleutel gebruik je alleen voor uploads.

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
7. **Bouwen:** GitHub → Actions → *Roviko app* → *Run workflow*. Kies bij "Use workflow from" de branch waarop de nieuwste Roviko staat (nu `claude/upbeat-sagan-8igsaj`). Na ongeveer 15 tot 30 minuten staat de build in App Store Connect onder **TestFlight**.
8. **Testen via TestFlight** op je eigen iPhone (TestFlight-app, jezelf toevoegen als interne tester).
9. **Winkelpagina invullen** in App Store Connect:
   - teksten uit `store-listing.md` (versie 1.19);
   - screenshots uit `store/ios-iphone-6.9/` en `store/ios-ipad-13/`;
   - privacylabels volgens de tabel, leeftijd 4+, categorie Onderwijs;
   - privacy-URL `https://roviko.app/privacy`, support-URL `https://roviko.app` (contact `support@roviko.app`);
   - kies bij de build de TestFlight-build en dien de app in.

Met een Mac kan het ook: `cd roviko-app && npm ci && npx cap sync ios && npx cap open ios`, daarna in Xcode *Product → Archive → Distribute App*.

### Voor het indienen (1.20)

- **Notes for reviewer:** plak de tekst uit `roviko/docs/APP_REVIEW_NOTES.md`.
- **Privacylabels en leeftijd:** volg `roviko/docs/STORE_PRIVACY.md`. Apple kwam uit op 13+, omdat spelers de namen van onbekende tegenstanders zien. Kies niet de categorie "Kinderen".
- **Moderatie:** meldingen moet je binnen 24 uur bekijken; zie `roviko/docs/MODERATIE.md`. Zet `ADMIN_USER_IDS` in Cloudflare, dan kan het via roviko.app/admin.

### Aandachtspunten bij Apple

- **Richtlijn 4.2 (minimale functionaliteit):** Apple wijst soms apps af die "alleen een website" zijn. Roviko heeft een eigen icoon en opstartscherm, een offline-scherm, dagelijkse herinneringen en opent externe links buiten de app. Dat helpt, maar goedkeuring is niet gegarandeerd. Wordt de app afgewezen, dan zijn de volgende stappen haptische feedback bij antwoorden en een widget met je reeks. Sinds website 1.23 gebruikt de app de Haptics-plugin al: een korte trilling bij goed, fout en het einde van een spel (uit te zetten in Instellingen). Er is daarvoor geen nieuwe app-build nodig, want de plugin zat al in de app.
- **Richtlijn 4.8 (inloggen):** zet je Google-login aan op de site (`GOOGLE_CLIENT_ID`), dan eist Apple ook "Inloggen met Apple". Zolang alleen gastspel en e-mail-login aanstaan, is dat niet nodig.
- **Reviewer-account:** geef in *App Review Information* een testaccount (e-mail en wachtwoord) op. Dan kan de reviewer ook de vrienden- en paspoortfuncties zien.

## Later bijwerken

- **Website bijgewerkt?** Dan is de app automatisch bijgewerkt, want die laadt roviko.app.
- **Nieuw icoon of opstartscherm?** Draai `npm run assets && npx cap sync` en maak een nieuwe build met een hogere versie.
- **Nieuwe screenshots?** Het script staat beschreven in `store/README.md`.
