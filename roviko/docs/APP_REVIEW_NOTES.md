# Notes for App Review (App Store Connect → App Review Information → Notes)

Copy the text below into the "Notes" field. It is in English because the reviewer reads English.

It follows the numbered list App Review asked for on 26 September 2026 ("Guideline 2.1 - Information Needed": screen recording, purpose and audience, instructions, and the extra points). Apple asked for the same information in the reply **and** in this field, for future submissions. Stays under the 4,000-character limit.

---

1. SCREEN RECORDING
A screen recording from a physical iPhone on the latest iOS is attached to our reply in App Review messages (26 September 2026). It starts with launching the app and shows: the daily trip and a daily game, a multiplayer match against the computer, reporting and blocking another player, creating an account, signing out and in, and deleting the account in the app. There are no paid features.

2. PURPOSE AND AUDIENCE
Roviko is a daily geography game: every day a 20-question "Daily Detour" (flags, capitals, the map, neighbours and country sizes) and five short puzzle games (Rank Radar, World Duel, Side by Side, Country Mosaic, Clue Trail), plus a page for each of the 195 countries. It helps curious people of all ages learn the world in a few minutes a day, with a fact after every answer and sources for every number. Everyone gets the same games each day and there is no timer. Free, no in-app purchases. Languages: English, Dutch, Spanish.

3. HOW TO USE AND TEST IT
No login needed: the app creates a guest profile, so every feature works as a guest.
- Play tab: "Start today's trip" opens the Daily Detour; the five daily games follow.
- Multiplayer with one device: Friends tab > "Play against the computer" > pick Easy, Medium or Hard > "Play now". "Play against a random player" pairs two real players; after 3 minutes without an opponent the app offers the computer.
- Account (optional, only for the friends list): Passport tab > sign in > create account (email + password).
- Account deletion: Passport tab > "Account and privacy" > "Delete my account" (works for guests too; deletes all data immediately). Also there: contact (support@roviko.app), privacy policy, download my data.

4. USER-GENERATED CONTENT
The only text other players see is the display name; there is no chat. Names are filtered on the server. Every other player has a "..." button (room lobby, end-of-match ranking, friends list) to report (four fixed reasons) or block them. Blocked players are never matched again. Reports are reviewed within 24 hours; the terms (roviko.app/terms) forbid offensive names and cheating.

5. EXTERNAL SERVICES
Game content and accounts are served by our own backend at roviko.app (Cloudflare Workers and D1). No third-party analytics, advertising or tracking SDKs. Optional usage statistics are off by default and stay on our own server.

6. REGIONAL DIFFERENCES
None. The app works the same in every country.

7. APP FEATURES
Optional daily reminder (local notification), offline screen when there is no connection, native layout without browser elements, fixed game controls at the bottom of the screen.

Privacy policy: https://roviko.app/privacy  Terms: https://roviko.app/terms

---

## Demo account (optional)

Not needed: everything works as a guest. If Apple still asks for one, create an account in the app beforehand (Passport → sign in → create account) and enter its email and password in "Sign-in information". Never put that password in this repository.
