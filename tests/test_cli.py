import tempfile
import unittest
from datetime import datetime
from pathlib import Path
from unittest.mock import patch

from premarket_alert import cli, clock
from premarket_alert.models import Mover

PREMARKET = datetime(2026, 9, 14, 8, 0, tzinfo=clock.ET)  # maandag 08:00 ET
WEEKEND = datetime(2026, 9, 13, 8, 0, tzinfo=clock.ET)


def mover(symbol="ABCD", change_pct=87.5):
    return Mover(
        symbol=symbol,
        exchange="NASDAQ",
        name="Testbedrijf",
        price=6.0,
        prev_close=3.2,
        change_pct=change_pct,
        volume=500_000,
    )


class TestRun(unittest.TestCase):
    def setUp(self):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        self.state_path = Path(tmp.name) / "alerts.json"
        env = {
            "PROVIDER": "tradingview",
            "STATE_PATH": str(self.state_path),
            "SMTP_HOST": "smtp.example.com",
            "SMTP_USER": "bot@example.com",
            "SMTP_PASSWORD": "geheim",
            "MAIL_TO": "mij@example.com",
        }
        patcher = patch.dict("os.environ", env, clear=True)
        patcher.start()
        self.addCleanup(patcher.stop)

    def run_cli(self, movers, argv=None, now=PREMARKET):
        with patch("premarket_alert.clock.now_et", return_value=now), patch(
            "premarket_alert.providers.tradingview.TradingViewProvider.fetch", return_value=movers
        ), patch("premarket_alert.cli.send_email") as send:
            code = cli.run(argv or [])
        return code, send

    def test_sends_mail_on_a_hit(self):
        code, send = self.run_cli([mover()])
        self.assertEqual(code, 0)
        send.assert_called_once()
        self.assertEqual([m.symbol for m in send.call_args.args[0]], ["ABCD"])

    def test_no_mail_when_nothing_passes_the_threshold(self):
        code, send = self.run_cli([mover(change_pct=12.0)])
        self.assertEqual(code, 0)
        send.assert_not_called()

    def test_does_nothing_outside_the_window(self):
        code, send = self.run_cli([mover()], now=WEEKEND)
        self.assertEqual(code, 0)
        send.assert_not_called()

    def test_ignore_window_overrides_the_schedule(self):
        code, send = self.run_cli([mover()], argv=["--ignore-window"], now=WEEKEND)
        self.assertEqual(code, 0)
        send.assert_called_once()

    def test_same_ticker_is_only_mailed_once_per_day(self):
        _, first = self.run_cli([mover()])
        first.assert_called_once()
        _, second = self.run_cli([mover(change_pct=90.0)])
        second.assert_not_called()

    def test_a_much_bigger_move_mails_again(self):
        self.run_cli([mover()])
        _, send = self.run_cli([mover(change_pct=130.0)])
        send.assert_called_once()

    def test_threshold_can_be_overridden_on_the_command_line(self):
        code, send = self.run_cli([mover(change_pct=30.0)], argv=["--threshold", "25"])
        self.assertEqual(code, 0)
        send.assert_called_once()

    def test_state_is_not_written_when_nothing_is_sent(self):
        self.run_cli([mover(change_pct=1.0)])
        self.assertFalse(self.state_path.exists())

    def test_missing_email_settings_fail_loudly(self):
        with patch.dict("os.environ", {"MAIL_TO": ""}):
            self.assertEqual(cli.run([]), 2)

    def test_dry_run_needs_no_email_settings(self):
        with patch.dict("os.environ", {"SMTP_HOST": "", "MAIL_TO": ""}):
            code, send = self.run_cli([mover()], argv=["--dry-run"])
        self.assertEqual(code, 0)
        send.assert_called_once()

    def test_unknown_provider_is_a_config_error(self):
        with patch.dict("os.environ", {"PROVIDER": "bloomberg"}):
            self.assertEqual(cli.run([]), 2)

    def test_self_test_sends_a_sample_without_calling_the_provider(self):
        with patch("premarket_alert.cli.send_email") as send, patch(
            "premarket_alert.providers.tradingview.TradingViewProvider.fetch"
        ) as fetch:
            code = cli.run(["--self-test"])
        self.assertEqual(code, 0)
        fetch.assert_not_called()
        self.assertEqual(send.call_args.args[0][0].symbol, "TEST")


if __name__ == "__main__":
    unittest.main()
