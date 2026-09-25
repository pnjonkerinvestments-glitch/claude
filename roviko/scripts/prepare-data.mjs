import fs from 'node:fs';
import countries from 'world-countries';
const importDate='2026-09-08';
const selected=countries.filter(c=>c.unMember||['PSE','VAT'].includes(c.cca3));
const records=selected.map(c=>({id:c.cca3,iso2:c.cca2.toLowerCase(),numeric:c.ccn3,name:c.name.common,nl:c.translations.nld?.common??c.name.common,official:c.name.official,capitals:c.capital,region:c.region==='Americas'?(c.subregion==='South America'?'South America':'North America'):c.region,subregion:c.subregion,latlng:c.latlng,borders:c.borders.filter(id=>selected.some(c=>c.cca3===id)),area:c.area,languages:Object.values(c.languages),currencies:Object.values(c.currencies).map(v=>v.name),flag:'/flags/'+c.cca2.toLowerCase()+'.svg'}));
// The source capital list for Sri Lanka includes an outdated administrative entry.
records.find(c=>c.id==='LKA').capitals=['Sri Jayawardenepura Kotte'];
records.find(c=>c.id==='ZAF').capitals=['Pretoria','Cape Town','Bloemfontein'];
for(const p of ['lib/data','public/data','public/licenses','public/flags','public/shapes'])fs.mkdirSync(p,{recursive:true});
fs.writeFileSync('lib/data/countries.json',JSON.stringify(records));
fs.writeFileSync('public/data/countries.json',JSON.stringify(records));
fs.copyFileSync('node_modules/world-countries/LICENSE','public/licenses/countries-ODbL.txt');
fs.copyFileSync('node_modules/world-atlas/LICENSE','public/licenses/world-atlas-ISC.txt');
fs.copyFileSync('node_modules/flag-icons/LICENSE','public/licenses/flags-MIT.txt');
for(const c of records){fs.copyFileSync('node_modules/flag-icons/flags/4x3/'+c.iso2+'.svg','public/flags/'+c.iso2+'.svg');const p='node_modules/world-countries/data/'+c.id.toLowerCase()+'.geo.json';if(fs.existsSync(p))fs.copyFileSync(p,'public/shapes/'+c.id+'.geo.json');}
const topo=JSON.parse(fs.readFileSync('node_modules/world-atlas/countries-110m.json'));
function arc(i){let x=0,y=0;let points=topo.arcs[i<0?~i:i].map(v=>{x+=v[0];y+=v[1];return[x*topo.transform.scale[0]+topo.transform.translate[0],y*topo.transform.scale[1]+topo.transform.translate[1]]});return i<0?points.reverse():points;}
function ring(indices){return indices.flatMap((idx,i)=>arc(idx).slice(i?1:0));}
function shape(g){let polys=g.type==='Polygon'?[g.arcs]:g.arcs;return polys.map(poly=>poly.map(r=>ring(r))).flat().map(points=>{let path='';let previous=null;for(const [lng,lat] of points){const x=(lng+180)/360*1000,y=(90-lat)/180*500;path+=(!previous||Math.abs(lng-previous[0])>180?'M':'L')+x.toFixed(2)+','+y.toFixed(2);previous=[lng,lat];}return path+'Z';}).join('');}
const map=topo.objects.countries.geometries.map(g=>({id:g.id,path:shape(g)}));
fs.writeFileSync('public/data/world-map.json',JSON.stringify(map));
const sources=[{id:'mledoze',name:'World countries 5.1.0',url:'https://github.com/mledoze/countries',license:'ODbL-1.0',importedAt:importDate,attribution:'Contains information from World countries by Mohammed Le Doze and contributors, made available under the Open Database License.'},{id:'natural-earth',name:'Natural Earth via world-atlas 2.0.2',url:'https://www.naturalearthdata.com/about/terms-of-use/',license:'Public domain (data); ISC (world-atlas)',importedAt:importDate,attribution:'Made with Natural Earth; world-atlas © Michael Bostock.'},{id:'flags',name:'flag-icons 7.5.0',url:'https://github.com/lipis/flag-icons',license:'MIT',importedAt:importDate,attribution:'flag-icons © Panayiotis Lipiridis.'}];
if(fs.existsSync('public/data/sources.json')) sources.push(...JSON.parse(fs.readFileSync('public/data/sources.json','utf8')).filter(s=>!sources.some(base=>base.id===s.id)));
fs.writeFileSync('public/data/sources.json',JSON.stringify(sources,null,2));
const quote=s=>"'"+String(s).replaceAll("'","''")+"'";
const sql=[...sources.map(s=>`INSERT OR IGNORE INTO data_sources(id,name,url,license,imported_at,attribution) VALUES (${[s.id,s.name,s.url,s.license,s.importedAt,s.attribution].map(quote).join(',')});`),...records.map(c=>`INSERT OR REPLACE INTO countries(id,iso2,name,data,source_id) VALUES (${[c.id,c.iso2,c.name,JSON.stringify(c),'mledoze'].map(quote).join(',')});`),...records.flatMap(c=>c.borders.map(n=>`INSERT OR IGNORE INTO country_borders(country_id,neighbor_id) VALUES (${quote(c.id)},${quote(n)});`))];
fs.writeFileSync('db/seed.sql',sql.join('\n')+'\n');
console.log({countries:records.length,geometries:map.length,importDate});
