import assert from "node:assert/strict";
import { test } from "node:test";
import { buildHtml, buildMessage, buildSubject, buildText, fmtCap } from "../src/notifier.ts";
import { config, mover } from "./helpers.ts";

const hit = mover({ symbol: "ABCD", name: "Testbedrijf Inc", price: 6, prevClose: 3.2, changePct: 87.5 });

test("onderwerp bij één en bij meerdere stijgers", () => {
  assert.equal(buildSubject([hit], config()), "[Premarket] ABCD +88% premarket");
  const many = ["A", "B", "C", "D", "E"].map((symbol) => mover({ symbol }));
  assert.equal(buildSubject(many, config()), "[Premarket] 5 stijgers >50%: A, B, C +2");
});

test("tekst bevat de getallen die ertoe doen", () => {
  const text = buildText([hit], config(), "14-09-2026 07:42");
  assert.match(text, /ABCD \(NASDAQ\) {2}\+87\.5%/);
  assert.match(text, /koers \$6\.00 \(vorige slot \$3\.20\)/);
  assert.match(text, /premarket volume 500,000 \| omzet \$3,000,000 \| cap \$120\.0M/);
  assert.match(text, /tradingview\.com\/chart\/\?symbol=NASDAQ%3AABCD/);
});

test("HTML escapet bedrijfsnamen", () => {
  const html = buildHtml([mover({ name: "<script>x</script> & Co" })], config(), "nu");
  assert.ok(!html.includes("<script>"));
  assert.ok(html.includes("&lt;script&gt;"));
});

test("bericht is multipart met tekst en HTML, en een geldige onderwerpregel", () => {
  const msg = buildMessage([hit], config({ subjectPrefix: "[Prémarket]" }), "nu", new Date("2026-09-14T11:42:00Z"));
  const split = msg.indexOf("\r\n\r\n");
  const headers = msg.slice(0, split);
  const body = msg.slice(split + 4);
  assert.match(headers, /^From: ik@example\.com$/m);
  assert.match(headers, /^Date: Mon, 14 Sep 2026 11:42:00 \+0000$/m);
  assert.match(headers, /^Subject: =\?UTF-8\?B\?.+\?=$/m);
  assert.match(headers, /^Content-Type: multipart\/alternative; boundary="(.+)"$/m);
  assert.match(body, /Content-Type: text\/plain; charset=utf-8/);
  assert.match(body, /Content-Type: text\/html; charset=utf-8/);
  assert.ok(msg.split("\r\n").every((line) => line.length <= 998));
  const boundary = headers.match(/boundary="(.+)"/)![1]!;
  assert.ok(msg.endsWith(`--${boundary}--\r\n`));
});

test("marktkapitalisatie leesbaar", () => {
  assert.equal(fmtCap(null), "-");
  assert.equal(fmtCap(1.5e9), "$1.5B");
  assert.equal(fmtCap(950), "$950");
});
