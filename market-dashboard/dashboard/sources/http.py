"""Shared HTTP client settings."""

import httpx

HEADERS = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) "
                  "Chrome/124.0 Safari/537.36 market-dashboard",
    "Accept": "*/*",
}


def client(timeout: float = 30.0) -> httpx.Client:
    return httpx.Client(headers=HEADERS, timeout=timeout, follow_redirects=True)
