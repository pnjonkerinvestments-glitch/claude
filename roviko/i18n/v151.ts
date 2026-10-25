// Copy for 1.51: the daily reminder by email for website players (Settings, the offer after a daily game, the
// unsubscribe answer) and the count on /admin. Spread last in messages.ts.
const en = {
  mailReminderTitle: 'Reminder by email', mailReminderCopy: 'One email on days you have not played yet, when your streak would end tonight.',
  mailReminderOnCopy: 'On. At most one email a day, only when your streak would end tonight. Every email has a link to turn it off.',
  mailReminderGuest: 'With a free account you can get an email when your streak would end tonight.', mailReminderVerify: 'Confirm your email address first, then you can turn it on.', mailReminderVerifyCta: 'Confirm',
  mailReminderOff: 'Done. You will not get reminder emails any more.', mailReminderExpired: 'This link no longer works. You can turn the reminder off here.',
  remindMailCopy: 'Shall Roviko send you an email when your streak would end tonight?', remindMailOn: 'Done. At most one email a day. Every email has a link to turn it off.', remindMailFailed: 'That did not work. You can turn it on in Settings.',
  gdMail: 'Reminder emails', gdMailSub: '{on} players have it on · {week} sent in 7 days',
};
const nl: typeof en = {
  mailReminderTitle: 'Herinnering per e-mail', mailReminderCopy: 'Eén mailtje op dagen dat je nog niet speelde, als je reeks vannacht zou aflopen.',
  mailReminderOnCopy: 'Aan. Hooguit één mail per dag, alleen als je reeks vannacht zou aflopen. Onder elke mail staat een link om hem uit te zetten.',
  mailReminderGuest: 'Met een gratis account krijg je een mailtje als je reeks vannacht zou aflopen.', mailReminderVerify: 'Bevestig eerst je e-mailadres, dan kun je hem aanzetten.', mailReminderVerifyCta: 'Bevestigen',
  mailReminderOff: 'Gedaan. Je krijgt geen herinneringsmails meer.', mailReminderExpired: 'Deze link werkt niet meer. Je kunt de herinnering hier uitzetten.',
  remindMailCopy: 'Zal Roviko je een mailtje sturen als je reeks vannacht zou aflopen?', remindMailOn: 'Gedaan. Hooguit één mail per dag. Onder elke mail staat een link om hem uit te zetten.', remindMailFailed: 'Dat lukte niet. Aanzetten kan in Instellingen.',
  gdMail: 'Herinneringsmails', gdMailSub: '{on} spelers hebben hem aan · {week} verstuurd in 7 dagen',
};
const es: typeof en = {
  mailReminderTitle: 'Recordatorio por correo', mailReminderCopy: 'Un correo los días que aún no has jugado, si tu racha terminaría esta noche.',
  mailReminderOnCopy: 'Activado. Como mucho un correo al día, solo si tu racha terminaría esta noche. Cada correo tiene un enlace para desactivarlo.',
  mailReminderGuest: 'Con una cuenta gratuita recibes un correo si tu racha terminaría esta noche.', mailReminderVerify: 'Confirma primero tu correo y después podrás activarlo.', mailReminderVerifyCta: 'Confirmar',
  mailReminderOff: 'Listo. Ya no recibirás correos de recordatorio.', mailReminderExpired: 'Este enlace ya no funciona. Puedes desactivar el recordatorio aquí.',
  remindMailCopy: '¿Quieres que Roviko te envíe un correo si tu racha terminaría esta noche?', remindMailOn: 'Listo. Como mucho un correo al día. Cada correo tiene un enlace para desactivarlo.', remindMailFailed: 'No ha funcionado. Puedes activarlo en Ajustes.',
  gdMail: 'Correos de recordatorio', gdMailSub: '{on} jugadores lo tienen activado · {week} enviados en 7 días',
};
export const v151Messages = { en, nl, es };
