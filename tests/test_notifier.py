import unittest

from premarket_alert.config import Config
from premarket_alert.models import Mover
from premarket_alert.notifier import build_message, build_subject, build_text


def mover(symbol="ABCD", change_pct=87.5, name="Testbedrijf Inc"):
    return Mover(
        symbol=symbol,
        exchange="NASDAQ",
        name=name,
        price=6.0,
        prev_close=3.2,
        change_pct=change_pct,
        volume=500_000,
        market_cap=120_000_000,
    )


class TestNotifier(unittest.TestCase):
    def setUp(self):
        self.config = Config(mail_from="bot@example.com", mail_to=["mij@example.com"])

    def test_single_hit_subject(self):
        self.assertEqual(build_subject([mover()], self.config), "[Premarket] ABCD +88% premarket")

    def test_multi_hit_subject_lists_and_counts(self):
        movers = [mover(s) for s in ("AAA", "BBB", "CCC", "DDD", "EEE")]
        subject = build_subject(movers, self.config)
        self.assertIn("5 stijgers >50%", subject)
        self.assertIn("AAA, BBB, CCC", subject)
        self.assertIn("+2", subject)

    def test_text_contains_the_numbers_that_matter(self):
        body = build_text([mover()], self.config, "14-09-2026 08:12")
        self.assertIn("+87.5%", body)
        self.assertIn("$6.00", body)
        self.assertIn("$3.20", body)
        self.assertIn("500,000", body)
        self.assertIn("tradingview.com", body)

    def test_message_is_multipart_with_html(self):
        message = build_message([mover()], self.config, "14-09-2026 08:12")
        self.assertTrue(message.is_multipart())
        self.assertEqual(message["To"], "mij@example.com")
        html = message.get_body(preferencelist=("html",)).get_content()
        self.assertIn("+87.5%", html)

    def test_html_escapes_company_names(self):
        message = build_message([mover(name='Acme <script>"x"')], self.config, "nu")
        html = message.get_body(preferencelist=("html",)).get_content()
        self.assertNotIn("<script>", html)
        self.assertIn("&lt;script&gt;", html)


if __name__ == "__main__":
    unittest.main()
