// Roviko's sound: short synthesised effects and an optional, very quiet background tune.
// Everything is generated with Web Audio, so there are no audio files to download or license.
// Browsers only allow sound after a tap, so music starts from a user action (the settings switch
// or the first tap on a page when the player had it switched on before).

let ctx: AudioContext | undefined;
function audio() { ctx ??= new AudioContext(); void ctx.resume(); return ctx; }

type Note = { f: number; at: number; len: number; type?: OscillatorType; vol?: number };
function play(notes: Note[], master = 1) {
  const c = audio(), t0 = c.currentTime;
  for (const n of notes) {
    const osc = c.createOscillator(), gain = c.createGain();
    osc.type = n.type ?? 'triangle';
    osc.frequency.setValueAtTime(n.f, t0 + n.at);
    const v = (n.vol ?? .05) * master;
    gain.gain.setValueAtTime(0.0001, t0 + n.at);
    gain.gain.exponentialRampToValueAtTime(v, t0 + n.at + .015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + n.at + n.len);
    osc.connect(gain).connect(c.destination);
    osc.start(t0 + n.at); osc.stop(t0 + n.at + n.len + .05);
  }
}

export type Effect = 'correct' | 'incorrect' | 'countdown' | 'win' | 'tap';
/** Short, soft effects: a rising two-note chime for right, a low muted note for wrong. */
export function effect(type: Effect) {
  try {
    if (type === 'correct') play([{ f: 659.25, at: 0, len: .16 }, { f: 987.77, at: .09, len: .28 }]);
    else if (type === 'incorrect') play([{ f: 196, at: 0, len: .26, type: 'sine', vol: .06 }, { f: 174.61, at: .08, len: .3, type: 'sine', vol: .045 }]);
    else if (type === 'countdown') play([{ f: 523.25, at: 0, len: .12, type: 'sine', vol: .04 }]);
    else if (type === 'tap') play([{ f: 880, at: 0, len: .06, type: 'sine', vol: .02 }]);
    else play([{ f: 523.25, at: 0, len: .22 }, { f: 659.25, at: .1, len: .22 }, { f: 783.99, at: .2, len: .22 }, { f: 1046.5, at: .3, len: .5 }]);
  } catch { /* no audio available */ }
}

// Background music: a slow four-chord loop (Cmaj7 · Am7 · Fmaj7 · G6) as soft pads with a light
// arpeggio on top. About 0.02 volume: it sits under the game, never over it.
const CHORDS = [[261.63, 329.63, 392, 493.88], [220, 261.63, 329.63, 392], [174.61, 220, 261.63, 329.63], [196, 246.94, 293.66, 329.63]];
const BAR = 4.8;
let timer: ReturnType<typeof setInterval> | undefined, bar = 0, bus: GainNode | undefined;

function scheduleBar() {
  const c = audio(); if (!bus) return;
  const chord = CHORDS[bar++ % CHORDS.length], t0 = c.currentTime + .05;
  for (const f of chord) {
    const osc = c.createOscillator(), gain = c.createGain();
    osc.type = 'sine'; osc.frequency.value = f / 2;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.linearRampToValueAtTime(.18, t0 + 1.2);
    gain.gain.linearRampToValueAtTime(0.0001, t0 + BAR + .6);
    osc.connect(gain).connect(bus); osc.start(t0); osc.stop(t0 + BAR + .7);
  }
  // A gentle arpeggio: every other beat, going up the chord.
  chord.forEach((f, i) => {
    const osc = c.createOscillator(), gain = c.createGain(), at = t0 + .6 + i * 1.1;
    osc.type = 'triangle'; osc.frequency.value = f;
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(.12, at + .02);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + .9);
    osc.connect(gain).connect(bus!); osc.start(at); osc.stop(at + 1);
  });
}

export function musicPlaying() { return !!timer; }
export function startMusic() {
  try {
    if (timer) return;
    const c = audio();
    bus = c.createGain(); bus.gain.value = 0.11;
    const soft = c.createBiquadFilter(); soft.type = 'lowpass'; soft.frequency.value = 1800;
    bus.connect(soft).connect(c.destination);
    bar = 0; scheduleBar();
    timer = setInterval(() => { if (document.visibilityState === 'visible') scheduleBar(); }, BAR * 1000);
  } catch { /* no audio available */ }
}
export function stopMusic() {
  if (timer) clearInterval(timer);
  timer = undefined;
  try { bus?.gain.setTargetAtTime(0, audio().currentTime, .3); } catch { /* ignore */ }
  bus = undefined;
}
