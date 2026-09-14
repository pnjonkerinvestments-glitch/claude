from __future__ import annotations

import argparse
import logging
import sys

from . import __version__, clock
from .config import Config, ConfigError
from .models import Mover
from .notifier import send_email
from .providers import get_provider
from .scanner import select
from .state import AlertState

log = logging.getLogger("premarket_alert")


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        prog="premarket-alert",
        description="Mailt je als een Amerikaans aandeel in de premarket hard stijgt.",
    )
    parser.add_argument("--dry-run", action="store_true", help="Print de mail in plaats van hem te versturen")
    parser.add_argument("--ignore-window", action="store_true", help="Draai ook buiten 04:00-09:30 ET")
    parser.add_argument("--threshold", type=float, help="Overschrijft THRESHOLD_PCT")
    parser.add_argument("--self-test", action="store_true", help="Stuur een voorbeeldmail om SMTP te testen")
    parser.add_argument("-v", "--verbose", action="store_true", help="Debug-logging")
    parser.add_argument("--version", action="version", version=__version__)
    return parser.parse_args(argv)


def build_config(args: argparse.Namespace) -> Config:
    config = Config.from_env()
    if args.dry_run:
        config.dry_run = True
    if args.ignore_window:
        config.ignore_window = True
    if args.threshold is not None:
        config.threshold_pct = args.threshold
    config.validate()
    return config


SAMPLE = Mover(
    symbol="TEST",
    exchange="NASDAQ",
    name="Voorbeeldmelding - dit is geen echte beweging",
    price=7.5,
    prev_close=4.0,
    change_pct=87.5,
    volume=1_250_000,
    market_cap=180_000_000,
)


def run(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(asctime)s %(levelname)-7s %(message)s",
        datefmt="%H:%M:%S",
    )

    try:
        config = build_config(args)
    except ConfigError as exc:
        log.error("Configuratiefout: %s", exc)
        return 2

    now = clock.now_et()
    stamp = now.strftime("%d-%m-%Y %H:%M")

    if args.self_test:
        send_email([SAMPLE], config, stamp)
        log.info("Testmail afgehandeld")
        return 0

    if not config.ignore_window and not clock.in_premarket_window(now):
        log.info("Buiten de premarket (%s ET) - niets te doen", stamp)
        return 0

    if now.year not in clock.holiday_years_covered():
        log.warning("Geen feestdagenlijst voor %d; alleen weekenden worden overgeslagen", now.year)

    provider = get_provider(config)
    log.info("Databron %s bevragen (drempel %.0f%%)", provider.name, config.threshold_pct)
    movers = provider.fetch()

    hits = select(movers, config)
    log.info("%d ticker(s) boven de drempel", len(hits))
    if not hits:
        return 0

    state = AlertState(config.state_path)
    session_day = clock.session_date(now)
    fresh = state.filter_new(hits, session_day, config.re_alert_step_pct)
    if not fresh:
        log.info("Alles al gemeld vandaag - geen mail")
        return 0

    send_email(fresh, config, stamp)
    for mover in fresh:
        state.record(mover, session_day)
    state.save()
    return 0


def main() -> None:
    try:
        sys.exit(run())
    except KeyboardInterrupt:
        sys.exit(130)
    except Exception as exc:  # noqa: BLE001 - een crash mag de workflow rood maken
        log.exception("Onverwachte fout: %s", exc)
        sys.exit(1)


if __name__ == "__main__":
    main()
