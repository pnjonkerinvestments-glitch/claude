// Makes heavy flags light. Flags with detailed coats of arms are 40-180 KB as vector files, which
// shows as a visible delay the first time such a flag appears in a game. For every flag above the
// threshold this script renders the original flag-icons SVG once at 640 px and wraps that WebP in an
// SVG with the same 4:3 viewBox, so every existing /flags/xx.svg path keeps working unchanged.
// Simple flags stay pure vector (they are already a few hundred bytes). Run: node scripts/optimize-flags.mjs
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import sharp from 'sharp';

const SOURCE = 'node_modules/flag-icons/flags/4x3';
const TARGET = 'public/flags';
const THRESHOLD = 8 * 1024;
// Vector paths this large take noticeable time to draw on phones, even when they download quickly.
const HEAVY_TO_DRAW = 60 * 1024;
const gz = (b) => zlib.gzipSync(b, { level: 9 }).length;
let before = 0, after = 0, converted = 0;
for (const file of fs.readdirSync(TARGET).filter(f => f.endsWith('.svg'))) {
  const original = path.join(SOURCE, file);
  if (!fs.existsSync(original)) continue;
  const svg = fs.readFileSync(original);
  if (svg.length <= THRESHOLD) continue;
  const webp = await sharp(svg, { density: 300 }).resize({ width: 640, height: 480, fit: 'fill' }).webp({ quality: 82, effort: 6 }).toBuffer();
  const wrapped = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480"><image width="640" height="480" href="data:image/webp;base64,${webp.toString('base64')}"/></svg>\n`;
  // Servers send SVG gzipped: only swap when the compressed transfer really gets smaller, or drawing is heavy.
  if (gz(Buffer.from(wrapped)) >= gz(svg) * 0.8 && svg.length < HEAVY_TO_DRAW) continue;
  before += gz(svg); after += gz(Buffer.from(wrapped)); converted++;
  fs.writeFileSync(path.join(TARGET, file), wrapped);
}
console.log(`${converted} flags converted, compressed transfer ${Math.round(before / 1024)} KB -> ${Math.round(after / 1024)} KB`);
