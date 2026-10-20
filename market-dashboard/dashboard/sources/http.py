"""Shared HTTP client settings."""

import httpx

# httpx's default User-Agent on purpose: FRED's CSV server drops requests with a
# browser-like or custom one.


def client(timeout: float = 30.0) -> httpx.Client:
    return httpx.Client(timeout=timeout, follow_redirects=True)
