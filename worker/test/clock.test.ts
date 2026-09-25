import assert from "node:assert/strict";
import { test } from "node:test";
import { inPremarketWindow, isHoliday, isTradingDay, sessionDate, stamp, toEt } from "../src/clock.ts";

const utc = (iso: string) => new Date(`${iso}Z`);

test("weekend is geen handelsdag", () => {
  assert.equal(isTradingDay(toEt(utc("2026-09-12T15:00"))), false); // zaterdag
  assert.equal(isTradingDay(toEt(utc("2026-09-13T15:00"))), false); // zondag
  assert.equal(isTradingDay(toEt(utc("2026-09-14T15:00"))), true); // maandag
});

test("feestdagen", () => {
  assert.equal(isHoliday(toEt(utc("2026-11-26T15:00"))), true); // Thanksgiving
  assert.equal(isHoliday(toEt(utc("2026-07-03T15:00"))), true); // 4 juli valt op zaterdag
  assert.equal(isHoliday(toEt(utc("2026-07-06T15:00"))), false);
  assert.equal(isHoliday(toEt(utc("2099-12-25T15:00"))), false); // onbekend jaar
});

test("grenzen van het venster in zomertijd (UTC-4)", () => {
  assert.equal(inPremarketWindow(utc("2026-09-14T07:59")), false);
  assert.equal(inPremarketWindow(utc("2026-09-14T08:00")), true);
  assert.equal(inPremarketWindow(utc("2026-09-14T13:29")), true);
  assert.equal(inPremarketWindow(utc("2026-09-14T13:30")), false);
});

test("grenzen van het venster in wintertijd (UTC-5)", () => {
  assert.equal(inPremarketWindow(utc("2026-12-14T08:59")), false);
  assert.equal(inPremarketWindow(utc("2026-12-14T09:00")), true);
  assert.equal(inPremarketWindow(utc("2026-12-14T14:29")), true);
  assert.equal(inPremarketWindow(utc("2026-12-14T14:30")), false);
});

test("venster dicht op een feestdag", () => {
  assert.equal(inPremarketWindow(utc("2026-11-26T13:00")), false);
});

test("handelsdag volgt de New Yorkse datum", () => {
  assert.equal(sessionDate(utc("2026-09-14T08:00")), "2026-09-14");
  assert.equal(sessionDate(utc("2026-09-14T02:00")), "2026-09-13");
});

test("tijdstempel in ET", () => {
  assert.equal(stamp(utc("2026-09-14T11:42")), "14-09-2026 07:42");
});
