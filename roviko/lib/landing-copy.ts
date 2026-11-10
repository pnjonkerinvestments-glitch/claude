// 1.61: the words on the landing pages (lib/landing.ts), in English, Dutch and Spanish: the title a search engine
// shows, the description, the heading, a short explanation and a few questions with answers. Every fact comes from the
// game itself (four answers, ten questions, 15 seconds, the number of countries in the data); nothing is made up.
import { BRAND } from './config';
import type { Landing, LandingMode, LandingRegion, Lang } from './landing';

const REGION: Record<Lang, Record<LandingRegion, string>> = {
  en: { World: 'the world', Europe: 'Europe', Africa: 'Africa', Asia: 'Asia', 'North America': 'North America', 'South America': 'South America', Oceania: 'Oceania' },
  nl: { World: 'de wereld', Europe: 'Europa', Africa: 'Afrika', Asia: 'Azië', 'North America': 'Noord-Amerika', 'South America': 'Zuid-Amerika', Oceania: 'Oceanië' },
  es: { World: 'el mundo', Europe: 'Europa', Africa: 'África', Asia: 'Asia', 'North America': 'América del Norte', 'South America': 'América del Sur', Oceania: 'Oceanía' },
};
export const regionName = (lang: Lang, region: LandingRegion) => REGION[lang][region];
/** "of Europe" / "van Europa" / "de Europa" ("del mundo" for the world). */
const of = (lang: Lang, region: LandingRegion) => lang === 'en' ? 'of ' + REGION.en[region] : lang === 'nl' ? 'van ' + REGION.nl[region] : region === 'World' ? 'del mundo' : 'de ' + REGION.es[region];

export type LandingCopy = { title: string; description: string; h1: string; intro: string; howTitle: string; how: string[]; listTitle: string; faqTitle: string; faq: { q: string; a: string }[]; moreTitle: string; play: string };
type Texts = { title: [string, string]; description: [string, string]; h1: [string, string]; intro: [string, string]; how: string[]; list: [string, string] };
// Each pair is [the world, one part of the world]. {of} = "of Europe", {region} = "Europe", {n} = number of countries.
const TEXTS: Record<Lang, Record<LandingMode, Texts>> = {
  en: {
    flags: {
      title: ['Flag Quiz: Guess the Flags of the World', 'Flags {of} Quiz: All {n} Flags'],
      description: ['Free flag quiz with all {n} countries. See a flag, pick the country, learn a fact after every answer. Play alone or against friends.', 'Free quiz with all {n} flags {of}. See a flag, pick the country and learn a fact after every answer. Play alone or against friends.'],
      h1: ['Flag quiz: the flags of the world', 'Flags {of} quiz'],
      intro: ['How many of the {n} flags of the world do you know? You see a flag and choose the right country. Ten questions, a few seconds each, and you can start right away.', 'Do you know all {n} flags {of}? You see a flag and choose the right country. Ten questions, a few seconds each, and you can start right away.'],
      how: ['You see a flag and pick the right country out of four answers.', 'A round is ten questions with 15 seconds each. You can change the number of questions, the time and the difficulty.', 'After every answer you get a short fact about the country, so you learn while you play.'],
      list: ['All {n} flags of the world', 'All {n} flags {of}'],
    },
    capitals: {
      title: ['Capitals Quiz: Capital Cities of the World', 'Capitals {of} Quiz: All {n} Countries'],
      description: ['Free capitals quiz with {n} countries. Pick the capital out of four answers or type it yourself. Play alone or against friends.', 'Free quiz with the capitals of all {n} countries {of}. Pick the capital out of four answers or type it yourself.'],
      h1: ['Capitals quiz: capital cities of the world', 'Capitals {of} quiz'],
      intro: ['Which city is the capital of which country? Test the capitals of all {n} countries in the world: choose out of four answers, or type the capital yourself for a harder game.', 'Which city is the capital of which country? Test the capitals of all {n} countries {of}: choose out of four answers, or type the capital yourself for a harder game.'],
      how: ['You get a country and pick its capital out of four answers.', 'Want it harder? Switch on typing and write the capital yourself. Accents and common spellings are accepted.', 'A round is ten questions with 15 seconds each. You can change the number of questions, the time and the difficulty.'],
      list: ['All countries of the world and their capitals', 'The {n} countries {of} and their capitals'],
    },
    pinpoint: {
      title: ['Country Map Quiz: Find Countries on the World Map', '{region} Map Quiz: Find the Countries {of}'],
      description: ['Free map quiz: you get a country, you drop a pin on the map. The closer your pin, the more points. All {n} countries of the world.', 'Free map quiz {of}: you get a country, you drop a pin on the map. The closer your pin, the more points. All {n} countries.'],
      h1: ['Map quiz: find the countries on the world map', '{region} map quiz: find the countries on the map'],
      intro: ['Where is that country exactly? You get the name of a country and drop a pin on the map. The closer you are, the more points you get. All {n} countries of the world can come by.', 'Where is that country exactly? You get the name of a country {of} and drop a pin on the map. The closer you are, the more points you get. All {n} countries can come by.'],
      how: ['You get the name of a country and drop a pin on the map where you think it is.', 'The closer your pin is to the country, the more points you get. Afterwards you see where it really is.', 'A round is ten countries. You can zoom and drag the map, and change the number of questions and the time.'],
      list: ['All {n} countries of the world', 'The {n} countries {of}'],
    },
    mixed: {
      title: ['World Geography Quiz: Flags, Capitals and Maps', '{region} Geography Quiz: Flags, Capitals and Map'],
      description: ['Free geography quiz about all {n} countries: flags, capitals, borders, country shapes and the map in one mix. Play alone or against friends.', 'Free geography quiz about the {n} countries {of}: flags, capitals, borders, country shapes and the map in one mix.'],
      h1: ['World geography quiz', '{region} geography quiz'],
      intro: ['One quiz, every kind of question: flags, capitals, neighbours, country shapes, sizes and pins on the map. A new mix about the {n} countries of the world every time you play.', 'One quiz, every kind of question: flags, capitals, neighbours, country shapes, sizes and pins on the map. A new mix about the {n} countries {of} every time you play.'],
      how: ['Every question is a different kind: a flag, a capital, a neighbour, the shape of a country, a pin on the map or a trail of clues.', 'A round is ten questions with 15 seconds each. You can change the number of questions, the time and the difficulty.', 'After every answer you get a short fact about the country, so you learn while you play.'],
      list: ['All {n} countries of the world', 'The {n} countries {of}'],
    },
  },
  nl: {
    flags: {
      title: ['Vlaggen quiz: raad de vlaggen van de wereld', 'Vlaggen {of} quiz: alle {n} vlaggen'],
      description: ['Gratis vlaggen quiz met alle {n} landen. Je ziet een vlag, kiest het land en leert na elk antwoord een weetje. Speel alleen of tegen vrienden.', 'Gratis quiz met alle {n} vlaggen {of}. Je ziet een vlag, kiest het land en leert na elk antwoord een weetje. Speel alleen of tegen vrienden.'],
      h1: ['Vlaggen quiz: de vlaggen van de wereld', 'Vlaggen {of} quiz'],
      intro: ['Hoeveel van de {n} vlaggen van de wereld ken jij? Je ziet een vlag en kiest het juiste land. Tien vragen, een paar seconden per vraag, en je kunt direct beginnen.', 'Ken jij alle {n} vlaggen {of}? Je ziet een vlag en kiest het juiste land. Tien vragen, een paar seconden per vraag, en je kunt direct beginnen.'],
      how: ['Je ziet een vlag en kiest het juiste land uit vier antwoorden.', 'Een ronde is tien vragen met 15 seconden per vraag. Het aantal vragen, de tijd en de moeilijkheid stel je zelf in.', 'Na elk antwoord krijg je een kort weetje over het land. Zo leer je terwijl je speelt.'],
      list: ['Alle {n} vlaggen van de wereld', 'Alle {n} vlaggen {of}'],
    },
    capitals: {
      title: ['Hoofdsteden quiz: de hoofdsteden van de wereld', 'Hoofdsteden {of} quiz: alle {n} landen'],
      description: ['Gratis hoofdsteden quiz met {n} landen. Kies de hoofdstad uit vier antwoorden of typ hem zelf. Speel alleen of tegen vrienden.', 'Gratis quiz met de hoofdsteden van alle {n} landen {of}. Kies de hoofdstad uit vier antwoorden of typ hem zelf.'],
      h1: ['Hoofdsteden quiz: de hoofdsteden van de wereld', 'Hoofdsteden {of} quiz'],
      intro: ['Welke stad is de hoofdstad van welk land? Test de hoofdsteden van alle {n} landen van de wereld: kies uit vier antwoorden, of typ de hoofdstad zelf voor een moeilijker spel.', 'Welke stad is de hoofdstad van welk land? Test de hoofdsteden van alle {n} landen {of}: kies uit vier antwoorden, of typ de hoofdstad zelf voor een moeilijker spel.'],
      how: ['Je krijgt een land en kiest de hoofdstad uit vier antwoorden.', 'Moeilijker? Zet typen aan en schrijf de hoofdstad zelf. Accenten en gebruikelijke schrijfwijzen worden herkend.', 'Een ronde is tien vragen met 15 seconden per vraag. Het aantal vragen, de tijd en de moeilijkheid stel je zelf in.'],
      list: ['Alle landen van de wereld en hun hoofdsteden', 'De {n} landen {of} en hun hoofdsteden'],
    },
    pinpoint: {
      title: ['Topografie quiz: vind de landen op de wereldkaart', 'Topografie {region}: vind de landen op de kaart'],
      description: ['Gratis topografie quiz: je krijgt een land en zet een speld op de kaart. Hoe dichterbij, hoe meer punten. Alle {n} landen van de wereld.', 'Gratis topografie quiz {of}: je krijgt een land en zet een speld op de kaart. Hoe dichterbij, hoe meer punten. Alle {n} landen.'],
      h1: ['Topografie quiz: vind de landen op de wereldkaart', 'Topografie {region}: vind de landen op de kaart'],
      intro: ['Waar ligt dat land precies? Je krijgt de naam van een land en zet een speld op de kaart. Hoe dichterbij je zit, hoe meer punten je krijgt. Alle {n} landen van de wereld kunnen langskomen.', 'Waar ligt dat land precies? Je krijgt de naam van een land {of} en zet een speld op de kaart. Hoe dichterbij je zit, hoe meer punten je krijgt. Alle {n} landen kunnen langskomen.'],
      how: ['Je krijgt de naam van een land en zet een speld op de kaart waar jij denkt dat het ligt.', 'Hoe dichter je speld bij het land staat, hoe meer punten je krijgt. Daarna zie je waar het echt ligt.', 'Een ronde is tien landen. Je kunt de kaart inzoomen en verslepen, en het aantal vragen en de tijd zelf instellen.'],
      list: ['Alle {n} landen van de wereld', 'De {n} landen {of}'],
    },
    mixed: {
      title: ['Aardrijkskunde quiz: vlaggen, hoofdsteden en topografie', 'Aardrijkskunde quiz {region}: vlaggen, hoofdsteden, kaart'],
      description: ['Gratis aardrijkskunde quiz over alle {n} landen: vlaggen, hoofdsteden, buurlanden, landvormen en de kaart door elkaar. Speel alleen of tegen vrienden.', 'Gratis aardrijkskunde quiz over de {n} landen {of}: vlaggen, hoofdsteden, buurlanden, landvormen en de kaart door elkaar.'],
      h1: ['Aardrijkskunde quiz over de hele wereld', 'Aardrijkskunde quiz {region}'],
      intro: ['Eén quiz, elk soort vraag: vlaggen, hoofdsteden, buurlanden, landvormen, groottes en spelden op de kaart. Elke keer een nieuwe mix over de {n} landen van de wereld.', 'Eén quiz, elk soort vraag: vlaggen, hoofdsteden, buurlanden, landvormen, groottes en spelden op de kaart. Elke keer een nieuwe mix over de {n} landen {of}.'],
      how: ['Elke vraag is een ander soort: een vlag, een hoofdstad, een buurland, de vorm van een land, een speld op de kaart of een spoor van aanwijzingen.', 'Een ronde is tien vragen met 15 seconden per vraag. Het aantal vragen, de tijd en de moeilijkheid stel je zelf in.', 'Na elk antwoord krijg je een kort weetje over het land. Zo leer je terwijl je speelt.'],
      list: ['Alle {n} landen van de wereld', 'De {n} landen {of}'],
    },
  },
  es: {
    flags: {
      title: ['Quiz de banderas: adivina las banderas del mundo', 'Quiz de banderas {of}: las {n} banderas'],
      description: ['Quiz de banderas gratis con los {n} países. Ves una bandera, eliges el país y aprendes un dato tras cada respuesta. Juega solo o contra amigos.', 'Quiz gratis con las {n} banderas {of}. Ves una bandera, eliges el país y aprendes un dato tras cada respuesta. Juega solo o contra amigos.'],
      h1: ['Quiz de banderas: las banderas del mundo', 'Quiz de banderas {of}'],
      intro: ['¿Cuántas de las {n} banderas del mundo conoces? Ves una bandera y eliges el país correcto. Diez preguntas, unos segundos cada una, y puedes empezar ya.', '¿Conoces las {n} banderas {of}? Ves una bandera y eliges el país correcto. Diez preguntas, unos segundos cada una, y puedes empezar ya.'],
      how: ['Ves una bandera y eliges el país correcto entre cuatro respuestas.', 'Una ronda son diez preguntas con 15 segundos cada una. Puedes cambiar el número de preguntas, el tiempo y la dificultad.', 'Tras cada respuesta recibes un dato breve sobre el país, así aprendes mientras juegas.'],
      list: ['Las {n} banderas del mundo', 'Las {n} banderas {of}'],
    },
    capitals: {
      title: ['Quiz de capitales: las capitales del mundo', 'Quiz de capitales {of}: los {n} países'],
      description: ['Quiz de capitales gratis con {n} países. Elige la capital entre cuatro respuestas o escríbela tú. Juega solo o contra amigos.', 'Quiz gratis con las capitales de los {n} países {of}. Elige la capital entre cuatro respuestas o escríbela tú.'],
      h1: ['Quiz de capitales: las capitales del mundo', 'Quiz de capitales {of}'],
      intro: ['¿Qué ciudad es la capital de cada país? Pon a prueba las capitales de los {n} países del mundo: elige entre cuatro respuestas o escribe la capital tú mismo para un juego más difícil.', '¿Qué ciudad es la capital de cada país? Pon a prueba las capitales de los {n} países {of}: elige entre cuatro respuestas o escribe la capital tú mismo para un juego más difícil.'],
      how: ['Recibes un país y eliges su capital entre cuatro respuestas.', '¿Más difícil? Activa la escritura y escribe la capital tú mismo. Se aceptan acentos y grafías habituales.', 'Una ronda son diez preguntas con 15 segundos cada una. Puedes cambiar el número de preguntas, el tiempo y la dificultad.'],
      list: ['Todos los países del mundo y sus capitales', 'Los {n} países {of} y sus capitales'],
    },
    pinpoint: {
      title: ['Quiz de mapas: encuentra los países en el mapa del mundo', 'Mapa {of}: encuentra los países en el mapa'],
      description: ['Quiz de mapas gratis: recibes un país y pones un marcador en el mapa. Cuanto más cerca, más puntos. Los {n} países del mundo.', 'Quiz de mapas {of} gratis: recibes un país y pones un marcador en el mapa. Cuanto más cerca, más puntos. Los {n} países.'],
      h1: ['Quiz de mapas: encuentra los países en el mapa del mundo', 'Mapa {of}: encuentra los países'],
      intro: ['¿Dónde está exactamente ese país? Recibes el nombre de un país y pones un marcador en el mapa. Cuanto más cerca estés, más puntos consigues. Pueden salir los {n} países del mundo.', '¿Dónde está exactamente ese país? Recibes el nombre de un país {of} y pones un marcador en el mapa. Cuanto más cerca estés, más puntos consigues. Pueden salir los {n} países.'],
      how: ['Recibes el nombre de un país y pones un marcador en el mapa donde crees que está.', 'Cuanto más cerca esté tu marcador del país, más puntos consigues. Después ves dónde está de verdad.', 'Una ronda son diez países. Puedes ampliar y mover el mapa, y cambiar el número de preguntas y el tiempo.'],
      list: ['Los {n} países del mundo', 'Los {n} países {of}'],
    },
    mixed: {
      title: ['Quiz de geografía: banderas, capitales y mapas', 'Quiz de geografía {of}: banderas, capitales y mapa'],
      description: ['Quiz de geografía gratis sobre los {n} países: banderas, capitales, fronteras, siluetas y el mapa en una mezcla. Juega solo o contra amigos.', 'Quiz de geografía gratis sobre los {n} países {of}: banderas, capitales, fronteras, siluetas y el mapa en una mezcla.'],
      h1: ['Quiz de geografía del mundo', 'Quiz de geografía {of}'],
      intro: ['Un quiz, todo tipo de preguntas: banderas, capitales, vecinos, siluetas, tamaños y marcadores en el mapa. Una mezcla nueva sobre los {n} países del mundo cada vez que juegas.', 'Un quiz, todo tipo de preguntas: banderas, capitales, vecinos, siluetas, tamaños y marcadores en el mapa. Una mezcla nueva sobre los {n} países {of} cada vez que juegas.'],
      how: ['Cada pregunta es de un tipo distinto: una bandera, una capital, un vecino, la silueta de un país, un marcador en el mapa o un rastro de pistas.', 'Una ronda son diez preguntas con 15 segundos cada una. Puedes cambiar el número de preguntas, el tiempo y la dificultad.', 'Tras cada respuesta recibes un dato breve sobre el país, así aprendes mientras juegas.'],
      list: ['Los {n} países del mundo', 'Los {n} países {of}'],
    },
  },
};
const COMMON: Record<Lang, { how: string; faq: string; more: string; play: string; qCount: [string, string]; aCount: string; qFree: string; aFree: string; qFriends: string; aFriends: string; qDaily: string; aDaily: string }> = {
  en: { how: 'How it works', faq: 'Questions and answers', more: 'More quizzes', play: 'Play now',
    qCount: ['How many countries are in this quiz?', 'How many countries {of} are in this quiz?'], aCount: '{n} countries. The full list is on this page.',
    qFree: 'Is this quiz free?', aFree: 'Yes. Roviko is free and you can start right away, without an account.',
    qFriends: 'Can I play against friends?', aFriends: 'Yes. Open a private room and share the code with friends, or play against a random player or the computer.',
    qDaily: 'Is there a new quiz every day?', aDaily: 'Yes. Besides this quiz, Roviko has new daily geography games every day, the same for everyone, with a ranking of the day.' },
  nl: { how: 'Zo werkt het', faq: 'Vragen en antwoorden', more: 'Meer quizzen', play: 'Nu spelen',
    qCount: ['Hoeveel landen zitten er in deze quiz?', 'Hoeveel landen {of} zitten er in deze quiz?'], aCount: '{n} landen. De hele lijst staat op deze pagina.',
    qFree: 'Is deze quiz gratis?', aFree: 'Ja. Roviko is gratis en je kunt direct beginnen, zonder account.',
    qFriends: 'Kan ik tegen vrienden spelen?', aFriends: 'Ja. Open een privékamer en deel de code met vrienden, of speel tegen een willekeurige speler of de computer.',
    qDaily: 'Is er elke dag een nieuwe quiz?', aDaily: 'Ja. Naast deze quiz heeft Roviko elke dag nieuwe aardrijkskundespellen, voor iedereen dezelfde, met een ranglijst van de dag.' },
  es: { how: 'Cómo funciona', faq: 'Preguntas y respuestas', more: 'Más quizzes', play: 'Jugar ahora',
    qCount: ['¿Cuántos países hay en este quiz?', '¿Cuántos países {of} hay en este quiz?'], aCount: '{n} países. La lista completa está en esta página.',
    qFree: '¿Este quiz es gratis?', aFree: 'Sí. Roviko es gratis y puedes empezar ya, sin cuenta.',
    qFriends: '¿Puedo jugar contra amigos?', aFriends: 'Sí. Abre una sala privada y comparte el código con tus amigos, o juega contra un jugador al azar o el ordenador.',
    qDaily: '¿Hay un quiz nuevo cada día?', aDaily: 'Sí. Además de este quiz, Roviko tiene juegos de geografía nuevos cada día, los mismos para todos, con una clasificación del día.' },
};

/** The words of one landing page. `count` is the number of countries of its part of the world (from the data). */
export function landingCopy(l: Landing, lang: Lang, count: number): LandingCopy {
  const i = l.region === 'World' ? 0 : 1, x = TEXTS[lang][l.mode], c = COMMON[lang];
  const f = (s: string) => s.replace(/\{of\}/g, of(lang, l.region)).replace(/\{region\}/g, REGION[lang][l.region]).replace(/\{n\}/g, String(count));
  return {
    title: f(x.title[i]) + ' | ' + BRAND.name, description: f(x.description[i]), h1: f(x.h1[i]), intro: f(x.intro[i]),
    howTitle: c.how, how: x.how, listTitle: f(x.list[i]), faqTitle: c.faq, moreTitle: c.more, play: c.play,
    faq: [{ q: f(c.qCount[i]), a: f(c.aCount) }, { q: c.qFree, a: c.aFree }, { q: c.qFriends, a: c.aFriends }, { q: c.qDaily, a: c.aDaily }],
  };
}
/** The short name of a landing page in a list of links: "Flags of Europe", "Hoofdsteden van Afrika". */
export function landingLabel(l: Landing, lang: Lang) {
  const names: Record<Lang, Record<LandingMode, string>> = {
    en: { flags: 'Flags', capitals: 'Capitals', pinpoint: 'Map', mixed: 'Geography' },
    nl: { flags: 'Vlaggen', capitals: 'Hoofdsteden', pinpoint: 'Topografie', mixed: 'Aardrijkskunde' },
    es: { flags: 'Banderas', capitals: 'Capitales', pinpoint: 'Mapa', mixed: 'Geografía' },
  };
  return names[lang][l.mode] + ' ' + of(lang, l.region);
}
/** Home and the app pages that also exist under /nl and /es: the title and description a search engine shows. */
export const PAGE_META: Record<Lang, Record<string, { title: string; description: string }>> = {
  en: {
    '': { title: 'Roviko: Daily Geography Games – Flags, Capitals and Maps', description: 'Free daily geography games: the Daily Detour plus five more games every day, with flags, capitals, maps and country rankings. Play alone, climb the ranking of the day or challenge friends.' },
    daily: { title: 'All Geography Games: Daily Games, Flags, Capitals and Maps | Roviko', description: 'All Roviko games in one place: the Daily Detour, five daily games with points, extras and classic flag, capital and map games.' },
    'how-to-play': { title: 'How to Play Roviko: Rules of Every Geography Game', description: 'How every Roviko game works: the daily games, the classic flag, capital and map quizzes and playing together.' },
    learn: { title: 'Learn the Flags of Europe in Short Lessons | Roviko', description: 'Learn the flags of Europe in short lessons. What you get wrong comes back until you know it, with bronze, silver and gold medals.' },
    explore: { title: 'All Countries of the World: Flags, Capitals and Facts | Roviko', description: 'Explore every country by region: flags, capitals, neighbours and facts. Then put your knowledge to the test.' },
    multiplayer: { title: 'Geography Quiz With Friends: Private Rooms, No Account | Roviko', description: 'Play geography games with friends in a private room, against a random player or against the computer. No account needed.' },
    scoring: { title: 'Scoring: How Points and Streaks Work | Roviko', description: 'How you earn up to 6,000 points a day with the daily games, plus streaks, shields, quests and room points.' },
  },
  nl: {
    '': { title: 'Roviko: dagelijkse aardrijkskunde-spellen – vlaggen, hoofdsteden en topografie', description: 'Gratis dagelijkse aardrijkskundespellen: de Daily Detour en elke dag nog vijf spellen, met vlaggen, hoofdsteden, topografie en landenranglijsten. Speel alleen, klim in de ranglijst van de dag of daag vrienden uit.' },
    daily: { title: 'Alle aardrijkskundespellen: dagspellen, vlaggen, hoofdsteden en topografie | Roviko', description: 'Alle spellen van Roviko op één plek: de Daily Detour, vijf dagspellen met punten, extra’s en de klassieke vlaggen-, hoofdsteden- en kaartspellen.' },
    'how-to-play': { title: 'Zo speel je Roviko: de regels van elk aardrijkskundespel', description: 'Hoe elk spel van Roviko werkt: de dagspellen, de klassieke vlaggen-, hoofdsteden- en topografiequizzen en samen spelen.' },
    learn: { title: 'Leer de vlaggen van Europa in korte lessen | Roviko', description: 'Leer de vlaggen van Europa in korte lessen. Wat je fout hebt komt terug tot je het weet, met bronzen, zilveren en gouden medailles.' },
    explore: { title: 'Alle landen van de wereld: vlaggen, hoofdsteden en weetjes | Roviko', description: 'Ontdek elk land per werelddeel: vlaggen, hoofdsteden, buurlanden en weetjes. Test daarna je kennis.' },
    multiplayer: { title: 'Aardrijkskunde quiz met vrienden: privékamers, zonder account | Roviko', description: 'Speel aardrijkskundespellen met vrienden in een privékamer, tegen een willekeurige speler of tegen de computer. Geen account nodig.' },
    scoring: { title: 'Puntentelling: zo werken punten en reeksen | Roviko', description: 'Zo verdien je tot 6.000 punten per dag met de dagspellen, plus reeksen, schilden, opdrachten en kamerpunten.' },
  },
  es: {
    '': { title: 'Roviko: juegos diarios de geografía – banderas, capitales y mapas', description: 'Juegos diarios de geografía gratis: el Daily Detour y cinco juegos más cada día, con banderas, capitales, mapas y clasificaciones de países. Juega solo, sube en la clasificación del día o reta a tus amigos.' },
    daily: { title: 'Todos los juegos de geografía: diarios, banderas, capitales y mapas | Roviko', description: 'Todos los juegos de Roviko en un lugar: el Daily Detour, cinco juegos diarios con puntos, extras y los clásicos de banderas, capitales y mapas.' },
    'how-to-play': { title: 'Cómo jugar a Roviko: las reglas de cada juego de geografía', description: 'Cómo funciona cada juego de Roviko: los juegos diarios, los quizzes clásicos de banderas, capitales y mapas y jugar juntos.' },
    learn: { title: 'Aprende las banderas de Europa en lecciones cortas | Roviko', description: 'Aprende las banderas de Europa en lecciones cortas. Lo que fallas vuelve hasta que lo sabes, con medallas de bronce, plata y oro.' },
    explore: { title: 'Todos los países del mundo: banderas, capitales y datos | Roviko', description: 'Explora cada país por región: banderas, capitales, vecinos y datos. Después pon a prueba lo que sabes.' },
    multiplayer: { title: 'Quiz de geografía con amigos: salas privadas, sin cuenta | Roviko', description: 'Juega a juegos de geografía con amigos en una sala privada, contra un jugador al azar o contra el ordenador. Sin cuenta.' },
    scoring: { title: 'Puntuación: cómo funcionan los puntos y las rachas | Roviko', description: 'Así consigues hasta 6.000 puntos al día con los juegos diarios, además de rachas, escudos, misiones y puntos de sala.' },
  },
};
