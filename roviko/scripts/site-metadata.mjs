import fs from 'node:fs';
import ts from 'typescript';
const source=ts.transpileModule(fs.readFileSync('lib/config.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText;
const {BRAND}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const manifest=JSON.parse(fs.readFileSync('public/manifest.webmanifest','utf8'));
manifest.name=BRAND.name;manifest.short_name=BRAND.name;manifest.description=BRAND.tagline;
fs.writeFileSync('public/manifest.webmanifest',JSON.stringify(manifest,null,2)+'\n');
console.log('Brand metadata generated.');
