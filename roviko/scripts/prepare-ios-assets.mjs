import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

// Convert existing, licensed project artwork. No remote assets or build-time downloads.
const root = process.cwd(), assets = path.join(root, 'ios/Roviko/Assets.xcassets');
await fs.mkdir(assets, { recursive: true });
const info = { author: 'Roviko', version: 1 };
await fs.writeFile(path.join(assets, 'Contents.json'), JSON.stringify({ info }, null, 2));
async function imageSet(name, input, width, height) {
  const folder = path.join(assets, name + '.imageset');
  await fs.mkdir(folder, { recursive: true });
  await sharp(input).resize(width, height, { fit: 'inside', withoutEnlargement: true }).png().toFile(path.join(folder, name + '.png'));
  await fs.writeFile(path.join(folder, 'Contents.json'), JSON.stringify({ images: [{ filename: name + '.png', idiom: 'universal' }], info }, null, 2));
}
const countries = JSON.parse(await fs.readFile('public/data/countries.json', 'utf8'));
await fs.mkdir('public/flags/png', { recursive: true });
for (const country of countries) {
  const input = path.join(root, 'public' + country.flag);
  const png = path.join(root, 'public/flags/png', country.iso2 + '.png');
  await sharp(input, { density: 192 }).resize(480, 360, { fit: 'inside' }).png().toFile(png);
  await imageSet('flag-' + country.id, png, 480, 360);
}
await imageSet('Globe', 'public/globe.png', 400, 400);
for (const [name, file] of [['Mosaic','country-mosaic'],['Compare','side-by-side'],['Daily','world-trip'],['Rank','rank-radar']]) await imageSet(name, 'public/art/' + file + '-480.webp', 480, 480);
const icon = path.join(assets, 'AppIcon.appiconset');
await fs.mkdir(icon, { recursive: true });
await sharp('public/globe.png').resize(1024,1024).flatten({background:'#f7f9fc'}).removeAlpha().png().toFile(path.join(icon,'AppIcon.png'));
await fs.writeFile(path.join(icon,'Contents.json'), JSON.stringify({ images:[{filename:'AppIcon.png',idiom:'universal',platform:'ios',size:'1024x1024'}],info },null,2));
const resources = 'ios/Roviko/Resources';
await fs.mkdir(resources,{recursive:true});
for (const name of ['countries','silhouettes','boundaries']) await fs.copyFile('public/data/'+name+'.json',resources+'/'+name+'.json');
for (const name of ['countries-ODbL','flags-MIT','factbook-CC0']) await fs.copyFile('public/licenses/'+name+'.txt',resources+'/'+name+'.txt');
await fs.copyFile('DATA_SOURCES.md',resources+'/DATA_SOURCES.md');
console.log('Prepared 195 licensed flags, four game covers, a 1024px icon and offline geography.');
