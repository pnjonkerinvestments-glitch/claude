"""FastAPI app: serves the page, the dashboard JSON and runs the refresh schedule."""

from __future__ import annotations

import logging
import threading
from contextlib import asynccontextmanager

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from fastapi import FastAPI, HTTPException
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from . import blocks, refresh
from .config import ROOT, load_config
from .db import Store

log = logging.getLogger("dashboard")
STATIC = ROOT / "static"


def build_scheduler(store: Store, cfg: dict) -> BackgroundScheduler:
    r = cfg["refresh"]
    sched = BackgroundScheduler(timezone=cfg["tz"])
    for t in r["daily_times"]:
        hour, minute = t.split(":")
        sched.add_job(refresh.run_sources, CronTrigger(day_of_week=r["daily_days"], hour=hour,
                                                       minute=minute, timezone=cfg["tz"]),
                      args=(store, cfg, refresh.DAILY_SOURCES), id=f"daily-{t}",
                      misfire_grace_time=3600, coalesce=True)
    hour, minute = r["morning_time"].split(":")
    sched.add_job(refresh.run_sources, CronTrigger(day_of_week=r["daily_days"], hour=hour,
                                                   minute=minute, timezone=cfg["tz"]),
                  args=(store, cfg, refresh.MORNING_SOURCES), id="morning",
                  misfire_grace_time=3600, coalesce=True)
    hour, minute = r["cot_time"].split(":")
    sched.add_job(refresh.run_sources, CronTrigger(day_of_week=r["cot_day"], hour=hour,
                                                   minute=minute, timezone=cfg["tz"]),
                  args=(store, cfg, refresh.WEEKLY_SOURCES), id="cot",
                  misfire_grace_time=3600, coalesce=True)
    return sched


def create_app(cfg: dict | None = None, start_jobs: bool = True) -> FastAPI:
    cfg = cfg or load_config()
    store = Store(cfg["database"])

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        sched = None
        if start_jobs:
            sched = build_scheduler(store, cfg)
            sched.start()
            # First start fetches the full history; later starts just top up.
            threading.Thread(target=refresh.run_all, args=(store, cfg), daemon=True).start()
        yield
        if sched:
            sched.shutdown(wait=False)

    app = FastAPI(title="Market overview", lifespan=lifespan)
    app.add_middleware(GZipMiddleware, minimum_size=1000)
    cache: dict = {}

    def data_version() -> tuple:
        """Changes whenever any source is refreshed (or fails), so the cache stays current."""
        return tuple(store.status(src)["last_attempt"]
                     for src in refresh.DAILY_SOURCES + refresh.WEEKLY_SOURCES + refresh.MORNING_SOURCES)

    @app.get("/api/dashboard")
    def dashboard_data():
        version = data_version()
        if cache.get("version") != version:
            cache.update(version=version, data=blocks.dashboard(store, cfg))
        return cache["data"]

    @app.get("/api/cot/{key}")
    def cot_chart(key: str):
        if key not in {a["key"] for a in cfg["cftc"]["assets"]}:
            raise HTTPException(404, "unknown COT asset")
        return blocks.cot_chart(store, cfg, key)

    @app.get("/api/widgets")
    def widget_config():
        return cfg["tradingview"]

    @app.get("/")
    def index():
        return FileResponse(STATIC / "index.html")

    app.mount("/static", StaticFiles(directory=STATIC), name="static")
    return app
