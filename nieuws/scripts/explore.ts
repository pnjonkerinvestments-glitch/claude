// Tijdelijk: hoe zit de directors-dealings-pagina van innoscripta in elkaar, en staat het al op TradingView?
import { fetchNews } from "../src/tradingview.ts";
// eslint-disable-next-line
const _ua = { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36", Accept: "text/html,application/xhtml+xml" };
// Staan directors' dealings van innoscripta al in het TradingView-nieuws?
for (const lang of ["de", "en"]) {
  const items = await fetchNews(fetch, "XETR:1INN", lang);
  const dd = items.filter((i) => /dealing|managers|eigengesch|-DD:|directors|art\.? 19/i.test(i.title));
  console.log(`\nTradingView ${lang}: ${items.length} berichten, waarvan DD-achtig ${dd.length}`);
  for (const i of dd.slice(0, 10)) console.log(" ", new Date(i.published * 1000).toISOString(), `[${i.provider}]`, i.title, i.link ?? "");
  for (const i of items.slice(0, 5)) console.log("  (recent)", new Date(i.published * 1000).toISOString(), i.title.slice(0, 120));
}
export {};
