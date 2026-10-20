// Claimrechten: elke ochtend alle verhandelbare rechten op de Europese beurzen ophalen (de
// zoekfunctie van TradingView kent ze als type "right"; in de screener staan ze niet). De
// omschrijving bevat de vervaldatum: "UNIPOL ASSICURAZIONI SPA Rights 2026-26.10.26 fOR Shares".
// Een nieuwe rechtenlijn betekent dat de rechtenhandel begint, en juist dan openen rechten soms
// extreem laag (UNIAXA, oktober 2026).

import { parseNumber } from "./amount.ts";
import { fold } from "./dates.ts";
import type { Fetch } from "./tradingview.ts";

/** Beurzen om langs te gaan. Londen niet (zie EXCLUDED_EXCHANGES); Frankfurt e.d. hebben alleen kopieën. */
export const RIGHTS_EXCHANGES = ["MIL", "EURONEXT", "XETR", "OMXSTO", "OMXCOP", "OMXHEX", "OSL", "BME", "SIX", "VIE", "NGM"];
/** Welke rechtenlijnen de bot al eens zag, en wanneer (JSON {symbool: "2026-10-12"}). */
export const RIGHTS_SEEN_KEY = "rights_seen";

export interface RightsLine {
  /** "MIL:UNIAXA" */
  symbol: string;
  /** Bedrijfsnaam zoals in de omschrijving, "UNIPOL ASSICURAZIONI SPA". */
  company: string;
  exchange: string;
  /** Vervaldatum uit de omschrijving (einde inschrijving), "2026-10-26", of leeg. */
  expiry: string;
  description: string;
  /** Aandeel van het bedrijf, als de bot het kon vinden ("MIL:UNI"). */
  companySymbol?: string;
  capEur?: number;
  /** Eerste dag dat de bot deze lijn zag. */
  firstSeen?: string;
}

/** "26.10.26" of "23.10.2026" → "2026-10-26"; de laatste datum in de omschrijving telt. */
export function rightsExpiry(description: string): string {
  const dates = [...description.matchAll(/(?<!\d)(\d{1,2})\.(\d{1,2})\.(\d{4}|\d{2})(?!\d)/g)];
  const last = dates.at(-1);
  if (!last) return "";
  const year = last[3].length === 2 ? 2000 + Number(last[3]) : Number(last[3]);
  const date = new Date(Date.UTC(year, Number(last[2]) - 1, Number(last[1])));
  return date.getUTCMonth() === Number(last[2]) - 1 ? date.toISOString().slice(0, 10) : "";
}

/** "Lenzing AG Subscription Rights 2026-20.10.26 For Shares" → "Lenzing AG". */
export function rightsCompany(description: string): string {
  return description.split(/\s+(?:subscription\s+)?rights?\b/i)[0].trim();
}

export function parseRightsSearch(body: unknown, exchange: string): RightsLine[] {
  const list = Array.isArray(body) ? body : ((body as { symbols?: unknown[] } | null)?.symbols ?? []);
  const lines: RightsLine[] = [];
  for (const raw of list) {
    const item = raw as Record<string, unknown>;
    if (item?.type !== "right" || typeof item.symbol !== "string") continue;
    const prefix = typeof item.prefix === "string" ? item.prefix : typeof item.source_id === "string" ? item.source_id : exchange;
    const description = typeof item.description === "string" ? item.description.replace(/<[^>]*>/g, "") : "";
    lines.push({
      symbol: `${prefix}:${item.symbol.replace(/<[^>]*>/g, "")}`.toUpperCase(),
      company: rightsCompany(description),
      exchange: prefix.toUpperCase(),
      expiry: rightsExpiry(description),
      description,
    });
  }
  return lines;
}

/** Alle rechtenlijnen op één beurs. */
export async function searchRights(fetcher: Fetch, exchange: string): Promise<RightsLine[]> {
  const params = new URLSearchParams({ text: "rights", hl: "0", lang: "en", search_type: "", domain: "production", exchange });
  const response = await fetcher(`https://symbol-search.tradingview.com/symbol_search/v3/?${params}`, {
    headers: {
      Accept: "application/json",
      Origin: "https://www.tradingview.com",
      Referer: "https://www.tradingview.com/",
      "User-Agent": "Mozilla/5.0 (compatible; nieuws-alert/1.0)",
    },
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`rechten ${exchange} HTTP ${response.status}`);
  return parseRightsSearch(await response.json(), exchange);
}

/** Naam vergelijkbaar maken: "UNIPOL ASSICURAZIONI SPA" en "Unipol Assicurazioni S.p.A." → "unipol assicurazioni spa". */
export function companyKey(name: string): string {
  return fold(name)
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(s p a|s a|n v|a s|a b)\b/g, (m) => m.replace(/ /g, ""))
    .trim();
}

// ---------------------------------------------------------------- voorwaarden

/** Welke uitgifteprijs en verhouding de bot per rechtenlijn vond (JSON {symbool: RightsTerms}). */
export const RIGHTS_TERMS_KEY = "rights_terms";

/** Uitgifteprijs en verhouding van een claimemissie. */
export interface RightsTerms {
  /** Uitgifteprijs per nieuw aandeel. */
  price?: number;
  /** ISO-munt; "KR" als niet duidelijk is welke kroon. */
  currency?: string;
  /** Zoveel nieuwe aandelen (of units) ... */
  newShares?: number;
  /** ... per zoveel rechten. */
  perRights?: number;
  /** Aandelen per unit, als de emissie in units gaat (warrants tellen niet mee). */
  sharesPerUnit?: number;
  /** Units waarvan de bot niet weet uit hoeveel aandelen ze bestaan. */
  units?: boolean;
  /** Waarom de verhouding een aanname is. */
  assumed?: string;
  /** Kop en link van het bericht waar de voorwaarden uit komen. */
  source?: string;
  url?: string;
  /** Zelf ingevoerd met /rechten. */
  manual?: boolean;
  /** Laatste dag dat de bot zocht. */
  checked?: string;
}

const WORD_NUMBERS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  uno: 1, una: 1, une: 1, ein: 1, eine: 1, einer: 1, yksi: 1, due: 2, deux: 2, zwei: 2, dos: 2, tva: 2,
  tre: 3, trois: 3, drei: 3, tres: 3, each: 1, every: 1, hver: 1, chaque: 1, ogni: 1, jedes: 1, jeder: 1,
  jede: 1, varje: 1, cada: 1,
};
/** Een aantal: "10", "0,5", "seven (7)", "one hundred (100)", "one", "each". */
const N = `(?<![a-z0-9])((?:[a-z]+\\s+){0,2}\\(\\d+\\)|\\d+(?:[.,]\\d+)?|${Object.keys(WORD_NUMBERS).join("|")})(?![a-z])`;
const NEW = `(?:new|nuov[ae]|neuen?|nouvelles?|nya|nye|ny|nuevas?|uutta|ordinary|ordinarie)`;
const SHARE = `(?:offer\\s+shares?|shares?|azioni|aktien?|aktie|aktier|actions?|aksjer?|acciones?|accion|osaketta|osakkeet|units?|unita)`;
const OLD = `(?:existing\\s+|old\\s+|held\\s+|alte\\s+)?(?:shares?|azioni|aktien|aktier|actions?|aksjer|acciones|osaketta|(?:subscription\\s+|unit\\s+)?rights?|diritti(?:\\s+di\\s+opzione)?|dps|droits?|teckningsratter|uniratter|tegningsretter|bezugsrechte|derechos(?:\\s+de\\s+suscripcion)?|merkintaoikeutta)`;
const FOR_EVERY = `(?:for\\s+every|for\\s+each|per\\s+ogni|ogni|pour|por\\s+cada|for\\s+hver|for\\s+varje|fur\\s+je|je|per)`;
const RIGHT = `(?:(?:subscription\\s+|unit\\s+|preferential\\s+)?rights?|dps|droits?\\s+preferentiels?(?:\\s+de\\s+souscription)?|diritti(?:\\s+di\\s+opzione)?|bezugsrechte?|alte\\s+aktien|teckningsratt(?:er)?|uniratt(?:er)?|tegningsrett(?:er)?|derechos(?:\\s+de\\s+suscripcion)?|merkintaoikeu\\w*)`;
const ENTITLE = `(?:entitles?|gives?|grants?|confers?|permettr\\w*|permet|donne\\w*|berattigar|gir|dar(?:a|an)?|consent\\w*|danno|berechtig\\w*|oikeutta\\w*)`;
/** "10 nuove azioni ogni 59 azioni", "1 new share for every 5 shares", "1 action nouvelle pour 4 actions existantes". */
const NEW_FOR_OLD = new RegExp(`${N}\\s+(?:${NEW}\\s+)?${SHARE}(?:\\s+${NEW})?(?:\\s+[a-z']+){0,3}?\\s+${FOR_EVERY}\\s+${N}\\s+${OLD}(?![a-z])`);
/** "3 DPS permettront de souscrire à 1 action nouvelle", "seven (7) unit rights entitle the holder to subscribe for one hundred (100) units". */
const RIGHTS_FOR_NEW = new RegExp(`${N}\\s+${RIGHT}\\s+(?:[a-z]+\\s+)?${ENTITLE}\\s+(?:[a-z']+\\s+){0,8}?${N}\\s+(?:${NEW}\\s+)?${SHARE}(?![a-z])`);
/** "Bezugsverhältnis 7:2" of "im Verhältnis 7:2": 7 oude aandelen (rechten) voor 2 nieuwe. */
const GERMAN_RATIO = /(?:bezugsverhaltnis|im\s+verhaltnis)\s*(?:von\s+|betragt\s+|:\s*)?(\d+(?:[.,]\d+)?)\s*:\s*(\d+(?:[.,]\d+)?)/;

const PRICE_ANCHOR =
  /subscription price|offer(?:ing)? price|issue price|issuance price|prezzo di (?:sottoscrizione|emissione|offerta)|fissando il prezzo|prezzo (?:unitario|aumento|dell'aumento|delle nuove)|bezugspreis|ausgabepreis|angebotspreis|teckningskurs\w*|tegningskurs\w*|tegningspris\w*|prix (?:de souscription|unitaire|d'emission)|precio de (?:suscripcion|emision)|merkintahin\w*|\bat (?=(?:nok|sek|eur|dkk|chf|€)\s?\d)/g;
const AMOUNT = `(\\d{1,3}(?:[.,\\s]\\d{3})*(?:[.,]\\d{1,4})?|\\d+(?:[.,]\\d{1,4})?)`;
const MONEY = `(eur|euros?|€|sek|nok|dkk|chf|kr|kronor|kroner|pln|gbp|£)`;
const MONEY_AFTER = `(eur|euros?|€|e|sek|nok|dkk|chf|kr|kronor|kroner|pln|gbp|£)`;
const MONEY_BEFORE_RE = new RegExp(`(?<![a-z])${MONEY}\\s?${AMOUNT}(?![\\d])`, "g");
const MONEY_AFTER_RE = new RegExp(`(?<![\\d.,])${AMOUNT}\\s?${MONEY_AFTER}(?![a-z])`, "g");
const ISO: Record<string, string> = {
  eur: "EUR", euro: "EUR", euros: "EUR", "€": "EUR", e: "EUR", sek: "SEK", kronor: "SEK", nok: "NOK", dkk: "DKK",
  chf: "CHF", kr: "KR", kroner: "KR", pln: "PLN", gbp: "GBP", "£": "GBP",
};

function count(raw: string): number {
  const paren = /\((\d+)\)/.exec(raw);
  if (paren) return Number(paren[1]);
  return WORD_NUMBERS[raw] ?? parseNumber(raw);
}

interface Money {
  index: number;
  end: number;
  amount: number;
  currency: string;
}

/** Bedragen met munt in een stuk tekst, op volgorde. */
function amounts(text: string): Money[] {
  const found: Money[] = [];
  for (const m of text.matchAll(MONEY_BEFORE_RE)) found.push({ index: m.index, end: m.index + m[0].length, amount: parseNumber(m[2]), currency: ISO[m[1]] });
  for (const m of text.matchAll(MONEY_AFTER_RE)) found.push({ index: m.index, end: m.index + m[0].length, amount: parseNumber(m[1]), currency: ISO[m[2]] });
  return found.filter((a) => a.currency && Number.isFinite(a.amount) && a.amount > 0).sort((a, b) => a.index - b.index);
}

/**
 * Uitgifteprijs en verhouding uit een persbericht, in het Engels, Italiaans, Duits, Frans,
 * Spaans, Zweeds, Noors of Fins. Geeft alleen wat er met zekerheid staat.
 */
export function parseRightsTerms(raw: string): RightsTerms {
  const text = fold(raw).replace(/[’`]/g, "'").replace(/\s+/g, " ");
  const terms: RightsTerms = {};

  // Verhouding.
  const german = GERMAN_RATIO.exec(text);
  const forOld = NEW_FOR_OLD.exec(text);
  const forNew = RIGHTS_FOR_NEW.exec(text);
  const candidates = [
    german && { index: german.index, newShares: parseNumber(german[2]), perRights: parseNumber(german[1]), unit: false },
    forOld && { index: forOld.index, newShares: count(forOld[1]), perRights: count(forOld[2]), unit: /\bunit/.test(forOld[0]) },
    forNew && { index: forNew.index, newShares: count(forNew[2]), perRights: count(forNew[1]), unit: /\bunits?$|unita$/.test(forNew[0]) },
  ].filter((c): c is { index: number; newShares: number; perRights: number; unit: boolean } => !!c && c.newShares > 0 && c.perRights > 0);
  const ratio = candidates.sort((a, b) => a.index - b.index)[0];
  if (ratio && ratio.newShares / ratio.perRights >= 0.002 && ratio.newShares / ratio.perRights <= 200) {
    terms.newShares = ratio.newShares;
    terms.perRights = ratio.perRights;
    if (ratio.unit) terms.units = true;
  }

  // Uitgifteprijs: het eerste bedrag kort na "subscription price", "prezzo di sottoscrizione", ...
  for (const anchor of text.matchAll(PRICE_ANCHOR)) {
    const window = text.slice(anchor.index, anchor.index + 160);
    const found = amounts(window);
    const first = found[0];
    if (!first || first.index > 100) continue;
    const after = window.slice(first.end, first.end + 20);
    const perUnit = /^\s*(?:\/\s*)?per (?:unit|unita)/.test(after);
    // "SEK 2.40 per unit, 0.60 SEK per share" of "SEK 0.10 per unit, corresponding to SEK 0.10 per share".
    const perShare = found.slice(1).find((a) => a.index - first.end < 60 && /^\s*per (?:share|aktie|aksje|azione|action)/.test(window.slice(a.end, a.end + 20)));
    if (perUnit) {
      terms.units = true;
      if (perShare && perShare.currency === first.currency) {
        const shares = first.amount / perShare.amount;
        if (Math.abs(shares - Math.round(shares)) < 0.02 && Math.round(shares) >= 1) terms.sharesPerUnit = Math.round(shares);
        terms.price = perShare.amount;
      } else {
        terms.price = first.amount;
      }
    } else {
      terms.price = first.amount;
    }
    terms.currency = first.currency;
    break;
  }
  if (terms.units && !terms.sharesPerUnit) {
    const consists = new RegExp(`units?\\s+(?:consists?|bestar|comprises?|består)\\s+(?:of\\s+|av\\s+)?${N}\\s+(?:${NEW}\\s+)?(?:shares?|aktier)`).exec(text);
    if (consists) terms.sharesPerUnit = count(consists[1]);
  }
  return terms;
}

/** Zijn prijs en verhouding allebei bekend (en, bij units, de samenstelling)? */
export function termsComplete(terms: RightsTerms | undefined): boolean {
  return !!terms?.price && !!terms.newShares && !!terms.perRights && (!terms.units || !!terms.sharesPerUnit);
}

/**
 * Voegt de voorwaarden uit meerdere berichten samen, nieuwste eerst. Een bericht met prijs én
 * verhouding wint; anders de nieuwste prijs met de nieuwste verhouding.
 */
export function mergeTerms(found: Array<RightsTerms & { source?: string; url?: string }>): RightsTerms {
  const both = found.find((t) => t.price && t.newShares);
  if (both) return { ...both };
  const price = found.find((t) => t.price);
  const ratio = found.find((t) => t.newShares);
  return {
    ...(price ? { price: price.price, currency: price.currency, sharesPerUnit: price.sharesPerUnit, source: price.source, url: price.url } : {}),
    ...(ratio ? { newShares: ratio.newShares, perRights: ratio.perRights, ...(ratio.sharesPerUnit ? { sharesPerUnit: ratio.sharesPerUnit } : {}) } : {}),
    ...(price?.units || ratio?.units ? { units: true } : {}),
    ...(!price && ratio ? { source: ratio.source, url: ratio.url } : {}),
  };
}

/** Taal van de berichten per beurs (naast Engels). */
export const RIGHTS_LANG: Record<string, string> = {
  MIL: "it", EURONEXT: "fr", XETR: "de", VIE: "de", SIX: "de", OMXSTO: "sv", NGM: "sv", OMXCOP: "da", OMXHEX: "fi", OSL: "no", BME: "es",
};
/** Koppen die over een claimemissie gaan (na fold()). */
export const RIGHTS_TITLE =
  /rights?\b|subscription|capital increase|share issue|offering|aumento (?:di )?capitale|diritti|opzione|kapitalerh|bezug|augmentation de capital|\bdps\b|droits? preferentiel|emission|foretrade|teckning|tegning|fortrinn|merkinta|osakeanti|ampliacion|suscripcion|\bunits?\b/;

// ---------------------------------------------------------------- waarde

export interface RightsValue {
  /** Nieuwe aandelen per recht. */
  perRight: number;
  /** Theoretische waarde van één recht: (koers − uitgifteprijs) × aandelen per recht. */
  value: number;
  /** Prijs per nieuw aandeel als je de rechten koopt en inschrijft. */
  viaRights: number;
  /** Hoeveel goedkoper dan het aandeel (0,03 = 3%); negatief = duurder. */
  edge: number;
  /** Hoeveel het recht onder zijn waarde noteert (0,19 = 19%), als het iets waard is. */
  discount: number | null;
}

/** Kan een bedrag in deze munt naast een koers in die munt? */
function sameCurrency(terms: string | undefined, quote: string | undefined): boolean {
  if (!terms || !quote) return true;
  const q = quote.toUpperCase();
  return terms === q || (terms === "KR" && ["SEK", "NOK", "DKK"].includes(q));
}

/** Is meedoen via de rechten goedkoper dan het aandeel kopen? Null als dat niet te zeggen is. */
export function rightsValue(terms: RightsTerms | undefined, share: number, right: number, currency?: string): RightsValue | null {
  if (!terms || !termsComplete(terms) || !(share > 0) || !(right >= 0)) return null;
  if (!sameCurrency(terms.currency, currency)) return null;
  const perRight = (terms.newShares! / terms.perRights!) * (terms.units ? terms.sharesPerUnit! : 1);
  const value = Math.max(0, (share - terms.price!) * perRight);
  const viaRights = terms.price! + right / perRight;
  return { perRight, value, viaRights, edge: (share - viaRights) / share, discount: value > 0 ? 1 - right / value : null };
}
