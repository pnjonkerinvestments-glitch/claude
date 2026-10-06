// Flags in their real proportions (1.22). Source: the public-domain Wikipedia renders collected in
// svg-country-flags 1.2.10 (github.com/hjnilsson/country-flags), first run through svgo
// (multipass, floatPrecision 2). Usage: node scripts/import-flags.mjs <folder with the optimised xx.svg files>
// Every existing /flags/xx.svg path keeps working; only the drawing (and its viewBox) changes.
// Flags with a detailed coat of arms stay heavy as vectors, so above the threshold the flag is rendered once
// as a sharp 960 px WebP and wrapped in an SVG with the same viewBox (as scripts/optimize-flags.mjs did before).
// Afterwards public/flags/png/ is rebuilt at 480 × 360 (fit inside, real proportions).
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import sharp from 'sharp';

const SOURCE = process.argv[2];
if (!SOURCE) throw new Error('usage: node scripts/import-flags.mjs <folder>');
const TARGET = 'public/flags';
const HEAVY = 40 * 1024;
const gz = (b) => zlib.gzipSync(b, { level: 9 }).length;
let vector = 0, raster = 0;
for (const file of fs.readdirSync(TARGET).filter(f => f.endsWith('.svg'))) {
  const svg = fs.readFileSync(path.join(SOURCE, file));
  const viewBox = /viewBox="([^"]+)"/.exec(svg.toString())?.[1];
  if (!viewBox) throw new Error(file + ' has no viewBox');
  let out = svg;
  if (svg.length > HEAVY) {
    const [, , w, h] = viewBox.split(/[\s,]+/).map(Number);
    const meta = await sharp(svg, { density: 72, limitInputPixels: false }).metadata();
    const density = Math.min(2400, Math.max(1, 72 * 960 / meta.width));
    const webp = await sharp(svg, { density, limitInputPixels: false }).resize({ width: 960 }).webp({ quality: 86, effort: 6 }).toBuffer();
    const [x, y] = viewBox.split(/[\s,]+/).map(Number);
    const wrapped = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}"><image x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="none" href="data:image/webp;base64,${webp.toString('base64')}"/></svg>\n`);
    if (gz(wrapped) < gz(svg)) { out = wrapped; raster++; } else vector++;
  } else vector++;
  fs.writeFileSync(path.join(TARGET, file), out);
}
const countries = JSON.parse(fs.readFileSync('public/data/countries.json', 'utf8'));
for (const c of countries) {
  const file = 'public' + c.flag;
  const meta = await sharp(file, { density: 72, limitInputPixels: false }).metadata();
  const density = Math.min(2400, Math.max(1, 72 * 960 / Math.max(meta.width, meta.height * 4 / 3)));
  await sharp(file, { density, limitInputPixels: false }).resize(480, 360, { fit: 'inside' }).png({ compressionLevel: 9 }).toFile('public/flags/png/' + c.iso2 + '.png');
}
console.log(`${vector} vector flags, ${raster} detailed flags as WebP, ${countries.length} PNGs`);
