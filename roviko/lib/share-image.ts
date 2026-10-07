// A share picture (1.23), drawn in the browser from the share text itself, so every game gets one without
// extra data: "Roviko #12 · Daily Detour", the answer squares, the score line and roviko.app.
// No server, no upload: the PNG only exists on the player's phone until they share it.

const SIZE = 1080;
const COLORS = { forest: '#163B32', deep: '#0f2c25', brand: '#1F806B', mint: '#DDEDE6', gold: '#F6B84B', right: '#3fbf7f', wrong: '#e5484d', medal: '#f2c94c', none: '#c9d3ce', white: '#ffffff' };

type Parsed = { head: string; game: string; rows: string[][]; score: string; streak: string; url: string };

/** Splits a share text from lib/share.ts into its parts. */
export function parseShareText(text: string): Parsed {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const [first = '', ...rest] = lines;
  const [head, ...gameParts] = first.split(' · ');
  const url = rest.find(l => /^https?:\/\//.test(l)) ?? '';
  const rows = rest.filter(l => /^[🟩🟥🟨⬜🥇🥈🥉⚪●○\s]+$/u.test(l)).map(l => Array.from(l.replace(/\s/g, '')));
  const info = rest.find(l => l !== url && !rows.some(r => r.join('') === l.replace(/\s/g, ''))) ?? '';
  const [score, streak = ''] = info.split(' · 🔥 ');
  return { head, game: gameParts.join(' · '), rows, score: score.trim(), streak: streak.trim(), url };
}

const roundRect = (c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); };
const cellColor = (ch: string) => ch === '🟩' || ch === '●' ? COLORS.right : ch === '🟥' || ch === '○' ? COLORS.wrong : ch === '🟨' || ch === '🥇' || ch === '🥈' || ch === '🥉' ? COLORS.medal : COLORS.none;
// Phones only open the share sheet straight after a tap, so drawing must not wait for anything: the logo
// and the font are loaded beforehand (warmShareImage, called when a finish screen appears).
let logo: HTMLImageElement | null = null;
export function warmShareImage() {
  try { if (typeof window === 'undefined') return; if (!logo) { logo = new Image(); logo.decoding = 'async'; logo.src = '/globe-logo.webp'; } void document.fonts?.load('700 80px Fredoka').catch(() => {}); } catch { /* no picture, the text still shares */ }
}
const dataUrlToBlob = (url: string) => { const [meta, data] = url.split(','); const bytes = atob(data), out = new Uint8Array(bytes.length); for (let i = 0; i < bytes.length; i++) out[i] = bytes.charCodeAt(i); return new Blob([out], { type: meta.slice(5, meta.indexOf(';')) }); };

/** Draws the share picture, synchronously; null when the browser cannot draw (old browser, no canvas). */
export function drawShareImage(text: string): Blob | null {
  try {
    const p = parseShareText(text);
    const canvas = document.createElement('canvas'); canvas.width = SIZE; canvas.height = SIZE;
    const c = canvas.getContext('2d'); if (!c) return null;
    const display = (w: number, px: number) => `${w} ${px}px Fredoka, 'Segoe UI', system-ui, sans-serif`;
    // Forest stage with soft halos, like the finish screens and the videos.
    c.fillStyle = COLORS.forest; c.fillRect(0, 0, SIZE, SIZE);
    const halo = (x: number, y: number, r: number, color: string) => { const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, color); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, 0, SIZE, SIZE); };
    halo(880, 180, 420, 'rgba(91,211,168,.30)'); halo(160, 980, 460, 'rgba(246,184,75,.20)');
    // Header: logo + "Roviko #12"
    const icon = logo?.complete && logo.naturalWidth ? logo : null;
    if (icon) c.drawImage(icon, 80, 70, 112, 112);
    c.fillStyle = COLORS.white; c.font = display(700, 64); c.textBaseline = 'middle'; c.fillText(p.head || 'Roviko', icon ? 212 : 80, 128);
    // Game name as a pill
    c.font = display(600, 40);
    const label = p.game.toUpperCase(), lw = Math.min(SIZE - 160, c.measureText(label).width + 64);
    c.fillStyle = 'rgba(255,255,255,.14)'; roundRect(c, 80, 222, lw, 72, 36); c.fill();
    c.fillStyle = COLORS.white; c.fillText(label, 112, 259, lw - 64);
    // The score, huge
    const [big, ...small] = p.score.split(' ');
    const [mine, max] = (big || '').split('/');
    c.font = display(700, mine.length > 6 ? 130 : 180); c.fillStyle = COLORS.gold;
    c.fillText(mine, 80, 430);
    if (max) { const w = c.measureText(mine).width; c.font = display(600, 72); c.fillStyle = 'rgba(255,255,255,.75)'; c.fillText('/' + max, 80 + w + 12, 452); }
    c.font = display(600, 46); c.fillStyle = 'rgba(255,255,255,.85)'; c.fillText(small.join(' '), 84, 540);
    // Answer squares as rounded tiles
    const cells = p.rows.flat(), perRow = Math.min(10, Math.max(5, p.rows[0]?.length ?? 10)), gap = 14;
    const tile = Math.min(76, Math.floor((SIZE - 160 - gap * (perRow - 1)) / perRow));
    cells.forEach((ch, i) => { const x = 80 + (i % perRow) * (tile + gap), y = 610 + Math.floor(i / perRow) * (tile + gap); c.fillStyle = cellColor(ch); roundRect(c, x, y, tile, tile, tile * 0.3); c.fill(); });
    // Streak and address at the bottom
    c.font = display(700, 46); c.fillStyle = COLORS.white;
    if (p.streak) c.fillText('🔥 ' + p.streak, 80, 980);
    c.font = display(600, 40); c.fillStyle = COLORS.mint; c.textAlign = 'right';
    c.fillText((p.url ? new URL(p.url).host : 'roviko.app'), SIZE - 80, 980);
    return dataUrlToBlob(canvas.toDataURL('image/png'));
  } catch { return null; }
}

/**
 * Shares the text with the picture when the phone's share sheet takes files; returns false when it does
 * not (then the caller shares or copies the text as before).
 */
export async function shareWithImage(text: string): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.share || !navigator.canShare) return false;
  const blob = drawShareImage(text); if (!blob) return false;
  const file = new File([blob], 'roviko.png', { type: 'image/png' });
  if (!navigator.canShare({ files: [file] })) return false;
  await navigator.share({ files: [file], text });
  return true;
}
