import tempfile
import unittest
from pathlib import Path

from premarket_alert.models import Mover
from premarket_alert.state import AlertState


def mover(symbol="ABCD", change_pct=80.0):
    return Mover(
        symbol=symbol,
        exchange="NASDAQ",
        name="Test",
        price=6.0,
        prev_close=3.0,
        change_pct=change_pct,
        volume=500_000,
    )


class TestAlertState(unittest.TestCase):
    def setUp(self):
        self.dir = tempfile.TemporaryDirectory()
        self.addCleanup(self.dir.cleanup)
        self.path = Path(self.dir.name) / "nested" / "alerts.json"

    def test_first_alert_is_new(self):
        state = AlertState(self.path)
        self.assertTrue(state.is_new(mover(), "2026-09-14", 25.0))

    def test_same_ticker_is_not_repeated(self):
        state = AlertState(self.path)
        state.record(mover(change_pct=80.0), "2026-09-14")
        self.assertFalse(state.is_new(mover(change_pct=85.0), "2026-09-14", 25.0))

    def test_big_further_move_alerts_again(self):
        state = AlertState(self.path)
        state.record(mover(change_pct=80.0), "2026-09-14")
        self.assertTrue(state.is_new(mover(change_pct=105.0), "2026-09-14", 25.0))

    def test_new_day_resets(self):
        state = AlertState(self.path)
        state.record(mover(), "2026-09-14")
        self.assertTrue(state.is_new(mover(), "2026-09-15", 25.0))

    def test_persists_across_runs(self):
        first = AlertState(self.path)
        first.record(mover(), "2026-09-14")
        first.save()

        second = AlertState(self.path)
        self.assertFalse(second.is_new(mover(), "2026-09-14", 25.0))

    def test_corrupt_file_does_not_block_alerts(self):
        self.path.parent.mkdir(parents=True)
        self.path.write_text("{niet eens json")
        state = AlertState(self.path)
        self.assertTrue(state.is_new(mover(), "2026-09-14", 25.0))
        state.record(mover(), "2026-09-14")
        state.save()
        self.assertIn("days", self.path.read_text())

    def test_old_days_are_pruned(self):
        state = AlertState(self.path)
        for day in range(1, 12):
            state.record(mover(), f"2026-09-{day:02d}")
        state.save()

        reloaded = AlertState(self.path)
        self.assertTrue(reloaded.is_new(mover(), "2026-09-01", 25.0))
        self.assertFalse(reloaded.is_new(mover(), "2026-09-11", 25.0))

    def test_filter_new_keeps_only_unreported(self):
        state = AlertState(self.path)
        state.record(mover("AAA"), "2026-09-14")
        fresh = state.filter_new([mover("AAA"), mover("BBB")], "2026-09-14", 25.0)
        self.assertEqual([m.symbol for m in fresh], ["BBB"])

    def test_record_keeps_the_highest_seen_move(self):
        state = AlertState(self.path)
        state.record(mover(change_pct=120.0), "2026-09-14")
        state.record(mover(change_pct=60.0), "2026-09-14")
        self.assertFalse(state.is_new(mover(change_pct=100.0), "2026-09-14", 25.0))


if __name__ == "__main__":
    unittest.main()
