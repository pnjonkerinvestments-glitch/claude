// Copy for 1.51: the daily reminder by email for website players (Settings, the offer after a daily game, the
// unsubscribe answer) and the count on /admin. Spread last in messages.ts.
const en = {
  mailReminderTitle: 'Reminder by email', mailReminderCopy: 'An email when you skipped a day. Stay away longer and we email less and less, and after a month we stop.',
  mailReminderOnCopy: 'On. At most one email a day, fewer when you stay away, none after a month. Every email has a link to turn it off.',
  mailReminderGuest: 'With a free account you get an email when you skipped a day.', mailReminderVerify: 'Confirm your email address first, then you can turn it on.', mailReminderVerifyCta: 'Confirm',
  mailReminderOff: 'Done. You will not get reminder emails any more.', mailReminderExpired: 'This link no longer works. You can turn the reminder off here.',
  remindMailCopy: 'Shall Roviko send you an email when you skip a day?', remindMailOn: 'Done. At most one a day, and fewer when you stay away. Every email has a link to turn it off.', remindMailFailed: 'That did not work. You can turn it on in Settings.',
  gdMail: 'Reminder emails', gdMailSub: '{on} players have it on · {week} sent in 7 days',
};
const nl: typeof en = {
  mailReminderTitle: 'Herinnering per e-mail', mailReminderCopy: 'Een mailtje als je een dag niet speelde. Blijf je langer weg, dan mailen we steeds minder vaak, en na een maand stoppen we.',
  mailReminderOnCopy: 'Aan. Hooguit één mail per dag, minder vaak als je wegblijft, en na een maand niet meer. Onder elke mail staat een link om hem uit te zetten.',
  mailReminderGuest: 'Met een gratis account krijg je een mailtje als je een dag niet speelde.', mailReminderVerify: 'Bevestig eerst je e-mailadres, dan kun je hem aanzetten.', mailReminderVerifyCta: 'Bevestigen',
  mailReminderOff: 'Gedaan. Je krijgt geen herinneringsmails meer.', mailReminderExpired: 'Deze link werkt niet meer. Je kunt de herinnering hier uitzetten.',
  remindMailCopy: 'Zal Roviko je een mailtje sturen als je een dag niet speelt?', remindMailOn: 'Gedaan. Hooguit één per dag, en minder vaak als je wegblijft. Onder elke mail staat een link om hem uit te zetten.', remindMailFailed: 'Dat lukte niet. Aanzetten kan in Instellingen.',
  gdMail: 'Herinneringsmails', gdMailSub: '{on} spelers hebben hem aan · {week} verstuurd in 7 dagen',
};
const es: typeof en = {
  mailReminderTitle: 'Recordatorio por correo', mailReminderCopy: 'Un correo si te saltas un día. Si tardas más en volver, te escribimos cada vez menos, y al mes paramos.',
  mailReminderOnCopy: 'Activado. Como mucho un correo al día, menos si no vuelves, y ninguno después de un mes. Cada correo tiene un enlace para desactivarlo.',
  mailReminderGuest: 'Con una cuenta gratuita recibes un correo si te saltas un día.', mailReminderVerify: 'Confirma primero tu correo y después podrás activarlo.', mailReminderVerifyCta: 'Confirmar',
  mailReminderOff: 'Listo. Ya no recibirás correos de recordatorio.', mailReminderExpired: 'Este enlace ya no funciona. Puedes desactivar el recordatorio aquí.',
  remindMailCopy: '¿Quieres que Roviko te envíe un correo si te saltas un día?', remindMailOn: 'Listo. Como mucho uno al día, y menos si no vuelves. Cada correo tiene un enlace para desactivarlo.', remindMailFailed: 'No ha funcionado. Puedes activarlo en Ajustes.',
  gdMail: 'Correos de recordatorio', gdMailSub: '{on} jugadores lo tienen activado · {week} enviados en 7 días',
};
export const v151Messages = { en, nl, es };
