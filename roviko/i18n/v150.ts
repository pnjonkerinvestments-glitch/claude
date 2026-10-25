// Copy for 1.50: Lucia's daily invite, the reminder (streak text and the offer after a daily game), the computer after
// 30 seconds, "this month" instead of "all time", the league rule as it really is, the next step after a game and the
// day-1 funnel on /admin. Spread last in messages.ts.
const en = {
  luciaPopTitle: '{name} wants to play a match with you!', luciaPopCopy: 'Are you in?',
  reminderStreak: 'Your {n}-day streak is waiting for you 🔥 One game keeps it going.',
  remindOfferCopy: 'Shall Roviko send you a nudge on days you have not played yet?', remindOfferYes: 'Yes, remind me', remindOfferNo: 'No thanks',
  remindOfferOn: 'Done. Only on days you have not played yet, around your own time. You can turn it off in Settings.', remindOfferLater: 'Fine. You can always turn it on in Settings.',
  quickComputerSoon: 'Nobody after 30 seconds? Then you can play the computer instead.', quickNobody: 'Nobody found yet.', quickComputerOffer: 'Play against the computer?',
  rankingsMonth: 'This month', rankTabWeek: 'Week', rankTabMonth: 'Month', rankingsOwnTotal: 'All your daily points so far: {n}',
  leagueHow: 'Every week a group of up to 20 players. The best quarter moves up a league; in groups of 10 or more the bottom 5 move down.',
  leagueGuest: 'With a free account you play in a weekly group of up to 20 players. The best players move up a league.',
  dayNudge: 'Your daily trip is not finished yet.', dayNudgeCta: 'Next up: {game}',
  gdFunnel: 'Day 1 of new players · 30 days', gdFunnelStart: 'Started playing', gdFunnelAll: 'All daily games',
  gdFunnelNote: 'New players of the last 30 complete days: how many finished each daily game of their first day, in that day\'s order.',
};
const nl: typeof en = {
  luciaPopTitle: '{name} wil een potje met je spelen!', luciaPopCopy: 'Doe je mee?',
  reminderStreak: 'Je reeks van {n} dagen wacht op je 🔥 Eén spel houdt hem vast.',
  remindOfferCopy: 'Zal Roviko je een seintje geven op dagen dat je nog niet speelde?', remindOfferYes: 'Ja, herinner me', remindOfferNo: 'Nee, dank je',
  remindOfferOn: 'Gedaan. Alleen op dagen dat je nog niet speelde, rond je eigen tijd. Uitzetten kan in Instellingen.', remindOfferLater: 'Prima. Aanzetten kan altijd in Instellingen.',
  quickComputerSoon: 'Na 30 seconden nog niemand? Dan kun je tegen de computer spelen.', quickNobody: 'Nog niemand gevonden.', quickComputerOffer: 'Tegen de computer spelen?',
  rankingsMonth: 'Deze maand', rankTabWeek: 'Week', rankTabMonth: 'Maand', rankingsOwnTotal: 'Al je dagpunten tot nu toe: {n}',
  leagueHow: 'Elke week een groep van maximaal 20 spelers. Het beste kwart gaat een niveau omhoog; in groepen van 10 of meer gaan de onderste 5 omlaag.',
  leagueGuest: 'Met een gratis account speel je elke week in een groep van maximaal 20 spelers. De besten gaan een niveau omhoog.',
  dayNudge: 'Je dagreis van vandaag is nog niet af.', dayNudgeCta: 'Verder met {game}',
  gdFunnel: 'Dag 1 van nieuwe spelers · 30 dagen', gdFunnelStart: 'Begonnen met spelen', gdFunnelAll: 'Alle dagspellen',
  gdFunnelNote: 'Nieuwe spelers van de laatste 30 volle dagen: hoeveel maakten elk dagspel van hun eerste dag af, in de volgorde van die dag.',
};
const es: typeof en = {
  luciaPopTitle: '¡{name} quiere jugar una partida contigo!', luciaPopCopy: '¿Te unes?',
  reminderStreak: 'Tu racha de {n} días te espera 🔥 Un juego la mantiene viva.',
  remindOfferCopy: '¿Quieres que Roviko te avise los días que aún no has jugado?', remindOfferYes: 'Sí, avísame', remindOfferNo: 'No, gracias',
  remindOfferOn: 'Listo. Solo los días que aún no has jugado, cerca de tu hora. Puedes desactivarlo en Ajustes.', remindOfferLater: 'Vale. Puedes activarlo cuando quieras en Ajustes.',
  quickComputerSoon: '¿Nadie en 30 segundos? Entonces podrás jugar contra el ordenador.', quickNobody: 'Aún no hay nadie.', quickComputerOffer: '¿Jugar contra el ordenador?',
  rankingsMonth: 'Este mes', rankTabWeek: 'Semana', rankTabMonth: 'Mes', rankingsOwnTotal: 'Todos tus puntos diarios hasta ahora: {n}',
  leagueHow: 'Cada semana un grupo de hasta 20 jugadores. El mejor cuarto sube de liga; en grupos de 10 o más, los 5 últimos bajan.',
  leagueGuest: 'Con una cuenta gratuita juegas cada semana en un grupo de hasta 20 jugadores. Los mejores suben de liga.',
  dayNudge: 'Tu viaje de hoy aún no ha terminado.', dayNudgeCta: 'Sigue con {game}',
  gdFunnel: 'Día 1 de los nuevos jugadores · 30 días', gdFunnelStart: 'Empezaron a jugar', gdFunnelAll: 'Todos los juegos diarios',
  gdFunnelNote: 'Nuevos jugadores de los últimos 30 días completos: cuántos terminaron cada juego diario de su primer día, en el orden de ese día.',
};
export const v150Messages = { en, nl, es };
