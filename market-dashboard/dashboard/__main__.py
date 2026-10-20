"""Entry point: `python -m dashboard` starts the server, `python -m dashboard verify` tests the sources."""

from __future__ import annotations

import argparse
import logging

import uvicorn

from .config import load_config


def main() -> None:
    parser = argparse.ArgumentParser(prog="python -m dashboard")
    parser.add_argument("command", nargs="?", default="serve", choices=["serve", "verify"])
    parser.add_argument("--host", help="interface to bind, e.g. 0.0.0.0 for a server")
    parser.add_argument("--port", type=int)
    args = parser.parse_args()

    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
    cfg = load_config()
    if args.command == "verify":
        from .verify import verify
        raise SystemExit(verify(cfg))

    from .server import create_app
    host = args.host or cfg["server"]["host"]
    port = args.port or cfg["server"]["port"]
    uvicorn.run(create_app(cfg), host=host, port=port, workers=1)


if __name__ == "__main__":
    main()
