import { COUNTRIES } from '../lib/game-engine/questions';
import sources from '../public/data/sources.json';
import { ACHIEVEMENTS } from '../lib/achievements';
import { one, batch, run } from './db';
import type { Env } from './types';
// Idempotent data import, separate from schema migrations. The marker is written last.
export async function ensureCatalog(env: Env) { if (await one(env, "SELECT id FROM data_sources WHERE id='roviko-catalog-v1.2'"))
    return; const statements: any[] = [...sources.map(s => ({ sql: 'INSERT OR IGNORE INTO data_sources(id,name,url,license,imported_at,attribution) VALUES (?,?,?,?,?,?)', args: [s.id, s.name, s.url, s.license, s.importedAt, s.attribution] })), ...COUNTRIES.map(c => ({ sql: 'INSERT OR IGNORE INTO countries(id,iso2,name,data,source_id) VALUES (?,?,?,?,?)', args: [c.id, c.iso2, c.name, JSON.stringify(c), 'mledoze'] })), ...COUNTRIES.flatMap(c => c.borders.map(n => ({ sql: 'INSERT OR IGNORE INTO country_borders(country_id,neighbor_id) VALUES (?,?)', args: [c.id, n] }))), ...ACHIEVEMENTS.map(a => ({ sql: 'INSERT OR IGNORE INTO achievements(id,definition) VALUES (?,?)', args: [a.id, JSON.stringify(a)] }))]; for (let i = 0; i < statements.length; i += 40)
    await batch(env, statements.slice(i, i + 40)); await run(env, 'INSERT OR IGNORE INTO data_sources(id,name,url,license,imported_at,attribution) VALUES (?,?,?,?,?,?)', 'roviko-catalog-v1.2', 'Roviko derived catalog', '/data/countries.json', 'ODbL-1.0', '2026-09-08', 'Derived from World countries by Mohammed Le Doze and contributors.'); }
