/** Tijdvenster van de Amerikaanse premarket (04:00-09:30 ET) en de NYSE-feestdagen. */

// NYSE/Nasdaq-feestdagen. Valt een feestdag op zaterdag, dan sluit de beurs de
// vrijdag ervoor -- behalve bij Nieuwjaarsdag. Valt hij op zondag, dan de maandag erna.
export const MARKET_HOLIDAYS: Record<number, readonly string[]> = {
  2026: ["01-01", "01-19", "02-16", "04-03", "05-25", "06-19", "07-03", "09-07", "11-26", "12-25"],
  2027: ["01-01", "01-18", "02-15", "03-26", "05-31", "06-18", "07-05", "09-06", "11-25", "12-24"],
  2028: ["01-17", "02-21", "04-14", "05-29", "06-19", "07-04", "09-04", "11-23", "12-25"],
  2029: ["01-01", "01-15", "02-19", "03-30", "05-28", "06-19", "07-04", "09-03", "11-22", "12-25"],
  2030: ["01-01", "01-21", "02-18", "04-19", "05-27", "06-19", "07-04", "09-02", "11-28", "12-25"],
};

const PREMARKET_OPEN = 4 * 60;
const REGULAR_OPEN = 9 * 60 + 30;

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const FORMAT = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  weekday: "short",
  hourCycle: "h23",
});

/** Een moment uitgedrukt in New Yorkse tijd. */
export interface EtTime {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  weekday: number; // 0 = zondag
}

export function toEt(moment: Date): EtTime {
  const parts: Record<string, string> = {};
  for (const part of FORMAT.formatToParts(moment)) parts[part.type] = part.value;
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    weekday: WEEKDAYS.indexOf(parts.weekday ?? ""),
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

/** True als de beurs die dag dicht is. Onbekende jaren tellen niet als feestdag. */
export function isHoliday(et: EtTime): boolean {
  return (MARKET_HOLIDAYS[et.year] ?? []).includes(`${pad(et.month)}-${pad(et.day)}`);
}

export function isTradingDay(et: EtTime): boolean {
  return et.weekday >= 1 && et.weekday <= 5 && !isHoliday(et);
}

/** True tussen 04:00 en 09:30 ET op een handelsdag. */
export function inPremarketWindow(moment: Date): boolean {
  const et = toEt(moment);
  if (!isTradingDay(et)) return false;
  const minutes = et.hour * 60 + et.minute;
  return minutes >= PREMARKET_OPEN && minutes < REGULAR_OPEN;
}

/** De handelsdag (ET) waar dit moment bij hoort, als YYYY-MM-DD. */
export function sessionDate(moment: Date): string {
  const et = toEt(moment);
  return `${et.year}-${pad(et.month)}-${pad(et.day)}`;
}

/** Tijdstempel voor in de mail, bv. "25-09-2026 07:42". */
export function stamp(moment: Date): string {
  const et = toEt(moment);
  return `${pad(et.day)}-${pad(et.month)}-${et.year} ${pad(et.hour)}:${pad(et.minute)}`;
}

export function holidaysKnown(moment: Date): boolean {
  return toEt(moment).year in MARKET_HOLIDAYS;
}
