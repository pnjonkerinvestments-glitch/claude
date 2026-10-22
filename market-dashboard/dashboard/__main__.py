"""Entry point.

python -m dashboard                    start the server (with its refresh schedule)
python -m dashboard verify             hit every source once and report
python -m dashboard refresh            fetch every source now, without starting the server
python -m dashboard snapshot OUTDIR    write a static copy of the page for sharing
"""

from __future__ import annotations

import argparse
import logging

import uvicorn

from .config import load_config


def main() -> None:
    parser = argparse.ArgumentParser(prog="python -m dashboard")
    parser.add_argument("command", nargs="?", default="serve", choices=["serve", "verify", "refresh", "snapshot"])
    parser.add_argument("outdir", nargs="?", help="snapshot: folder to write the static page into")
    parser.add_argument("--host", help="interface to bind, e.g. 0.0.0.0 for a server")
    parser.add_argument("--port", type=int)
    args = parser.parse_args()

    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
    cfg = load_config()
    if args.command == "verify":
        from .verify import verify
        raise SystemExit(verify(cfg))
    if args.command in ("refresh", "snapshot"):
        from .db import Store
        store = Store(cfg["database"])
        if args.command == "refresh":
            from . import refresh
            refresh.run_all(store, cfg)
            failed = {s: store.status(s)["last_error"] for s in refresh.DAILY_SOURCES + refresh.WEEKLY_SOURCES
                      if store.status(s)["last_error"]}
            for source, error in failed.items():
                print(f"FAILED {source}: {error}")
            raise SystemExit(1 if failed else 0)
        if not args.outdir:
            parser.error("snapshot needs an output folder")
        from .snapshot import build
        for name, size in build(store, cfg, args.outdir).items():
            print(f"{name}: {size // 1024} KB")
        return

    from .server import create_app
    host = args.host or cfg["server"]["host"]
    port = args.port or cfg["server"]["port"]
    uvicorn.run(create_app(cfg), host=host, port=port, workers=1)


if __name__ == "__main__":
    main()
