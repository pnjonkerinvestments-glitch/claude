// Copy for the 1.23 trip style (cream canvas, mint answer pills, coin score, Roviko peeking). Spread after v123 in messages.ts.
// Keys ending in _one are the singular of the key without it (see lib/plural.ts). Each area keeps its own block.
export const tripMessages = {
  en: {
    // shell
    streakPill: '{n}-day streak', streakPill_one: '1-day streak', streakPillZero: 'Start your streak', scorePill: '{n} points', scorePill_one: '1 point',
    // game
    questionOf: '{game} · {n}/{total}',
    // multiplayer
    mpRoundOf: 'Round {round}/{total}', mpSecondsLeft: '{n} seconds left', mpSecondsLeft_one: '1 second left', mpPickedBy: 'Picked by {names}',
    mpGained: 'You scored {n} points this round', mpGained_one: 'You scored 1 point this round', mpResultsIn: 'Results in',
    mpRowRight: 'right', mpRowWrong: 'wrong', mpRowAnswered: 'answered',
    mpFinal: 'Final results · {n} rounds', mpFinal_one: 'Final results · 1 round', mpRightCount: '{n} of {total} right', mpRightCount_one: '1 of {total} right',
    mpWin: 'You win!', mpSecond: '2nd place!', mpThird: '3rd place!', mpGoodGame: 'Good game!',
    mpPlaceOf: '{place} of {n} players', mpPlaceOf_one: '{place} of 1 player', mpPodium: 'Podium', mpPlayAgain: 'Play again', mpAllPlayers: 'All players',
    mpHome: 'Home', mpPointsWord: 'points', mpPointsWord_one: 'point', mpRoundsPill: '{n} rounds', mpRoundsPill_one: '1 round', mpTimerPill: '{n} sec per round', mpTimerPill_one: '1 sec per round',
    // finish
    dayDoneHeadline: 'Nice trip. Same time tomorrow?', dayDoneKicker: 'Day complete · 6/6', dayBonus: 'Bonus tour', dayChallenge: 'Challenge a friend', dayGamesLabel: 'Your six games today', dayNewIn: 'New games in', finSurvival: 'Survival',
    // home
    agResume: 'Continue',
    homeBeatIt: 'Can you beat it?', mascotBonusLeft_one: 'One bonus trip to go!', homeBonusLine: 'Ten questions each, the same countries for everyone.',
    homeProgress: '{n}/{total} today', homeProgress_one: '1/{total} today', homePoints: '{n} points', homePoints_one: '1 point', homeFirstLine: 'Six short games · no account needed', homeDoneTitle: 'Nice trip. See you tomorrow?', homeDoneBubble: 'Woohoo, 6 out of 6!',
    // puzzles
    tpPointsGained: '{n} points gained', tpPointsGained_one: '1 point gained', duelYourCard: 'Your card',
    // pages
    pgExploreLead: '195 countries. Tap one to visit.', pgRankLead: 'The same six games for everyone, every day.', pgScoringLead: 'Six daily games give points. The rest is for fun.',
    pgHowLead: 'Every game in three short steps.', pgSourcesLead: 'Every question is built from open data.',
  },
  nl: {
    // shell
    streakPill: '{n} dagen reeks', streakPill_one: '1 dag reeks', streakPillZero: 'Begin je reeks', scorePill: '{n} punten', scorePill_one: '1 punt',
    // game
    questionOf: '{game} · {n}/{total}',
    // multiplayer
    mpRoundOf: 'Ronde {round}/{total}', mpSecondsLeft: 'Nog {n} seconden', mpSecondsLeft_one: 'Nog 1 seconde', mpPickedBy: 'Gekozen door {names}',
    mpGained: 'Je scoorde {n} punten in deze ronde', mpGained_one: 'Je scoorde 1 punt in deze ronde', mpResultsIn: 'Uitslag over',
    mpRowRight: 'goed', mpRowWrong: 'fout', mpRowAnswered: 'heeft geantwoord',
    mpFinal: 'Eindstand · {n} rondes', mpFinal_one: 'Eindstand · 1 ronde', mpRightCount: '{n} van de {total} goed', mpRightCount_one: '1 van de {total} goed',
    mpWin: 'Jij wint!', mpSecond: '2e plaats!', mpThird: '3e plaats!', mpGoodGame: 'Goed gespeeld!',
    mpPlaceOf: '{place} van {n} spelers', mpPlaceOf_one: '{place} van 1 speler', mpPodium: 'Podium', mpPlayAgain: 'Nog een keer', mpAllPlayers: 'Alle spelers',
    mpHome: 'Naar start', mpPointsWord: 'punten', mpPointsWord_one: 'punt', mpRoundsPill: '{n} rondes', mpRoundsPill_one: '1 ronde', mpTimerPill: '{n} sec per ronde', mpTimerPill_one: '1 sec per ronde',
    // finish
    dayDoneHeadline: 'Mooie reis. Morgen weer?', dayDoneKicker: 'Dag compleet · 6/6', dayBonus: 'Bonustour', dayChallenge: 'Daag een vriend uit', dayGamesLabel: 'Je zes spellen van vandaag', dayNewIn: 'Nieuwe spellen over', finSurvival: 'Overleven',
    // home
    agResume: 'Verder',
    homeBeatIt: 'Kun jij het beter?', mascotBonusLeft_one: 'Nog één bonusreis!', homeBonusLine: 'Tien vragen per spel, voor iedereen dezelfde landen.',
    homeProgress: '{n}/{total} vandaag', homeProgress_one: '1/{total} vandaag', homePoints: '{n} punten', homePoints_one: '1 punt', homeFirstLine: 'Zes korte spellen · geen account nodig', homeDoneTitle: 'Mooie reis. Tot morgen?', homeDoneBubble: 'Joepie, 6 van de 6!',
    // puzzles
    tpPointsGained: '{n} punten erbij', tpPointsGained_one: '1 punt erbij', duelYourCard: 'Jouw kaart',
    // pages
    pgExploreLead: '195 landen. Tik er een aan.', pgRankLead: 'Elke dag dezelfde zes spellen voor iedereen.', pgScoringLead: 'Zes dagspellen geven punten. De rest is voor de lol.',
    pgHowLead: 'Elk spel in drie korte stappen.', pgSourcesLead: 'Elke vraag komt uit open data.',
  },
  es: {
    // shell
    streakPill: 'Racha de {n} días', streakPill_one: 'Racha de 1 día', streakPillZero: 'Empieza tu racha', scorePill: '{n} puntos', scorePill_one: '1 punto',
    // game
    questionOf: '{game} · {n}/{total}',
    // multiplayer
    mpRoundOf: 'Ronda {round}/{total}', mpSecondsLeft: 'Quedan {n} segundos', mpSecondsLeft_one: 'Queda 1 segundo', mpPickedBy: 'Elegido por {names}',
    mpGained: 'Has sumado {n} puntos en esta ronda', mpGained_one: 'Has sumado 1 punto en esta ronda', mpResultsIn: 'Resultados en',
    mpRowRight: 'acierto', mpRowWrong: 'fallo', mpRowAnswered: 'ha respondido',
    mpFinal: 'Resultado final · {n} rondas', mpFinal_one: 'Resultado final · 1 ronda', mpRightCount: '{n} aciertos de {total}', mpRightCount_one: '1 acierto de {total}',
    mpWin: '¡Has ganado!', mpSecond: '¡Segundo puesto!', mpThird: '¡Tercer puesto!', mpGoodGame: '¡Buena partida!',
    mpPlaceOf: '{place} de {n} jugadores', mpPlaceOf_one: '{place} de 1 jugador', mpPodium: 'Podio', mpPlayAgain: 'Jugar otra vez', mpAllPlayers: 'Todos los jugadores',
    mpHome: 'Ir al inicio', mpPointsWord: 'puntos', mpPointsWord_one: 'punto', mpRoundsPill: '{n} rondas', mpRoundsPill_one: '1 ronda', mpTimerPill: '{n} s por ronda', mpTimerPill_one: '1 s por ronda',
    // finish
    dayDoneHeadline: 'Buen viaje. ¿Nos vemos mañana?', dayDoneKicker: 'Día completo · 6/6', dayBonus: 'Ruta extra', dayChallenge: 'Reta a un amigo', dayGamesLabel: 'Tus seis juegos de hoy', dayNewIn: 'Nuevos juegos en', finSurvival: 'Supervivencia',
    // home
    agResume: 'Seguir',
    homeBeatIt: '¿Puedes superarlo?', mascotBonusLeft_one: '¡Queda un viaje extra!', homeBonusLine: 'Diez preguntas cada uno, los mismos países para todos.',
    homeProgress: '{n}/{total} hoy', homeProgress_one: '1/{total} hoy', homePoints: '{n} puntos', homePoints_one: '1 punto', homeFirstLine: 'Seis juegos cortos · sin cuenta', homeDoneTitle: 'Buen viaje. ¿Hasta mañana?', homeDoneBubble: '¡Bien! 6 de 6.',
    // puzzles
    tpPointsGained: '{n} puntos más', tpPointsGained_one: '1 punto más', duelYourCard: 'Tu carta',
    // pages
    pgExploreLead: '195 países. Toca uno para visitarlo.', pgRankLead: 'Los mismos seis juegos para todos, cada día.', pgScoringLead: 'Seis juegos diarios dan puntos. El resto es por diversión.',
    pgHowLead: 'Cada juego en tres pasos cortos.', pgSourcesLead: 'Cada pregunta se basa en datos abiertos.',
  },
};
