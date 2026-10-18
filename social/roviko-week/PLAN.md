# Roviko contentweek · maandag 19 t/m zondag 25 oktober 2026 · @playroviko

28 posts, 4 per dag. 23 Reels (1080×1920) en 5 carrousels (1080×1350, 4:5). Alles staat gerenderd in deze map:
`D1/` … `D7/` met per Reel een `.mp4` en een `-cover.jpg`, en per carrousel een map met de slides (`01.png`, `02.png`, …).

## Eerst: wat ik wel en niet kon onderzoeken

- **Instagram (@playroviko) was niet bereikbaar** vanuit deze omgeving: de verbinding wordt geweigerd. Ik heb dus géén accountgegevens, eerdere posts of prestaties bekeken, en verzin die ook niet.
- **Actuele virale content** op Instagram kon ik om dezelfde reden niet bekijken. Ik heb jouw trendsignalen (10–18 oktober) gebruikt, en verder tijdloze principes: een directe vraag, een open loop, suspense, een eerlijke onthulling en een reden om te delen. Nergens beweer ik dat een format of audio "trending" is.
- **Wat ik wel heb gebruikt:**
  - de bestaande Roviko-contentgenerator in deze repo (`social/roviko-shorts`): mascotte, kleuren, lettertypen en film-engine;
  - de spelmodi en data van roviko.app: oppervlaktes, hoofdsteden en vlaggen in de echte verhoudingen (uit 1.34).

## Wat is er nieuw aan de stijl

- **iPhone-stijl icoontjes.** Emoji worden op deze machine getekend als Google Noto-emoji (de Android-look), en dat oogde goedkoop. In beeld staat daarom **geen enkele emoji** meer. Alle icoontjes zijn eigen getekende glyphs in de geest van SF Symbols (`lib/ios.js`). Ze staan in app-icoon-tegels (squircles met een lichte verloop).
- **iOS-materialen:**
  - frosted-glass kaarten;
  - inset-grouped lijsten met checkmarks;
  - een timer-ring in Activity-stijl;
  - chatballonnen zoals in Berichten (zonder app-namen of logo's);
  - een notificatiebanner.
- **Vlaggen in de echte verhoudingen.** Dat is essentieel voor de vlaggenquizzen: Luxemburg is 3:5, Monaco 4:5 en Ierland 1:2.
- **Herkenbare series.** Elke post heeft bovenaan een vast serielabel met icoon:
  - GUESS THE COUNTRY (groen);
  - GUESS THE FLAG (rood);
  - GEO CHALLENGE (blauw);
  - ROVIKO (geel).
- **Muziek.** Elke Reel heeft een eigen, vrolijk Mixkit-nummer en er zit geen dubbel nummer op dezelfde dag. Daar bovenop komen virale geluidjes: record scratch, drumroll, boom, ka-ching, clown horn, trombone en publiek.
- **Werkt ook zonder geluid.** De hook staat in de eerste seconde als grote tekst bovenin. Belangrijke tekst blijft uit de onderste ±450 px en de rechterrand, waar de Instagram-interface zit.

## Algemene regels die voor alle Reels gelden

- **Eerste frame.** Het serielabel en de hook staan binnen 0,3 s in beeld. Er is geen logo-intro.
- **Opbouw.** Hook → uitdaging → suspense (timer-ring en tikkende klok) → onthulling (record scratch of boom) → payoff (feit) → één CTA in de bovenste caption.
- **Lengte.** De Reels duren 10,6–18,1 s.
- **Roviko.** De mascotte reageert in de linkerbenedenhoek (zelfverzekerd, geschrokken, juichend). Dat geeft de serie een gezicht.
- **Geen eindkaart met "Download".** Alleen de 3 expliciete promoposts noemen de app (D2-P4, D4-P4, D7-P4).
- **Covers.** Een frame waarop vraag én uitdaging zichtbaar zijn (`*-cover.jpg`). In het profielraster blijft het middelste 3:4-deel leesbaar.

---

## De 28 posts

Legenda voor elk veld: **Doel** = primair doel, **Mechanisme** = primair viraliteitsmechanisme, **Metric** = belangrijkste metric.

### MAANDAG 19 OKTOBER

#### D1-P1 · Guess the Country: Nepal
- **Serie / format:** GUESS THE COUNTRY · Reel · 12,4 s · bestand `D1/D1P1.mp4` · muziek "Games Worldbeat"
- **Doel:** bereik · **Mechanisme:** nieuwsgierigheid (open loop: "voor de laatste aanwijzing")
- **Waarom stoppen:** een directe uitdaging met een harde deadline. Je wilt weten of je het eerder weet dan aanwijzing 3.
- **Hook (scherm, 0 s):** "Name this country / before the last clue"
- **Storyboard:**
  1. 0,0 s: serielabel "GUESS THE COUNTRY · MON · MEDIUM" en de hook.
  2. 0,5 s: aanwijzing 1, met de timer-ring die aftelt en een vraagtekenkaart "WHO AM I?".
  3. 2,6 s: aanwijzing 2.
  4. 4,6 s: aanwijzing 3.
  5. 6,7 s: drumroll, boom, en de antwoordkaart (silhouet, vlag, naam, "ANSWER").
  6. 7,5 s: feitkaart.
  7. 10 s: CTA.
- **Teksten op het scherm:**
  - Aanwijzing 1: "8 of the 10 highest mountains on Earth are here"
  - Aanwijzing 2: "It sits between India and China"
  - Aanwijzing 3: "Its flag is not a rectangle"
  - Antwoord: "It's Nepal"
  - Feit: "Mount Everest (8,849 m) is on its border with China. And it has the only national flag that isn't a rectangle."
  - CTA: "Clue 1, 2 or 3? / Say when you got it"
- **Quiz:** open vraag · antwoord: **Nepal**. Valkuil bij aanwijzing 2: Bhutan ligt ook tussen India en China.
- **Timing:** de aanwijzingen komen op 0,5 / 2,6 / 4,6 s, de onthulling op 6,7 s en het feit op 7,5 s.
- **Assets:** glazen aanwijzingskaarten met icoontegels (berg, pin, vlag), de Nepal-vorm uit roviko-data, de vlag in de echte verhouding en de timer-ring.
- **Eerste frame:** grote witte hook en de eerste aanwijzing die binnenkomt. Je ziet direct dát er geraden moet worden, en waarop.
- **Cover:** de hook met alle 3 aanwijzingen en het vraagteken (`D1P1-cover.jpg`).
- **Caption:**
  > Name this country before the last clue.
  > Clue 2 is a trap 👀
  > Tell us which clue gave it away 👇
- **CTA:** "Clue 1, 2 or 3?" (reacties)
- **Hashtags:** #geography #geographyquiz #guessthecountry #nepal
- **Audio/edit:** eigen geluid laten staan. Tikkende klok per aanwijzing, drumroll en boom bij het antwoord.
- **Waarom het werkt:** iedereen kan meedoen zonder voorkennis, en de deadline ("voor aanwijzing 3") maakt het competitief. De Bhutan-valkuil levert discussie op.
- **Principes:** A, B, C, E, F, G
- **Metric:** gemiddelde kijktijd en voltooiing

#### D1-P2 · Guess the Flag: Netherlands vs Luxembourg
- **Serie / format:** GUESS THE FLAG · Reel · 12,4 s · `D1/D1P2.mp4` · "K.O. Games"
- **Doel:** shares · **Mechanisme:** spot the difference en herbekijkwaarde
- **Waarom stoppen:** twee bijna identieke vlaggen met de vraag "Find 2 differences": een zoekplaatje.
- **Hook:** "Same flag? / Find 2 differences"
- **Storyboard:**
  1. 0 s: beide vlaggen met naam, in glazen kaarten.
  2. 1 s: chip "Find 2 differences" en een timer van 3 s.
  3. 4,3 s: record scratch, "Here's how to tell".
  4. 5,1 en 5,6 s: twee vergrootglazen op het blauw ("Dark blue" en "Light blue").
  5. 6 s: chips "SHAPE 2 : 3" en "SHAPE 3 : 5".
  6. 6,8 s: feitkaart.
  7. 9,4 s: CTA.
- **Teksten:**
  - Feit: "Luxembourg's flag is longer and its blue is lighter. The colours come from its coat of arms: a red lion on blue and white stripes."
  - CTA: "Send this to someone / who mixes them up"
- **Quiz:** de 2 verschillen zijn de tint blauw en de verhouding (2:3 tegenover 3:5).
- **Assets:** officiële vlaggen in de echte verhouding en ronde vergrootglas-crops van de vlag.
- **Eerste frame:** twee bijna gelijke vlaggen. Het brein wil meteen het verschil zien.
- **Cover:** "Same flag? Find 2 differences" met beide vlaggen.
- **Caption:**
  > Same flag? Look again.
  > 2 differences between the Netherlands and Luxembourg. Did you spot both before the reveal?
  > Send this to the friend who mixes them up.
- **CTA:** doorsturen
- **Hashtags:** #flags #geography #netherlands #luxembourg #vexillology
- **Audio/edit:** klok-tikken tijdens het zoeken, scratch op de onthulling en een sparkle bij elk vergrootglas.
- **Waarom het werkt:** Nederlanders en Belgen kennen het verschil vaak "bijna", wat zorgt voor discussie en tags. Het tweede verschil (de vorm) ziet bijna niemand, waardoor mensen terugspoelen.
- **Principes:** A, C, D, F
- **Metric:** shares per bereik en herhalingen

#### D1-P3 · Bigger or Smaller: Germany vs Japan
- **Serie / format:** GEO CHALLENGE · Reel · 13,9 s · `D1/D1P3.mp4` · "Fun and Games"
- **Doel:** reacties · **Mechanisme:** verrassing (contra-intuïtief)
- **Waarom stoppen:** bijna iedereen denkt "Duitsland natuurlijk", maar het antwoord is Japan.
- **Hook:** "Which one is / bigger?"
- **Storyboard:**
  1. 0 s: VS-kaarten Germany en Japan met vlag.
  2. 1,6 s: Roviko zegt "Germany. Obviously." (met zonnebril).
  3. 1,2–4,8 s: timer.
  4. 4,8 s: boom, "Japan. Yes, really." en de echte vormen op dezelfde schaal (gelijkoppervlakteprojectie).
  5. 6 s: getallen 357,114 km² en 377,930 km² (kroon bij Japan).
  6. 6,7 s: "…wait, WHAT?"
  7. 7,6 s: feit.
  8. 10,5 s: CTA.
- **Teksten:**
  - Feit: "Japan is bigger by about 20,800 km²: roughly half the Netherlands."
  - CTA: "Settle it: who in your / group chat said Germany?"
- **Quiz:** antwoord **Japan** (377,930 tegen 357,114 km², roviko.app-data).
- **Assets:** landvormen op dezelfde schaal uit roviko-data, vlaggen en oppervlakte-chips.
- **Eerste frame:** twee bekende landen tegenover elkaar met een simpele keuze.
- **Cover:** "Which one is bigger?" met Germany VS Japan.
- **Caption:**
  > Germany or Japan: which one is bigger?
  > Most maps make this look obvious. It isn't.
  > Who in your group chat said Germany? 👇
- **CTA:** "Settle it" (reacties en tags)
- **Hashtags:** #geography #japan #germany #maps
- **Audio/edit:** boom en ka-ching op de getallen, boing op Roviko's verbazing.
- **Waarom het werkt:** een intuïtieve fout met een snelle, meetbare payoff. Daarover ontstaat ruzie in de comments.
- **Principes:** A, B, E, F
- **Metric:** reacties per bereik

#### D1-P4 · Challenge Your Smartest Friend (carrousel)
- **Serie / format:** ROVIKO / FRIEND CHALLENGE · carrousel 8 slides 4:5 · `D1/D1P4/01–08.png`
- **Doel:** shares · **Mechanisme:** vriendentagging en sociale vergelijking
- **Waarom stoppen:** "Send this to your smartest friend" is een directe sociale opdracht, met een Berichten-chat als visuele haak.
- **Hook (slide 1):** "Send this to your smartest friend · 5 questions. No googling. Compare scores." met chatballonnen "you think you're good at geography?" en "prove it."
- **Slides:**
  1. Cover.
  2. Q1 "Which city is further north?" London / Calgary
  3. Q2 "Which country has more people?" Nigeria / Russia
  4. Q3 "Smallest country in Africa?" Gambia / Seychelles / Djibouti
  5. Q4 "Which of these flags shows a map of the country?" Cyprus / Malta / Greece
  6. Q5 "Longest coastline in the world?" Norway / Canada / Indonesia
  7. Antwoorden met uitleg.
  8. Score-schaal en "Send it. Whoever scores lower picks dinner."
- **Antwoorden:**
  1. London (51.5°N tegen 51.0°N)
  2. Nigeria (meer dan 200 miljoen tegen ongeveer 145 miljoen)
  3. Seychelles (ongeveer 460 km²)
  4. Cyprus
  5. Canada
- **Timing:** n.v.t. (zelf swipen). De antwoorden komen pas op slide 7, wat zorgt voor swipe-retentie.
- **Assets:** glazen kaarten, A/B/C-lijsten, iMessage-achtige ballonnen en de mascotte.
- **Eerste slide:** een chatgesprek dat uitdaagt, herkenbaar als een echt bericht.
- **Cover:** slide 1.
- **Caption:**
  > 5 questions. No googling.
  > Send this to your smartest friend and compare scores. Lowest score picks dinner 🍕
  > What did you get? 👇
- **CTA:** doorsturen
- **Hashtags:** #geographyquiz #quiz #trivia #friends
- **Audio:** in de app een rustig instrumentaal nummer uit de Instagram-bibliotheek kiezen (optioneel).
- **Waarom het werkt:** de swipe-structuur houdt mensen vast, en de score-schaal en de "dinner"-weddenschap maken doorsturen logisch.
- **Principes:** B, D, E, G, I
- **Metric:** shares en saves per bereik

### DINSDAG 20 OKTOBER

#### D2-P1 · Guess the Country: Madagascar
- **Format:** Reel · 12,0 s · `D2/D2P1.mp4` · "Bob" · **Doel:** reacties · **Mechanisme:** competitie (tegen Roviko)
- **Waarom stoppen:** "Roviko says he gets this on clue 2. Can you?": een duel met een personage.
- **Hook:** "Roviko says he gets this / on clue 2. Can you?"
- **Storyboard:**
  1. Aanwijzing 1 (0,5 s): "It's an island in the Indian Ocean"
  2. Aanwijzing 2 (2,5 s): "It's the home of the lemurs"
  3. Rond 3,1 s zegt Roviko (zelfverzekerd): "Easy. Sri Lanka."
  4. Aanwijzing 3 (4,5 s): "It's the 4th-biggest island on Earth"
  5. Onthulling (6,5 s): Madagascar, met trombone en "…oh. Wrong."
  6. Feit: "It split from India about 88 million years ago. That's why most of its wildlife lives nowhere else."
  7. CTA: "Did you beat Roviko? / Tell him in the comments"
- **Quiz:** antwoord **Madagascar** (het 4e grootste eiland na Groenland, Nieuw-Guinea en Borneo).
- **Cover:** de hook met de 3 aanwijzingen en de ballon "Easy. Sri Lanka."
- **Caption:**
  > Roviko said he'd get this on clue 2. He did not. 🙈
  > Did you beat him? Which clue? 👇
- **CTA:** reacties · **Hashtags:** #geography #guessthecountry #madagascar #lemurs
- **Audio:** trombone op Roviko's fout en publiek bij het antwoord.
- **Waarom:** een personage dat faalt is grappig en laat de kijker winnen. Dat geeft een goed gevoel, en daar komen reacties op.
- **Principes:** A, B, E, F, G · **Metric:** reacties per bereik

#### D2-P2 · Flags: Australia vs New Zealand
- **Format:** Reel · 10,6 s · `D2/D2P2.mp4` · "Keeping Fit" · **Doel:** bereik · **Mechanisme:** keuze met een intuïtieve fout
- **Hook:** "Which one is / New Zealand?" met twee ongelabelde vlaggen A en B.
- **Storyboard:**
  1. 3 seconden timer, "A or B?".
  2. 3,7 s: scratch, "It's B" (groene rand, check en kruis).
  3. Vergrootglazen op "7-point star" (Australië) en "Red stars" (Nieuw-Zeeland).
  4. Feit: "New Zealand has 4 red stars with a white edge. Australia has 6 white stars; the big one has 7 points, for its 6 states plus its territories."
  5. CTA: "A or B: what did / you pick? Be honest"
- **Quiz:** antwoord **B = New Zealand**.
- **Cover:** "Which one is New Zealand?" met A en B.
- **Caption:**
  > A or B: which one is New Zealand?
  > Answer before the reveal, then check the stars ⭐
  > Be honest 👇
- **CTA:** reacties (A/B) · **Hashtags:** #flags #australia #newzealand #flagquiz
- **Waarom:** een klassieke verwarring, en het antwoord is in één woord te geven (lage drempel).
- **Principes:** A, C, E, F · **Metric:** eerste-seconde-retentie en reacties

#### D2-P3 · Capital City Trap: Australia
- **Format:** Reel · 13,5 s · `D2/D2P3.mp4` · "K.O. Games" · **Doel:** shares · **Mechanisme:** herkenbare fout en vriendentagging
- **Hook:** "Capital of Australia? / Careful, it's a trap"
- **Storyboard:**
  1. Inset-lijst Sydney / Melbourne / Canberra / Perth, de vlag en de timer.
  2. Roviko: "Sydney. Easy."
  3. 4,3 s: rood kruis bij Sydney, groen vinkje bij Canberra, publiek lacht.
  4. Feit: "Sydney and Melbourne both wanted to be the capital. So Australia built a new city in between."
  5. Twee snelle extra vallen: "Turkey: ~~Istanbul~~ → Ankara" en "Canada: ~~Toronto~~ → Ottawa".
  6. CTA: "Send this to someone / who said Sydney"
- **Quiz:** antwoord **Canberra**.
- **Cover:** de hook met de vierkeuzelijst en de vlag.
- **Caption:**
  > Capital of Australia? Careful.
  > Bonus round: Turkey and Canada have the same trap.
  > Send this to someone who said Sydney 👀
- **CTA:** doorsturen · **Hashtags:** #geography #capitals #australia #quiz
- **Waarom:** bijna iedereen kent iemand die Sydney zegt. De bonusvallen geven herbekijkwaarde.
- **Principes:** A, C, D, F · **Metric:** shares per bereik

#### D2-P4 · Country Mosaic: demo (promo 1/3)
- **Format:** Reel · 14,7 s · `D2/D2P4.mp4` · "Mi Gente" · **Doel:** appconversie · **Mechanisme:** appdemonstratie (eerst spelen, dan de app)
- **Hook:** "Match each shape / to its flag": 3 landvormen (Vietnam, Cuba, Iceland) en 3 geschudde vlaggen.
- **Storyboard:**
  1. Een timer van 3 s.
  2. 4,9 s: groene lijnen trekken zich één voor één, met munt-geluidjes en ka-ching.
  3. "How many did you get? / 3 out of 3?"
  4. 7,6 s: de kaart "Country Mosaic · Flag, name, shape and a fact: put the right pieces together." met de vinkjes Free · No ads · No account en "One of the daily games in Roviko · iPhone and iPad".
  5. CTA: "Your Mosaic score? / Tell us below"
- **Quiz:** Vietnam ↔ Vietnamese vlag, Cuba ↔ Cubaanse vlag, Iceland ↔ IJslandse vlag.
- **Cover:** de hook met het raster van vormen en vlaggen.
- **Caption:**
  > Match each shape to its flag. 3/3?
  > This is Country Mosaic, one of the daily games in Roviko. Free, no ads, no account. Link in bio.
- **CTA:** profielbezoek / link in bio · **Hashtags:** #geography #flags #iphonegames #quiz
- **Waarom:** de kijker speelt eerst zelf (entertainment first). De app komt pas als logische vervolgstap.
- **Principes:** A, C, G · **Metric:** profielbezoeken en installaties

### WOENSDAG 21 OKTOBER

#### D3-P1 · Guess the Country: Bhutan
- **Format:** Reel · 14,5 s · `D3/D3P1.mp4` · "Fun and Games" · **Doel:** terugkerende kijkers · **Mechanisme:** oplopende moeilijkheid
- **Hook:** "Hard mode: / clues go from hard to easy" met chips HARD, MEDIUM en EASY.
- **Aanwijzingen:**
  1. HARD: "It measures Gross National Happiness"
  2. MEDIUM: "It's a kingdom in the Himalayas"
  3. EASY: "There's a white dragon on its flag"
- **Onthulling:** 7,8 s, **Bhutan**.
- **Feit:** "Its constitution says at least 60% of the country must stay forest. Forever."
- **CTA:** "Which clue gave it away? / 1, 2 or 3"
- **Cover:** "Hard mode" met de 3 gekleurde niveau-chips.
- **Caption:**
  > Hard mode: the clues go from hard to easy.
  > Did you need the dragon? 🐉 Clue 1, 2 or 3 👇
- **CTA:** reacties · **Hashtags:** #geography #guessthecountry #bhutan #himalayas
- **Waarom:** de moeilijkheidschips maken de voortgang zichtbaar, en kenners willen laten zien dat ze het bij HARD al wisten.
- **Principes:** A, B, C, E · **Metric:** voltooiing en reacties

#### D3-P2 · Flags: Chad vs Romania
- **Format:** Reel · 12,5 s · `D3/D3P2.mp4` · "Mi Gente" · **Doel:** shares · **Mechanisme:** verrassing (bijna identiek)
- **Hook:** "One is Romania, one is Chad. / Which one is Chad?" met A en B.
- **Storyboard:**
  1. De drop van "Mi Gente" valt op de onthulling (4,4 s): B = Chad.
  2. Vergrootglazen "Brighter blue" (Roemenië) en "Darker blue" (Tsjaad).
  3. De vlag van Andorra springt erbij: "Andorra too?!"
  4. Feit: "They are nearly identical: only the blue is different. And Andorra uses the same colours too, with a coat of arms in the middle."
  5. CTA: "Did you get it / or did you guess?"
- **Quiz:** antwoord **B = Chad**.
- **Cover:** de hook met de twee vlaggen A en B.
- **Caption:**
  > One is Romania. One is Chad. Which is which?
  > Then Andorra joined the chat 😅
  > Got it or guessed it? 👇
- **CTA:** reacties · **Hashtags:** #flags #chad #romania #flagquiz
- **Waarom:** "dat kan toch niet hetzelfde zijn?". Ongeloof is een sterke deelreden, en Andorra werkt als extra payoff.
- **Principes:** A, D, E, F · **Metric:** shares per bereik

#### D3-P3 · Guess the Country by Shape: Norway (gedraaid)
- **Format:** Reel · 12,5 s · `D3/D3P3.mp4` · "Upbeat Jazz" · **Doel:** herhalingen · **Mechanisme:** herbekijkwaarde
- **Hook:** "All 4 are long and thin. / Which one is this?" met een silhouet dat 90° gedraaid is.
- **Opties:** Chile / Norway / Vietnam / Italy. Roviko zegt "Chile. 100%."
- **Onthulling (4,4 s):** het silhouet draait rechtop, met een kruis bij Chili en een vinkje bij **Norway**.
- **Feit:** "Count every fjord and island and Norway's coast is about 100,000 km. That's 2.5 times around the Earth."
- **CTA:** "Did you need it upright? / Watch it again"
- **Cover:** het gedraaide silhouet met de vierkeuzelijst.
- **Caption:**
  > Which long country is this? It's turned sideways 👀
  > Watch it again and see when it clicks.
- **CTA:** opnieuw kijken · **Hashtags:** #geography #maps #norway #fjords
- **Waarom:** de draai maakt het moeilijk. Na de onthulling wil je terugspoelen om te zien waarom je het miste.
- **Principes:** A, B, C, F · **Metric:** herhalingen en gemiddelde kijktijd

#### D3-P4 · Halloween: The haunted house of geography (carrousel)
- **Format:** carrousel 8 slides 4:5 (donker Halloween-thema) · `D3/D3P4/` · **Doel:** saves · **Mechanisme:** herkenbare humor en fouten
- **Hook (slide 1):** spook- en pompoen-glyphs met "The haunted house of geography · 6 rooms. Every geography fan's nightmare." en "Enter if you dare".
- **Kamers (slide 2–7), steeds een "nachtmerrie" en daaronder "THE TRUTH":**
  1. "Someone says the capital of Australia is Sydney." → "It's Canberra. Sydney is just the biggest city."
  2. "Niger and Nigeria are two different countries…" → "…and they're neighbours."
  3. "On the map, Greenland looks as big as Africa." → "Africa is 14 times bigger. The map lied."
  4. "Chad and Romania have the same flag." → "Almost: only the shade of blue is different."
  5. "Kazakhstan's capital was Astana, then Nur-Sultan…" → "…and since 2022 it's Astana again."
  6. "Iceland sounds icy. Greenland sounds green." → "Greenland is about 80% ice. Iceland is mostly not."
- **Slide 8:** "Which room haunts you most?" met 6 genummerde tegels en "Comment the room number. Add your own nightmare."
- **Caption:**
  > Welcome to the haunted house of geography 👻
  > 6 rooms, 6 nightmares. Which one haunts you most? Comment the room number, or add your own.
- **CTA:** reacties (kamernummer) · **Hashtags:** #halloween #geography #maps #geographymemes
- **Waarom:** het sluit aan op de vroege Halloween-trend, in de taal van de niche. Mensen voegen hun eigen "nachtmerries" toe.
- **Principes:** D, E, F, I · **Metric:** saves en reacties per bereik

### DONDERDAG 22 OKTOBER

#### D4-P1 · Guess the Country: Morocco
- **Format:** Reel · 12,1 s · `D4/D4P1.mp4` · "Light it Up Boy" · **Doel:** bereik · **Mechanisme:** visuele progressie (een vorm die steeds scherper wordt)
- **Hook:** "The shape gets sharper / with every clue". Een sterk vervaagd silhouet wordt na elke aanwijzing scherper.
- **Aanwijzingen:**
  1. "Its capital is not its biggest city"
  2. "The Atlas Mountains run through it"
  3. "On a clear day you can see Europe from here"
- **Onthulling:** **Morocco**.
- **Feit:** "The capital is Rabat, not Casablanca or Marrakesh. And Spain is only 14 km away."
- **CTA:** "How blurry was it / when you got it?"
- **Cover:** de 3 aanwijzingen met de vage vorm.
- **Caption:**
  > The shape gets sharper with every clue.
  > How blurry was it when you got it? 👇
- **CTA:** reacties · **Hashtags:** #geography #guessthecountry #morocco #maps
- **Waarom:** het scherper worden is een visuele countdown die vasthoudt tot het einde.
- **Principes:** A, B, C, F · **Metric:** voltooiing

#### D4-P2 · Flags: Ireland vs Ivory Coast
- **Format:** Reel · 11,9 s · `D4/D4P2.mp4` · "Games Worldbeat" · **Doel:** shares · **Mechanisme:** intuïtieve fout en vriendentagging
- **Hook:** "Quick. Which one / is Ireland?" met A (oranje-wit-groen) en B (groen-wit-oranje).
- **Onthulling:** **B = Ireland**.
- **Vergrootglazen:** "Orange by the pole" en "Green by the pole".
- **Feit:** "Same colours, mirrored. Green next to the pole means Ireland. And Ireland's flag is longer (1:2)."
- **CTA:** "Tag the friend who / would get this wrong"
- **Cover:** de hook met A en B.
- **Caption:**
  > Quick: which one is Ireland? 🇮🇪
  > Tip for life: green next to the pole.
  > Tag the friend who'd get this wrong.
- **CTA:** taggen · **Hashtags:** #flags #ireland #ivorycoast #flagquiz
- **Waarom:** een gespiegelde vlag is een perfecte "haha, ik wist het"-valkuil, met een geheugensteuntje als payoff (save-waardig).
- **Principes:** A, D, E, F · **Metric:** shares en tags

#### D4-P3 · Bigger or Smaller: Spain vs Sweden (Maps lie)
- **Format:** Reel · 11,5 s · `D4/D4P3.mp4` · "Bob" · **Doel:** shares · **Mechanisme:** verrassing (de kaart liegt)
- **Hook:** "On the map Sweden looks bigger. / Which one really is?"
- **Storyboard:**
  1. Beide landen op een gewone webkaart (Mercator), waar Zweden groot lijkt.
  2. Roviko: "Sweden. Look at it!"
  3. 4,0 s: scratch en morph naar de echte grootte op dezelfde schaal. **Spain** wint, met een kroon.
  4. "the map LIED to me"
- **Getallen:** 505,992 km² tegen 450,295 km² (roviko.app-data).
- **Feit:** "Spain is bigger by about 56,000 km²: about the size of Croatia. Web maps stretch the north."
- **CTA:** "Which map trick / should we expose next?"
- **Caption:**
  > On most maps Sweden looks bigger than Spain. It isn't.
  > Which map trick should we expose next? 👇
- **CTA:** reacties met een volgend onderwerp · **Hashtags:** #maps #geography #mercator #spain #sweden
- **Waarom:** "de kaart liegt" is een bewezen, deelbaar inzicht, en de morph laat het in één seconde zien.
- **Principes:** A, B, D, E, F · **Metric:** shares per bereik

#### D4-P4 · World Duel: challenge Roviko (promo 2/3, subtiel)
- **Format:** Reel · 15,5 s · `D4/D4P4.mp4` · "Take This Higher" · **Doel:** reacties · **Mechanisme:** competitie en commentparticipatie
- **Hook:** "You vs Roviko. / Answer before he does" met een scorebord You ? · Roviko 0.
- **Vijf vragen (elk ±2 s):**
  1. Capital of Canada? Roviko: Toronto ✗, "Answer: Ottawa"
  2. Biggest country in South America? Brazil ✓
  3. Which country has a maple leaf on its flag? Canada ✓
  4. Longest river in Africa? The Nile ✓
  5. Which country has the most time zones? Russia ✗, "Answer: France (12)"
- **Afsluiting:** "Roviko: 3 / 5", "Did you beat him?" en "Rematch him in World Duel · Roviko".
- **CTA:** "Your score out of 5? / Comment it"
- **Caption:**
  > You vs Roviko: 5 questions, answer before he does.
  > He got 3/5 (France has 12 time zones, he didn't know either 😅). Your score? 👇
- **CTA:** reacties met score · **Hashtags:** #geographyquiz #quiz #trivia #worldduel
- **Waarom:** snelle ronde met een scorebord. De Frankrijk-vraag verrast, en een score delen is laagdrempelig.
- **Principes:** A, C, E, F, G · **Metric:** reacties per bereik

### VRIJDAG 23 OKTOBER

#### D5-P1 · Guess the Country: Namibia
- **Format:** Reel · 11,1 s · `D5/D5P1.mp4` · "Keeping Fit" · **Doel:** shares · **Mechanisme:** expertise-uitdaging
- **Hook:** "Africa expert? / Prove it in 3 clues"
- **Aanwijzingen:**
  1. "Its flag has a golden sun"
  2. "It's named after one of the oldest deserts on Earth"
  3. "It's right here:" met een minikaart van Afrika en een rode pin
- **Onthulling:** **Namibia**.
- **Feit:** "The Namib desert is at least 55 million years old. Older than the Sahara by tens of millions of years."
- **CTA:** "Send this to your / Africa expert"
- **Caption:**
  > Africa expert? Prove it in 3 clues 🌍
  > Send this to the friend who thinks they know Africa.
- **CTA:** doorsturen · **Hashtags:** #africa #geography #namibia #guessthecountry
- **Waarom:** de identiteitshook ("expert?") prikkelt kenners, en de kaartaanwijzing maakt het eerlijk oplosbaar.
- **Principes:** A, B, D, F · **Metric:** shares per bereik

#### D5-P2 · Flags: Mali, Senegal or Guinea
- **Format:** Reel · 12,5 s · `D5/D5P2.mp4` · "Upbeat Jazz" · **Doel:** reacties · **Mechanisme:** scorechallenge (0–3)
- **Hook:** "Mali, Senegal or Guinea? / Name all 3 flags" met A, B en C.
- **Onthulling:**
  - A Mali: "PLAIN"
  - B Senegal: "GREEN STAR"
  - C Guinea: "MALI, MIRRORED"
  - Een vergrootglas op de groene ster.
- **Feit:** "These three are neighbours. Senegal adds a green star, and Guinea is Mali flipped around: red next to the pole."
- **CTA:** "How many did you get? / 0, 1, 2 or 3"
- **Caption:**
  > Mali, Senegal or Guinea: name all 3 flags.
  > Your score: 0, 1, 2 or 3? 👇
- **CTA:** score in de comments · **Hashtags:** #flags #africa #senegal #mali #guinea
- **Waarom:** een score geven is makkelijker dan een land noemen, wat zorgt voor meer comments. Het spiegel-feit verrast.
- **Principes:** C, E, F · **Metric:** reacties per bereik

#### D5-P3 · Odd One Out: which city is not a capital?
- **Format:** Reel · 13,6 s · `D5/D5P3.mp4` · "Light it Up Boy" · **Doel:** herhalingen · **Mechanisme:** oplopende moeilijkheid en scorechallenge
- **Hook:** "Which one is / NOT a capital?"
- **3 rondes (2×2-tegels, elk ±3,6 s):**
  1. EASY: Rome / Madrid / **Milan** / Paris. "Milan is big, but Rome is the capital of Italy"
  2. MEDIUM: Ankara / **Istanbul** / Rabat / Cairo. "Istanbul is Turkey's biggest city. The capital is Ankara"
  3. HARD: Quito / Lima / **Guayaquil** / Santiago. "Guayaquil is Ecuador's biggest city. The capital is Quito"
- **Afsluiting:** "Your score: ? / 3" en "3/3? Prove it. / Comment your score"
- **Caption:**
  > Which one is NOT a capital? 3 rounds, it gets harder.
  > 3/3? Prove it 👇
- **CTA:** score · **Hashtags:** #capitals #geography #quiz #trivia
- **Waarom:** de oplopende moeilijkheid en een eigen score geven een reden om opnieuw te kijken als je ronde 3 miste.
- **Principes:** A, C, E, H · **Metric:** herhalingen en voltooiing

#### D5-P4 · Swipe to reveal: guess the country, zoomed in (carrousel)
- **Format:** carrousel 5 slides 4:5 · `D5/D5P4/` · **Doel:** saves en swipes · **Mechanisme:** swipe-to-reveal en nieuwsgierigheid
- **Slides:**
  1. "Which country? / Swipe to zoom out": een kustlijn van dichtbij, zonder namen.
  2. Verder uitgezoomd: "Zooming out… / Got it yet?"
  3. Nog verder uitgezoomd: "Last chance".
  4. "It's Croatia": het land in groen gemarkeerd, met vlag.
  5. "How many swipes / did you need?" met het feit "Croatia has more than 1,000 islands. Slide 1 was the coast near Dubrovnik." en "Comment 1, 2, 3 or 4. Which country next?"
- **Caption:**
  > Guess the country before you swipe 🔍
  > How many zooms did you need: 1, 2, 3 or 4?
- **CTA:** reacties (aantal swipes) en een volgend land · **Hashtags:** #geography #maps #croatia #guessthecountry
- **Waarom:** elke swipe geeft een kleine beloning. Het aantal swipes werkt als score.
- **Principes:** B, C, E, I · **Metric:** swipe-doorloop (slide 5 bereikt) en saves

### ZATERDAG 24 OKTOBER

#### D6-P1 · Guess the Country: Peru
- **Format:** Reel · 13,1 s · `D6/D6P1.mp4` · "Upbeat Jazz" · **Doel:** shares · **Mechanisme:** vriendenchallenge met punten
- **Hook:** "Fewer clues, more points. / Play this with a friend" met chips 3 PTS, 2 PTS en 1 PT.
- **Aanwijzingen:**
  1. "The Amazon River starts in its mountains"
  2. "It shares Lake Titicaca with Bolivia"
  3. "Machu Picchu is here"
- **Onthulling:** **Peru**.
- **Feit:** "Its capital, Lima, gets less than 2 cm of rain a year. It's a big city in a desert."
- **CTA:** "Your score: 3, 2 or 1? / Now send it to your friend"
- **Caption:**
  > Play this with a friend: guess on clue 1 for 3 points, clue 2 for 2, clue 3 for 1.
  > Who won? 👇
- **CTA:** doorsturen · **Hashtags:** #geography #peru #guessthecountry #quiz
- **Waarom:** het puntensysteem maakt er een spel voor twee van, en dat is een natuurlijke reden om te delen.
- **Principes:** C, D, E, F · **Metric:** shares per bereik

#### D6-P2 · Flags: Monaco vs Indonesia (+ Poland) (carrousel)
- **Format:** carrousel 4 slides 4:5 · `D6/D6P2/` · **Doel:** saves · **Mechanisme:** verrassing (schaal)
- **Slides:**
  1. "Monaco, Indonesia or Poland? / Name all 3" met 3 vlaggen A, B en C.
  2. "Here's how to tell":
     - A Monaco: "Red on white, a bit squarer (4:5)"
     - B Indonesia: "Red on white, longer (2:3)"
     - C Poland: "White on top, red below"
  3. "Same flag. / Very different countries": Monaco 2 km² tegenover Indonesia 1,9 miljoen km², en "~940,000×: Indonesia is about 940,000 times bigger than Monaco."
  4. "Which flag twins / should we do next?" met de keuzes Chad/Romania · Ireland/Ivory Coast · Norway/Iceland.
- **Caption:**
  > Monaco, Indonesia or Poland? Name all 3.
  > Swipe for the trick, and the craziest size gap of the week.
  > Which flag twins next? 👇
- **CTA:** reacties met een volgend onderwerp · **Hashtags:** #flags #monaco #indonesia #poland #flagquiz
- **Waarom:** de schaalvergelijking (940.000×) is een deelbaar "wat?!"-moment, en de laatste slide levert input voor de volgende week.
- **Principes:** D, E, F, I · **Metric:** saves en reacties

#### D6-P3 · Find the Country: Laos on the map
- **Format:** Reel · 11,9 s · `D6/D6P3.mp4` · "Games Worldbeat" · **Doel:** shares · **Mechanisme:** vriendentagging ("which number would they pick?")
- **Hook:** "Which number / is Laos?" met een kaart van het vasteland van Zuidoost-Azië en 5 genummerde pinnen.
- **Pinnen:** 1 Myanmar, 2 Laos, 3 Thailand, 4 Cambodia, 5 Vietnam.
- **Storyboard:**
  1. Roviko: "Number 4. Trust me."
  2. 4,1 s: Laos kleurt groen, pin 2 wordt groter en de rest vervaagt.
  3. Feit: "Laos is the only landlocked country in Southeast Asia."
  4. CTA: "Send this to a friend. / Which number would they pick?"
- **Caption:**
  > Which number is Laos? 1, 2, 3, 4 or 5.
  > Send it to a friend before they see the answer 👀
- **CTA:** doorsturen · **Hashtags:** #geography #maps #laos #southeastasia
- **Waarom:** één cijfer is de laagste drempel om te reageren, en "wat zou je vriend kiezen?" nodigt uit tot sturen.
- **Principes:** A, D, E, G · **Metric:** shares per bereik

#### D6-P4 · Geography POV: the geography friend
- **Format:** Reel · 18,1 s · `D6/D6P4.mp4` · "Fun and Games" · **Doel:** bereik · **Mechanisme:** herkenbare humor
- **Hook:** "POV: you're the / geography friend" met een groepschat "Geography is fun (3)" in iPhone-stijl.
- **Chat:**
  - Sam: "Australia looks so small on maps lol" → jij: "It's bigger than the whole EU."
  - Mia: "ok but the capital of Brazil is Rio" → "Brasília."
  - Sam: "Greenland is basically the size of Africa" → "Africa is 14 times bigger."
  - Mia: "you're no fun" → "No fun. But correct." (ba-dum-tss)
- **CTA:** "Tag your group chat's / geography friend"
- **Caption:**
  > POV: you're the geography friend in the group chat 🤓
  > Tag yours.
- **CTA:** taggen · **Hashtags:** #geographymemes #pov #geography #relatable
- **Waarom:** identiteit en herkenning: mensen taggen de vriend die zo is, of zichzelf.
- **Principes:** A, D, G · **Metric:** shares en tags per bereik

### ZONDAG 25 OKTOBER

#### D7-P1 · Guess the Country: Mongolia (week finale)
- **Format:** Reel · 16,4 s · `D7/D7P1.mp4` · "Mi Gente" · **Doel:** terugkerende kijkers · **Mechanisme:** finale met tijdsdruk
- **Hook:** "Week finale: / 3 clues, 3 seconds each" met een timer-ring van 3 s per aanwijzing.
- **Aanwijzingen:**
  1. "It's the least densely populated country"
  2. "It borders only Russia and China"
  3. "Genghis Khan was born here"
- **Onthulling:** 10,4 s, **Mongolia**.
- **Feit:** "Its capital, Ulaanbaatar, is the coldest capital city in the world."
- **CTA:** "Got all 7 this week? / Count your score"
- **Caption:**
  > Week finale: 3 clues, 3 seconds each.
  > How many of this week's 7 countries did you get? 👇
- **CTA:** score van de week · **Hashtags:** #geography #mongolia #guessthecountry #quiz
- **Waarom:** de finale verwijst naar de hele serie, wat terugkeer en "wat heb ik gemist" stimuleert.
- **Principes:** B, C, E · **Metric:** terugkerende kijkers en voltooiing

#### D7-P2 · Flags: Slovakia vs Slovenia
- **Format:** Reel · 11,5 s · `D7/D7P2.mp4` · "Bob" · **Doel:** saves · **Mechanisme:** spot the difference en een detail
- **Hook:** "Slovakia vs Slovenia. / Spot the difference" en "Look at the shields".
- **Vergrootglazen:** "Double cross" (Slowakije) en "Mount Triglav" (Slovenië).
- **Feit:** "Slovakia's shield is bigger, with a double cross on three hills. Slovenia's is smaller, with Triglav, its highest mountain (2,864 m)."
- **CTA:** "Save this for your / next quiz night"
- **Caption:**
  > Slovakia vs Slovenia: spot the difference.
  > Save this for your next quiz night 📌
- **CTA:** opslaan · **Hashtags:** #flags #slovakia #slovenia #vexillology
- **Waarom:** een bekende verwarring met een concreet onderscheid. Dat is waardevol om te bewaren.
- **Principes:** C, F, I · **Metric:** saves per bereik

#### D7-P3 · Capital Challenge: Ljubljana
- **Format:** Reel · 10,6 s · `D7/D7P3.mp4` · "Keeping Fit" · **Doel:** reacties · **Mechanisme:** herkenbare fout
- **Hook:** "This city is the / capital of…?" met een grote pil "Ljubljana".
- **Opties (met vlaggen):** Slovakia / Slovenia / Croatia / Serbia.
- **Storyboard:**
  1. Roviko: "Slovakia. Same thing."
  2. Onthulling (3,7 s): **Slovenia**.
  3. Roviko: "it is NOT the same thing" (ba-dum-tss).
  4. Bonus: "Ljubljana's symbol is a dragon. And Slovakia's capital? Bratislava."
  5. CTA: "Which capital do / you always mix up?"
- **Caption:**
  > Ljubljana is the capital of…?
  > Which capital do you always mix up? 👇
- **CTA:** reacties · **Hashtags:** #capitals #slovenia #geography #quiz
- **Waarom:** het sluit aan op D7-P2. De vervolgvraag levert echte, inhoudelijke comments op.
- **Principes:** A, E, F · **Metric:** reacties per bereik

#### D7-P4 · Weekly Score Challenge (carrousel, promo 3/3)
- **Format:** carrousel 5 slides 4:5 · `D7/D7P4/` · **Doel:** appconversie en terugkerende kijkers · **Mechanisme:** sociale vergelijking
- **Slides:**
  1. "This week in / 7 questions · Keep score. Then compare with a friend."
  2. Vragen 1–4: Nepal-vlag (rechthoek), Germany of Japan, hoofdstad van Australië, de ster op de vlag van Senegal.
  3. Vragen 5–7: Spain of Sweden, het enige land zonder kust in Zuidoost-Azië, Ljubljana.
  4. Antwoorden: Rectangle, Japan, Canberra, Star, Spain, Laos, Slovenia.
  5. "Your score: __ / 7 · Beat it every day": een Roviko-kaart met "New geography games every day: clues, flags, maps and duels. Keep your streak, fill your passport." en de chips Free · No ads · No account, plus "Comment your score. Link in bio."
- **Caption:**
  > This week in 7 questions. Keep score 🏆
  > Your score /7? Comment it, and play a new round every day in Roviko (free, no ads, no account). Link in bio.
- **CTA:** score en profielbezoek · **Hashtags:** #geographyquiz #quiz #trivia #roviko
- **Waarom:** de recap beloont trouwe kijkers. De app komt aan het eind als natuurlijke vervolgstap.
- **Principes:** C, D, G, I · **Metric:** profielbezoeken en installaties

---

## Weekplanning in één oogopslag

| Dag | P1 Guess the Country | P2 Guess the Flag | P3 Geo Challenge | P4 Experiment/Community |
|---|---|---|---|---|
| Ma 19 | Nepal (Reel) | NL vs LU, spot the difference (Reel) | Germany vs Japan (Reel) | Friend challenge (carrousel) |
| Di 20 | Madagascar, vs Roviko (Reel) | AU vs NZ (Reel) | Capital trap: Australia (Reel) | Country Mosaic demo (Reel, promo) |
| Wo 21 | Bhutan, hard → easy (Reel) | Chad vs Romania (+Andorra) (Reel) | Norway, gedraaid silhouet (Reel) | Haunted house of geography (carrousel) |
| Do 22 | Morocco, vorm wordt scherper (Reel) | Ireland vs Ivory Coast (Reel) | Spain vs Sweden, maps lie (Reel) | World Duel: you vs Roviko (Reel, subtiele promo) |
| Vr 23 | Namibia, kaartaanwijzing (Reel) | Mali, Senegal, Guinea (Reel) | Odd one out, 3 rondes (Reel) | Swipe to zoom out: Croatia (carrousel) |
| Za 24 | Peru, punten met een vriend (Reel) | Monaco, Indonesia, Poland (carrousel) | Find Laos (Reel) | POV: the geography friend (Reel) |
| Zo 25 | Mongolia, finale 3 s per aanwijzing (Reel) | Slovakia vs Slovenia (Reel) | Ljubljana (Reel) | Weekly score challenge (carrousel, promo) |

Voorstel voor de tijden: P1 08:00 · P2 12:30 · P3 17:30 · P4 20:30 (lokale tijd van je publiek). Verschuif dit zodra Insights laat zien wanneer je volgers online zijn.

## Viraliteitsmatrix

| ID | Format | Doelgroep | Hooktype | Mechanisme | Verwachte actie | Risico lage retentie | Metric |
|---|---|---|---|---|---|---|---|
| D1-P1 | Reel | breed, quizliefhebbers | deadline-vraag | nieuwsgierigheid | kijken, reageren | aanwijzing 1 te makkelijk (Everest) | voltooiing |
| D1-P2 | Reel | NL/BE, vlaggenfans | spot the difference | herbekijkwaarde | delen | wie het verschil al kent, haakt af | shares/bereik |
| D1-P3 | Reel | breed | versus-keuze | verrassing | reageren | kijkers stoppen na hun gok | reacties/bereik |
| D1-P4 | Carrousel | vriendengroepen | sociale opdracht | vriendentagging | delen | uitval vóór slide 7 | shares, saves |
| D2-P1 | Reel | breed | duel met personage | competitie | reageren | trage eerste aanwijzing | reacties/bereik |
| D2-P2 | Reel | Oceanië, vlaggenfans | A/B-keuze | herkenbare fout | reageren | te snel geraden | 1e-seconde-retentie |
| D2-P3 | Reel | breed | trap-waarschuwing | herkenbare fout | delen | "trap" verklapt al iets | shares/bereik |
| D2-P4 | Reel | quizliefhebbers | match-puzzel | appdemonstratie | profiel, installeren | uitval bij het app-deel | profielbezoeken |
| D3-P1 | Reel | kenners | hard mode | oplopende moeilijkheid | reageren | HARD-aanwijzing te vaag | voltooiing |
| D3-P2 | Reel | breed | "one is…" | verrassing | delen | gokken zonder kijken | shares/bereik |
| D3-P3 | Reel | breed | gedraaide vorm | herbekijkwaarde | opnieuw kijken | vorm onherkenbaar, men haakt af | herhalingen |
| D3-P4 | Carrousel | nichefans | Halloween-thema | humor, herkenbare fouten | opslaan, reageren | te veel tekst per slide | saves, reacties |
| D4-P1 | Reel | breed | vervaagde vorm | visuele progressie | kijken | vorm te vroeg herkenbaar | voltooiing |
| D4-P2 | Reel | IE/UK/FR-Afrika | "quick, which one" | herkenbare fout | taggen | 50/50-gok | shares, tags |
| D4-P3 | Reel | breed | "the map lies" | verrassing | delen | Mercator-uitleg te snel | shares/bereik |
| D4-P4 | Reel | quizliefhebbers | jij vs Roviko | competitie | reageren met score | 5 vragen voelt lang | reacties/bereik |
| D5-P1 | Reel | Afrika-fans | expert-uitdaging | identiteit, deelbaarheid | delen | moeilijk voor een breed publiek | shares/bereik |
| D5-P2 | Reel | vlaggenfans | "name all 3" | scorechallenge | reageren | 3 vlaggen zijn veel tegelijk | reacties/bereik |
| D5-P3 | Reel | breed | odd one out | oplopend, score | opnieuw kijken | ronde 1 te makkelijk | herhalingen |
| D5-P4 | Carrousel | breed | zoom out | swipe-to-reveal | swipen, opslaan | slide 2 verklapt al veel | swipe-doorloop |
| D6-P1 | Reel | vriendengroepen | punten per aanwijzing | competitie, delen | delen | punten-uitleg vraagt aandacht | shares/bereik |
| D6-P2 | Carrousel | vlaggenfans | "name all 3" | schaalverrassing | opslaan, reageren | 3 rode/witte vlaggen ogen saai | saves |
| D6-P3 | Reel | breed | "which number" | vriendentagging | delen | kaart klein op een telefoon | shares/bereik |
| D6-P4 | Reel | nichefans | POV | humor | taggen | chattekst lezen kost tijd | shares, tags |
| D7-P1 | Reel | vaste kijkers | finale met tijdsdruk | terugkeer | kijken, reageren | 3 s per aanwijzing voelt traag | terugkerende kijkers |
| D7-P2 | Reel | vlaggenfans | spot the difference | detail, opslaan | opslaan | schilden klein zonder vergrootglas | saves/bereik |
| D7-P3 | Reel | breed | "capital of…?" | herkenbare fout | reageren | te makkelijk na D7-P2 | reacties/bereik |
| D7-P4 | Carrousel | vaste kijkers | week-recap | sociale vergelijking | profiel, installeren | 5 slides met veel tekst | profielbezoeken |

Verdeling van de mechanismen:
- nieuwsgierigheid: 3
- verrassing: 5
- competitie: 3
- sociale vergelijking: 2
- humor: 2
- herkenbare fouten: 4
- vriendentagging: 5
- herbekijkwaarde: 3
- commentparticipatie / score: 5
- appdemonstratie: 2

**Telling ten opzichte van je eisen:**

| Eis | Aantal | Posts |
|---|---|---|
| Deelbaar met vrienden (min. 8) | 11 | D1-P2, D1-P3, D1-P4, D2-P3, D3-P2, D4-P2, D4-P3, D5-P1, D6-P1, D6-P3, D6-P4 |
| Verrassende onthulling (min. 6) | 8 | D1-P3, D2-P1, D3-P2, D4-P3, D4-P4 (Frankrijk), D5-P2 (spiegel), D6-P2 (940.000×), D3-P3 |
| Herbekijkwaarde (min. 4) | 5 | D1-P2, D3-P3, D4-P1, D5-P3, D7-P1 |

Max. 4 promoposts: er zijn er 3 (D2-P4, D4-P4, D7-P4). Elke dag heeft minstens één deelgerichte post en één post met een duidelijke keuze.

## Top 5: bereik buiten bestaande volgers
1. **D4-P3** Spain vs Sweden, "the map lies": universeel, met een visueel bewijs in één seconde.
2. **D1-P3** Germany vs Japan: een intuïtieve fout die mensen willen rechtzetten.
3. **D2-P3** Capital trap Australia: iedereen kent het antwoord "Sydney".
4. **D6-P4** POV: the geography friend: humor en identiteit, ook voor niet-quizzers.
5. **D3-P2** Chad vs Romania: ongeloof ("dat is dezelfde vlag!").

## Top 5: shares en vriendentags
1. **D1-P4** Challenge your smartest friend (weddenschap "lowest score picks dinner")
2. **D6-P1** Peru met punten ("play this with a friend")
3. **D6-P3** Find Laos ("which number would they pick?")
4. **D4-P2** Ireland vs Ivory Coast ("tag the friend who'd get this wrong")
5. **D6-P4** POV ("tag your group chat's geography friend")

## Wat we de week daarna vergelijken

| Vraag | Vergelijk |
|---|---|
| Gemiddelde kijktijd | de 7 Guess the Country-varianten onderling (gewoon, vs Roviko, hard → easy, vage vorm, kaartaanwijzing, punten, 3 s/aanwijzing) |
| Eerste-seconde-retentie | vraag-hooks ("Which one is…?") tegen identiteitshooks ("Africa expert?") en opdrachthooks ("Send this to…") |
| Voltooiingspercentage | Reels van 10–12 s tegen 13–18 s |
| Herhalingen | herbekijkformats (gedraaid silhouet, odd one out, spot the difference) tegen gewone quizzen |
| Shares per bereik | "send/tag"-CTA's tegen vraag-CTA's |
| Saves per bereik | carrousels tegen Reels, en "save this"-CTA (D7-P2) tegen andere |
| Reacties per bereik | score-CTA's (0–3, /5, /7) tegen open vragen en A/B-keuzes |
| Profielbezoeken | promo-Reel (D2-P4), subtiele promo (D4-P4) en promo-carrousel (D7-P4) |
| Appinstallaties | idem, via link-in-bio-kliks en App Store Connect-bronnen (Instagram als verwijzer) |
| Terugkerende kijkers | series-labels: groeit het aandeel volgers dat P1 elke dag kijkt van maandag naar zondag? |

## Hoe we beslissen: herhalen, aanpassen of stoppen

1. **Normaliseer per bereik.** Vergelijk shares, saves en reacties per 1.000 bereik, niet absoluut, en alleen binnen hetzelfde format (Reel met Reel, carrousel met carrousel).
2. **Herhalen:** een format dat in de bovenste derde scoort op de metric die erbij hoort (zie de matrix) én een voltooiing heeft op of boven je weekmediaan. Volgende week maken we 2 nieuwe varianten met dezelfde structuur en een ander land of andere vlag.
3. **Aanpassen:** een sterke metric, maar zwakke eerste-seconde-retentie of voltooiing. Dan is de inhoud goed en de opbouw niet: test een kortere hook, een snellere eerste aanwijzing of een kortere Reel. Verander één ding tegelijk.
4. **Stoppen:** onderste derde op zowel de eigen metric als de voltooiing, twee weken achter elkaar. Eén slechte week kan aan timing of onderwerp liggen.
5. **Promo:** we beoordelen de 3 promoposts op profielbezoeken en installaties per 1.000 bereik, niet op likes. Is de subtiele promo (D4-P4) niet slechter dan de expliciete (D2-P4, D7-P4)? Dan schuiven we op naar meer subtiele demo's.
6. **Kijk naar de comments zelf.** Welke landen, vlaggen en "nachtmerries" mensen voorstellen (D3-P4, D4-P3, D5-P4, D6-P2) wordt het onderwerp van de volgende week.

## Bestanden en wat nog handmatig moet

- `D1/ … D7/`: 23 Reels (`D?P?.mp4`, H.264, 60 fps, AAC, −14 LUFS), 23 covers (`D?P?-cover.jpg`) en 5 carrousels (mappen `D1P4`, `D3P4`, `D5P4`, `D6P2`, `D7P4` met PNG-slides in 4:5).
- `CAPTIONS.txt` per dag in elke dagmap: caption, CTA en hashtags, klaar om te kopiëren.
- **Bron en herbouw:**
  - templates in `social/roviko-shorts/src/wk-country.js`, `wk-flag.js`, `wk-chal.js`, `wk-comm.js` en `wk-car.js`;
  - de iOS-kit in `lib/ios.js`;
  - herbouwen met `build/week.sh` (Reels), `node build/week-car.mjs` (carrousels) en `node build/week-covers.mjs` (covers).
- **Handmatig:**
  - plannen en posten in Instagram (of Meta Business Suite);
  - per Reel de cover uploaden (`-cover.jpg`);
  - bij carrousels eventueel muziek uit de Instagram-bibliotheek toevoegen;
  - de link in de bio controleren.
- **Licenties:** de muziek en geluidjes komen van Mixkit (gratis licentie, ook voor social media). De vlaggen en kaartdata komen uit roviko.app.

---

## Aanvulling: dagelijkse kaartchallenge (P5) en banners

- **Wat:** elke dag een extra "Guess the country"-carrousel in het bekende format. Het zijn 12 slides: een cover, 5 landen (Easy → Legend) met steeds een vraag- en een antwoordslide, en een scoreslide. Het zijn **map challenge #21–27**, met 35 landen die nog niet eerder in de reeks zaten:

| Dag | # | Thema | Easy → Legend |
|---|---|---|---|
| Ma 19 | 21 | Europe | Spain, Germany, Ukraine, Belarus, Slovenia |
| Di 20 | 22 | Africa | Algeria, Mozambique, Botswana, Togo, Gambia |
| Wo 21 | 23 | Asia | South Korea, Malaysia, Iraq, Azerbaijan, Brunei |
| Do 22 | 24 | The Americas | Canada, Costa Rica, Dominican Republic, Jamaica, Trinidad and Tobago |
| Vr 23 | 25 | Islands only | Cyprus, Malta, Cape Verde, Bahamas, Bahrain |
| Za 24 | 26 | Europe | Netherlands, Denmark, Serbia, Bosnia and Herzegovina, Luxembourg |
| Zo 25 | 27 | Around the world | Australia, Sweden, Uganda, Qatar, Timor-Leste |

- **Bestanden:** `D?/D?P5/instagram/01–12.png` (4:5) en `D?/D?P5/tiktok/01–12.png` (3:4).
- **Mechanisme:** scorechallenge en swipe-retentie. **Doel:** reacties ("__/5") en terugkerende kijkers (de reeks loopt door).
- **Feiten:** hoofdsteden en buurlanden zijn gecontroleerd met de data van roviko.app (`roviko/lib/data/countries.json`).
- **Banners:** `D?/banners/D?P?-banner.png`, één per post (35 in totaal), 1080×1920 in de Day-stijl. Ze laten de uitdaging zien zonder het antwoord. Te gebruiken als Story-aankondiging ("new post"), als omslag, of voor pinned Highlights.
- **Captions:** staan in `D?/CAPTIONS.txt` onder D?-P5.
