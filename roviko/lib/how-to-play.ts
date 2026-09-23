// "How to play" content for every game mode: three short, kid-friendly steps and one tip.
type L = { en: string; nl: string };
export type HowToPlay = { emoji: string; steps: { icon: string; text: L }[]; tip: L };
const l = (en: string, nl: string): L => ({ en, nl });

export const HOW_TO_PLAY: Record<string, HowToPlay> = {
  rank: { emoji: '🎯', steps: [
    { icon: '🌍', text: l('You see one country and four subjects, like coastline, forest or population.', 'Je ziet één land en vier onderwerpen, zoals kustlijn, bos of bevolking.') },
    { icon: '👆', text: l('Pick the subject where this country ranks highest compared with all other countries in the world.', 'Kies het onderwerp waarop dit land het hoogst staat, vergeleken met alle andere landen van de wereld.') },
    { icon: '🥇', text: l('The best choice wins gold, the 2nd best silver and the 3rd bronze. Six countries a day.', 'De beste keuze is goud, de 2e beste zilver en de 3e brons. Elke dag zes landen.') },
  ], tip: l('Think relative: a small country can still be world top in forest or coastline.', 'Denk relatief: een klein land kan toch wereldtop zijn in bos of kustlijn.') },
  daily: { emoji: '✈️', steps: [
    { icon: '🧳', text: l('Five stops, each a different mini-game: flags, capitals, the map, neighbours and sizes.', 'Vijf stops, elk een ander minispel: vlaggen, hoofdsteden, de kaart, buurlanden en grootte.') },
    { icon: '👆', text: l('Tap the answer you think is right. There is no timer, take your time.', 'Tik op het antwoord dat jij denkt. Er is geen tijdsdruk, neem je tijd.') },
    { icon: '💡', text: l('After every answer you see right away if it was correct, with a fun fact.', 'Na elk antwoord zie je meteen of het goed was, met een leuk weetje.') },
  ], tip: l('Everyone gets the same trip today. A new one starts at midnight (UTC).', 'Iedereen krijgt vandaag dezelfde reis. Om middernacht (UTC) begint een nieuwe.') },
  compare: { emoji: '⚖️', steps: [
    { icon: '🌎', text: l('Two countries and one subject of the day, for example land neighbours.', 'Twee landen en één onderwerp van de dag, bijvoorbeeld het aantal buurlanden.') },
    { icon: '👆', text: l('Tap the country with the higher value.', 'Tik op het land met de hoogste waarde.') },
    { icon: '🔁', text: l('One country stays for the next round and a new one joins. Ten comparisons in total.', 'Eén land blijft voor de volgende ronde en er komt een nieuw land bij. In totaal tien vergelijkingen.') },
  ], tip: l('Unsure? Think about size, climate and where the country lies.', 'Twijfel je? Denk aan grootte, klimaat en waar het land ligt.') },
  mosaic: { emoji: '🧩', steps: [
    { icon: '🔲', text: l('The board hides four countries in tiles: names, flags, shapes, facts and more.', 'Op het bord zitten vier landen verstopt in tegels: namen, vlaggen, vormen, weetjes en meer.') },
    { icon: '👆', text: l('Tap one tile of each kind that belong to the same country, then tap "Check match".', 'Tik op één tegel van elke soort die bij hetzelfde land hoort en tik dan op "Controleer set".') },
    { icon: '🔁', text: l('Try as often as you like. The lightbulb gives a hint, the arrows shuffle the tiles.', 'Probeer zo vaak als je wilt. Het lampje geeft een hint, de pijltjes schudden de tegels.') },
  ], tip: l('Start with a flag and name you are sure about, then find the matching shape.', 'Begin met een vlag en naam die je zeker weet, en zoek daarna de vorm erbij.') },
  duel: { emoji: '⚔️', steps: [
    { icon: '🃏', text: l('You get five country cards. Each round Roviko plays a country on a subject.', 'Je krijgt vijf landenkaarten. Elke ronde speelt Roviko een land op een onderwerp.') },
    { icon: '👆', text: l('Pick a card from your hand that scores higher than Roviko\'s country.', 'Kies een kaart uit je hand die hoger scoort dan het land van Roviko.') },
    { icon: '🧠', text: l('Every card only once! Save strong cards for the right subject. There is always one perfect route.', 'Elke kaart maar één keer! Bewaar sterke kaarten voor het juiste onderwerp. Er is altijd één perfecte route.') },
  ], tip: l('Look at all five subjects at the top first and plan which card goes where.', 'Bekijk eerst alle vijf onderwerpen bovenaan en bedenk welke kaart waar hoort.') },
  mystery: { emoji: '❓', steps: [
    { icon: '📜', text: l('Read the clue about a special place somewhere in the world.', 'Lees de aanwijzing over een bijzondere plek ergens op de wereld.') },
    { icon: '💡', text: l('Stuck? Tap for another clue.', 'Kom je er niet uit? Tik voor nog een aanwijzing.') },
    { icon: '👆', text: l('Pick the country. You see the answer and the story behind it.', 'Kies het land. Je ziet het antwoord en het verhaal erachter.') },
  ], tip: l('A new mystery country every day, the same for everyone.', 'Elke dag een nieuw mysterieland, voor iedereen hetzelfde.') },
  trail: { emoji: '🧭', steps: [
    { icon: '🔎', text: l('You get clues about a mystery country: its region, neighbours, flag and capital.', 'Je krijgt aanwijzingen over een geheim land: de regio, buurlanden, vlag en hoofdstad.') },
    { icon: '💡', text: l('Open the next clue whenever you need more help.', 'Open de volgende aanwijzing als je meer hulp nodig hebt.') },
    { icon: '👆', text: l('Pick the country. One guess per country, no timer.', 'Kies het land. Eén poging per land, zonder tijdsdruk.') },
  ], tip: l('The fewer clues you need, the better you know the world.', 'Hoe minder aanwijzingen je nodig hebt, hoe beter je de wereld kent.') },
  capitals: { emoji: '🏙️', steps: [
    { icon: '🌍', text: l('You see a country.', 'Je ziet een land.') },
    { icon: '👆', text: l('Pick its capital city. In settings you can also switch to typing the answer.', 'Kies de hoofdstad. In de instellingen kun je ook kiezen om het antwoord te typen.') },
    { icon: '💡', text: l('After each answer you learn a fact about the country.', 'Na elk antwoord leer je een weetje over het land.') },
  ], tip: l('When typing, small spelling mistakes and missing accents are fine.', 'Bij typen zijn kleine spelfouten en ontbrekende accenten geen probleem.') },
  flags: { emoji: '🚩', steps: [
    { icon: '🏳️', text: l('You see a flag.', 'Je ziet een vlag.') },
    { icon: '👆', text: l('Pick the country it belongs to.', 'Kies het land waar hij bij hoort.') },
    { icon: '💡', text: l('You see right away if it was right, with a fact about the country.', 'Je ziet meteen of het goed was, met een weetje over het land.') },
  ], tip: l('Look at colours, symbols and stripes: neighbouring countries often have similar flags.', 'Let op kleuren, symbolen en strepen: buurlanden hebben vaak vergelijkbare vlaggen.') },
  pinpoint: { emoji: '🗺️', steps: [
    { icon: '📍', text: l('You get the name of a country.', 'Je krijgt de naam van een land.') },
    { icon: '👆', text: l('Tap where it lies on the world map (zoom with + and −), then lock your answer.', 'Tik op de wereldkaart waar het ligt (zoom met + en −) en zet je antwoord vast.') },
    { icon: '📏', text: l('You see how far away you were and where the country really is.', 'Je ziet hoe ver je ernaast zat en waar het land echt ligt.') },
  ], tip: l('Start with the continent, then zoom in.', 'Begin bij het werelddeel en zoom dan in.') },
  borders: { emoji: '🤝', steps: [
    { icon: '🌍', text: l('You see a country.', 'Je ziet een land.') },
    { icon: '👆', text: l('Pick the country that shares a land border with it.', 'Kies het land dat er een landgrens mee deelt.') },
    { icon: '🗺️', text: l('A small map shows both neighbours after your answer.', 'Na je antwoord laat een kaartje beide buren zien.') },
  ], tip: l('Only land borders count, not sea borders.', 'Alleen landgrenzen tellen, geen grenzen over zee.') },
  order: { emoji: '📏', steps: [
    { icon: '🌍', text: l('You get four countries.', 'Je krijgt vier landen.') },
    { icon: '↕️', text: l('Put them in order of size, largest at the top. Drag a row or use the arrows.', 'Zet ze op volgorde van grootte, de grootste bovenaan. Sleep een rij of gebruik de pijltjes.') },
    { icon: '✅', text: l('Lock your order and see which places were right.', 'Zet je volgorde vast en zie welke plekken goed waren.') },
  ], tip: l('Size means land area, not population.', 'Grootte betekent oppervlakte, niet het aantal inwoners.') },
  room: { emoji: '👥', steps: [
    { icon: '🔑', text: l('Create a room and share the code or link. 2 to 12 players, guests are welcome.', 'Maak een kamer en deel de code of link. 2 tot 12 spelers, ook als gast.') },
    { icon: '⚙️', text: l('The host picks the game, the number of questions and the timer.', 'De host kiest het spel, het aantal vragen en de timer.') },
    { icon: '🏆', text: l('Everyone gets the same question. Right and quick answers earn points; the ranking shows who is on top.', 'Iedereen krijgt dezelfde vraag. Goede en snelle antwoorden leveren punten op; de ranglijst laat zien wie bovenaan staat.') },
  ], tip: l('Only rooms use a timer and points. Playing alone is always at your own pace.', 'Alleen in kamers is er een timer en zijn er punten. Alleen speel je altijd in je eigen tempo.') },
};

/** Translation key of each game's name. */
export const HOW_TO_PLAY_TITLE: Record<string, string> = { rank: 'rankRadar', daily: 'dailyTitle', mystery: 'mysteryShort', room: 'howToRoomName' };

/** Where the overview groups each game. */
export const HOW_TO_PLAY_GROUPS: { key: string; note: string; modes: string[] }[] = [
  { key: 'howToDaily', note: 'howToDailyNote', modes: ['rank', 'daily', 'compare', 'mosaic'] },
  { key: 'howToExtras', note: 'howToExtrasNote', modes: ['duel', 'mystery'] },
  { key: 'howToClassic', note: 'howToClassicNote', modes: ['trail', 'capitals', 'flags', 'pinpoint', 'borders', 'order'] },
  { key: 'howToFriends', note: 'howToFriendsNote', modes: ['room'] },
];

/** Every explained game, in homepage order. */
export const HOW_TO_PLAY_ORDER = HOW_TO_PLAY_GROUPS.flatMap(g => g.modes);
