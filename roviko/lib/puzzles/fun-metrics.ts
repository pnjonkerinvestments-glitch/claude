import fun from '../data/fun-metrics.json';
import snapshot from '../data/comparisons.json';

/**
 * Extra subjects for Side by Side and Rank Radar (1.25), from the archived CIA World Factbook (CC0 archive,
 * `scripts/import-fun-metrics.py`). The military budget is an estimate: the Factbook's latest military
 * expenditure as a share of GDP times the World Bank GDP in `comparisons.json`.
 */
export type FunObservation = { value: number; referenceYear: number | null; source: string; sourceUrl: string; estimated?: boolean };
type Field = { value: number; reference_year: number | null; source_url: string };
const records = fun.records as Record<string, Record<string, Field>>;
const gdp = (snapshot.topics as Record<string, { values: Record<string, number> }>).economy.values;
export const FUN_IDS = ['military', 'alcohol', 'airports', 'railways'];
export function funObservation(countryId: string, topic: string): FunObservation | undefined {
  const r = records[countryId];
  if (topic === 'military') {
    const share = r?.military_share, economy = gdp[countryId];
    if (!share || !Number.isFinite(economy)) return undefined;
    return { value: Math.round(share.value / 100 * economy), referenceYear: share.reference_year, source: 'Factbook archive (share of GDP) × World Bank GDP', sourceUrl: share.source_url, estimated: true };
  }
  const field = r?.[topic];
  return field && Number.isFinite(field.value) ? { value: field.value, referenceYear: field.reference_year, source: 'Factbook archive · CC0', sourceUrl: field.source_url } : undefined;
}
