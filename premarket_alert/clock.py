"""Tijdvenster van de Amerikaanse premarket (04:00-09:30 ET) en de NYSE-feestdagen."""

from __future__ import annotations

from datetime import date, datetime, time
from zoneinfo import ZoneInfo

ET = ZoneInfo("America/New_York")

PREMARKET_OPEN = time(4, 0)
REGULAR_OPEN = time(9, 30)

# NYSE/Nasdaq-feestdagen. Valt een feestdag op zaterdag, dan sluit de beurs de
# vrijdag ervoor -- behalve bij Nieuwjaarsdag. Valt hij op zondag, dan de maandag erna.
MARKET_HOLIDAYS: dict[int, tuple[str, ...]] = {
    2026: ("01-01", "01-19", "02-16", "04-03", "05-25", "06-19", "07-03", "09-07", "11-26", "12-25"),
    2027: ("01-01", "01-18", "02-15", "03-26", "05-31", "06-18", "07-05", "09-06", "11-25", "12-24"),
    2028: ("01-17", "02-21", "04-14", "05-29", "06-19", "07-04", "09-04", "11-23", "12-25"),
    2029: ("01-01", "01-15", "02-19", "03-30", "05-28", "06-19", "07-04", "09-03", "11-22", "12-25"),
    2030: ("01-01", "01-21", "02-18", "04-19", "05-27", "06-19", "07-04", "09-02", "11-28", "12-25"),
}


def now_et() -> datetime:
    return datetime.now(tz=ET)


def is_holiday(day: date) -> bool:
    """True als de beurs die dag dicht is. Onbekende jaren tellen niet als feestdag."""
    return day.strftime("%m-%d") in MARKET_HOLIDAYS.get(day.year, ())


def is_trading_day(day: date) -> bool:
    return day.weekday() < 5 and not is_holiday(day)


def in_premarket_window(moment: datetime | None = None) -> bool:
    """True tussen 04:00 en 09:30 ET op een handelsdag."""
    moment = (moment or now_et()).astimezone(ET)
    if not is_trading_day(moment.date()):
        return False
    return PREMARKET_OPEN <= moment.time() < REGULAR_OPEN


def session_date(moment: datetime | None = None) -> str:
    """De handelsdag (ET) waar dit moment bij hoort, als YYYY-MM-DD."""
    return (moment or now_et()).astimezone(ET).date().isoformat()


def holiday_years_covered() -> tuple[int, ...]:
    return tuple(sorted(MARKET_HOLIDAYS))
