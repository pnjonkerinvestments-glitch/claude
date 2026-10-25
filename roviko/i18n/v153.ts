// Copy for 1.53: the host's "Everyone ready?" note in the waiting room, and Lucia's room that waits for Ready.
// Spread last in messages.ts.
const en = {
  nudgeButton: 'Everyone ready? 👋', nudgeSays: 'Everyone ready? 👋', nudgeFrom: '{name} asks',
  nudgeSent: 'Sent to everyone', luciaWaitsReady: 'Lucia 👽 starts as soon as you are ready.',
};
const nl: typeof en = {
  nudgeButton: 'Iedereen klaar? 👋', nudgeSays: 'Iedereen klaar? 👋', nudgeFrom: '{name} vraagt',
  nudgeSent: 'Verstuurd naar iedereen', luciaWaitsReady: 'Lucia 👽 begint zodra jij klaar bent.',
};
const es: typeof en = {
  nudgeButton: '¿Todos listos? 👋', nudgeSays: '¿Todos listos? 👋', nudgeFrom: '{name} pregunta',
  nudgeSent: 'Enviado a todos', luciaWaitsReady: 'Lucia 👽 empieza en cuanto estés listo.',
};
export const v153Messages = { en, nl, es };
