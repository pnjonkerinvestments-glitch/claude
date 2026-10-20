export interface Env {
  DB: D1Database;
  /** Binding naar deze Worker zelf, voor de screener-run met een eigen budget. */
  SELF?: Fetcher;
  TELEGRAM_BOT_TOKEN?: string;
  /** Optioneel: vaste chat. Zonder deze secret wordt de eerste chat die /start stuurt de eigenaar. */
  TELEGRAM_CHAT_ID?: string;
  NEWS_LANGS?: string;
  TIMEZONE?: string;
  MAX_AGE_HOURS?: string;
  MAX_REQUESTS?: string;
  MAX_ALERTS_PER_SYMBOL?: string;
  STORY_DETAILS?: string;
  WATCHLIST?: string;
  SCREEN_MARKETS?: string;
  SCREEN_FEEDS?: string;
  SCREEN_CAP_MIN_EUR?: string;
  SCREEN_CAP_MAX_EUR?: string;
  SCREEN_COUNTRIES?: string;
  OCHTEND_TIJD?: string;
  OCHTEND_DIVIDEND_PCT?: string;
  AGENDA_DAGEN?: string;
}

export interface Feed {
  lang: string;
  /** ISO-landcodes zoals TradingView ze gebruikt (GB, niet UK), gesorteerd. */
  countries: string[];
}

export interface Config {
  langs: string[];
  timeZone: string;
  /** Berichten die ouder zijn dan dit worden stil als gezien gemarkeerd. */
  maxAgeSeconds: number;
  /** Bovengrens voor TradingView-verzoeken per run (Workers Free staat 50 subrequests toe). */
  maxRequests: number;
  maxAlertsPerSymbol: number;
  storyDetails: boolean;
  /** Startlijst, alleen gebruikt zolang er nog nooit een lijst is opgeslagen. */
  seedWatchlist: Array<{ symbol: string; name: string }>;
  /** Screener-markten van TradingView, bijvoorbeeld "germany" of "uk". */
  screenMarkets: string[];
  /** Nieuwsstromen voor de screener: per taal een set landen. */
  screenFeeds: Feed[];
  capMinEur: number;
  capMaxEur: number;
  /**
   * Land van het bedrijf zelf (zoals TradingView het noemt). Een beurs in Londen of Stockholm
   * heeft ook bedrijven uit de VS, Ierland, Cyprus of Bermuda; die vallen hiermee af.
   */
  screenCountries: string[];
  /** Tijd van het ochtendoverzicht in minuten na middernacht (08:40 = 520), lokale tijd. */
  digestMinutes: number;
  /** Speciaal dividend telt mee vanaf dit deel van de koers (0,25 = 25%). */
  dividendRatio: number;
  /** Zoveel dagen vooruit staat de agenda in het ochtendoverzicht. */
  agendaDays: number;
}

export const DEFAULT_MARKETS =
  "germany,france,italy,spain,portugal,netherlands,belgium,luxembourg,denmark,sweden,norway,finland,uk,switzerland,austria";
// Faeröer en Groenland horen bij Denemarken, Åland bij Finland.
export const DEFAULT_COUNTRIES =
  "Germany,France,Italy,Spain,Portugal,Netherlands,Belgium,Luxembourg,Denmark,Sweden,Norway,Finland," +
  "United Kingdom,Switzerland,Austria,Faroe Islands,Greenland,Aland Islands";
// Eén Engelse stroom voor alle landen, plus de landstalen die TradingView kent
// (Zweeds en Nederlands bestaan daar niet als nieuwstaal).
export const DEFAULT_FEEDS =
  "en:AT,BE,CH,DE,DK,ES,FI,FR,GB,IT,LU,NL,NO,PT,SE; de:AT,CH,DE; fr:BE,CH,FR,LU; it:IT; es:ES; pt:PT";

/**
 * Standaardfilters. Elk filter wordt één keer aangemaakt (ook bij een bestaande installatie);
 * wat de groep daarna toevoegt of weghaalt blijft staan. Matchen is hoofdletter- en
 * accentongevoelig, en een woord vindt ook langere vormen (Insolvenz → Insolvenzantrag).
 * De lijsten zijn getest tegen ruim 8.000 echte TradingView-koppen.
 */
export const DEFAULT_FILTERS: Record<string, string[]> = {
  dividend: [
    // Engels
    "special dividend", "extraordinary dividend", "extra dividend", "one-off dividend", "one-time dividend",
    "bonus dividend", "special distribution", "special cash dividend",
    // Duits
    "Sonderdividende", "Sonderausschüttung", "Bonusdividende", "Zusatzdividende", "Superdividende",
    // Frans
    "dividende exceptionnel", "dividendes exceptionnels", "dividende extraordinaire", "dividende spécial",
    // Italiaans
    "dividendo straordinario", "dividendi straordinari", "dividendo speciale",
    // Spaans en Portugees
    "dividendo extraordinario", "dividendos extraordinarios", "dividendo especial",
    // Nederlands en Scandinavisch (voor koppen die toch in de landstaal binnenkomen)
    "speciaal dividend", "extra utdelning", "extrautdelning", "ekstraordinært utbytte", "tilleggsutbytte",
    "ekstraordinært udbytte", "ekstraudbytte", "lisäosinko",
  ],
  insolventie: [
    // Engels
    "insolvency", "insolvent", "bankrupt", "into administration", "administrators", "liquidation", "liquidator",
    "receivership", "chapter 11", "going concern",
    // Duits
    "Insolvenz", "Zahlungsunfähigkeit", "zahlungsunfähig", "Überschuldung", "Schutzschirmverfahren", "Eigenverwaltung",
    "StaRUG", "Konkurs",
    // Frans
    "faillite", "insolvabilité", "redressement judiciaire", "procédure de sauvegarde", "cessation des paiements",
    // Italiaans
    "insolvenza", "fallimento", "concordato preventivo", "liquidazione giudiziale", "composizione negoziata",
    // Spaans en Portugees
    "insolvencia", "concurso de acreedores", "quiebra", "preconcurso", "insolvência", "falência",
    // Nederlands, Scandinavisch en Fins
    "faillissement", "failliet", "surseance", "företagsrekonstruktion", "rekonstruktion", "rekonstruksjon",
    "tvangsakkord", "konkurssi", "yrityssaneeraus",
  ],
  emissie: [
    // Engels (Londen: "placing", Scandinavië: "rights issue", "directed share issue")
    "share offering", "equity offering", "public offering", "secondary offering", "placing", "private placement",
    "capital increase", "capital raise", "rights issue", "accelerated bookbuild", "bookbuilding", "directed issue",
    "share issue", "issue of new shares", "fundraise", "fundraising", "open offer",
    // Duits
    "Kapitalerhöhung", "Platzierung", "Privatplatzierung", "Bezugsrecht", "Bezugsangebot",
    // Frans
    "augmentation de capital", "placement privé", "émission d'actions",
    // Italiaans
    "aumento di capitale", "aumento capitale", "collocamento",
    // Spaans en Portugees
    "ampliación de capital", "aumento de capital", "colocación acelerada", "colocación de acciones",
    // Nederlands, Scandinavisch en Fins
    "claimemissie", "aandelenemissie", "nyemission", "riktad emission", "företrädesemission", "emisjon",
    "kapitalforhøjelse", "rettet emission", "osakeanti",
  ],
  // Claimemissies: emissies waarbij aandeelhouders (verhandelbare) rechten krijgen. Zie ook EXCLUDE
  // ("unter Ausschluss des Bezugsrechts" is juist géén claimemissie) en de rechtenkalender.
  claim: [
    // Engels
    "rights issue", "rights offering", "rights offer", "subscription rights", "pre-emptive rights",
    "rights trading", "nil paid rights",
    // Duits
    "Bezugsangebot", "Bezugsrechtsemission", "Bezugsrechtskapitalerhöhung", "Bezugsfrist", "Bezugsrechtshandel",
    "mit Bezugsrecht", "Bezugsrecht", "Bezugsrechte",
    // Frans
    "droit préférentiel de souscription", "droits préférentiels de souscription", "maintien du DPS", "avec DPS",
    "droits de souscription",
    // Italiaans
    "in opzione", "diritti di opzione", "diritto di opzione", "offerta in opzione",
    // Spaans en Portugees
    "derechos de suscripción preferente", "derechos de suscripción", "direitos de subscrição", "direitos de preferência",
    // Nederlands, Scandinavisch en Fins
    "claimemissie", "claimrechten", "företrädesemission", "teckningsrätter", "uniträtter", "fortrinnsrettsemisjon",
    "fortrinnsrett", "tegningsretter", "tegningsrettighedsemission", "fortegningsret", "merkintäoikeusanti",
    "merkintäoikeudet",
  ],
  // Werkt standaard over al het Europese nieuws, niet alleen de selectie (zie /bereik).
  // Getest tegen ruim 10.000 koppen: "debut", "listing", "cotation" en "admission to trading"
  // gaven vooral ruis (Frans "début", obligaties, handelsstops) en staan er bewust niet in.
  ipo: [
    // Engels ("IPO" telt alleen als heel woord, niet in "ipotesi")
    "IPO", "IPOs", "initial public offering", "intention to float", "market debut", "trading debut",
    "begins trading on", "completes listing", "flotation", "first day of trading",
    // Duits
    "Börsengang", "Erstnotiz", "Börsendebüt", "Börsenneuling", "Börsenaspirant",
    // Frans
    "introduction en bourse", "première cotation",
    // Italiaans
    "quotazione in borsa", "quotazione a Piazza Affari", "prepara quotazione", "verso la quotazione", "debutto",
    // Spaans en Portugees
    "salida a bolsa", "OPV", "estreno bursátil", "debut bursátil", "oferta pública inicial", "entrada em bolsa",
    // Nederlands, Scandinavisch en Fins
    "beursgang", "beursnotering", "börsnotering", "børsnotering", "listautumisanti", "listautuminen",
  ],
  // De filters hieronder komen standaard alleen in het ochtendoverzicht (zie /direct).
  // Getest tegen ruim 12.000 koppen: "Übernahme", "OPS" ("Squarepoint Ops LLC") en "public offer"
  // (aandelenemissies) gaven vooral ruis.
  overname: [
    // Engels (Londen: Rule 2.7 = vast bod, Rule 2.4 = mogelijk bod, PUSU = deadline voor een bod)
    "takeover", "tender offer", "recommended offer", "recommended cash offer", "cash offer", "Rule 2.7",
    "Rule 2.4", "possible offer", "firm offer", "firm intention", "offer period", "acceptance period", "PUSU",
    "put up or shut up", "squeeze-out", "squeeze out", "delisting", "merger agreement", "scheme of arrangement",
    "recommended acquisition", "recommended cash acquisition", "recommended final offer", "possible cash offer",
    "statement regarding possible offer", "statement re possible offer", "scheme document", "court sanction",
    "unconditional offer", "offer unconditional", "increased offer", "revised offer", "competing offer",
    "hostile bid", "takeover bid", "bid for", "agreed to be acquired", "to be acquired by", "acquisition proposal",
    // Duits
    "Übernahmeangebot", "Pflichtangebot", "Erwerbsangebot", "Delisting-Angebot", "Annahmefrist", "Angebotsunterlage",
    "Beherrschungsvertrag", "Barabfindung",
    // Frans
    "offre publique", "OPA", "OPAS", "OPR", "retrait obligatoire",
    // Italiaans
    "offerta pubblica di acquisto", "offerta pubblica di scambio", "offerta pubblica totalitaria",
    // Spaans en Portugees
    "oferta pública de adquisición", "oferta pública de aquisição", "exclusión de cotización",
    // Nederlands, Scandinavisch en Fins
    "openbaar bod", "uppköpserbjudande", "offentligt erbjudande", "frivillig tilbud", "pliktig tilbud",
    "overtagelsestilbud", "købstilbud", "ostotarjous",
  ],
  splitsing: [
    // Afsplitsingen
    "spin-off", "spinoff", "spin off", "demerger", "Abspaltung", "scission", "scissione", "escisión", "cisão",
    "afsplitsing",
    // Reverse splits (samenvoegen) en gewone splits
    "reverse split", "reverse stock split", "share consolidation", "consolidation of shares", "Aktienzusammenlegung",
    "Zusammenlegung", "regroupement d'actions", "raggruppamento", "contrasplit", "agrupación de acciones",
    "sammanläggning", "omvänd split", "stock split", "share split", "Aktiensplit", "division du nominal",
    "frazionamento", "aktiesplit", "aksjesplitt",
  ],
  handelsstop: [
    "trading halt", "halted", "suspension of trading", "trading suspended", "temporary suspension",
    "suspension from trading", "suspension of listing", "restoration of trading", "restoration of listing",
    "trading resumed", "resumption of trading", "Handelsaussetzung", "Handel ausgesetzt", "Aussetzung des Handels",
    "Wiederaufnahme des Handels", "suspension de cotation", "reprise de cotation", "suspension du cours",
    "sospensione dalle negoziazioni", "sospeso dalle negoziazioni", "riammissione alle negoziazioni",
    "suspensión de cotización", "suspensión cautelar", "suspensão da negociação", "handelsstopp", "handelsstop",
    "observation status", "observationsstatus",
  ],
  // "MAR" alleen gaf vooral insidermeldingen ("Artikel 19 MAR"), "Ad-hoc" alleen ook "Ad-hoc-Gruppe".
  adhoc: [
    "Adhoc", "Ad-hoc-Mitteilung", "Ad hoc-Mitteilung", "ad hoc announcement", "inside information",
    "Insiderinformation", "information privilégiée", "informazione privilegiata", "información privilegiada",
    "informação privilegiada", "sisäpiiritieto", "innsideinformasjon", "intern viden", "voorwetenschap",
  ],
  index: [
    "index inclusion", "index changes", "index review", "Indexaufnahme", "Indexänderung", "INDEX-MONITOR",
    "in den SDax", "in den MDax", "in den TecDax", "in den Dax", "aus dem SDax", "aus dem MDax", "aus dem Dax",
    "to join FTSE", "join the FTSE", "promoted to the FTSE", "relegated from the FTSE", "intègre les indices",
    "intègre l'indice", "intégrer les indices", "intégrer l'indice", "dans le SBF 120", "dans le CAC",
    "entra nel Ftse", "esce dal Ftse", "entrará en el Ibex", "saldrá del Ibex", "AMX", "AScX", "OMXS30",
  ],
  // FDA en EMA, maar ook studieresultaten. "approval" en "Studie" alleen gaven vooral ruis.
  fda: [
    "FDA", "PDUFA", "EMA", "CHMP", "positive opinion", "marketing authorisation", "marketing authorization",
    "Breakthrough Therapy", "Orphan Drug", "NDA", "BLA", "complete response letter", "CE mark",
    "Zulassungsantrag", "EU-Zulassung", "FDA-Zulassung", "Marktzulassung", "Zulassungserweiterung",
    "erhält Zulassung", "autorisation de mise sur le marché", "AMM", "AIFA", "Swissmedic", "MHRA",
    "topline results", "top-line results", "Phase 3", "Phase III", "Phase 2", "Phase II", "pivotal",
    "primary endpoint", "Studienergebnisse", "Studiendaten", "étude de phase", "studio di fase", "ensayo de fase",
  ],
  // Dubbele noteringen, overstap naar een andere beurs of ander segment, en aangekondigde noteringen.
  // "listing" alleen gaf ruis ("Block Listings", "Nasdaq Listing Rule"), "admission to trading" vooral obligaties.
  notering: [
    "dual listing", "secondary listing", "second listing", "parallel listing", "Zweitnotierung", "Zweitlisting",
    "Doppelkotierung", "Doppelnotierung", "Sekundärkotierung", "Kotierung an der", "Kotierungsgesuch", "uplisting",
    "listing of", "listing on", "listing in", "intends to list", "plans to list", "intention to list",
    "Main Market", "Prime Standard", "Segmentwechsel", "Notierungsaufnahme", "Handelsaufnahme", "Börsennotierung",
    "cotation secondaire", "double cotation", "transfert sur Euronext", "transfert de cotation", "translisting",
    "listing transfer", "starts trading on", "doble cotización", "dubbele notering", "listbyte", "planerad notering",
  ],
};

/**
 * Vaste patronen naast de woorden, voor koppen die je met losse woorden niet goed vangt
 * (filternaam → patronen). Op dit moment geen.
 */
export const PATTERNS: Record<string, Array<{ label: string; pattern: RegExp }>> = {};

/**
 * Woorden die een treffer van dat filter juist tegenhouden. "Barkapitalerhöhung unter Ausschluss
 * des Bezugsrechts" is een gewone emissie, geen claimemissie; "Ausübung Bezugsrechte" is een
 * insider die zijn rechten uitoefent.
 */
export const EXCLUDE: Record<string, string[]> = {
  // Obligaties zijn geen aandelenemissie of overname ("Avviato collocamento sindacato AT1",
  // "Notice to Noteholders and Delisting of Notes").
  emissie: [
    "AT1", "Tier 1", "Tier 2", "bond", "bonds", "green bond", "obbligazion", "Anleihe", "Schuldverschreibung",
    "Schuldschein", "senior notes", "senior unsecured", "EMTN", "covered bond", "obligations", "noteholders",
  ],
  overname: ["noteholders", "of notes", "bond", "bonds", "obbligazion", "Anleihe", "Form 8.3", "Form 8 (OPD)"],
  claim: [
    "Ausschluss des Bezugsrechts", "Ausschluss der Bezugsrechte", "ohne Bezugsrecht", "Ausübung Bezugsrechte",
    "Ausübung von Bezugsrechten", "senza diritto di opzione", "esclusione del diritto di opzione", "sans DPS",
    "suppression du droit préférentiel", "suppression du DPS", "non-pre-emptive", "disapplication of pre-emption",
    "exclusión del derecho de suscripción", "utan företrädesrätt", "rettet emisjon", "directed issue",
  ],
};

/** Filters die niet meer bestaan; bij een bestaande installatie worden ze eenmalig weggehaald. */
export const RETIRED_FILTERS = ["insider"];

/**
 * Beurzen waarvan een filter niets wil horen: emissies in Londen (dagelijks tientallen placings
 * van kleine AIM-fondsen). Ook koppen zonder aandeel met het Londense "REG - "-voorvoegsel tellen
 * dan niet.
 */
export const EXCLUDED_EXCHANGES: Record<string, string[]> = {
  emissie: ["LSE", "AQUIS"],
  claim: ["LSE", "AQUIS"],
};

/** Filters die standaard niet direct melden, maar alleen in het ochtendoverzicht staan. */
export const DEFAULT_DIGEST_ONLY = ["overname", "splitsing", "handelsstop", "adhoc", "index", "fda", "notering"];
/**
 * Filters die standaard over al het Europese nieuws werken, niet alleen over de selectie: een
 * claimemissie van Unipol (€23 mld) of een Brits bod van €2 mld valt ver buiten de small caps.
 */
export const DEFAULT_EUROPE_FILTERS = ["ipo", "notering", "emissie", "claim", "overname"];

/**
 * Minimale marktwaarde (euro) per filter; kleinere bedrijven geven geen treffer. Bij een bedrijf
 * dat nog niet genoteerd is (IPO), telt de waardering uit de kop of het bericht ("valued at
 * SEK 675M"). Is de grootte onbekend, dan blijft de treffer staan. Aanpasbaar met /minimum.
 */
export const DEFAULT_MIN_CAP: Record<string, number> = {
  emissie: 40e6,
  claim: 40e6,
  ipo: 100e6,
  // Ook voor de blokken Nieuw op de beurs en Nieuwe en dubbele noteringen in het ochtendoverzicht.
  notering: 1e9,
  overname: 250e6,
};

export function parseFeeds(raw: string): Feed[] {
  return raw
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [lang, list = ""] = part.split(":");
      const countries = list
        .split(",")
        .map((c) => c.trim().toUpperCase())
        .filter((c) => /^[A-Z]{2}$/.test(c))
        .sort();
      return { lang: lang.trim().toLowerCase(), countries };
    })
    .filter((feed) => /^[a-z]{2}$/.test(feed.lang) && feed.countries.length > 0);
}

function number(raw: string | undefined, fallback: number): number {
  const value = Number(raw);
  return raw !== undefined && raw.trim() !== "" && Number.isFinite(value) && value > 0 ? value : fallback;
}

export function parseWatchlist(raw: string | undefined): Array<{ symbol: string; name: string }> {
  if (!raw) return [];
  return raw
    .split(/[;\n]/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [symbol, ...name] = part.split("=");
      return { symbol: symbol.trim().toUpperCase(), name: name.join("=").trim() };
    })
    .filter((entry) => /^[A-Z0-9_.!-]+:[A-Z0-9_.!/-]+$/.test(entry.symbol));
}

/** "08:40" → 520; ongeldig → terugval. */
export function parseClock(raw: string | undefined, fallback: number): number {
  const match = raw?.trim().match(/^(\d{1,2})[:.](\d{2})$/);
  if (!match) return fallback;
  const minutes = Number(match[1]) * 60 + Number(match[2]);
  return Number(match[1]) < 24 && Number(match[2]) < 60 ? minutes : fallback;
}

export function loadConfig(env: Env): Config {
  const langs = (env.NEWS_LANGS ?? "de,en")
    .split(",")
    .map((lang) => lang.trim().toLowerCase())
    .filter((lang) => lang === "" || /^[a-z]{2}(-[a-z]{2})?$/.test(lang));
  return {
    langs: langs.length ? [...new Set(langs)] : ["de", "en"],
    timeZone: env.TIMEZONE?.trim() || "Europe/Amsterdam",
    maxAgeSeconds: number(env.MAX_AGE_HOURS, 24) * 3600,
    maxRequests: Math.floor(number(env.MAX_REQUESTS, 30)),
    maxAlertsPerSymbol: Math.floor(number(env.MAX_ALERTS_PER_SYMBOL, 5)),
    storyDetails: (env.STORY_DETAILS ?? "true").trim().toLowerCase() !== "false",
    seedWatchlist: parseWatchlist(env.WATCHLIST),
    screenMarkets: (env.SCREEN_MARKETS ?? DEFAULT_MARKETS)
      .split(",")
      .map((m) => m.trim().toLowerCase())
      .filter((m) => /^[a-z_]+$/.test(m)),
    screenFeeds: parseFeeds(env.SCREEN_FEEDS ?? DEFAULT_FEEDS),
    capMinEur: number(env.SCREEN_CAP_MIN_EUR, 2_500_000),
    capMaxEur: number(env.SCREEN_CAP_MAX_EUR, 500_000_000),
    screenCountries: (env.SCREEN_COUNTRIES ?? DEFAULT_COUNTRIES)
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean),
    digestMinutes: parseClock(env.OCHTEND_TIJD, 8 * 60 + 40),
    dividendRatio: number(env.OCHTEND_DIVIDEND_PCT, 25) / 100,
    agendaDays: Math.floor(number(env.AGENDA_DAGEN, 7)),
  };
}
