// Datums: de lokale klok (werkdag, tijd van het ochtendoverzicht) en datums uit persberichten
// halen voor de agenda ("Annahmefrist endet am 23. Oktober 2026", "PDUFA date of March 15, 2027",
// "Opa su Trevi in programma da 28 settembre a 20 novembre").

export interface LocalTime {
  /** "2026-10-06" */
  date: string;
  /** 1 = maandag … 7 = zondag */
  weekday: number;
  /** Minuten sinds middernacht. */
  minutes: number;
}

const WEEKDAYS: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };
const formatters = new Map<string, Intl.DateTimeFormat>();

export function localTime(unix: number, timeZone: string): LocalTime {
  let formatter = formatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      weekday: "short",
      hourCycle: "h23",
    });
    formatters.set(timeZone, formatter);
  }
  const parts = Object.fromEntries(formatter.formatToParts(new Date(unix * 1000)).map((p) => [p.type, p.value]));
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    weekday: WEEKDAYS[parts.weekday] ?? 1,
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
  };
}

function dayNumber(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return Date.UTC(y, m - 1, d) / 86_400_000;
}

export function addDays(date: string, days: number): string {
  return new Date((dayNumber(date) + days) * 86_400_000).toISOString().slice(0, 10);
}

export function daysBetween(from: string, to: string): number {
  return Math.round(dayNumber(to) - dayNumber(from));
}

/** 1 = maandag … 7 = zondag, voor een datum als "2026-10-06". */
export function weekdayOf(date: string): number {
  return ((((dayNumber(date) + 3) % 7) + 7) % 7) + 1;
}

/** Unix-tijd van een lokale datum en tijd (minuten sinds middernacht) in deze tijdzone. */
export function toUnix(date: string, minutes: number, timeZone: string): number {
  const guess = dayNumber(date) * 86_400 + minutes * 60;
  const local = localTime(guess, timeZone);
  const shown = dayNumber(local.date) * 86_400 + local.minutes * 60;
  const result = guess - (shown - guess);
  // Rond de omschakeling naar zomer- of wintertijd kan één correctie te weinig zijn.
  const check = localTime(result, timeZone);
  const off = dayNumber(check.date) * 86_400 + check.minutes * 60 - guess;
  return result - off;
}

/** Vorige werkdag (ma–vr) vóór deze datum. */
export function previousWorkday(date: string): string {
  let day = addDays(date, -1);
  while (weekdayOf(day) > 5) day = addDays(day, -1);
  return day;
}

const MONTHS_NL = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
const DAYS_NL = ["ma", "di", "wo", "do", "vr", "za", "zo"];

/** "do 8 okt" (met jaartal als het niet dit jaar is). */
export function formatDay(date: string, today?: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const year = today && today.slice(0, 4) !== date.slice(0, 4) ? ` ${y}` : "";
  return `${DAYS_NL[weekdayOf(date) - 1]} ${d} ${MONTHS_NL[m - 1]}${year}`;
}

/** "vandaag", "morgen", "over 3 dagen", "3 dagen geleden". */
export function relativeDay(date: string, today: string): string {
  const days = daysBetween(today, date);
  if (days === 0) return "vandaag";
  if (days === 1) return "morgen";
  if (days === -1) return "gisteren";
  return days > 0 ? `over ${days} dagen` : `${-days} dagen geleden`;
}

// ---------------------------------------------------------------- datums in tekst

/** Kleine letters, zonder accenten; leestekens blijven staan (anders dan normalize in screener.ts). */
export function fold(text: string): string {
  return text
    .toLowerCase()
    .replace(/ß/g, "ss")
    .replace(/æ/g, "ae")
    .replace(/ø/g, "o")
    .replace(/œ/g, "oe")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[‘’]/g, "'");
}

/** Volledige maandnamen in de talen van de nieuwsstromen (na fold). */
const MONTH_NAMES: Record<string, number> = {};
const FULL = [
  "january januar janvier gennaio enero janeiro januari jänner jaenner tammikuu",
  "february februar fevrier febbraio febrero fevereiro februari helmikuu",
  "march marz maerz mars marzo marco maart marts maaliskuu",
  "april avril aprile abril huhtikuu",
  "may mai maggio mayo maio mei maj toukokuu",
  "june juni juin giugno junio junho kesakuu",
  "july juli juillet luglio julio julho heinakuu",
  "august aout agosto augustus augusti elokuu",
  "september septembre settembre septiembre setiembre setembro syyskuu",
  "october oktober octobre ottobre octubre outubro lokakuu",
  "november novembre noviembre novembro marraskuu",
  "december dezember decembre dicembre diciembre dezembro desember joulukuu",
];
FULL.forEach((names, index) => {
  for (const name of names.split(" ")) MONTH_NAMES[name] = index + 1;
});
/** Afkortingen; alleen geldig met een punt of jaartal erachter, of vóór de dag ("Oct 14"). */
const MONTH_SHORT: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, mrz: 3, mrt: 3, apr: 4, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, okt: 10,
  nov: 11, dec: 12, dez: 12,
};
const MONTH_ALT = Object.keys(MONTH_NAMES).concat(Object.keys(MONTH_SHORT)).sort((a, b) => b.length - a.length).join("|");

export interface FoundDate {
  date: string;
  /** Positie in de (gevouwen) tekst. */
  index: number;
  /** Wat ervoor en erna stond, om het soort datum te bepalen. */
  before: string;
  after: string;
}

function valid(y: number, m: number, d: number): string | null {
  if (m < 1 || m > 12 || d < 1 || d > 31 || y < 2000 || y > 2100) return null;
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCMonth() !== m - 1) return null;
  return date.toISOString().slice(0, 10);
}

/** Zonder jaartal: het eerstvolgende moment rond de publicatiedatum (tot een maand terug). */
function guessYear(m: number, d: number, reference: string): string | null {
  const year = Number(reference.slice(0, 4));
  for (const y of [year, year + 1]) {
    const date = valid(y, m, d);
    if (date && daysBetween(reference, date) >= -31) return date;
  }
  return null;
}

function monthNumber(raw: string, hasDot: boolean, hasYear: boolean, monthFirst: boolean): number | null {
  if (MONTH_NAMES[raw]) return MONTH_NAMES[raw];
  // "19 MAR" in "Artikel 19 MAR" is geen datum; "Oct. 14", "Nov 3" en "14 Oct 2026" wel.
  if (MONTH_SHORT[raw] && (hasDot || hasYear || monthFirst)) return MONTH_SHORT[raw];
  return null;
}

/** Alle datums in een tekst. `reference` is de publicatiedatum ("2026-10-06"). */
export function findDates(text: string, reference: string): FoundDate[] {
  const folded = fold(text);
  const found = new Map<number, FoundDate>();
  const add = (index: number, date: string | null, length = 0) => {
    if (date && !found.has(index)) {
      found.set(index, { date, index, before: folded.slice(Math.max(0, index - 140), index), after: folded.slice(index + length, index + length + 45).split(/[.;\n]/)[0] });
    }
  };
  for (const m of folded.matchAll(/\b(20\d\d)-(\d\d)-(\d\d)\b/g)) add(m.index, valid(+m[1], +m[2], +m[3]), m[0].length);
  for (const m of folded.matchAll(/\b(\d{1,2})[./](\d{1,2})[./](20\d\d|\d\d)\b/g)) {
    const year = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]);
    add(m.index, valid(year, +m[2], +m[1]), m[0].length);
  }
  const dayMonth = new RegExp(
    `\\b(\\d{1,2})(?:st|nd|rd|th|er|o)?\\.?\\s+(?:de\\s+|di\\s+)?(${MONTH_ALT})(\\.)?(?:,?\\s+(?:de\\s+)?(20\\d\\d))?\\b`,
    "g",
  );
  for (const m of folded.matchAll(dayMonth)) {
    const month = monthNumber(m[2], !!m[3], !!m[4], false);
    if (!month) continue;
    add(m.index, m[4] ? valid(+m[4], month, +m[1]) : guessYear(month, +m[1], reference), m[0].length);
  }
  const monthDay = new RegExp(`\\b(${MONTH_ALT})(\\.)?\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b(?!\\.\\d|:\\d)(?:,?\\s+(20\\d\\d))?`, "g");
  for (const m of folded.matchAll(monthDay)) {
    const month = monthNumber(m[1], !!m[2], !!m[4], true);
    if (!month) continue;
    add(m.index, m[4] ? valid(+m[4], month, +m[3]) : guessYear(month, +m[3], reference), m[0].length);
  }
  return [...found.values()].sort((a, b) => a.index - b.index);
}

/**
 * Soorten datums, op volgorde van voorrang. Het label komt in de agenda; de woorden zoeken we in
 * de 140 tekens vóór de datum (de dichtstbijzijnde wint).
 */
const KINDS: Array<{ label: string; words: string[] }> = [
  { label: "PDUFA-datum", words: ["pdufa", "target action date", "action date"] },
  {
    label: "einde aanmeldtermijn",
    words: [
      "acceptance period", "offer period", "offer will close", "offer closes", "offer expires", "annahmefrist",
      "angebotsfrist", "weitere annahmefrist", "periode d'offre", "periodo di adesione", "periodo de aceptacion",
      "acceptance level", "pusu", "put up or shut up", "deadline", "expire", "expires", "frist",
    ],
  },
  {
    label: "eerste handelsdag",
    words: [
      "first day of trading", "first trading day", "trading debut", "start of trading", "trading will commence",
      "trading is expected to commence", "commence trading", "admission is expected", "erster handelstag",
      "erstnotiz", "notierungsaufnahme", "handelsaufnahme", "premier jour de cotation", "premiere cotation",
      "primo giorno di negoziazione", "inizio delle negoziazioni", "primer dia de cotizacion", "forste handelsdag",
      "forsta handelsdag", "for listing", "listing on", "listing of",
    ],
  },
  {
    label: "laatste handelsdag / delisting",
    words: [
      "last day of trading", "last trading day", "letzter handelstag", "delisting", "dernier jour de cotation",
      "retrait obligatoire", "squeeze-out", "squeeze out", "revoca", "cancellation of admission", "exclusion",
    ],
  },
  { label: "ex-dividend", words: ["ex-dividend", "ex dividend", "ex-date", "ex date", "ex-tag", "ex-dividende", "detachement", "stacco", "ex-dag"] },
  { label: "betaaldatum dividend", words: ["payment", "payable on", "paid on", "zahltag", "auszahlung", "mise en paiement", "pagamento", "betalningsdag"] },
  {
    label: "inschrijving sluit",
    words: ["subscription period", "zeichnungsfrist", "bookbuilding", "periode de souscription", "periodo di sottoscrizione", "teckningsperiod"],
  },
  {
    label: "vergadering",
    words: [
      "general meeting", "agm", "egm", "court meeting", "court hearing", "sanction hearing", "hauptversammlung",
      "assemblee generale", "assemblea", "junta general", "junta extraordinaria", "generalforsamling",
      "bolagsstamma", "yhtiokokous", "aandeelhoudersvergadering",
    ],
  },
  {
    label: "ingangsdatum",
    words: ["effective", "with effect from", "mit wirkung", "wirksam", "a compter du", "a partir du", "con efficacia", "con efecto"],
  },
  { label: "besluit of resultaten", words: ["decision", "ruling", "readout", "topline", "results", "ergebnisse", "resultats", "risultati"] },
];

/** Een periode "van X tot Y": de tweede datum is het einde. */
const UNTIL = /(?:(?:^|[\s(])(?:to|until|till|through|bis(?: zum)?|au|jusqu'au|a|al|fino al|hasta el|ate|tot|t\/m)\s+|\s[-–]\s*)$/;

/**
 * Laatste plek waar een woord begint (net als bij de filters mag het langer doorlopen:
 * "expire" vindt "expires"). Korte woorden (zoals "agm") alleen als heel woord, anders vindt
 * "egm" ook "segment".
 */
export function lastWordIndex(text: string, word: string): number {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const tail = word.length <= 4 ? "(?![a-z0-9])" : "";
  let last = -1;
  for (const m of text.matchAll(new RegExp(`(?<![a-z0-9])${escaped}${tail}`, "g"))) last = m.index;
  return last;
}

export interface ClassifiedDate {
  date: string;
  label: string;
}

/** Datums die nog komen, met wat voor datum het is. Hoogstens drie, de duidelijkste eerst. */
export function datesForAgenda(text: string, reference: string, today: string, horizonDays = 400): ClassifiedDate[] {
  const results: Array<ClassifiedDate & { rank: number }> = [];
  for (const found of findDates(text, reference)) {
    const ahead = daysBetween(today, found.date);
    if (ahead < 0 || ahead > horizonDays) continue;
    let best: { label: string; at: number; rank: number } | null = null;
    KINDS.forEach((kind, rank) => {
      for (const word of kind.words) {
        const at = lastWordIndex(found.before, word);
        if (at >= 0 && (!best || at > best.at)) best = { label: kind.label, at, rank };
      }
    });
    // Niets ervoor? Dan wat er direct na staat ("October 28 for listing of ...").
    if (!best) {
      KINDS.forEach((kind, rank) => {
        for (const word of kind.words) {
          const at = lastWordIndex(found.after, word);
          if (at >= 0 && (!best || at < best.at)) best = { label: kind.label, at, rank };
        }
      });
    }
    const period = UNTIL.test(found.before.slice(-12));
    const chosen = best as { label: string; at: number; rank: number } | null;
    let label = chosen?.label ?? (period ? "einde periode" : "datum uit bericht");
    if (period && chosen && !/einde|sluit|laatste/.test(label)) label = `${label} (einde)`;
    // De dagtekening van het bericht zelf is geen agendapunt.
    if (!chosen && found.date === reference && !period) continue;
    // Een periode zonder trefwoord ("van 8 tot 21 oktober") is nog altijd duidelijker dan een losse datum.
    results.push({ date: found.date, label, rank: chosen ? chosen.rank : period ? KINDS.length - 0.5 : KINDS.length });
  }
  const unique = new Map<string, ClassifiedDate & { rank: number }>();
  for (const result of results) {
    const key = result.date;
    const existing = unique.get(key);
    if (!existing || result.rank < existing.rank) unique.set(key, result);
  }
  const sorted = [...unique.values()].sort((a, b) => a.rank - b.rank || a.date.localeCompare(b.date));
  const specific = sorted.filter((r) => r.rank < KINDS.length);
  return (specific.length ? specific : sorted)
    .slice(0, 3)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(({ date, label }) => ({ date, label }));
}
