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
    agLineDaily: '10 questions, flags to the map', agLineRank: 'Eight countries, eight topics', agLineDuel: 'Seven cards against Roviko', agLineCompare: 'Which country ranks higher?', agLineOrder: 'Sort four countries by size', agLineMosaic: 'Match flags, shapes and facts', agLineTrail: 'Fewer clues, more points',
    agPractiseDaily: 'Practise the daily games', agPracticeCompare: 'Pick a topic', shufflePlacesRight: 'Countries in place', shufflePerfectRounds: 'Perfect rounds', orderCardCopy: 'Five rounds of four countries. Sort them by size.',
    competitionOrder: 'Five rounds of four countries, from easy to tricky. Every country in its right place earns 50 points, so a round is worth up to 200. No timer.',
    // puzzles
    rbPickBest: 'Best pick', rbPickNth: '{nth} best of {total}', rbAllFor: 'All subjects for {country}', rbTagBest: 'Best', rbTagYours: 'Your pick', rbReviewHint: 'Tap a country to see all eight subjects in order.',
    lvlHint_easy: 'Well-known and big countries. Most wrong answers come from other continents.', lvlHint_medium: 'All countries. Wrong answers are often nearby.', lvlHint_hard: 'Lesser-known countries. Wrong answers are look-alikes from the same region.', lvlHint_mixed: 'Every question gets its own level: easy, medium or hard.',
    rematchKeen: 'Ready for another round: {names}', rematchHostHint: 'Everyone goes back to the room, where you can change the settings.', rematchImIn: 'I\u2019m in', rematchIn: 'You\u2019re in', rematchHostWait: '{name} (host) starts the next round from the room.', lobbyKick: 'Remove {name} from the room', lobbyKickConfirm: 'Remove {name} from the room? They can\u2019t join this room again.', roomKickedTitle: 'You were removed from the room', roomKickedCopy: 'The host removed you. Open your own room or join another one.',
    lobbyNameEdit: 'Choose your name', lobbyNameLabel: 'Your name in this room and on the scoreboard',
    shareChallenge: 'Challenge your friends', shareRank: '#{place} of {players} players worldwide today', shareRankFirst: 'number 1 in the world today ({players} players)', shareRankWho: '{name}: {rank}', shareCall: 'Can you beat that?', chTitleNamed: '{name} scored {n} points in {game}', chTitleDayNamed: '{name} scored {n} points today', chRank: '#{place} of {players} players worldwide', chRankFirst: 'Number 1 in the world today',
    shareScored: '{name} scored {score} in {game}', shareScoredMe: 'I scored {score} in {game}', shareScoredDay: '{name} scored {score} today', shareScoredDayMe: 'I scored {score} today',
    adminUsage: 'Usage (last 14 days)', adminUsageTotals: '{players} players in total, {accounts} with an account.', adminUsageDay: 'Day', adminUsageDaily: 'Daily players (games)', adminUsageStarted: 'Games started / players', adminUsageNew: 'New players (accounts)', adminUsageNote: 'Days in UTC. App downloads are in App Store Connect, not here.',
    navRequests: '{n} friend requests waiting', navRequests_one: '1 friend request waiting', invitePopKicker: 'Multiplayer invite', invitePopTitle: '{name} invites you to play!', invitePopCopy: 'Room {code} · join the match?', invitePopAccept: 'Join the match of {name}', invitePopDecline: 'Decline the invite from {name}',
    nameLocked: 'You can change your name once every 30 days.', nameLockedUntil: 'You can change your name again from {date}.', nameOncePerMonth: 'You can change your name once every 30 days.', nameChangeConfirm: 'Change your name to "{name}"? After this you can only change it again in 30 days.',
    botInRoom: 'Computer · {level}',
    tpPointsGained: '{n} points gained', tpPointsGained_one: '1 point gained', duelYourCard: 'Your card',
    orderMoved: '{country} is now number {n}.', orderMoved_one: '{country} is now number 1.',
    orderPartial: '{n} of {total} in the right place: you get that share of the points.', orderPartial_one: '1 of {total} in the right place: you get that share of the points.',
    // pages
    pgExploreLead: '195 countries. Tap one to visit.', pgRankLead: 'The same six games for everyone, every day.', pgScoringLead: 'Six daily games give points. The rest is for fun.',
    pgHowLead: 'Every game in three short steps.', pgSourcesLead: 'Every question is built from open data.',
    pgWelcomeBack: 'Welcome back!', pgSignInCopy: 'Sign in and pick up where you left off.', pgPassportSave: 'Keep your stamps, streak and points on every device.', pgSeoKicker: 'Free · no account needed',
    pgGoal_games: '{n} games played', pgGoal_games_one: '1 game played', pgGoal_correct: '{n} right answers', pgGoal_correct_one: '1 right answer', pgGoal_xp: '{n} XP', pgGoal_xp_one: '1 XP',
    pgGoal_bestStreak: '{n} right in a row', pgGoal_bestStreak_one: '1 right in a row', pgGoal_dailyCount: '{n} days played', pgGoal_dailyCount_one: '1 day played',
    pgGoal_dailyStreak: '{n}-day streak', pgGoal_dailyStreak_one: '1-day streak', pgGoal_wins: '{n} room wins', pgGoal_wins_one: '1 room win',
    pgGoal_multiGames: '{n} multiplayer games', pgGoal_multiGames_one: '1 multiplayer game', pgGoal_perfect: '{n} perfect games', pgGoal_perfect_one: '1 perfect game',
    pgGoal_mode: '{n} games of {game}', pgGoal_mode_one: '1 game of {game}',
    // rules (corrected 1.23: the scoring page and the daily-points notes still described the pre-1.21 Rank Radar and Side by Side)
    competitionRankRule: 'Eight countries and eight subjects, each subject once. A pick is worth up to 125 points: the full 125 when it is that country’s strongest subject, fewer the further off it is.',
    competitionCompare: 'Fifteen comparisons, from easy to hard. The first wrong answer ends the run. Your score: correct answers ÷ 15 × 1,000.',
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
    agLineDaily: '10 vragen, van vlag tot kaart', agLineRank: 'Acht landen, acht onderwerpen', agLineDuel: 'Zeven kaarten tegen Roviko', agLineCompare: 'Welk land scoort hoger?', agLineOrder: 'Zet vier landen op grootte', agLineMosaic: 'Koppel vlaggen, vormen en feitjes', agLineTrail: 'Minder hints, meer punten',
    agPractiseDaily: 'Dagspellen oefenen', agPracticeCompare: 'Kies een onderwerp', shufflePlacesRight: 'Landen op de goede plek', shufflePerfectRounds: 'Foutloze rondes', orderCardCopy: 'Vijf rondes van vier landen. Zet ze op grootte.',
    competitionOrder: 'Vijf rondes van vier landen, van makkelijk naar lastig. Elk land op de goede plek levert 50 punten op, dus een ronde is tot 200 punten waard. Geen timer.',
    // puzzles
    rbPickBest: 'Beste keuze', rbPickNth: '{nth} beste van {total}', rbAllFor: 'Alle onderwerpen voor {country}', rbTagBest: 'Beste', rbTagYours: 'Jouw keuze', rbReviewHint: 'Tik op een land om alle acht onderwerpen op volgorde te zien.',
    lvlHint_easy: 'Bekende en grote landen. De meeste foute antwoorden komen van andere continenten.', lvlHint_medium: 'Alle landen. Foute antwoorden liggen vaak in de buurt.', lvlHint_hard: 'Minder bekende landen. Foute antwoorden lijken erop en liggen in dezelfde regio.', lvlHint_mixed: 'Elke vraag krijgt zijn eigen niveau: makkelijk, gemiddeld of moeilijk.',
    rematchKeen: 'Klaar voor nog een potje: {names}', rematchHostHint: 'Iedereen gaat terug naar de kamer, waar je de instellingen kunt aanpassen.', rematchImIn: 'Ik doe mee', rematchIn: 'Je doet mee', rematchHostWait: '{name} (host) start het volgende potje vanuit de kamer.', lobbyKick: 'Verwijder {name} uit de kamer', lobbyKickConfirm: '{name} uit de kamer verwijderen? Die kan deze kamer daarna niet meer in.', roomKickedTitle: 'Je bent uit de kamer verwijderd', roomKickedCopy: 'De host heeft je verwijderd. Open je eigen kamer of ga naar een andere.',
    lobbyNameEdit: 'Kies je naam', lobbyNameLabel: 'Je naam in deze kamer en op het scorebord',
    shareChallenge: 'Daag je vrienden uit', shareRank: '#{place} van {players} spelers wereldwijd vandaag', shareRankFirst: 'nummer 1 van de wereld vandaag ({players} spelers)', shareRankWho: '{name}: {rank}', shareCall: 'Kun jij dat verslaan?', chTitleNamed: '{name} haalde {n} punten in {game}', chTitleDayNamed: '{name} haalde vandaag {n} punten', chRank: '#{place} van {players} spelers wereldwijd', chRankFirst: 'Nummer 1 van de wereld vandaag',
    shareScored: '{name} haalde {score} in {game}', shareScoredMe: 'Ik haalde {score} in {game}', shareScoredDay: '{name} haalde vandaag {score}', shareScoredDayMe: 'Ik haalde vandaag {score}',
    adminUsage: 'Gebruik (laatste 14 dagen)', adminUsageTotals: '{players} spelers in totaal, {accounts} met een account.', adminUsageDay: 'Dag', adminUsageDaily: 'Dagspelers (spellen)', adminUsageStarted: 'Spellen gestart / spelers', adminUsageNew: 'Nieuwe spelers (accounts)', adminUsageNote: 'Dagen in UTC. App-downloads staan in App Store Connect, niet hier.',
    navRequests: '{n} vriendschapsverzoeken wachten', navRequests_one: '1 vriendschapsverzoek wacht', invitePopKicker: 'Uitnodiging voor multiplayer', invitePopTitle: '{name} nodigt je uit voor een potje!', invitePopCopy: 'Kamer {code} · doe je mee?', invitePopAccept: 'Doe mee met het potje van {name}', invitePopDecline: 'Uitnodiging van {name} afwijzen',
    nameLocked: 'Je kunt je naam maar eens per 30 dagen wijzigen.', nameLockedUntil: 'Je kunt je naam weer wijzigen vanaf {date}.', nameOncePerMonth: 'Je kunt je naam eens per 30 dagen wijzigen.', nameChangeConfirm: 'Je naam wijzigen in "{name}"? Daarna kan dat pas weer over 30 dagen.',
    botInRoom: 'Computer · {level}',
    tpPointsGained: '{n} punten erbij', tpPointsGained_one: '1 punt erbij', duelYourCard: 'Jouw kaart',
    orderMoved: '{country} staat nu op plek {n}.', orderMoved_one: '{country} staat nu op plek 1.',
    orderPartial: '{n} van de {total} op de goede plek: daarvoor krijg je een deel van de punten.', orderPartial_one: '1 van de {total} op de goede plek: daarvoor krijg je een deel van de punten.',
    // pages
    pgExploreLead: '195 landen. Tik er een aan.', pgRankLead: 'Elke dag dezelfde zes spellen voor iedereen.', pgScoringLead: 'Zes dagspellen geven punten. De rest is voor de lol.',
    pgHowLead: 'Elk spel in drie korte stappen.', pgSourcesLead: 'Elke vraag komt uit open data.',
    pgWelcomeBack: 'Welkom terug!', pgSignInCopy: 'Log in en ga verder waar je was.', pgPassportSave: 'Bewaar je stempels, reeks en punten op elk apparaat.', pgSeoKicker: 'Gratis · geen account nodig',
    pgGoal_games: '{n} spellen gespeeld', pgGoal_games_one: '1 spel gespeeld', pgGoal_correct: '{n} goede antwoorden', pgGoal_correct_one: '1 goed antwoord', pgGoal_xp: '{n} XP', pgGoal_xp_one: '1 XP',
    pgGoal_bestStreak: '{n} goed op rij', pgGoal_bestStreak_one: '1 goed op rij', pgGoal_dailyCount: '{n} dagen gespeeld', pgGoal_dailyCount_one: '1 dag gespeeld',
    pgGoal_dailyStreak: 'Reeks van {n} dagen', pgGoal_dailyStreak_one: 'Reeks van 1 dag', pgGoal_wins: '{n} keer gewonnen', pgGoal_wins_one: '1 keer gewonnen',
    pgGoal_multiGames: '{n} potjes samen', pgGoal_multiGames_one: '1 potje samen', pgGoal_perfect: '{n} foutloze spellen', pgGoal_perfect_one: '1 foutloos spel',
    pgGoal_mode: '{n} keer {game}', pgGoal_mode_one: '1 keer {game}',
    // rules (gecorrigeerd in 1.23: de puntenpagina beschreef nog Rank Radar en Side by Side van vóór 1.21)
    competitionRankRule: 'Acht landen en acht onderwerpen, elk onderwerp één keer. Een keuze is tot 125 punten waard: alles als het het sterkste onderwerp van dat land is, minder naarmate het verder ernaast zit.',
    competitionCompare: 'Vijftien vergelijkingen, van makkelijk naar moeilijk. De eerste fout stopt de run. Je score: goede antwoorden ÷ 15 × 1.000.',
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
    agLineDaily: '10 preguntas, de banderas al mapa', agLineRank: 'Ocho países, ocho temas', agLineDuel: 'Siete cartas contra Roviko', agLineCompare: '¿Qué país queda más alto?', agLineOrder: 'Ordena cuatro países por tamaño', agLineMosaic: 'Une banderas, siluetas y datos', agLineTrail: 'Menos pistas, más puntos',
    agPractiseDaily: 'Practica los juegos diarios', agPracticeCompare: 'Elige un tema', shufflePlacesRight: 'Países en su sitio', shufflePerfectRounds: 'Rondas perfectas', orderCardCopy: 'Cinco rondas de cuatro países. Ordénalos por tamaño.',
    competitionOrder: 'Cinco rondas de cuatro países, de fácil a difícil. Cada país en su sitio vale 50 puntos, así que una ronda vale hasta 200. Sin cronómetro.',
    // puzzles
    rbPickBest: 'La mejor opción', rbPickNth: '{nth} mejor de {total}', rbAllFor: 'Todos los temas de {country}', rbTagBest: 'Mejor', rbTagYours: 'Tu elección', rbReviewHint: 'Toca un país para ver los ocho temas en orden.',
    lvlHint_easy: 'Países conocidos y grandes. La mayoría de las respuestas falsas son de otros continentes.', lvlHint_medium: 'Todos los países. Las respuestas falsas suelen estar cerca.', lvlHint_hard: 'Países menos conocidos. Las respuestas falsas se parecen y están en la misma región.', lvlHint_mixed: 'Cada pregunta tiene su propio nivel: fácil, medio o difícil.',
    rematchKeen: 'Listos para otra ronda: {names}', rematchHostHint: 'Todos vuelven a la sala, donde puedes cambiar los ajustes.', rematchImIn: 'Me apunto', rematchIn: 'Te has apuntado', rematchHostWait: '{name} (anfitrión) empieza la siguiente ronda desde la sala.', lobbyKick: 'Quitar a {name} de la sala', lobbyKickConfirm: '¿Quitar a {name} de la sala? No podrá volver a entrar en esta sala.', roomKickedTitle: 'Te han quitado de la sala', roomKickedCopy: 'El anfitrión te ha quitado. Abre tu propia sala o únete a otra.',
    lobbyNameEdit: 'Elige tu nombre', lobbyNameLabel: 'Tu nombre en esta sala y en la clasificación',
    shareChallenge: 'Reta a tus amigos', shareRank: 'n.º {place} de {players} jugadores en todo el mundo hoy', shareRankFirst: 'número 1 del mundo hoy ({players} jugadores)', shareRankWho: '{name}: {rank}', shareCall: '¿Puedes superarlo?', chTitleNamed: '{name} hizo {n} puntos en {game}', chTitleDayNamed: '{name} hizo {n} puntos hoy', chRank: 'n.º {place} de {players} jugadores en todo el mundo', chRankFirst: 'Número 1 del mundo hoy',
    shareScored: '{name} hizo {score} en {game}', shareScoredMe: 'Hice {score} en {game}', shareScoredDay: '{name} hizo {score} hoy', shareScoredDayMe: 'Hoy hice {score}',
    adminUsage: 'Uso (últimos 14 días)', adminUsageTotals: '{players} jugadores en total, {accounts} con cuenta.', adminUsageDay: 'Día', adminUsageDaily: 'Jugadores diarios (partidas)', adminUsageStarted: 'Partidas iniciadas / jugadores', adminUsageNew: 'Jugadores nuevos (cuentas)', adminUsageNote: 'Días en UTC. Las descargas de la app están en App Store Connect, no aquí.',
    navRequests: '{n} solicitudes de amistad pendientes', navRequests_one: '1 solicitud de amistad pendiente', invitePopKicker: 'Invitación multijugador', invitePopTitle: '¡{name} te invita a jugar!', invitePopCopy: 'Sala {code} · ¿te unes?', invitePopAccept: 'Unirte a la partida de {name}', invitePopDecline: 'Rechazar la invitación de {name}',
    nameLocked: 'Solo puedes cambiar tu nombre una vez cada 30 días.', nameLockedUntil: 'Podrás cambiar tu nombre de nuevo a partir del {date}.', nameOncePerMonth: 'Puedes cambiar tu nombre una vez cada 30 días.', nameChangeConfirm: '¿Cambiar tu nombre a "{name}"? Después no podrás cambiarlo hasta dentro de 30 días.',
    botInRoom: 'Ordenador · {level}',
    tpPointsGained: '{n} puntos más', tpPointsGained_one: '1 punto más', duelYourCard: 'Tu carta',
    orderMoved: '{country} está ahora en el puesto {n}.', orderMoved_one: '{country} está ahora en el puesto 1.',
    orderPartial: '{n} de {total} en su sitio: recibes esa parte de los puntos.', orderPartial_one: '1 de {total} en su sitio: recibes esa parte de los puntos.',
    // pages
    pgExploreLead: '195 países. Toca uno para visitarlo.', pgRankLead: 'Los mismos seis juegos para todos, cada día.', pgScoringLead: 'Seis juegos diarios dan puntos. El resto es por diversión.',
    pgHowLead: 'Cada juego en tres pasos cortos.', pgSourcesLead: 'Cada pregunta se basa en datos abiertos.',
    pgWelcomeBack: '¡Hola de nuevo!', pgSignInCopy: 'Inicia sesión y sigue donde lo dejaste.', pgPassportSave: 'Guarda tus sellos, tu racha y tus puntos en todos tus dispositivos.', pgSeoKicker: 'Gratis · sin cuenta',
    pgGoal_games: '{n} partidas jugadas', pgGoal_games_one: '1 partida jugada', pgGoal_correct: '{n} respuestas correctas', pgGoal_correct_one: '1 respuesta correcta', pgGoal_xp: '{n} XP', pgGoal_xp_one: '1 XP',
    pgGoal_bestStreak: '{n} aciertos seguidos', pgGoal_bestStreak_one: '1 acierto seguido', pgGoal_dailyCount: '{n} días jugados', pgGoal_dailyCount_one: '1 día jugado',
    pgGoal_dailyStreak: 'Racha de {n} días', pgGoal_dailyStreak_one: 'Racha de 1 día', pgGoal_wins: '{n} victorias en sala', pgGoal_wins_one: '1 victoria en sala',
    pgGoal_multiGames: '{n} partidas en grupo', pgGoal_multiGames_one: '1 partida en grupo', pgGoal_perfect: '{n} partidas perfectas', pgGoal_perfect_one: '1 partida perfecta',
    pgGoal_mode: '{n} partidas de {game}', pgGoal_mode_one: '1 partida de {game}',
    // rules (corregido en 1.23: la página de puntos aún describía Rank Radar y Side by Side de antes de la 1.21)
    competitionRankRule: 'Ocho países y ocho temas, cada tema una vez. Cada elección vale hasta 125 puntos: los 125 si es el tema más fuerte de ese país, menos cuanto más se aleje.',
    competitionCompare: 'Quince comparaciones, de fácil a difícil. El primer error termina la partida. Tu puntuación: respuestas correctas ÷ 15 × 1.000.',
  },
};
