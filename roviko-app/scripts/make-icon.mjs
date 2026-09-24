// Builds the 1024px store icon and splash artwork from the Roviko mascot (1.16 style).
// App Store icons must be square and fully opaque, so the mascot sits on a warm cream-to-mint wash.
import sharp from 'sharp';
const mascot = '../roviko/public/icon-512.png';
const wash = (size, dark = false) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><defs><radialGradient id="g" cx="50%" cy="42%" r="70%"><stop offset="0" stop-color="${dark ? '#1f4a3f' : '#ffffff'}"/><stop offset=".55" stop-color="${dark ? '#163b32' : '#f6f3e9'}"/><stop offset="1" stop-color="${dark ? '#10302a' : '#ddede6'}"/></radialGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>`);
async function compose(out, size, mascotSize, dark = false) {
  const m = await sharp(mascot).resize(mascotSize, mascotSize, { kernel: 'lanczos3' }).png().toBuffer();
  await sharp(wash(size, dark)).composite([{ input: m, gravity: 'center' }]).flatten({ background: dark ? '#163B32' : '#F6F3E9' }).png().toFile(out);
}
await compose('assets/icon-only.png', 1024, 780);
await compose('assets/splash.png', 2732, 820);
await compose('assets/splash-dark.png', 2732, 820, true);
// Adaptive icon (Android): transparent foreground inside the 66% safe zone, cream wash as background layer.
const fg = await sharp(mascot).resize(620, 620, { kernel: 'lanczos3' }).png().toBuffer();
await sharp({ create: { width: 1024, height: 1024, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).composite([{ input: fg, gravity: 'center' }]).png().toFile('assets/icon-foreground.png');
await sharp(wash(1024)).png().toFile('assets/icon-background.png');
console.log('icons written to assets/');
