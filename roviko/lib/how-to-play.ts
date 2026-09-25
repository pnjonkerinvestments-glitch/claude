// "How to play" content for every game mode: three short, kid-friendly steps and one tip, in English, Dutch and Spanish.
type L = { en: string; nl: string; es: string };
export type HowToPlay = { emoji: string; steps: { icon: string; text: L }[]; tip: L };
const l = (en: string, nl: string, es: string): L => ({ en, nl, es });

export const HOW_TO_PLAY: Record<string, HowToPlay> = {
  rank: { emoji: '🎯', steps: [
    { icon: '🌍', text: l('You see one country and four subjects, like coastline, forest or population.', 'Je ziet één land en vier onderwerpen, zoals kustlijn, bos of bevolking.', 'Ves un país y cuatro temas, como costa, bosque o población.') },
    { icon: '👆', text: l('Tap the subject where this country ranks highest in the world. Your tap is your answer.', 'Tik op het onderwerp waarop dit land het hoogst staat in de wereld. Je tik is meteen je antwoord.', 'Toca el tema en el que este país está más alto del mundo. Tu toque es tu respuesta.') },
    { icon: '🥇', text: l('Best choice: gold. 2nd best: silver, 3rd: bronze. Six countries a day.', 'Beste keuze: goud. 2e beste: zilver, 3e: brons. Elke dag zes landen.', 'Mejor elección: oro. 2.ª: plata, 3.ª: bronce. Seis países al día.') },
  ], tip: l('Think relative: a small country can still be world top in forest or coastline.', 'Denk relatief: een klein land kan toch wereldtop zijn in bos of kustlijn.', 'Piensa en relativo: un país pequeño puede ser top mundial en bosque o costa.') },
  daily: { emoji: '✈️', steps: [
    { icon: '🧳', text: l('Twenty questions from every kind of game, mixed: flags, capitals, the map, neighbours and sizes.', 'Twintig vragen uit alle soorten spellen door elkaar: vlaggen, hoofdsteden, de kaart, buurlanden en grootte.', 'Veinte preguntas de todos los tipos de juego, mezcladas: banderas, capitales, el mapa, vecinos y tamaños.') },
    { icon: '👆', text: l('Tap the answer you think is right. There is no timer, take your time.', 'Tik op het antwoord dat jij denkt. Er is geen tijdsdruk, neem je tijd.', 'Toca la respuesta que creas correcta. No hay reloj, tómate tu tiempo.') },
    { icon: '💡', text: l('After every answer you see if it was right, with a fun fact. Each question is worth up to 50 points.', 'Na elk antwoord zie je of het goed was, met een weetje. Elke vraag is tot 50 punten waard.', 'Después de cada respuesta ves si acertaste, con un dato curioso. Cada pregunta vale hasta 50 puntos.') },
  ], tip: l('Everyone gets the same detour today. A new one starts at midnight (UTC).', 'Iedereen krijgt vandaag dezelfde omweg. Om middernacht (UTC) begint een nieuwe.', 'Hoy todos hacen el mismo desvío. Uno nuevo empieza a medianoche (UTC).') },
  compare: { emoji: '⚖️', steps: [
    { icon: '🌎', text: l('Two countries and one subject of the day, for example land neighbours.', 'Twee landen en één onderwerp van de dag, bijvoorbeeld het aantal buurlanden.', 'Dos países y un tema del día, por ejemplo los países vecinos.') },
    { icon: '👆', text: l('Tap the country with the higher value.', 'Tik op het land met de hoogste waarde.', 'Toca el país con el valor más alto.') },
    { icon: '🔁', text: l('One country stays for the next round and a new one joins. Ten rounds, 100 points each.', 'Eén land blijft voor de volgende ronde en er komt een nieuw land bij. Tien rondes, elk 100 punten.', 'Un país se queda para la siguiente ronda y llega uno nuevo. Diez rondas de 100 puntos.') },
  ], tip: l('Unsure? Think about size, climate and where the country lies.', 'Twijfel je? Denk aan grootte, klimaat en waar het land ligt.', '¿Dudas? Piensa en el tamaño, el clima y dónde está el país.') },
  mosaic: { emoji: '🧩', steps: [
    { icon: '🔲', text: l('The board hides four countries in tiles: names, flags, shapes, facts and more.', 'Op het bord zitten vier landen verstopt in tegels: namen, vlaggen, vormen, weetjes en meer.', 'El tablero esconde cuatro países en fichas: nombres, banderas, siluetas, datos y más.') },
    { icon: '👆', text: l('Tap one tile of each kind that belong to the same country, then tap "Check match".', 'Tik op één tegel van elke soort die bij hetzelfde land hoort en tik dan op "Controleer set".', 'Toca una ficha de cada tipo del mismo país y luego «Comprobar grupo».') },
    { icon: '🏅', text: l('Each country is worth 250 points. A wrong try or a hint for that country costs points.', 'Elk land is 250 punten waard. Een foute poging of een hint voor dat land kost punten.', 'Cada país vale 250 puntos. Un intento fallido o una pista de ese país cuesta puntos.') },
  ], tip: l('Start with a flag and name you are sure about. Practice boards never cost points.', 'Begin met een vlag en naam die je zeker weet. Oefenborden kosten nooit punten.', 'Empieza con una bandera y un nombre que conozcas. Practicar nunca cuesta puntos.') },
  trail: { emoji: '🧭', steps: [
    { icon: '🔎', text: l('Find the mystery country. Clues come one by one: continent, a neighbour, capital, flag.', 'Zoek het geheime land. De hints komen één voor één: werelddeel, een buurland, hoofdstad, vlag.', 'Encuentra el país misterioso. Las pistas llegan una a una: continente, un vecino, capital, bandera.') },
    { icon: '💡', text: l('Only open the next clue when you need it.', 'Open de volgende hint alleen als je hem nodig hebt.', 'Abre la siguiente pista solo si la necesitas.') },
    { icon: '👆', text: l('Pick the country. In the daily game: 200, 150, 100 or 50 points after 1, 2, 3 or 4 clues.', 'Kies het land. In het dagspel: 200, 150, 100 of 50 punten na 1, 2, 3 of 4 hints.', 'Elige el país. En el juego diario: 200, 150, 100 o 50 puntos tras 1, 2, 3 o 4 pistas.') },
  ], tip: l('The fewer clues you need, the better you know the world.', 'Hoe minder hints je nodig hebt, hoe beter je de wereld kent.', 'Cuantas menos pistas necesites, mejor conoces el mundo.') },
  duel: { emoji: '⚔️', steps: [
    { icon: '🃏', text: l('You get five country cards. Each round Roviko plays a country on a subject.', 'Je krijgt vijf landenkaarten. Elke ronde speelt Roviko een land op een onderwerp.', 'Recibes cinco cartas de países. Cada ronda Roviko juega un país en un tema.') },
    { icon: '👆', text: l('Pick a card from your hand that scores higher than Roviko\'s country.', 'Kies een kaart uit je hand die hoger scoort dan het land van Roviko.', 'Elige una carta de tu mano que supere al país de Roviko.') },
    { icon: '🧠', text: l('Every card only once! Save strong cards for the right subject. There is always one perfect route.', 'Elke kaart maar één keer! Bewaar sterke kaarten voor het juiste onderwerp. Er is altijd één perfecte route.', '¡Cada carta solo una vez! Guarda las fuertes para el tema adecuado. Siempre hay una ruta perfecta.') },
  ], tip: l('Look at all five subjects at the top first and plan which card goes where.', 'Bekijk eerst alle vijf onderwerpen bovenaan en bedenk welke kaart waar hoort.', 'Mira primero los cinco temas de arriba y planea qué carta va en cada uno.') },
  mystery: { emoji: '❓', steps: [
    { icon: '📜', text: l('Read the clue about a special place somewhere in the world.', 'Lees de aanwijzing over een bijzondere plek ergens op de wereld.', 'Lee la pista sobre un lugar especial en algún sitio del mundo.') },
    { icon: '💡', text: l('Stuck? Tap for another clue.', 'Kom je er niet uit? Tik voor nog een aanwijzing.', '¿Atascado? Toca para otra pista.') },
    { icon: '👆', text: l('Pick the country. You see the answer and the story behind it.', 'Kies het land. Je ziet het antwoord en het verhaal erachter.', 'Elige el país. Verás la respuesta y la historia detrás.') },
  ], tip: l('A new mystery country every day, just for fun: no points.', 'Elke dag een nieuw mysterieland, gewoon voor de lol: geen punten.', 'Un país misterioso nuevo cada día, solo por diversión: sin puntos.') },
  capitals: { emoji: '🏙️', steps: [
    { icon: '🌍', text: l('You see a country.', 'Je ziet een land.', 'Ves un país.') },
    { icon: '👆', text: l('Pick its capital city. In settings you can also switch to typing the answer.', 'Kies de hoofdstad. In de instellingen kun je ook kiezen om het antwoord te typen.', 'Elige su capital. En los ajustes también puedes escribir la respuesta.') },
    { icon: '💡', text: l('After each answer you learn a fact about the country.', 'Na elk antwoord leer je een weetje over het land.', 'Después de cada respuesta aprendes un dato del país.') },
  ], tip: l('When typing, small spelling mistakes and missing accents are fine.', 'Bij typen zijn kleine spelfouten en ontbrekende accenten geen probleem.', 'Al escribir, los pequeños errores y las tildes que faltan no importan.') },
  flags: { emoji: '🚩', steps: [
    { icon: '🏳️', text: l('You see a flag.', 'Je ziet een vlag.', 'Ves una bandera.') },
    { icon: '👆', text: l('Pick the country it belongs to.', 'Kies het land waar hij bij hoort.', 'Elige el país al que pertenece.') },
    { icon: '💡', text: l('You see right away if it was right, with a fact about the country.', 'Je ziet meteen of het goed was, met een weetje over het land.', 'Ves enseguida si acertaste, con un dato del país.') },
  ], tip: l('Look at colours, symbols and stripes: neighbouring countries often have similar flags.', 'Let op kleuren, symbolen en strepen: buurlanden hebben vaak vergelijkbare vlaggen.', 'Fíjate en colores, símbolos y franjas: los países vecinos suelen tener banderas parecidas.') },
  pinpoint: { emoji: '🗺️', steps: [
    { icon: '📍', text: l('You get the name of a country.', 'Je krijgt de naam van een land.', 'Recibes el nombre de un país.') },
    { icon: '👆', text: l('Tap the country on the world map: your tap is your answer. Pinch or use + and − to zoom in first.', 'Tik op het land op de wereldkaart: je tik is je antwoord. Zoom eerst in met knijpen of + en −.', 'Toca el país en el mapa: tu toque es tu respuesta. Antes, pellizca o usa + y − para acercar.') },
    { icon: '📏', text: l('You see how far away you were and where the country really is.', 'Je ziet hoe ver je ernaast zat en waar het land echt ligt.', 'Ves a qué distancia quedaste y dónde está realmente el país.') },
  ], tip: l('Start with the continent, then zoom in.', 'Begin bij het werelddeel en zoom dan in.', 'Empieza por el continente y luego acércate.') },
  borders: { emoji: '🤝', steps: [
    { icon: '🌍', text: l('You see a country.', 'Je ziet een land.', 'Ves un país.') },
    { icon: '👆', text: l('Pick the country that shares a land border with it.', 'Kies het land dat er een landgrens mee deelt.', 'Elige el país que comparte con él una frontera terrestre.') },
    { icon: '🗺️', text: l('A small map shows both neighbours after your answer.', 'Na je antwoord laat een kaartje beide buren zien.', 'Tras tu respuesta, un mapa muestra a los dos vecinos.') },
  ], tip: l('Only land borders count, not sea borders.', 'Alleen landgrenzen tellen, geen grenzen over zee.', 'Solo cuentan las fronteras terrestres, no las marítimas.') },
  order: { emoji: '📏', steps: [
    { icon: '🌍', text: l('You get four countries.', 'Je krijgt vier landen.', 'Recibes cuatro países.') },
    { icon: '↕️', text: l('Put them in order of size, largest at the top. Drag a row or use the arrows.', 'Zet ze op volgorde van grootte, de grootste bovenaan. Sleep een rij of gebruik de pijltjes.', 'Ordénalos por tamaño, el más grande arriba. Arrastra una fila o usa las flechas.') },
    { icon: '✅', text: l('Tap "Confirm order" and see which places were right.', 'Tik op "Volgorde bevestigen" en zie welke plekken goed waren.', 'Toca «Confirmar orden» y mira qué posiciones acertaste.') },
  ], tip: l('Size means land area, not population.', 'Grootte betekent oppervlakte, niet het aantal inwoners.', 'Tamaño significa superficie, no población.') },
  room: { emoji: '👥', steps: [
    { icon: '🔑', text: l('Create a room and share the code or link. 2 to 12 players, guests are welcome.', 'Maak een kamer en deel de code of link. 2 tot 12 spelers, ook als gast.', 'Crea una sala y comparte el código o el enlace. De 2 a 12 jugadores, también invitados.') },
    { icon: '⚙️', text: l('The host picks the games, the number of questions and the timer.', 'De host kiest de spellen, het aantal vragen en de timer.', 'El anfitrión elige los juegos, el número de preguntas y el tiempo.') },
    { icon: '🏆', text: l('Everyone gets the same question. Right and quick answers earn points; the ranking shows who is on top.', 'Iedereen krijgt dezelfde vraag. Goede en snelle antwoorden leveren punten op; de ranglijst laat zien wie bovenaan staat.', 'Todos reciben la misma pregunta. Acertar rápido da puntos; la clasificación muestra quién va primero.') },
  ], tip: l('Only rooms use a timer. Playing alone is always at your own pace.', 'Alleen in kamers loopt er een timer. Alleen speel je altijd in je eigen tempo.', 'Solo las salas usan reloj. Jugando solo, siempre vas a tu ritmo.') },
};

/** Translation key of each game's name. */
export const HOW_TO_PLAY_TITLE: Record<string, string> = { rank: 'rankRadar', daily: 'dailyTitle', mystery: 'mysteryShort', room: 'howToRoomName' };

/** Where the overview groups each game. */
export const HOW_TO_PLAY_GROUPS: { key: string; note: string; modes: string[] }[] = [
  { key: 'howToDaily', note: 'howToDailyNote', modes: ['rank', 'daily', 'compare', 'mosaic', 'trail'] },
  { key: 'howToExtras', note: 'howToExtrasNote', modes: ['duel', 'mystery'] },
  { key: 'howToClassic', note: 'howToClassicNote', modes: ['capitals', 'flags', 'pinpoint', 'borders', 'order'] },
  { key: 'howToFriends', note: 'howToFriendsNote', modes: ['room'] },
];

/** Every explained game, in homepage order. */
export const HOW_TO_PLAY_ORDER = HOW_TO_PLAY_GROUPS.flatMap(g => g.modes);

/** One worked example per game, shown under "Example" on the How to play page. */
export const HOW_TO_EXAMPLES: Record<string, L> = {
  rank: l('Iceland: population, forest, coastline or exports? With fewer than 400,000 people it ranks low on population and forest, but its long, jagged coastline lifts it far up the list. Coastline is the strong pick.',
    'IJsland: bevolking, bos, kustlijn of export? Met minder dan 400.000 inwoners staat het laag op bevolking en bos, maar de lange, grillige kust tilt het ver omhoog. Kustlijn is de sterke keuze.',
    'Islandia: ¿población, bosque, costa o exportaciones? Con menos de 400.000 habitantes está abajo en población y bosque, pero su costa larga y recortada la sube mucho. La costa es la buena elección.'),
  daily: l('Question 1 shows a red flag with a white cross: Switzerland. Question 2 asks for the capital of Australia: Canberra, not Sydney.',
    'Vraag 1 toont een rode vlag met een wit kruis: Zwitserland. Vraag 2 vraagt de hoofdstad van Australië: Canberra, niet Sydney.',
    'La pregunta 1 muestra una bandera roja con una cruz blanca: Suiza. La pregunta 2 pide la capital de Australia: Canberra, no Sídney.'),
  compare: l('Topic: population. India or Japan? Tap India. India stays on the board and faces the next country.',
    'Onderwerp: bevolking. India of Japan? Tik op India. India blijft staan en neemt het op tegen het volgende land.',
    'Tema: población. ¿India o Japón? Toca India. India se queda y se enfrenta al siguiente país.'),
  mosaic: l('Find Japan: the name, the white flag with a red circle, its island shape and the matching fact. Select all four, then tap "Check match".',
    'Zoek Japan: de naam, de witte vlag met een rode cirkel, de eilandvorm en het bijpassende weetje. Kies ze alle vier en tik op "Controleer set".',
    'Busca Japón: el nombre, la bandera blanca con un círculo rojo, su silueta de islas y el dato correcto. Elige las cuatro y toca «Comprobar grupo».'),
  trail: l('Clue 1: Europe. Clue 2: it borders Spain. Guess Portugal now and you earn 150 points; wait for the capital and it is 100.',
    'Hint 1: Europa. Hint 2: grenst aan Spanje. Raad je nu Portugal, dan krijg je 150 punten; wacht je op de hoofdstad, dan 100.',
    'Pista 1: Europa. Pista 2: limita con España. Si dices Portugal ahora, ganas 150 puntos; si esperas a la capital, 100.'),
  duel: l('Roviko plays Canada on coastline, the longest in the world. You will not beat it, so give up your weakest card here and keep your strong ones for later subjects.',
    'Roviko speelt Canada op kustlijn, de langste ter wereld. Die versla je niet, dus offer hier je zwakste kaart en bewaar je sterke kaarten voor later.',
    'Roviko juega Canadá en costa, la más larga del mundo. No la vas a superar, así que sacrifica tu carta más débil y guarda las fuertes para después.'),
  mystery: l('Clue: "a rose-red city carved into sandstone cliffs". That is Petra, so the country is Jordan.',
    'Hint: "een rozerode stad uitgehouwen in zandsteenrotsen". Dat is Petra, dus het land is Jordanië.',
    'Pista: «una ciudad rosada tallada en acantilados de arenisca». Es Petra, así que el país es Jordania.'),
  capitals: l('Canada: Toronto, Ottawa, Vancouver or Montreal? The capital is Ottawa.',
    'Canada: Toronto, Ottawa, Vancouver of Montreal? De hoofdstad is Ottawa.',
    'Canadá: ¿Toronto, Ottawa, Vancouver o Montreal? La capital es Ottawa.'),
  flags: l('A flag with a blue stripe above a yellow one belongs to Ukraine.',
    'Een vlag met een blauwe baan boven een gele hoort bij Oekraïne.',
    'Una bandera con una franja azul sobre una amarilla es de Ucrania.'),
  pinpoint: l('Place Chile: tap the long, narrow strip along the west coast of South America. The closer your pin, the more points.',
    'Plaats Chili: tik op de lange, smalle strook langs de westkust van Zuid-Amerika. Hoe dichterbij je pin, hoe meer punten.',
    'Sitúa Chile: toca la franja larga y estrecha de la costa oeste de Sudamérica. Cuanto más cerca, más puntos.'),
  borders: l('Which country borders France: Spain, Poland, Norway or Greece? Spain.',
    'Welk land grenst aan Frankrijk: Spanje, Polen, Noorwegen of Griekenland? Spanje.',
    '¿Qué país limita con Francia: España, Polonia, Noruega o Grecia? España.'),
  order: l('From smallest to largest: Vatican City, the Netherlands, France, Russia.',
    'Van klein naar groot: Vaticaanstad, Nederland, Frankrijk, Rusland.',
    'De menor a mayor: Ciudad del Vaticano, Países Bajos, Francia, Rusia.'),
  room: l('Create a room, invite two friends with one tap, pick Flag Signal with 10 rounds and start when everyone is ready.',
    'Maak een kamer, nodig met één tik twee vrienden uit, kies Flag Signal met 10 rondes en start als iedereen klaar is.',
    'Crea una sala, invita a dos amigos con un toque, elige Flag Signal con 10 rondas y empieza cuando todos estén listos.'),
};
