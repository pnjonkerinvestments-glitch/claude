# Roviko lanceren in de App Store en Google Play

Deze checklist hoort bij versie 1.17 van de website. Wat klaarstaat, staat bovenaan. Wat alleen jij kunt doen (accounts, betalingen, juridische gegevens, ondertekenen), staat daaronder, in de volgorde waarin je het doet.

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

## ⚠️ Eerst: drie dingen die de lancering tegenhouden

1. **Zet 1.17 live op roviko.app.** De app laadt de live website. De screenshots tonen 1.17. Staat roviko.app nog op een oudere versie, dan ziet de reviewer iets anders dan de screenshots. Publiceer dus eerst 1.17 (via de ChatGPT-zip of via Cloudflare, zie `../roviko/docs/PUBLICEREN.md`).
2. **Vul de privacyverklaring en de voorwaarden aan.** Apple en Google eisen een privacybeleid met contactgegevens. Op `/privacy` en `/terms` staan nog gele blokken "nog in te vullen". Het gaat om je naam of bedrijfsnaam, een adres, een contact-e-mail, bewaartermijnen, de hostingpartij en de minimumleeftijd. Die gegevens kan alleen jij aanleveren. Ik verzin ze niet. Geef ze door, dan zet ik ze erin.
3. **Een support-e-mailadres of supportpagina.** Beide winkels vragen erom. Bijvoorbeeld `support@roviko.app` of een contactpagina.

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

## App Store (iPhone en iPad)

1. **Apple Developer Program:** <https://developer.apple.com/programs/>, €99 per jaar. Voor een bedrijfsnaam heb je een D-U-N-S-nummer nodig.
2. **Een Mac met Xcode,** of een cloud-Mac-dienst zoals Codemagic. In deze omgeving is geen Mac beschikbaar, dus de iOS-build en het ondertekenen kan ik niet voor je doen.
3. **Op de Mac:** `cd roviko-app && npm ci && npx cap sync ios && npx cap open ios`. Kies je *Team* bij *Signing & Capabilities* en kies daarna *Product → Archive → Distribute App*.
4. **In App Store Connect:**
   - Naam, ondertitel, promotietekst, beschrijving en trefwoorden: `store-listing.md`.
   - Screenshots: `store/ios-iphone-6.9/` en `store/ios-ipad-13/`.
   - Privacylabels volgens de tabel in `store-listing.md`, leeftijd 4+ en categorie *Onderwijs*. Kies **niet** de categorie "Kinderen".
   - Privacybeleid-URL `https://roviko.app/privacy`, plus je support-URL.
5. **Test eerst via TestFlight** en dien de app daarna in. De beoordeling duurt meestal 1 tot 3 dagen.

### Aandachtspunten bij Apple

- **Richtlijn 4.2 (minimale functionaliteit):** Apple wijst soms apps af die "alleen een website" zijn. Roviko heeft een eigen icoon en opstartscherm, een offline-scherm, dagelijkse herinneringen en opent externe links buiten de app. Dat helpt, maar goedkeuring is niet gegarandeerd. Wordt de app afgewezen, dan zijn de volgende stappen haptische feedback bij antwoorden en een widget met je reeks.
- **Richtlijn 4.8 (inloggen):** zet je Google-login aan op de site (`GOOGLE_CLIENT_ID`), dan eist Apple ook "Inloggen met Apple". Zolang alleen gastspel en e-mail-login aanstaan, is dat niet nodig.
- **Reviewer-account:** geef in *App Review Information* een testaccount (e-mail en wachtwoord) op. Dan kan de reviewer ook de vrienden- en paspoortfuncties zien.

## Later bijwerken

- **Website bijgewerkt?** Dan is de app automatisch bijgewerkt, want die laadt roviko.app.
- **Nieuw icoon of opstartscherm?** Draai `npm run assets && npx cap sync` en maak een nieuwe build met een hogere versie.
- **Nieuwe screenshots?** Het script staat beschreven in `store/README.md`.
