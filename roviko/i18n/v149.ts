// Copy for 1.49: the growth dashboard on /admin (owner only). Spread last in messages.ts.
const en = {
  gdTitle: 'Growth', gdUpdated: 'Live from the database · {time}', gdPeriod: 'Period', gdDays: '{n} days', gdShowCharts: 'Show charts', gdShowTable: 'Show as table', gdRefresh: 'Refresh', gdError: 'The numbers could not be loaded.',
  gdPlayers: 'Players ever', gdAccounts: '{n} with an account', gdActiveToday: 'Played today', gdActiveWeekMonth: '7 days: {week} · 30 days: {month}', gdNew: 'New players · {n} days', gdVsBefore: 'vs. the period before',
  gdTime: 'Play time · {n} days', gdHours: '{n} h', gdPerPlayer: '≈ {n} min per player per day', gdGames: 'Games · {n} days', gdReturn: 'Came back the next day', gdReturnWeek: 'within a week: {pct} (of {n} new players)',
  gdDevices: 'Players in the apps', gdDevicesSub: 'iPhone {ios} · Android {android} · web {web}', gdAllTime: 'Play time ever', gdAllGames: '{n} games in all',
  gdChartActive: 'Players per day', gdChartNew: 'New players per day', gdChartTime: 'Play time per day (minutes)', gdChartTop: 'Most played · {n} days',
  gdPf_web: 'Website', gdPf_ios: 'iPhone app', gdPf_android: 'Android app', gdPf_unknown: 'Before measuring', gdMin: 'min', gdPlayersUnit: 'players', gdTotal: 'Total',
  gdDailyPrefix: 'Daily', gdBonusPrefix: 'Bonus tour', gdSurvivalPrefix: 'Survival', gdEmpty: 'No games in this period yet.', gdDate: 'Date', gdNewShort: 'New', gdGamesShort: 'Games',
  gdNote: 'A player counts once they answer a question. Play time is the time to answer, at most two minutes per question. The device is measured from version 1.49; earlier players show as "before measuring". Store downloads themselves are in App Store Connect and the Google Play Console.',
};
const nl: typeof en = {
  gdTitle: 'Groei', gdUpdated: 'Live uit de database · {time}', gdPeriod: 'Periode', gdDays: '{n} dagen', gdShowCharts: 'Toon grafieken', gdShowTable: 'Toon als tabel', gdRefresh: 'Vernieuwen', gdError: 'De cijfers konden niet worden geladen.',
  gdPlayers: 'Spelers ooit', gdAccounts: '{n} met een account', gdActiveToday: 'Vandaag gespeeld', gdActiveWeekMonth: '7 dagen: {week} · 30 dagen: {month}', gdNew: 'Nieuwe spelers · {n} dagen', gdVsBefore: 't.o.v. de periode ervoor',
  gdTime: 'Speeltijd · {n} dagen', gdHours: '{n} uur', gdPerPlayer: '≈ {n} min per speler per dag', gdGames: 'Spellen · {n} dagen', gdReturn: 'Kwam de dag erna terug', gdReturnWeek: 'binnen een week: {pct} (van {n} nieuwe spelers)',
  gdDevices: 'Spelers in de apps', gdDevicesSub: 'iPhone {ios} · Android {android} · web {web}', gdAllTime: 'Speeltijd ooit', gdAllGames: '{n} spellen in totaal',
  gdChartActive: 'Spelers per dag', gdChartNew: 'Nieuwe spelers per dag', gdChartTime: 'Speeltijd per dag (minuten)', gdChartTop: 'Meest gespeeld · {n} dagen',
  gdPf_web: 'Website', gdPf_ios: 'iPhone-app', gdPf_android: 'Android-app', gdPf_unknown: 'Vóór de meting', gdMin: 'min', gdPlayersUnit: 'spelers', gdTotal: 'Totaal',
  gdDailyPrefix: 'Dagspel', gdBonusPrefix: 'Bonustour', gdSurvivalPrefix: 'Overleven', gdEmpty: 'Nog geen spellen in deze periode.', gdDate: 'Datum', gdNewShort: 'Nieuw', gdGamesShort: 'Spellen',
  gdNote: 'Een speler telt zodra hij een vraag beantwoordt. Speeltijd is de tijd tot het antwoord, hooguit twee minuten per vraag. Het apparaat wordt gemeten vanaf versie 1.49; eerdere spelers staan bij "vóór de meting". De downloads zelf staan in App Store Connect en de Google Play Console.',
};
export const v149Messages = { en, nl, es: en } as const;
