import unittest
from unittest.mock import patch

from premarket_alert.config import Config
from premarket_alert.providers.polygon import PolygonProvider
from premarket_alert.providers.tradingview import COLUMNS, TradingViewProvider


def tv_row(symbol="NASDAQ:ABCD", **overrides):
    values = {
        "name": symbol.split(":")[-1],
        "description": "Testbedrijf Inc",
        "exchange": symbol.split(":")[0],
        "type": "stock",
        "close": 3.0,
        "premarket_close": 6.0,
        "premarket_change": 100.0,
        "premarket_volume": 500_000,
        "market_cap_basic": 120_000_000,
    }
    values.update(overrides)
    return {"s": symbol, "d": [values[column] for column in COLUMNS]}


class TestTradingViewProvider(unittest.TestCase):
    def setUp(self):
        self.provider = TradingViewProvider(Config())

    def test_payload_asks_slightly_below_the_threshold(self):
        payload = self.provider.build_payload()
        change_filter = next(f for f in payload["filter"] if f["left"] == "premarket_change")
        self.assertEqual(change_filter["right"], 40.0)
        self.assertEqual(payload["sort"]["sortBy"], "premarket_change")

    def test_parses_rows(self):
        with patch("premarket_alert.providers.tradingview.request_json") as fetch:
            fetch.return_value = {"data": [tv_row(), tv_row("NYSE:WXYZ", premarket_change=61.5)]}
            movers = self.provider.fetch()

        self.assertEqual([m.symbol for m in movers], ["ABCD", "WXYZ"])
        self.assertEqual(movers[0].exchange, "NASDAQ")
        self.assertAlmostEqual(movers[1].change_pct, 61.5)
        self.assertIn("NASDAQ%3AABCD", movers[0].chart_url)

    def test_skips_rows_without_premarket_data(self):
        with patch("premarket_alert.providers.tradingview.request_json") as fetch:
            fetch.return_value = {
                "data": [
                    tv_row(premarket_change=None),
                    tv_row("NYSE:NOPE", premarket_close=None),
                    tv_row("NYSE:ZERO", close=0),
                    {"s": "NYSE:SHORT", "d": [1, 2]},
                    tv_row("NYSE:GOED"),
                ]
            }
            movers = self.provider.fetch()

        self.assertEqual([m.symbol for m in movers], ["GOED"])

    def test_handles_empty_response(self):
        with patch("premarket_alert.providers.tradingview.request_json", return_value={}):
            self.assertEqual(self.provider.fetch(), [])

    def test_label_product_is_appended_once(self):
        with patch("premarket_alert.providers.tradingview.request_json") as fetch:
            fetch.return_value = {"data": []}
            self.provider.fetch()
        self.assertIn("label-product=screener-stock", fetch.call_args.args[0])


class TestPolygonProvider(unittest.TestCase):
    def setUp(self):
        self.provider = PolygonProvider(Config(provider="polygon", polygon_api_key="k"))

    def test_uses_minute_bar_during_premarket(self):
        entry = {
            "ticker": "ABCD",
            "prevDay": {"c": 4.0},
            "day": {"c": 0, "v": 800_000},
            "min": {"c": 7.0},
            "lastTrade": {"p": 6.9},
        }
        with patch("premarket_alert.providers.polygon.request_json", return_value={"tickers": [entry]}):
            movers = self.provider.fetch()

        self.assertEqual(len(movers), 1)
        self.assertAlmostEqual(movers[0].price, 7.0)
        self.assertAlmostEqual(movers[0].change_pct, 75.0)
        self.assertEqual(movers[0].volume, 800_000)

    def test_falls_back_to_last_trade(self):
        entry = {"ticker": "ABCD", "prevDay": {"c": 2.0}, "day": {"c": 0, "v": 0}, "lastTrade": {"p": 5.0}}
        with patch("premarket_alert.providers.polygon.request_json", return_value={"tickers": [entry]}):
            movers = self.provider.fetch()
        self.assertAlmostEqual(movers[0].change_pct, 150.0)

    def test_skips_unusable_entries(self):
        entries = [
            {"ticker": "NOPREV", "prevDay": {"c": 0}, "min": {"c": 5.0}},
            {"ticker": "NOPRICE", "prevDay": {"c": 3.0}, "day": {}, "min": {}, "lastTrade": {}},
        ]
        with patch("premarket_alert.providers.polygon.request_json", return_value={"tickers": entries}):
            self.assertEqual(self.provider.fetch(), [])


if __name__ == "__main__":
    unittest.main()
