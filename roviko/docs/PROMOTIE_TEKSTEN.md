# Roviko promoten: waar en met welke tekst

Klaargezet bij 1.61 (10 november 2026). Jij verstuurt; de teksten kun je zo plakken.
Alles wat hier staat klopt met het spel van nu. Controleer per plek eerst de regels voor eigen promotie.

**Vaste feiten (gebruik alleen deze):** gratis, direct spelen zonder account, elke dag nieuwe aardrijkskundespellen die voor iedereen hetzelfde zijn, ranglijst van de dag, reeks (streak), samen spelen in een privékamer, in het Engels, Nederlands en Spaans, ook als iPhone-app.

**Meet per plek:** zet achter de link `?ref=` met de naam van de plek, bijvoorbeeld `https://roviko.app/?ref=reddit`. Dat verandert niets voor de bezoeker; je herkent de plek later terug in Search Console en in de serverlogs van Cloudflare.

## 1. Verzamelsites van dagelijkse spellen (zoals Sussydle)

Dit werkte al één keer, dus hier begin je. Zoek op "daily games hub", "wordle alternatives list" en "daily geography games"; de meeste sites hebben een knop of formulier "Submit a game".

> **Subject:** Game suggestion: Roviko, daily geography games
>
> Hi,
>
> I make Roviko (https://roviko.app), a set of free daily geography games. Every day there are new games that are the same for everyone: flags, capitals, country shapes, maps and country rankings. Each game gives a score out of 1,000, there is a ranking of the day and a share text players can copy.
>
> It runs in the browser, needs no account and has no ads. I think it fits your list of daily games. The Daily Detour (https://roviko.app/daily) is the best one to link to.
>
> Happy to send a logo or screenshots if that helps.
>
> Thanks,
> Pepijn, Jonker Studios

## 2. Blogs en lijstjes over kaart- en aardrijkskundespellen

- Google Maps Mania heeft de lijst "The 12 Best Daily Map Games" en schrijft vaak over nieuwe kaartspellen.
- Lijstjes als "games like Worldle" en "best sites to play geography games online": mail de schrijver met dezelfde tekst als hierboven en noem het artikel waar Roviko in past.

## 3. Reddit

Lees eerst de regels van elke groep. Plaats als maker, wees eerlijk dat het jouw spel is en reageer op vragen. Eén groep per dag is genoeg.

Groepen om te bekijken: r/WebGames, r/geography, r/dailygames, r/wordle-achtige groepen.

> **Title:** I made a set of daily geography games (free, no account, no ads)
>
> Hi all, I built Roviko: https://roviko.app/?ref=reddit
>
> Every day there are new geography games, the same for everyone: a mixed round of ten questions, a ranking game, country shapes, a "which is bigger" game, an ordering game and one where you have to get as close as possible to a target without going over. Each one is scored out of 1,000 and there is a ranking of the day.
>
> There are also plain flag, capital and map quizzes per continent, and private rooms to play against friends.
>
> I would love feedback, especially on the difficulty: too easy, too hard, or about right?

## 4. Product Hunt en Hacker News

- **Product Hunt, tagline:** Daily geography games: flags, capitals, maps and rankings
- **Product Hunt, beschrijving:** Roviko is a small daily trip around the world. New geography games every day, the same for everyone, with a ranking of the day and a streak. Free, in the browser, no account needed. Play alone or open a private room for friends.
- **Hacker News, titel:** Show HN: Roviko – daily geography games in the browser

## 5. Nederlands: onderwijs en topografie

De nieuwe Nederlandse pagina's (topografie, vlaggen, hoofdsteden per werelddeel) zijn bruikbaar in de klas. Denk aan groepen en nieuwsbrieven van leerkrachten aardrijkskunde en groep 7/8.

> **Onderwerp:** Gratis topografie oefenen per werelddeel
>
> Hallo,
>
> Ik heb Roviko gemaakt, een gratis site om topografie, vlaggen en hoofdsteden te oefenen: https://roviko.app/nl/topografie-europa-quiz
>
> Leerlingen kunnen direct beginnen, zonder account en zonder reclame. Er is een quiz per werelddeel en je kunt met de klas tegen elkaar spelen in een privékamer met een code.
>
> Ik hoor graag wat er beter kan voor gebruik in de les.
>
> Groet,
> Pepijn, Jonker Studios

## 6. Spaans

> Roviko: juegos diarios de geografía gratis, sin cuenta y sin anuncios. Banderas, capitales y mapas por continente, y salas privadas para jugar con amigos: https://roviko.app/es

## Google Search Console koppelen (eenmalig, vijf minuten)

1. Ga naar https://search.google.com/search-console en log in met een Google-account.
2. Kies **URL-voorvoegsel** en vul `https://roviko.app` in.
3. Kies de controle **HTML-bestand**. Google geeft een bestand met een naam als `google1234abcd.html`.
4. Geef die bestandsnaam door; dat bestand komt dan in de site te staan en na het live zetten klik je op **Verifiëren**.
5. Daarna: **Sitemaps** → vul `sitemap.xml` in → Verzenden.

De bestandsnaam is geen geheim; die mag gewoon in de (openbare) repo.

## www.roviko.app laten doorverwijzen (eenmalig)

De site stuurt `www.roviko.app` vanaf 1.61 door naar `roviko.app`, maar het adres moet eerst aan de worker hangen:
Cloudflare-dashboard → Workers & Pages → **roviko** → Settings → Domains & Routes → **Add** → Custom domain → `www.roviko.app`.
Dit is dezelfde stap als op 25 september voor `roviko.app`. Er verandert niets aan de e-mailrecords.
