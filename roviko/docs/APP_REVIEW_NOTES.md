# Notes for App Review (App Store Connect → App Review Information → Notes)

Copy the text below into the "Notes" field. It is in English because the reviewer reads English.

It follows the numbered list App Review asked for on 26 September 2026 ("Guideline 2.1 - Information Needed"), with the same six numbers Apple used. Apple asked for the same information in the reply **and** in this field, for future submissions. Stays under the 4,000-character limit.

---

1. SCREEN RECORDING
A screen recording from a physical iPhone on the latest iOS is attached to our reply in App Review messages (26 September 2026). It starts with launching the app and shows the typical flow: the daily trip and a daily game, a multiplayer match against the computer, reporting and blocking another player, creating an account, signing out and in, and deleting the account in the app. The app has no paid content or features.

2. PURPOSE AND TARGET AUDIENCE
Roviko is a daily geography game for curious people of all ages (general audience, casual players, students and families). Every day there is a 20-question "Daily Detour" (flags, capitals, the map, neighbours and country sizes) and five short puzzle games, plus a page for each of the 195 countries. Problem it solves: most people know little about the world and quiz apps are often rushed. Value: a few calm minutes a day, no timer, a fact after every answer and a source for every number, the same games for everyone. Free, no in-app purchases. English, Dutch and Spanish.

3. HOW TO SET UP AND USE THE MAIN FEATURES
No login is needed: the app creates a guest profile, so every feature works without an account.
- Play tab: "Start today's trip" opens the Daily Detour; the five daily games follow.
- Multiplayer with one device: Friends tab > "Play against the computer" > pick Easy, Medium or Hard > "Play now". "Play against a random player" pairs two real players; after 3 minutes without an opponent the app offers the computer.
- Account (optional, only needed for the friends list): Passport tab > sign in > create account (email + password). Demo account credentials are in the Sign-in Information fields.
- Account deletion: Passport tab > "Account and privacy" > "Delete my account" (works for guests too; deletes all data immediately). Also there: contact (support@roviko.app), privacy policy, download my data.
- User-generated content: the only text other players see is the display name; there is no chat. Names are filtered on the server. Every other player has a "..." button (room lobby, end-of-match ranking, friends list) to report (four fixed reasons) or block them. Blocked players are never matched again. Reports are reviewed within 24 hours.

4. EXTERNAL SERVICES
- Our own backend at roviko.app, hosted on Cloudflare (Workers and D1 database): game content, accounts, multiplayer.
- Apple local notifications for the optional daily reminder.
- No payment processors, no AI services, no third-party analytics, advertising or tracking SDKs.

5. REGIONAL DIFFERENCES
None. The app functions the same in all regions.

6. REGULATED INDUSTRY / THIRD-PARTY MATERIAL
Roviko is not in a regulated industry. All geographic data and assets are openly licensed and credited in the app and at https://roviko.app/sources: country data and shapes from mledoze/countries (ODbL 1.0), map from Natural Earth (public domain), flag images from flag-icons (MIT), statistics from the World Bank World Development Indicators (CC BY 4.0), fonts under the SIL Open Font License. Illustrations and texts are original.

Privacy policy: https://roviko.app/privacy  Terms: https://roviko.app/terms

---

## Demo account

Everything works as a guest, but the friends list needs an account and Apple asks for demo credentials for account-based features. Create an account in the app beforehand (Passport → sign in → create account), enter its email and password in "Sign-in information" and keep it working. Never put that password in this repository.
