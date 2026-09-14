import unittest

from premarket_alert.config import Config
from premarket_alert.models import Mover
from premarket_alert.scanner import passes_filters, select


def mover(**kwargs) -> Mover:
    defaults = dict(
        symbol="ABCD",
        exchange="NASDAQ",
        name="Testbedrijf",
        price=6.0,
        prev_close=3.0,
        change_pct=100.0,
        volume=500_000,
        instrument_type="stock",
    )
    defaults.update(kwargs)
    return Mover(**defaults)


class TestFilters(unittest.TestCase):
    def setUp(self):
        self.config = Config()

    def test_accepts_a_clean_hit(self):
        ok, reason = passes_filters(mover(), self.config)
        self.assertTrue(ok, reason)

    def test_rejects_below_threshold(self):
        ok, reason = passes_filters(mover(change_pct=49.9), self.config)
        self.assertFalse(ok)
        self.assertIn("49.9", reason)

    def test_accepts_exactly_at_threshold(self):
        self.assertTrue(passes_filters(mover(change_pct=50.0), self.config)[0])

    def test_rejects_penny_stock(self):
        self.assertFalse(passes_filters(mover(price=0.40), self.config)[0])

    def test_rejects_thin_volume(self):
        self.assertFalse(passes_filters(mover(volume=1_000), self.config)[0])

    def test_rejects_low_dollar_volume(self):
        # Genoeg aandelen, maar te weinig geld omgezet om serieus te nemen.
        self.config.min_premarket_volume = 1_000
        self.assertFalse(passes_filters(mover(price=1.5, volume=5_000), self.config)[0])

    def test_rejects_other_exchange(self):
        self.assertFalse(passes_filters(mover(exchange="OTC"), self.config)[0])

    def test_rejects_etf(self):
        self.assertFalse(passes_filters(mover(instrument_type="fund"), self.config)[0])

    def test_max_price_is_optional(self):
        self.config.max_price = 5.0
        self.assertFalse(passes_filters(mover(price=6.0), self.config)[0])
        self.config.max_price = 0.0
        self.assertTrue(passes_filters(mover(price=6.0), self.config)[0])


class TestSelect(unittest.TestCase):
    def test_sorts_and_caps(self):
        config = Config(max_results=2)
        movers = [
            mover(symbol="A", change_pct=60.0),
            mover(symbol="B", change_pct=120.0),
            mover(symbol="C", change_pct=90.0),
            mover(symbol="D", change_pct=10.0),
        ]
        self.assertEqual([m.symbol for m in select(movers, config)], ["B", "C"])

    def test_empty_input(self):
        self.assertEqual(select([], Config()), [])


if __name__ == "__main__":
    unittest.main()
