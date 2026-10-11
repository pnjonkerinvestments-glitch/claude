// 1.40: sharp continent pictures for cards, Learn and the passport: each continent as a soft vector map
// (its countries in mint and green on a pale sea, the rest of the world in sand), drawn from the licensed
// boundaries file the game already uses. Run: node scripts/make-continent-art.mjs → public/art/map-<slug>.svg
import fs from 'node:fs';
const world = JSON.parse(fs.readFileSync('public/data/boundaries.json', 'utf8'));
const countries = JSON.parse(fs.readFileSync('public/data/countries.json', 'utf8'));
const region = new Map(countries.map(c => [c.id, c.region]));
const W = 1440, H = 600; // 2.4 : 1, like the old banners
const FRAMES = {
  europe: { region: 'Europe', box: [-26, 33, 46, 72] },
  africa: { region: 'Africa', box: [-26, -36, 60, 38] },
  asia: { region: 'Asia', box: [24, -12, 150, 56] },
  'north-america': { region: 'North America', box: [-170, 5, -50, 74] },
  'south-america': { region: 'South America', box: [-95, -57, -25, 14] },
  oceania: { region: 'Oceania', box: [108, -50, 215, 16], wrap: true },
  americas: { region: ['North America', 'South America'], box: [-170, -57, -25, 74] },
};
const GREENS = ['#9ed6b9', '#86cba7', '#b4e0c8', '#74c29a', '#a9dbc0', '#c3e7d3'];
// Roviko touches on the open sea at both sides: a compass rose, a dotted flight route with a little plane, sparkles.
const spark = (x, y, r, c) => `<path transform="translate(${x} ${y}) scale(${r / 12})" d="M0 -11l2.3 7.2 7.2 2.3-7.2 2.3L0 11l-2.3-7.2L-9.5 1.5l7.2-2.3z" fill="${c}"/>`;
const DECOR = `<g opacity=".95">
<g transform="translate(150 455)"><circle r="62" fill="#ffffff" opacity=".75"/><circle r="50" fill="none" stroke="#1f806b" stroke-opacity=".35" stroke-width="3" stroke-dasharray="3 7"/>
<path d="M0 -46 L10 0 L0 46 L-10 0Z" fill="#163b32"/><path d="M0 -46 L10 0 L-10 0Z" fill="#e0553f"/><path d="M-46 0 L0 -8 L46 0 L0 8Z" fill="#163b32" opacity=".55"/><circle r="6" fill="#ffffff" stroke="#163b32" stroke-width="2.5"/></g>
<path d="M1140 470 C 1220 380, 1250 250, 1330 150" fill="none" stroke="#1f806b" stroke-opacity=".45" stroke-width="4" stroke-dasharray="2 12" stroke-linecap="round"/>
<g transform="translate(1338 136) rotate(-35)"><path d="M-30 0 L22 -4 Q34 0 22 4 Z" fill="#ffffff" stroke="#163b32" stroke-width="2.5" stroke-linejoin="round"/><path d="M-2 -3 L-14 -24 L-4 -24 L12 -3Z M-2 3 L-14 24 L-4 24 L12 3Z" fill="#2f6fb3" stroke="#163b32" stroke-width="2.2" stroke-linejoin="round"/><path d="M-28 -1 L-36 -12 L-30 -12 L-22 -1Z" fill="#2f6fb3" stroke="#163b32" stroke-width="2" stroke-linejoin="round"/></g>
${spark(110, 120, 16, '#f6b84b')}${spark(1290, 470, 12, '#f6b84b')}${spark(1220, 95, 9, '#1f806b')}${spark(250, 330, 9, '#1f806b')}
</g>`;
const hash = s => { let h = 7; for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; };
for (const [slug, f] of Object.entries(FRAMES)) {
  const wrap = x => f.wrap && x < 0 ? x + 360 : x;
  const [w0, s0, e0, n0] = f.box, k = Math.cos((s0 + n0) / 2 * Math.PI / 180);
  // Fit the whole continent into the middle (contain), so square and wide crops both show all of it.
  const CW = 860, CH = 540;
  const bw = (e0 - w0) * k, bh = n0 - s0, scale = Math.min(CW / bw, CH / bh);
  const ox = (W - bw * scale) / 2, oy = (H - bh * scale) / 2;
  const px = lon => ox + (wrap(lon) - w0) * k * scale, py = lat => oy + (n0 - lat) * scale;
  const tol = 2.2;
  const path = polys => {
    let d = '';
    for (const poly of polys) for (const ring of poly) {
      let last = null, part = '', n = 0, minx = 1e9, maxx = -1e9, miny = 1e9, maxy = -1e9;
      for (const [lon, lat] of ring) {
        const x = px(lon), y = py(lat);
        minx = Math.min(minx, x); maxx = Math.max(maxx, x); miny = Math.min(miny, y); maxy = Math.max(maxy, y);
        if (last && Math.abs(x - last[0]) < tol && Math.abs(y - last[1]) < tol) continue;
        part += (last ? 'L' : 'M') + Math.round(x) + ' ' + Math.round(y); last = [x, y]; n++;
      }
      if (maxx < -50 || minx > W + 50 || maxy < -50 || miny > H + 50) continue;
      if (n > 2 && (maxx - minx > 4 || maxy - miny > 4)) d += part + 'Z';
    }
    return d;
  };
  let other = '', mine = '';
  for (const [id, polys] of Object.entries(world)) {
    const d = path(polys); if (!d) continue;
    if ([f.region].flat().includes(region.get(id))) mine += `<path d="${d}" fill="${GREENS[hash(id) % GREENS.length]}"/>`;
    else other += d;
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<defs><linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e4f2f8"/><stop offset="1" stop-color="#cfe6f1"/></linearGradient>
<pattern id="dots" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.6" fill="#ffffff" opacity=".55"/></pattern>
<filter id="lift" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy="6" stdDeviation="7" flood-color="#1f806b" flood-opacity=".22"/></filter></defs>
<rect width="${W}" height="${H}" fill="url(#sea)"/><rect width="${W}" height="${H}" fill="url(#dots)"/>
<path d="${other}" fill="#f1ecdd" stroke="#e3dcc6" stroke-width="1.2" stroke-linejoin="round"/>
<g filter="url(#lift)" stroke="#ffffff" stroke-width="2.4" stroke-linejoin="round">${mine}</g>
${DECOR}
</svg>`;
  fs.writeFileSync(`public/art/map-${slug}.svg`, svg);
  console.log(slug, Math.round(svg.length / 1024) + ' KB');
}
