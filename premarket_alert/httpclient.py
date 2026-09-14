from __future__ import annotations

import json
import logging
import time
import urllib.error
import urllib.request

log = logging.getLogger(__name__)

USER_AGENT = "premarket-alert/1.0 (+https://github.com)"


class HttpError(RuntimeError):
    pass


def request_json(
    url: str,
    *,
    method: str = "GET",
    payload: dict | None = None,
    headers: dict[str, str] | None = None,
    timeout: int = 30,
    retries: int = 3,
) -> dict | list:
    """Doe een JSON-request met exponentiële backoff bij netwerk-/5xx-fouten."""
    body = json.dumps(payload).encode() if payload is not None else None
    all_headers = {"User-Agent": USER_AGENT, "Accept": "application/json"}
    if body is not None:
        all_headers["Content-Type"] = "application/json"
    all_headers.update(headers or {})

    last_error: Exception | None = None
    for attempt in range(retries):
        req = urllib.request.Request(url, data=body, headers=all_headers, method=method)
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as exc:
            detail = exc.read()[:400].decode("utf-8", "replace")
            if exc.code < 500 and exc.code != 429:
                raise HttpError(f"{method} {url} -> HTTP {exc.code}: {detail}") from exc
            last_error = HttpError(f"{method} {url} -> HTTP {exc.code}: {detail}")
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
            last_error = HttpError(f"{method} {url} mislukt: {exc}")
        if attempt < retries - 1:
            delay = 2 ** attempt
            log.warning("Poging %d mislukt (%s), opnieuw over %ds", attempt + 1, last_error, delay)
            time.sleep(delay)

    raise last_error or HttpError(f"{method} {url} mislukt")
