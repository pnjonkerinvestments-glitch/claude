import type { MailLocale } from './welcome-mail';

/**
 * 1.51 · the words of the reminder mails, in Roviko's voice: playful, short, honest (no fake urgency, no numbers we do
 * not know, never the number of games). Every stage has its own angle and several variants, so a follow-up never
 * reads the same as the last one: the streak (only when it really ends tonight), today's new games, learning
 * something new, a fresh start after a week, and a friendly goodbye after a month.
 * Placeholders: {name} the player's name, {n} the streak in days.
 */
export type Stage = 'streak' | 'day1' | 'day2' | 'week' | 'month';
export type Variant = { emoji: string; subject: string; title: string; body: string; button: string };
type Footer = { why: string; rhythm: string; off: string };

const NL: Record<Stage, Variant[]> = {
  streak: [
    { emoji: '🔥', subject: 'Je reeks van {n} dagen wacht op je 🔥', title: 'Nog even de vlam aanblazen?', body: 'Je reeks staat op {n} dagen en vannacht dooft hij uit. Eén dagspel is genoeg om hem brandend te houden. Roviko heeft de lucifers al klaarliggen.', button: 'Houd mijn reeks vast' },
    { emoji: '🧳', subject: 'Al {n} dagen op rij. Nog eentje erbij? 🧳', title: 'Je koffer staat nog open!', body: '{n} dagen achter elkaar ben je op reis geweest. Vandaag nog niet. Eén korte stop en je reeks reist gewoon mee naar morgen.', button: 'Snel één spelletje' },
    { emoji: '🌍', subject: 'Psst {name}, je reeks kijkt je aan 👀', title: 'Je reeks mist je al een beetje', body: 'Na {n} dagen is hij best gehecht aan je geraakt. Speel vandaag één dagspel, dan blijft hij staan. Kost je een paar minuten, beloofd.', button: 'Red mijn reeks' },
  ],
  day1: [
    { emoji: '🕵️', subject: 'Er wacht een nieuw mysterieland op je 🕵️', title: 'Vandaag staat er iets nieuws klaar', body: 'Nieuwe vlaggen, een nieuw mysterieland en een frisse ranglijst. Roviko heeft de kaart al uitgevouwen. Kom je even kijken?', button: 'Laat zien!' },
    { emoji: '🗺️', subject: '{name}, de wereld is vandaag weer anders 🗺️', title: 'Nieuwe dag, nieuwe wereldreis', body: 'Elke dag krijgt iedereen dezelfde vragen. Vandaag ook. Benieuwd waar jij uitkomt tussen de andere reizigers?', button: 'Start de reis van vandaag' },
    { emoji: '🎯', subject: 'Klaar voor een paar minuten wereld? 🎯', title: 'Even je hoofd op reis sturen', body: 'Koffie in de ene hand, de wereld in de andere. De spellen van vandaag zijn kort, en je leert er altijd iets van.', button: 'Speel de spellen van vandaag' },
  ],
  day2: [
    { emoji: '💡', subject: 'Wist jij deze al? 💡', title: 'Er ligt nieuwe kennis op je te wachten', body: 'Ergens op de kaart ligt een land dat jij nog niet goed kent. Roviko weet precies welk. Eén rondje en je bent weer een stukje wereld wijzer.', button: 'Leer iets nieuws' },
    { emoji: '🧭', subject: 'Roviko zoekt een reisgenoot 🧭', title: 'Zonder jou is het stil aan boord', body: 'Twee dagen geen wereldreis. De vlaggen wapperen nog, de hoofdsteden staan nog op hun plek. Tijd om te kijken hoeveel je er nog weet?', button: 'Ik reis mee' },
  ],
  week: [
    { emoji: '👋', subject: 'Hé {name}, we hebben je gemist 👋', title: 'Een week zonder wereldreis!', body: 'Er is veel gebeurd: nieuwe dagspellen, een nieuw continent van de week en de ranglijst van deze maand loopt nog. Je kunt zo weer instappen, net waar je wilt.', button: 'Stap weer in' },
    { emoji: '🚀', subject: 'Een frisse start? Roviko staat klaar 🚀', title: 'Nieuwe week, schone lei', body: 'Een nieuwe reeks begint bij dag 1, en dag 1 kan vandaag zijn. Leer een paar vlaggen bij, versla Lucia 👽 in een potje, of speel gewoon de spellen van vandaag.', button: 'Begin opnieuw' },
  ],
  month: [
    { emoji: '💌', subject: 'Een laatste kaartje van Roviko 💌', title: 'Dit is ons laatste mailtje', body: 'Het is een maand geleden dat je speelde. We gaan je niet blijven mailen, beloofd. Maar mocht je zin hebben in een paar minuten wereld: de deur staat altijd open en je voortgang staat nog voor je klaar.', button: 'Nog één keer op reis' },
  ],
};
const EN: Record<Stage, Variant[]> = {
  streak: [
    { emoji: '🔥', subject: 'Your {n}-day streak is waiting for you 🔥', title: 'Fan the flame?', body: 'Your streak is at {n} days and it goes out tonight. One daily game keeps it burning. Roviko already has the matches ready.', button: 'Keep my streak' },
    { emoji: '🧳', subject: '{n} days in a row. One more? 🧳', title: 'Your suitcase is still open!', body: 'You have travelled {n} days in a row. Not yet today. One quick stop and your streak travels on to tomorrow.', button: 'One quick game' },
    { emoji: '🌍', subject: 'Psst {name}, your streak is looking at you 👀', title: 'Your streak misses you a little', body: 'After {n} days it has grown quite attached to you. Play one daily game today and it stays. A few minutes, promise.', button: 'Save my streak' },
  ],
  day1: [
    { emoji: '🕵️', subject: 'A new mystery country is waiting for you 🕵️', title: 'Something new is ready today', body: 'New flags, a new mystery country and a fresh ranking. Roviko has already unfolded the map. Coming to take a look?', button: 'Show me!' },
    { emoji: '🗺️', subject: '{name}, the world is different again today 🗺️', title: 'New day, new trip around the world', body: 'Every day everyone gets the same questions. Today too. Curious where you land among the other travellers?', button: "Start today's trip" },
    { emoji: '🎯', subject: 'Ready for a few minutes of world? 🎯', title: 'Send your mind on a trip', body: "Coffee in one hand, the world in the other. Today's games are short, and you always learn something.", button: "Play today's games" },
  ],
  day2: [
    { emoji: '💡', subject: 'Did you know this one? 💡', title: 'New knowledge is waiting for you', body: 'Somewhere on the map there is a country you do not know well yet. Roviko knows exactly which one. One round and you know a little more of the world.', button: 'Learn something new' },
    { emoji: '🧭', subject: 'Roviko is looking for a travel buddy 🧭', title: 'It is quiet on board without you', body: 'Two days without a trip. The flags are still waving, the capitals are still in place. Time to see how many you still know?', button: "I'm in" },
  ],
  week: [
    { emoji: '👋', subject: 'Hey {name}, we missed you 👋', title: 'A week without a trip!', body: "A lot happened: new daily games, a new continent of the week, and this month's ranking is still running. Hop back in wherever you like.", button: 'Hop back in' },
    { emoji: '🚀', subject: 'A fresh start? Roviko is ready 🚀', title: 'New week, clean slate', body: "A new streak starts at day 1, and day 1 can be today. Learn a few flags, beat Lucia 👽 in a match, or just play today's games.", button: 'Start again' },
  ],
  month: [
    { emoji: '💌', subject: 'One last postcard from Roviko 💌', title: 'This is our last email', body: 'It has been a month since you played. We will not keep emailing you, promise. But if you fancy a few minutes of world: the door is always open and your progress is still waiting for you.', button: 'One more trip' },
  ],
};
const ES: Record<Stage, Variant[]> = {
  streak: [
    { emoji: '🔥', subject: 'Tu racha de {n} días te espera 🔥', title: '¿Avivamos la llama?', body: 'Tu racha va por {n} días y esta noche se apaga. Un juego diario basta para mantenerla encendida. Roviko ya tiene las cerillas listas.', button: 'Mantener mi racha' },
    { emoji: '🧳', subject: '{n} días seguidos. ¿Uno más? 🧳', title: '¡Tu maleta sigue abierta!', body: 'Llevas {n} días seguidos de viaje. Hoy todavía no. Una parada rápida y tu racha sigue viajando hasta mañana.', button: 'Un juego rápido' },
    { emoji: '🌍', subject: 'Psst {name}, tu racha te está mirando 👀', title: 'Tu racha ya te echa un poco de menos', body: 'Después de {n} días te ha cogido cariño. Juega hoy un juego diario y se queda. Unos minutos, prometido.', button: 'Salvar mi racha' },
  ],
  day1: [
    { emoji: '🕵️', subject: 'Te espera un nuevo país misterioso 🕵️', title: 'Hoy hay algo nuevo', body: 'Banderas nuevas, un nuevo país misterioso y una clasificación recién empezada. Roviko ya ha desplegado el mapa. ¿Vienes a mirar?', button: '¡Enséñamelo!' },
    { emoji: '🗺️', subject: '{name}, hoy el mundo vuelve a ser distinto 🗺️', title: 'Nuevo día, nuevo viaje por el mundo', body: 'Cada día todos reciben las mismas preguntas. Hoy también. ¿Te pica la curiosidad de dónde quedas entre los demás viajeros?', button: 'Empezar el viaje de hoy' },
    { emoji: '🎯', subject: '¿Listo para unos minutos de mundo? 🎯', title: 'Manda tu cabeza de viaje', body: 'El café en una mano, el mundo en la otra. Los juegos de hoy son cortos y siempre aprendes algo.', button: 'Jugar los juegos de hoy' },
  ],
  day2: [
    { emoji: '💡', subject: '¿Sabías esta? 💡', title: 'Te espera algo nuevo que aprender', body: 'En algún lugar del mapa hay un país que aún no conoces bien. Roviko sabe exactamente cuál. Una ronda y sabrás un poco más del mundo.', button: 'Aprender algo nuevo' },
    { emoji: '🧭', subject: 'Roviko busca compañero de viaje 🧭', title: 'Sin ti hay silencio a bordo', body: 'Dos días sin viaje. Las banderas siguen ondeando y las capitales siguen en su sitio. ¿Vemos cuántas recuerdas?', button: 'Me apunto' },
  ],
  week: [
    { emoji: '👋', subject: 'Hola {name}, te hemos echado de menos 👋', title: '¡Una semana sin viajar!', body: 'Han pasado muchas cosas: nuevos juegos diarios, un nuevo continente de la semana y la clasificación de este mes sigue en marcha. Vuelve cuando quieras, por donde quieras.', button: 'Volver a subir' },
    { emoji: '🚀', subject: '¿Un nuevo comienzo? Roviko está listo 🚀', title: 'Nueva semana, borrón y cuenta nueva', body: 'Una racha nueva empieza en el día 1, y el día 1 puede ser hoy. Aprende unas banderas, gana a Lucia 👽 en una partida o juega los juegos de hoy.', button: 'Empezar de nuevo' },
  ],
  month: [
    { emoji: '💌', subject: 'Una última postal de Roviko 💌', title: 'Este es nuestro último correo', body: 'Hace un mes que no juegas. No vamos a seguir escribiéndote, prometido. Pero si te apetecen unos minutos de mundo: la puerta siempre está abierta y tu progreso te sigue esperando.', button: 'Un viaje más' },
  ],
};
export const REMINDER_COPY: Record<MailLocale, Record<Stage, Variant[]>> = { nl: NL, en: EN, es: ES };
export const REMINDER_FOOTER: Record<MailLocale, Footer> = {
  nl: { why: 'Je krijgt dit mailtje omdat je de herinnering aanzette.', rhythm: 'Speel je een tijdje niet, dan mailen we steeds minder vaak, en na een maand helemaal niet meer.', off: 'Liever geen mailtjes meer? Zet ze met één tik uit' },
  en: { why: 'You get this email because you turned on the reminder.', rhythm: 'If you do not play for a while, we email less and less, and after a month not at all.', off: 'Rather not get these? Turn them off with one tap' },
  es: { why: 'Recibes este correo porque activaste el recordatorio.', rhythm: 'Si no juegas durante un tiempo, te escribimos cada vez menos, y después de un mes ya no.', off: '¿Prefieres no recibirlos? Desactívalos con un toque' },
};
