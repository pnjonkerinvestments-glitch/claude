import type { Config } from "./config.ts";
import { chartUrl, dollarVolume, type Mover } from "./models.ts";
import { sendMail, type Connect } from "./smtp.ts";

const fmtInt = (n: number) => Math.round(n).toLocaleString("en-US");
const fmtMoney = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function fmtCap(value: number | null): string {
  if (!value) return "-";
  for (const [unit, size] of [["T", 1e12], ["B", 1e9], ["M", 1e6], ["K", 1e3]] as const) {
    if (value >= size) return `$${(value / size).toFixed(1)}${unit}`;
  }
  return `$${value.toFixed(0)}`;
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#x27;" })[c]!);

export function buildSubject(movers: Mover[], cfg: Config): string {
  if (movers.length === 1) {
    const m = movers[0]!;
    return `${cfg.subjectPrefix} ${m.symbol} +${m.changePct.toFixed(0)}% premarket`;
  }
  const names = movers.slice(0, 3).map((m) => m.symbol).join(", ");
  const extra = movers.length > 3 ? ` +${movers.length - 3}` : "";
  return `${cfg.subjectPrefix} ${movers.length} stijgers >${cfg.thresholdPct.toFixed(0)}%: ${names}${extra}`;
}

export function buildText(movers: Mover[], cfg: Config, when: string): string {
  const lines = [`Premarket-stijgers boven ${cfg.thresholdPct.toFixed(0)}% (${when} ET)`, ""];
  for (const m of movers) {
    lines.push(`${m.symbol} (${m.exchange || "US"})  +${m.changePct.toFixed(1)}%`);
    if (m.name) lines.push(`  ${m.name}`);
    lines.push(
      `  koers $${fmtMoney(m.price)} (vorige slot $${fmtMoney(m.prevClose)})`,
      `  premarket volume ${fmtInt(m.volume)} | omzet $${fmtInt(dollarVolume(m))} | cap ${fmtCap(m.marketCap)}`,
      `  ${chartUrl(m)}`,
      "",
    );
  }
  lines.push("Geen handelsadvies - controleer altijd zelf het nieuws en de liquiditeit.");
  return lines.join("\n");
}

export function buildHtml(movers: Mover[], cfg: Config, when: string): string {
  const cell = "padding:8px 10px;border-bottom:1px solid #e5e7eb";
  const sub = "color:#6b7280;font-size:12px";
  const rows = movers.map(
    (m) =>
      "<tr>" +
      `<td style="${cell}"><a href="${escapeHtml(chartUrl(m))}" ` +
      `style="font-weight:600;color:#1d4ed8;text-decoration:none">${escapeHtml(m.symbol)}</a>` +
      `<div style="${sub}">${escapeHtml(m.name.slice(0, 48))}</div></td>` +
      `<td style="${cell};text-align:right;color:#15803d;font-weight:700">+${m.changePct.toFixed(1)}%</td>` +
      `<td style="${cell};text-align:right">$${fmtMoney(m.price)}` +
      `<div style="${sub}">was $${fmtMoney(m.prevClose)}</div></td>` +
      `<td style="${cell};text-align:right">${fmtInt(m.volume)}` +
      `<div style="${sub}">${fmtCap(m.marketCap)}</div></td>` +
      "</tr>",
  );
  const header = (
    [
      ["Ticker", "left"],
      ["Premarket", "right"],
      ["Koers", "right"],
      ["Volume", "right"],
    ] as const
  )
    .map(
      ([label, align]) =>
        `<th style="padding:8px 10px;text-align:${align};border-bottom:2px solid #111827;font-size:12px;` +
        `text-transform:uppercase;letter-spacing:.04em;color:#374151">${label}</th>`,
    )
    .join("");
  return (
    '<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:640px;color:#111827">' +
    `<h2 style="margin:0 0 4px">Premarket-stijgers &gt; ${cfg.thresholdPct.toFixed(0)}%</h2>` +
    `<p style="margin:0 0 16px;color:#6b7280;font-size:13px">${escapeHtml(when)} ET</p>` +
    `<table style="border-collapse:collapse;width:100%;font-size:14px"><thead><tr>${header}</tr></thead>` +
    `<tbody>${rows.join("")}</tbody></table>` +
    '<p style="margin:16px 0 0;color:#6b7280;font-size:12px">Geen handelsadvies. Premarket-volume is dun; ' +
    "controleer het nieuws en de spread voordat je iets doet.</p></div>"
  );
}

function base64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

const wrap76 = (s: string) => s.replace(/.{1,76}/g, "$&\r\n");

/** RFC 2047-codering, alleen als de header niet-ASCII bevat. */
function encodeHeader(value: string): string {
  return /^[\x20-\x7e]*$/.test(value) ? value : `=?UTF-8?B?${base64(value)}?=`;
}

/** RFC 5322-datum, bv. "Fri, 25 Sep 2026 10:03:12 +0000". */
const rfc5322Date = (d: Date) => d.toUTCString().replace(/GMT$/, "+0000");

export function buildMessage(movers: Mover[], cfg: Config, when: string, now = new Date()): string {
  const boundary = `=_roviko_${crypto.randomUUID()}`;
  const domain = cfg.mailFrom.split("@")[1] || "roviko.workers.dev";
  const part = (type: string, body: string) =>
    `--${boundary}\r\nContent-Type: ${type}; charset=utf-8\r\nContent-Transfer-Encoding: base64\r\n\r\n` +
    wrap76(base64(body));
  return [
    `From: ${cfg.mailFrom}`,
    `To: ${cfg.mailTo.join(", ")}`,
    `Subject: ${encodeHeader(buildSubject(movers, cfg))}`,
    `Date: ${rfc5322Date(now)}`,
    `Message-ID: <${crypto.randomUUID()}@${domain}>`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    part("text/plain", buildText(movers, cfg, when)) +
      part("text/html", buildHtml(movers, cfg, when)) +
      `--${boundary}--\r\n`,
  ].join("\r\n");
}

/** Verstuurt de mail, of geeft bij DRY_RUN alleen de tekst terug. */
export async function sendEmail(
  movers: Mover[],
  cfg: Config,
  when: string,
  connect: Connect,
  log: (msg: string) => void,
): Promise<void> {
  if (cfg.dryRun) {
    log(`[DRY RUN] Onderwerp: ${buildSubject(movers, cfg)}\n${buildText(movers, cfg, when)}`);
    return;
  }
  await sendMail(connect, {
    host: cfg.smtpHost,
    port: cfg.smtpPort,
    user: cfg.smtpUser,
    password: cfg.smtpPassword,
    from: cfg.mailFrom,
    to: cfg.mailTo,
    data: buildMessage(movers, cfg, when),
  });
  log(`Mail verstuurd naar ${cfg.mailTo.join(", ")} (${movers.length} tickers)`);
}
