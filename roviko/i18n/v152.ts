// Copy for 1.52: the nudge for guests to choose their own name (a free account), and Lucia's notification after a day
// away. Spread last in messages.ts.
const en = {
  npKicker: 'Your player name', npTitle: 'You play as {name}', npPlace: 'Today you are #{rank} as {name}.',
  npCopy: 'Choose your own name so friends and the rankings know it is you. Your points and streak come along. Free.',
  npCta: 'Choose my name', npLater: 'Later',
  luciaNotifTitle: 'Lucia 👽 challenges you!', luciaNotifBody: 'Do you dare to take her on? 👽',
  luciaNotif2: 'Lucia 👽 is bored without you. A quick match?', luciaNotif3: 'Lucia 👽 has been practising. Can you still beat her?',
};
const nl: typeof en = {
  npKicker: 'Je spelersnaam', npTitle: 'Je speelt nu als {name}', npPlace: 'Vandaag sta je op #{rank} als {name}.',
  npCopy: 'Kies je eigen naam, dan zien vrienden en de ranglijst dat jij het bent. Je punten en reeks gaan mee. Gratis.',
  npCta: 'Kies mijn naam', npLater: 'Later',
  luciaNotifTitle: 'Lucia 👽 daagt je uit!', luciaNotifBody: 'Durf jij het tegen haar op te nemen? 👽',
  luciaNotif2: 'Lucia 👽 verveelt zich zonder jou. Snel een potje?', luciaNotif3: 'Lucia 👽 heeft geoefend. Win je nog van haar?',
};
const es: typeof en = {
  npKicker: 'Tu nombre de jugador', npTitle: 'Juegas como {name}', npPlace: 'Hoy vas #{rank} como {name}.',
  npCopy: 'Elige tu propio nombre para que tus amigos y la clasificación sepan que eres tú. Tus puntos y tu racha se quedan. Gratis.',
  npCta: 'Elegir mi nombre', npLater: 'Más tarde',
  luciaNotifTitle: '¡Lucia 👽 te reta!', luciaNotifBody: '¿Te atreves a jugar contra ella? 👽',
  luciaNotif2: 'Lucia 👽 se aburre sin ti. ¿Una partida rápida?', luciaNotif3: 'Lucia 👽 ha estado practicando. ¿Aún le ganas?',
};
export const v152Messages = { en, nl, es };
