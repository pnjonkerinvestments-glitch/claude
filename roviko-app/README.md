# Roviko-app (iOS + Android)

Dit is de native app voor de App Store en Google Play, gebouwd met [Capacitor](https://capacitorjs.com) 8. De app laadt de live website (`server.url` in `capacitor.config.json`), dus elke website-update staat meteen ook in de app. Een nieuwe app-versie is alleen nodig als er iets aan de native kant verandert.

## Wat de app extra doet ten opzichte van de website

- **Eigen app-icoon en splashscreen** met de mascotte (bron: `assets/`, gemaakt met `npm run assets`).
- **Dagelijkse herinnering:** een lokale melding om 18:00 ("Je 4 dagpuzzels staan klaar!"). De speler zet die zelf aan op de homepage (`components/atelier/NativeReminder.tsx` in de website). Er is geen server of pushdienst nodig en er worden geen gegevens gedeeld.
- **Vriendelijk offline-scherm** (`www/offline.html`) in plaats van een foutpagina. Het scherm probeert het vanzelf opnieuw zodra het internet terug is.
- **Externe links** (zoals UNESCO-bronnen) openen in de gewone browser, zodat spelers de app niet kwijtraken.
- Op Android is de permissie voor "exacte wekkers" verwijderd, omdat Google Play die alleen toestaat voor wekker- en agenda-apps.

## Wat al getest is, en wat niet

| Onderdeel | Status |
| --- | --- |
| Website met herinnering, getest met een nagebootste app-bridge (aan, toestemming, gepland om 18:00, bewaard na herladen, uit) | ✅ getest |
| Native projecten gegenereerd (`npx cap add android/ios`), iconen en splash in alle formaten | ✅ gedaan |
| Android-APK en iOS-simulatorbuild | ⏳ draait in GitHub Actions (`.github/workflows/roviko-app.yml`). In deze ontwikkelomgeving is geen Android SDK of Mac beschikbaar. |
| Op een echte iPhone of Android-telefoon | ❌ nog niet |
| Ondertekenen en indienen bij Apple en Google | ❌ vereist jouw accounts (zie hieronder) |

## Vóór de lancering: belangrijk

1. **Eigen domein:** de app wijst naar `https://roviko.app`. Laat dit domein en de DNS-records in Cloudflare altijd actief. Verandert het adres ooit, pas dan `server.url` in `capacitor.config.json` aan en de links in `www/`.
2. **App-ID `com.roviko.app`.** Dit ID kun je na de eerste upload nooit meer wijzigen. Wil je een ander, pas het dan nu aan in `capacitor.config.json`, `android/app/build.gradle` en in Xcode.
3. **Risico bij Apple (richtlijn 4.2).** Apple wijst apps af die "alleen een website" zijn. De dagelijkse herinnering, het offline-scherm en de native splash helpen, maar goedkeuring is niet gegarandeerd. Wordt de app afgewezen, dan zijn de volgende stappen bijvoorbeeld haptische feedback bij antwoorden, een widget met de reeks, of de bestaande SwiftUI-app (die zit in het aparte app-pakket dat je van ChatGPT hebt).
4. **Inloggen met Google.** Staat Google-login aan op de site, dan eist Apple (richtlijn 4.8) ook "Inloggen met Apple" of een vergelijkbare privacyvriendelijke optie. Gastspel en inloggen met e-mail zijn prima.
5. **Account verwijderen** kan al in de app (Paspoort → "Verwijder mijn account"). Apple en Google vereisen dat.

## Google Play: stappen

1. Maak een ontwikkelaarsaccount aan op <https://play.google.com/console>. Dat kost eenmalig $25 en vraagt een identiteitscontrole.
2. Maak een **upload-sleutel** aan, één keer, op een eigen computer met Java:
   ```sh
   keytool -genkeypair -v -keystore roviko-upload.jks -alias roviko -keyalg RSA -keysize 2048 -validity 10000
   base64 -w0 roviko-upload.jks > roviko-upload.b64   # op macOS: base64 -i roviko-upload.jks -o roviko-upload.b64
   ```
   Bewaar het `.jks`-bestand en de wachtwoorden veilig. Zonder deze sleutel kun je geen updates meer uploaden.
3. Zet in GitHub bij *Settings → Secrets and variables → Actions* deze vier secrets:
   - `ROVIKO_KEYSTORE_BASE64` met de inhoud van `roviko-upload.b64`
   - `ROVIKO_KEYSTORE_PASSWORD`
   - `ROVIKO_KEY_ALIAS` met de waarde `roviko`
   - `ROVIKO_KEY_PASSWORD`
4. Start in GitHub bij *Actions* de workflow **Roviko app** (*Run workflow*). Download het artifact `roviko-android`. Daarin zitten:
   - `app-debug.apk`: installeer die direct op een Android-telefoon om te testen.
   - `app-release.aab`: dit bestand upload je naar Google Play.
5. In de Play Console:
   - Maak een app aan met de teksten uit `store-listing.md`.
   - Vul de vragenlijst voor de leeftijdsclassificatie in, het **Data safety**-formulier (zie `store-listing.md`) en de doelgroep.
   - Upload de `.aab` bij **Gesloten testen**. Voor een *nieuw persoonlijk* ontwikkelaarsaccount eist Google eerst **minimaal 12 testers gedurende 14 dagen** voordat je naar productie mag. Voor een organisatie-account geldt dat niet.
6. Na de testperiode: *Productie → Nieuwe release* en ter beoordeling indienen. Dat duurt meestal 1–7 dagen.

## App Store: stappen

1. Word lid van het Apple Developer Program via <https://developer.apple.com/programs/>. Dat kost €99 per jaar. Kies voor een organisatie als je onder een bedrijfsnaam wilt publiceren; daarvoor heb je een D-U-N-S-nummer nodig.
2. Je hebt een **Mac met Xcode** nodig. Heb je die niet, dan kan het via een cloud-Mac-dienst zoals Codemagic, die Capacitor ondersteunt.
3. Op de Mac:
   ```sh
   cd roviko-app && npm ci && npx cap sync ios && npx cap open ios
   ```
   Kies in Xcode bij *Signing & Capabilities* je **Team**. Controleer de bundle-ID `com.roviko.app` en kies daarna *Product → Archive → Distribute App → App Store Connect*.
4. In App Store Connect:
   - Maak de app aan met de teksten uit `store-listing.md`.
   - Vul de privacylabels in (zie `store-listing.md`).
   - Zet de leeftijdsclassificatie op 4+.
   - Upload screenshots: 6,9" iPhone (1320×2868) en, omdat de app ook op iPad werkt, 13" iPad (2064×2752).
5. Test eerst via **TestFlight** en dien de app daarna in. De beoordeling duurt meestal 1–3 dagen.

**Kinderen:** kies bij Apple **niet** de categorie "Kinderen". Die eist een ouderpoort voor elke externe link. Categorie *Onderwijs* of *Spellen → Trivia* met leeftijd 4+ is geschikt. Bij Google moet je bij *Doelgroep* kiezen. Kies je ook leeftijden onder 13, dan geldt het Families-beleid. Roviko heeft geen advertenties en geen trackers, dus dat is haalbaar, maar vul de formulieren zorgvuldig in.

## Handige commando's

```sh
npm ci                # installeren
npm run assets        # iconen en splash opnieuw maken uit ../roviko/public/icon-512.png
npx cap sync          # config en plugins naar iOS/Android kopiëren
npx cap open android  # openen in Android Studio
npx cap open ios      # openen in Xcode (alleen op een Mac)
```
