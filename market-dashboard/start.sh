#!/usr/bin/env sh
# One command to start: creates .venv on first run, installs requirements, starts the dashboard.
# Extra arguments are passed on, e.g. ./start.sh --host 0.0.0.0 --port 8050
set -e
cd "$(dirname "$0")"
if [ ! -d .venv ]; then
  python3.12 -m venv .venv 2>/dev/null || python3 -m venv .venv
  .venv/bin/pip install -q -r requirements.txt
fi
exec .venv/bin/python -m dashboard "$@"
