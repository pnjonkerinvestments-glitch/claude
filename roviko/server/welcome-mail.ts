// The welcome email (1.29): sent right after sign-up, with the button that confirms the email address.
// Plain inline styles and a table layout, so it looks the same in Gmail, Outlook and Apple Mail; a text
// version goes along for clients that do not show HTML. No tracking pixels, no external fonts.

export type MailLocale = 'en' | 'nl' | 'es';
type Copy = { subject: string; hello: string; lead: string; body: string; button: string; why: string; code: string; codeNote: string; bye: string; footer: string };

const COPY: Record<MailLocale, Copy> = {
  nl: {
    subject: 'Welkom bij Roviko! Bevestig je e-mailadres 🌍',
    hello: 'Hoi {name},',
    lead: 'Welkom bij Roviko! Fijn dat je erbij bent.',
    body: 'Elke dag staan er zes korte aardrijkskundespellen voor je klaar, met voor iedereen dezelfde vragen. Haal tot 6.000 punten per dag, bouw je reeks op en daag je vrienden uit.',
    button: 'Bevestig mijn e-mailadres',
    why: 'Met een bevestigd adres kun je je wachtwoord altijd herstellen als je het vergeet.',
    code: 'Je vriendcode',
    codeNote: 'Deel hem, dan kunnen vrienden je toevoegen en uitnodigen voor een potje.',
    bye: 'Tot morgen bij de Daily Detour!',
    footer: 'Heb je geen account bij Roviko aangemaakt? Dan kun je deze e-mail negeren. De bevestigingslink werkt 48 uur.',
  },
  en: {
    subject: 'Welcome to Roviko! Please confirm your email 🌍',
    hello: 'Hi {name},',
    lead: 'Welcome to Roviko! Great to have you on board.',
    body: 'Every day six short geography games are waiting for you, with the same questions for everyone. Score up to 6,000 points a day, build your streak and challenge your friends.',
    button: 'Confirm my email address',
    why: 'With a confirmed address you can always reset your password if you forget it.',
    code: 'Your friend code',
    codeNote: 'Share it so friends can add you and invite you to a match.',
    bye: 'See you tomorrow on the Daily Detour!',
    footer: 'Did not create a Roviko account? Then you can ignore this email. The confirmation link works for 48 hours.',
  },
  es: {
    subject: '¡Bienvenido a Roviko! Confirma tu correo 🌍',
    hello: 'Hola, {name}:',
    lead: '¡Te damos la bienvenida a Roviko! Nos alegra tenerte aquí.',
    body: 'Cada día te esperan seis juegos cortos de geografía, con las mismas preguntas para todos. Consigue hasta 6.000 puntos al día, mantén tu racha y reta a tus amigos.',
    button: 'Confirmar mi correo',
    why: 'Con un correo confirmado siempre podrás recuperar tu contraseña si la olvidas.',
    code: 'Tu código de amistad',
    codeNote: 'Compártelo para que tus amigos te añadan y te inviten a una partida.',
    bye: '¡Hasta mañana en la Ruta diaria!',
    footer: '¿No has creado una cuenta en Roviko? Puedes ignorar este correo. El enlace de confirmación funciona durante 48 horas.',
  },
};

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** The welcome email as subject, HTML and text. `origin` is the site address, for the logo and the link. */
export function welcomeMail(locale: MailLocale, input: { name: string; friendCode: string; link: string; origin: string }) {
  const c = COPY[locale] ?? COPY.en;
  const hello = c.hello.replace('{name}', input.name);
  const text = [hello, '', c.lead, '', c.body, '', c.button + ':', input.link, '', c.why, '', c.code + ': ' + input.friendCode, c.codeNote, '', c.bye, 'Roviko', '', c.footer].join('\n');
  const html = `<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${esc(c.subject)}</title></head>
<body style="margin:0;padding:0;background:#f5f0e3;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0e3;"><tr><td align="center" style="padding:28px 14px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:24px;overflow:hidden;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#163b32;">
<tr><td align="center" style="background:#163b32;padding:30px 24px 26px;">
<img src="${input.origin}/icon-192.png" width="72" height="72" alt="Roviko" style="display:block;border:0;border-radius:18px;">
<div style="margin-top:12px;font-size:26px;font-weight:800;color:#ffffff;letter-spacing:.3px;">Roviko</div>
</td></tr>
<tr><td style="padding:28px 28px 8px;font-size:16px;line-height:1.55;">
<p style="margin:0 0 14px;font-size:20px;font-weight:800;">${esc(hello)}</p>
<p style="margin:0 0 12px;font-weight:700;">${esc(c.lead)}</p>
<p style="margin:0 0 22px;">${esc(c.body)}</p>
<table role="presentation" cellpadding="0" cellspacing="0" align="center"><tr><td align="center" style="border-radius:999px;background:#1f806b;">
<a href="${esc(input.link)}" style="display:inline-block;padding:15px 30px;font-size:17px;font-weight:800;color:#ffffff;text-decoration:none;border-radius:999px;">${esc(c.button)}</a>
</td></tr></table>
<p style="margin:18px 0 22px;font-size:14px;color:#4b635b;text-align:center;">${esc(c.why)}</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#e3f1ea;border-radius:18px;"><tr><td style="padding:16px 18px;">
<div style="font-size:12px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:#1f806b;">${esc(c.code)}</div>
<div style="margin:4px 0 6px;font-size:24px;font-weight:800;letter-spacing:3px;">${esc(input.friendCode)}</div>
<div style="font-size:14px;color:#4b635b;">${esc(c.codeNote)}</div>
</td></tr></table>
<p style="margin:22px 0 4px;font-weight:700;">${esc(c.bye)}</p>
<p style="margin:0 0 24px;">Roviko 🌍</p>
</td></tr>
<tr><td style="padding:16px 28px 24px;border-top:1px solid #eee6d2;font-size:12px;line-height:1.5;color:#7a8a84;">
${esc(c.footer)}<br><a href="${input.origin}" style="color:#1f806b;">${esc(input.origin.replace(/^https?:\/\//, ''))}</a>
</td></tr>
</table></td></tr></table></body></html>`;
  return { subject: c.subject, text, html };
}

/** The language for the email: what the app sent at sign-up, else the browser's first language. */
export function mailLocale(requested: unknown, acceptLanguage: string | null): MailLocale {
  if (requested === 'nl' || requested === 'es' || requested === 'en') return requested;
  const first = (acceptLanguage ?? '').split(',')[0].trim().slice(0, 2).toLowerCase();
  return first === 'nl' || first === 'es' ? first : 'en';
}
