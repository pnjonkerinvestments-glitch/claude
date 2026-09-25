Deze repo bevat vooral **Roviko**, de website achter roviko.app, in `roviko/`. De app staat in `roviko-app/`.
Lees eerst `roviko/START_HERE_CLAUDE.md` en `roviko/docs/PUBLICEREN.md` voordat je iets aan Roviko verandert of publiceert.

Publiceren naar Cloudflare gaat via GitHub Actions (`.github/workflows/roviko-deploy.yml`). Na een merge naar de standaardbranch met wijzigingen in `roviko/` deployt die workflow vanzelf.

`premarket_alert/` is een los, stilgelegd zijproject. Deploy nooit iets anders onder de Cloudflare-workernaam `roviko`.
