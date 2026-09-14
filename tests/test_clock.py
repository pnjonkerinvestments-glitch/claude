import unittest
from datetime import date, datetime

from premarket_alert import clock


class TestClock(unittest.TestCase):
    def test_weekend_is_not_a_trading_day(self):
        self.assertFalse(clock.is_trading_day(date(2026, 9, 12)))  # zaterdag
        self.assertFalse(clock.is_trading_day(date(2026, 9, 13)))  # zondag
        self.assertTrue(clock.is_trading_day(date(2026, 9, 14)))  # maandag

    def test_holidays(self):
        self.assertTrue(clock.is_holiday(date(2026, 11, 26)))  # Thanksgiving
        self.assertTrue(clock.is_holiday(date(2026, 7, 3)))  # 4 juli valt op zaterdag
        self.assertFalse(clock.is_holiday(date(2026, 7, 6)))

    def test_unknown_year_is_never_a_holiday(self):
        self.assertFalse(clock.is_holiday(date(2099, 12, 25)))

    def test_window_boundaries(self):
        def at(hour, minute):
            return datetime(2026, 9, 14, hour, minute, tzinfo=clock.ET)

        self.assertFalse(clock.in_premarket_window(at(3, 59)))
        self.assertTrue(clock.in_premarket_window(at(4, 0)))
        self.assertTrue(clock.in_premarket_window(at(9, 29)))
        self.assertFalse(clock.in_premarket_window(at(9, 30)))

    def test_window_closed_on_holiday(self):
        self.assertFalse(clock.in_premarket_window(datetime(2026, 11, 26, 8, 0, tzinfo=clock.ET)))

    def test_session_date_uses_eastern_time(self):
        # 08:00 UTC is 04:00 ET op dezelfde dag; 02:00 UTC is de avond ervoor.
        from zoneinfo import ZoneInfo

        utc = ZoneInfo("UTC")
        self.assertEqual(clock.session_date(datetime(2026, 9, 14, 8, 0, tzinfo=utc)), "2026-09-14")
        self.assertEqual(clock.session_date(datetime(2026, 9, 14, 2, 0, tzinfo=utc)), "2026-09-13")


if __name__ == "__main__":
    unittest.main()
