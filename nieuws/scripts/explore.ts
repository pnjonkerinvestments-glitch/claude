// Tijdelijk: hoe zit de directors-dealings-pagina van innoscripta in elkaar, en staat het al op TradingView?
import { fetchNews } from "../src/tradingview.ts";
const ua = { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36", Accept: "text/html,application/xhtml+xml" };
for (const url of [
  "https://www.innoscripta.com/en-de/investors/investor-news/directors-dealings",
  "https://www.innoscripta.com/de-de/investoren/investor-news/directors-dealings",
]) {
  const r = await fetch(url, { headers: ua, redirect: "follow" });
  const html = await r.text();
  console.log(`\n### ${url}\nHTTP ${r.status} ${r.headers.get("content-type")} ${html.length} bytes, final ${r.url}`);
  const text = html.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<style[\s\S]*?<\/style>/g, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  const i = text.search(/directors|dealings|Eigengesch|managers/i);
  console.log("tekst rond 'dealings':", text.slice(Math.max(0, i - 200), i + 1500));
  for (const re of [/https?:\/\/[^"' )]*(eqs|cockpit|api|feed|rss|json|news)[^"' )]*/gi, /<iframe[^>]*>/gi, /\/_next\/data[^"']*/g, /__NEXT_DATA__/g, /data-[a-z-]*url="[^"]*"/gi]) {
    const found = [...new Set(html.match(re) ?? [])].slice(0, 15);
    console.log(String(re), found);
  }
  const pdfs = [...new Set(html.match(/https?:\/\/[^"' ]+\.pdf/gi) ?? [])];
  console.log("pdf-links:", pdfs.length, pdfs.slice(0, 8));
  const dates = [...new Set(text.match(/\b\d{1,2}[./]\d{1,2}[./]20\d\d\b|\b20\d\d-\d\d-\d\d\b|\b(January|February|March|April|May|June|July|August|September|October|November|December) \d{1,2}, 20\d\d/g) ?? [])];
  console.log("datums:", dates.slice(0, 20));
}
// Staan directors' dealings van innoscripta al in het TradingView-nieuws?
for (const lang of ["de", "en"]) {
  const items = await fetchNews(fetch, "XETR:1INN", lang);
  const dd = items.filter((i) => /dealing|managers|eigengesch|EQS-DD|directors|art\.? 19|MAR/i.test(i.title));
  console.log(`\nTradingView ${lang}: ${items.length} berichten, waarvan DD-achtig ${dd.length}`);
  for (const i of dd.slice(0, 10)) console.log(" ", new Date(i.published * 1000).toISOString(), `[${i.provider}]`, i.title, i.link ?? "");
  for (const i of items.slice(0, 5)) console.log("  (recent)", new Date(i.published * 1000).toISOString(), i.title.slice(0, 120));
}
export {};
