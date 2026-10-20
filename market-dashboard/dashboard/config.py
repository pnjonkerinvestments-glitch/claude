"""Loads config.yaml and .env."""

from __future__ import annotations

import os
from pathlib import Path
from zoneinfo import ZoneInfo

import yaml
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent


def load_config(path: Path | None = None) -> dict:
    load_dotenv(ROOT / ".env")
    path = path or Path(os.environ.get("DASHBOARD_CONFIG", ROOT / "config.yaml"))
    with open(path, encoding="utf-8") as fh:
        cfg = yaml.safe_load(fh)
    cfg["fred_api_key"] = os.environ.get("FRED_API_KEY", "").strip()
    server = cfg.setdefault("server", {})
    server["host"] = os.environ.get("DASHBOARD_HOST", server.get("host", "127.0.0.1"))
    server["port"] = int(os.environ.get("DASHBOARD_PORT", server.get("port", 8050)))
    db = Path(cfg.get("database", "data/dashboard.sqlite"))
    cfg["database"] = str(db if db.is_absolute() else ROOT / db)
    cfg["tz"] = ZoneInfo(cfg.get("timezone", "Europe/Amsterdam"))
    return cfg
