/*
  Roviko short 11: "If countries had a group chat"
  15.8 s, 1080x1920, 120 BPM ("Life is a Dream", Mixkit, from song beat 48). Six countries post in "Countries (195)", each one
  a joke about a true fact: Canada says sorry, Australia's spider, neutral Switzerland, Russia's 11 time zones, the Vatican you can
  walk around before lunch, and the Dutch splitting the bill. Roviko joins the group and laughs. "Which country are you?"
*/
const TEMPO = 119.998, DIL = TEMPO / 130, END = 32, DURATION = END * 60 / TEMPO;
const TL = { head: -0.6, msg: [-0.2, 3.2, 6.4, 9.6, 12.8, 16], join: 19, cap2: 21.4, end: 25, hop: 29, blink2: 27.4 };
setupStage(C.cream);
const world = el(stage, { width: 1080, height: 1920, zIndex: 1 });
const uiL = el(stage, { width: 1080, height: 1920, zIndex: 20 });
const capL = el(stage, { width: 1080, height: 1920, zIndex: 50 });
Halo(world, 540, 900, 1700);
const head = Tag(uiL, '🌍  Countries (195 members)', { bg: C.forest, fg: C.white, font: 'Fredoka', weight: 600, size: 34, h: 72, ls: '0' });
centreX(head, 372);
const MSGS = [
  { flag: 'ca', name: 'Canada', text: 'Sorry, sorry, is this the right chat? 🙏' },
  { flag: 'au', name: 'Australia', text: 'A spider just stole my phone 🕷️' },
  { flag: 'ch', name: 'Switzerland', text: 'I’m staying neutral on this one 😐' },
  { flag: 'ru', name: 'Russia', text: 'Good morning! ☀️ And good night! 🌙' },
  { flag: 'va', name: 'Vatican City', text: 'I walked around my whole country today 🚶' },
  { flag: 'nl', name: 'Netherlands', text: 'Can we split the bill? 🧾' },
];
const msgs = MSGS.map((m, i) => FlagMsg(uiL, { ...m, x: 70, y: 470 + i * 138, size: 34 }));
const joined = Tag(uiL, 'Roviko joined the group 👋', { bg: C.mint, fg: C.forest, size: 26, h: 56 });
centreX(joined, 1305);
const MX = 870, MY = 1330, MR = 70;
const mBox = el(uiL, { left: MX - MR * 1.7, top: MY - MR * 1.7, width: MR * 3.4, height: MR * 3.4, zIndex: 30 });
const mascot = Mascot(mBox, MR * 3.4); S(mascot.svg, { left: 0, top: 0 });
const cap1 = Caption(capL, ['If countries had', 'a <b>group chat</b> 💬'], { cy: 236, size: 60 });
const cap2 = Caption(capL, ['Which country are <b>you</b>', 'in the group chat? 👇'], { cy: 236, size: 58 });
const endCard = EndCard(stage, { my: 690, tagline: 'Meet the whole group chat.' });

ev(0.02, 'pop', -12, { rate: 1.1 });

TL.msg.forEach((b, i) => { ev(Math.max(0.1, b + 0.05), 'mention', -6, { rate: 0.95 + i * 0.04 }); ev(b + 1.2, 'boing', -12, { rate: 1 + i * 0.05 }); });
ev(TL.join + 0.05, 'join', -6);
ev(TL.cap2 + 0.1, 'mention', -7);
ev(TL.end + 0.1, 'swoosh', -7); ev(TL.end + 0.35, 'sparkle', -7); ev(TL.end + 0.7, 'expand', -10);

function seek(tReal) {
  const t = clamp(tReal, 0, DURATION) * DIL, b = t / BEAT;
  HALOS[0].img.style.transform = `rotate(${20 + t * 14}deg)`;
  const out = k => segB(t, TL.end - 0.6 + k * 0.03, TL.end - 0.2 + k * 0.03, E.lin);
  popIn(head, t, TL.head); if (b > TL.end - 0.4) show(head, false);
  msgs.forEach((m, i) => m.set(spB(t, TL.msg[i], 2.4, 0.62), out(i)));
  const jp = spB(t, TL.join, 2.6, 0.55) * (1 - E.inBack(out(7))); S(joined, { transform: `scale(${jp})` }); show(joined, jp > 0.001);
  // Roviko pops in when he joins, before that he only peeks from the corner and giggles at every message
  const mp = spB(t, TL.join - 0.2, 2.2, 0.6);
  S(mBox, { transform: `translateY(${lerp(120, 0, clamp(mp, 0, 1.1))}px)` });
  const laugh = TL.msg.some(mb => b >= mb + 1.0 && b < mb + 2.2) || (b >= TL.join + 0.5 && b < TL.cap2);
  const s = Math.sin(t * 30) * 4;
  drawMascot(mascot, { look: [-0.9, -0.5], happy: laugh ? 1 : 0, mouth: laugh ? 'grin' : 'smile', cheeks: laugh ? 1 : 0.3, legs: 1,
    hop: laugh ? -Math.abs(Math.sin(t * 15)) * 8 : bop(b, 5), arms: laugh ? [[-40, 70 + s, -20, 11], [40, 70 - s, -20, 11]] : b >= TL.join && b < TL.join + 2 ? [[-112, 66, 22, 10], [118 + 6 * Math.sin(t * 11), -86, -18, 10]] : [[-112, 66, 22, 10], [112, 66, 22, 10]],
    blink: laugh ? 0 : blinkAt(t, [5.6, 14.2, 23.1]) });
  show(mBox, b < TL.end + 0.4);
  cap1.set(spB(t, -1.5, 1.9, 0.62), segB(t, TL.cap2 - 0.2, TL.cap2 + 0.15));
  cap2.set(spB(t, TL.cap2, 1.9, 0.62), segB(t, TL.end - 0.05, TL.end + 0.2));
  endCard.update(t, TL.end, [MX, MY], { hops: [TL.hop], blinks: [TL.blink2] });
}
boot(seek, DURATION);
