// Builds the 1024px store icon and splash artwork from the Roviko mascot.
// App Store icons must be square and fully opaque, so the mascot sits on the brand gradient.
import sharp from 'sharp';
const mascot = '../roviko/public/icon-512.png';
const gradient = (size, dark = false) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${dark ? '#1d2a6b' : '#2f5bea'}"/><stop offset="1" stop-color="${dark ? '#3b2a8c' : '#6a4cf0'}"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>`);
async function compose(out, size, mascotSize, dark = false) {
  const m = await sharp(mascot).resize(mascotSize, mascotSize, { kernel: 'lanczos3' }).png().toBuffer();
  await sharp(gradient(size, dark)).composite([{ input: m, gravity: 'center' }]).flatten({ background: '#2f5bea' }).png().toFile(out);
}
await compose('assets/icon-only.png', 1024, 760);
await compose('assets/splash.png', 2732, 900);
await compose('assets/splash-dark.png', 2732, 900, true);
// Adaptive icon (Android): transparent foreground inside the 66% safe zone, gradient background layer.
const fg = await sharp(mascot).resize(620, 620, { kernel: 'lanczos3' }).png().toBuffer();
await sharp({ create: { width: 1024, height: 1024, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).composite([{ input: fg, gravity: 'center' }]).png().toFile('assets/icon-foreground.png');
await sharp(gradient(1024)).png().toFile('assets/icon-background.png');
console.log('icons written to assets/');
