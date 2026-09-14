from __future__ import annotations

import html
import logging
import smtplib
import ssl
from email.message import EmailMessage
from email.utils import formatdate

from .config import Config
from .models import Mover

log = logging.getLogger(__name__)


def _fmt_cap(value: float | None) -> str:
    if not value:
        return "-"
    for unit, size in (("T", 1e12), ("B", 1e9), ("M", 1e6), ("K", 1e3)):
        if value >= size:
            return f"${value / size:.1f}{unit}"
    return f"${value:.0f}"


def build_subject(movers: list[Mover], config: Config) -> str:
    if len(movers) == 1:
        m = movers[0]
        return f"{config.subject_prefix} {m.symbol} +{m.change_pct:.0f}% premarket"
    names = ", ".join(m.symbol for m in movers[:3])
    extra = f" +{len(movers) - 3}" if len(movers) > 3 else ""
    return f"{config.subject_prefix} {len(movers)} stijgers >{config.threshold_pct:.0f}%: {names}{extra}"


def build_text(movers: list[Mover], config: Config, when: str) -> str:
    lines = [f"Premarket-stijgers boven {config.threshold_pct:.0f}% ({when} ET)", ""]
    for m in movers:
        lines.append(f"{m.symbol} ({m.exchange or 'US'})  +{m.change_pct:.1f}%")
        if m.name:
            lines.append(f"  {m.name}")
        lines += [
            f"  koers ${m.price:,.2f} (vorige slot ${m.prev_close:,.2f})",
            f"  premarket volume {m.volume:,} | omzet ${m.dollar_volume:,.0f} | cap {_fmt_cap(m.market_cap)}",
            f"  {m.chart_url}",
            "",
        ]
    lines.append("Geen handelsadvies - controleer altijd zelf het nieuws en de liquiditeit.")
    return "\n".join(lines)


def build_html(movers: list[Mover], config: Config, when: str) -> str:
    rows = []
    for m in movers:
        rows.append(
            "<tr>"
            f'<td style="padding:8px 10px;border-bottom:1px solid #e5e7eb"><a href="{html.escape(m.chart_url)}" '
            f'style="font-weight:600;color:#1d4ed8;text-decoration:none">{html.escape(m.symbol)}</a>'
            f'<div style="color:#6b7280;font-size:12px">{html.escape(m.name[:48])}</div></td>'
            f'<td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;text-align:right;color:#15803d;'
            f'font-weight:700">+{m.change_pct:.1f}%</td>'
            f'<td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;text-align:right">${m.price:,.2f}'
            f'<div style="color:#6b7280;font-size:12px">was ${m.prev_close:,.2f}</div></td>'
            f'<td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;text-align:right">{m.volume:,}'
            f'<div style="color:#6b7280;font-size:12px">{_fmt_cap(m.market_cap)}</div></td>'
            "</tr>"
        )
    header = "".join(
        f'<th style="padding:8px 10px;text-align:{align};border-bottom:2px solid #111827;font-size:12px;'
        f'text-transform:uppercase;letter-spacing:.04em;color:#374151">{label}</th>'
        for label, align in (("Ticker", "left"), ("Premarket", "right"), ("Koers", "right"), ("Volume", "right"))
    )
    return (
        '<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:640px;color:#111827">'
        f'<h2 style="margin:0 0 4px">Premarket-stijgers &gt; {config.threshold_pct:.0f}%</h2>'
        f'<p style="margin:0 0 16px;color:#6b7280;font-size:13px">{html.escape(when)} ET</p>'
        f'<table style="border-collapse:collapse;width:100%;font-size:14px"><thead><tr>{header}</tr></thead>'
        f"<tbody>{''.join(rows)}</tbody></table>"
        '<p style="margin:16px 0 0;color:#6b7280;font-size:12px">Geen handelsadvies. Premarket-volume is dun; '
        "controleer het nieuws en de spread voordat je iets doet.</p></div>"
    )


def build_message(movers: list[Mover], config: Config, when: str) -> EmailMessage:
    message = EmailMessage()
    message["Subject"] = build_subject(movers, config)
    message["From"] = config.mail_from
    message["To"] = ", ".join(config.mail_to)
    message["Date"] = formatdate(localtime=True)
    message.set_content(build_text(movers, config, when))
    message.add_alternative(build_html(movers, config, when), subtype="html")
    return message


def send_email(movers: list[Mover], config: Config, when: str) -> None:
    message = build_message(movers, config, when)
    if config.dry_run:
        print(f"[DRY RUN] Onderwerp: {message['Subject']}")
        print(build_text(movers, config, when))
        return

    context = ssl.create_default_context()
    if config.smtp_port == 465:
        server = smtplib.SMTP_SSL(config.smtp_host, config.smtp_port, timeout=30, context=context)
    else:
        server = smtplib.SMTP(config.smtp_host, config.smtp_port, timeout=30)
    with server:
        if config.smtp_port != 465:
            server.starttls(context=context)
        server.login(config.smtp_user, config.smtp_password)
        server.send_message(message)
    log.info("Mail verstuurd naar %s (%d tickers)", ", ".join(config.mail_to), len(movers))
