from __future__ import annotations

import os
from dataclasses import dataclass, field


class ConfigError(RuntimeError):
    """Ontbrekende of ongeldige configuratie."""


def _str(name: str, default: str = "") -> str:
    return os.environ.get(name, default).strip()


def _float(name: str, default: float) -> float:
    raw = _str(name)
    if not raw:
        return default
    try:
        return float(raw)
    except ValueError as exc:
        raise ConfigError(f"{name} moet een getal zijn, kreeg {raw!r}") from exc


def _int(name: str, default: int) -> int:
    return int(_float(name, float(default)))


def _bool(name: str, default: bool = False) -> bool:
    raw = _str(name).lower()
    if not raw:
        return default
    return raw in {"1", "true", "yes", "y", "on"}


def _list(name: str, default: str) -> list[str]:
    raw = _str(name) or default
    return [item.strip() for item in raw.split(",") if item.strip()]


@dataclass
class Config:
    # --- databron ---
    provider: str = "tradingview"
    polygon_api_key: str = ""
    scanner_url: str = "https://scanner.tradingview.com/america/scan"
    http_timeout: int = 30

    # --- filters ---
    threshold_pct: float = 50.0
    min_price: float = 1.0
    max_price: float = 0.0  # 0 = geen bovengrens
    min_premarket_volume: int = 50_000
    min_dollar_volume: float = 100_000.0
    exchanges: list[str] = field(default_factory=lambda: ["NASDAQ", "NYSE", "AMEX"])
    instrument_types: list[str] = field(default_factory=lambda: ["stock", "dr"])
    max_results: int = 50

    # --- herhaling onderdrukken ---
    re_alert_step_pct: float = 25.0
    state_path: str = ".state/alerts.json"

    # --- e-mail ---
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    mail_from: str = ""
    mail_to: list[str] = field(default_factory=list)
    subject_prefix: str = "[Premarket]"

    # --- uitvoering ---
    dry_run: bool = False
    ignore_window: bool = False

    @classmethod
    def from_env(cls) -> "Config":
        cfg = cls(
            provider=_str("PROVIDER", "tradingview").lower(),
            polygon_api_key=_str("POLYGON_API_KEY"),
            scanner_url=_str("SCANNER_URL", cls.scanner_url),
            http_timeout=_int("HTTP_TIMEOUT", cls.http_timeout),
            threshold_pct=_float("THRESHOLD_PCT", cls.threshold_pct),
            min_price=_float("MIN_PRICE", cls.min_price),
            max_price=_float("MAX_PRICE", cls.max_price),
            min_premarket_volume=_int("MIN_PREMARKET_VOLUME", cls.min_premarket_volume),
            min_dollar_volume=_float("MIN_DOLLAR_VOLUME", cls.min_dollar_volume),
            exchanges=_list("EXCHANGES", "NASDAQ,NYSE,AMEX"),
            instrument_types=_list("INSTRUMENT_TYPES", "stock,dr"),
            max_results=_int("MAX_RESULTS", cls.max_results),
            re_alert_step_pct=_float("RE_ALERT_STEP_PCT", cls.re_alert_step_pct),
            state_path=_str("STATE_PATH", cls.state_path),
            smtp_host=_str("SMTP_HOST"),
            smtp_port=_int("SMTP_PORT", cls.smtp_port),
            smtp_user=_str("SMTP_USER"),
            smtp_password=_str("SMTP_PASSWORD"),
            mail_from=_str("MAIL_FROM"),
            mail_to=_list("MAIL_TO", ""),
            subject_prefix=_str("SUBJECT_PREFIX", cls.subject_prefix),
            dry_run=_bool("DRY_RUN"),
            ignore_window=_bool("IGNORE_WINDOW"),
        )
        if not cfg.mail_from:
            cfg.mail_from = cfg.smtp_user
        return cfg

    def validate(self) -> None:
        if self.provider not in {"tradingview", "polygon"}:
            raise ConfigError(f"Onbekende PROVIDER {self.provider!r} (kies: tradingview, polygon)")
        if self.provider == "polygon" and not self.polygon_api_key:
            raise ConfigError("PROVIDER=polygon vereist POLYGON_API_KEY")
        if self.threshold_pct <= 0:
            raise ConfigError("THRESHOLD_PCT moet groter dan 0 zijn")
        if self.dry_run:
            return
        missing = [
            name
            for name, value in (
                ("SMTP_HOST", self.smtp_host),
                ("SMTP_USER", self.smtp_user),
                ("SMTP_PASSWORD", self.smtp_password),
                ("MAIL_TO", self.mail_to),
            )
            if not value
        ]
        if missing:
            raise ConfigError(
                "Ontbrekende e-mailinstellingen: " + ", ".join(missing) + " (of zet DRY_RUN=true)"
            )
