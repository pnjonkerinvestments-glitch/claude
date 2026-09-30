"""Sound effects for the shorts: the launch film's library (social/roviko-launch-film/audio/sfx) plus a few new cues.

  python3 build/sfx.py  ->  audio/sfx/*.wav + audio/sfx/peaks.json

New cues come from uisfx 0.4.0 (npm, audio CC0 1.0) or are synthesised here (the alarm and the thud).
"Peak" = the loudest point of the 5 ms RMS envelope; the mixer lands that point on the event.
"""
import json
import shutil
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
FILM = ROOT.parent / 'roviko-launch-film'
sys.path.insert(0, str(FILM / 'build'))
import sfx as film  # noqa: E402  (decode, write, peak_time, bp, SR)

OUT = ROOT / 'audio' / 'sfx'
film.OUT = OUT
SR = film.SR
rng = np.random.default_rng(5)

NEW = {  # name: (pack, cue, why)
    'error': ('soft', 'error', 'a wrong answer'),
    'mention': ('soft', 'mention', 'a chat message popping in'),
    'notify': ('soft', 'notification', 'a phone notification'),
    'leave': ('soft', 'disconnect', 'someone leaving the room'),
    'enter': ('soft', 'connect', 'someone joining the room'),
    'clock': ('mechanical', 'check', 'the clock ticking one second'),
    'slide': ('rubber', 'deselect', 'the sunglasses sliding down'),
    'boing': ('rubber', 'release', 'the mascot jumping up'),
    'lock': ('soft', 'lock', 'an answer locked in'),
}


def alarm():
    """Two bursts of a bright square-ish beep (2 kHz), like a phone alarm."""
    t = np.arange(int(0.62 * SR)) / SR
    out = np.zeros_like(t)
    for s in (0.0, 0.16, 0.32):
        m = (t >= s) & (t < s + 0.1)
        tt = t[m] - s
        out[m] += np.tanh(3 * np.sin(2 * np.pi * 2093 * tt)) * np.minimum(1, tt / 0.003) * np.minimum(1, (0.1 - tt) / 0.01)
    return film.bp(out, 400, 9000) * 0.9


def thud():
    """A soft body landing on the floor: low thump with a short cloth rustle."""
    t = np.arange(int(0.6 * SR)) / SR
    low = np.sin(2 * np.pi * np.cumsum(60 + 90 * np.exp(-t / 0.03)) / SR) * np.exp(-t / 0.12)
    rustle = film.bp(rng.standard_normal(len(t)), 500, 4000) * np.exp(-t / 0.05) * 0.35
    return np.tanh(1.6 * (low + rustle)) * np.minimum(1, t / 0.002)


def main(pkg):
    OUT.mkdir(parents=True, exist_ok=True)
    meta = json.loads((FILM / 'audio' / 'sfx' / 'peaks.json').read_text())
    for k, v in meta.items():
        shutil.copy(FILM / 'audio' / 'sfx' / v['file'], OUT / v['file'])
    for name, (pack, cue, why) in NEW.items():
        x = film.decode(Path(pkg) / 'sounds' / pack / f'{cue}.ogg')
        film.write(name, x)
        pk, dur = film.peak_time(x)
        meta[name] = {'file': f'{name}.wav', 'peak_s': round(pk, 4), 'duration_s': round(dur, 3),
                      'source': f'uisfx 0.4.0, pack "{pack}", cue "{cue}" (CC0 1.0)', 'use': why}
    for name, fn, why in [('alarm', alarm, 'the 23:58 alarm'), ('thud', thud, 'the mascot collapsing in relief')]:
        x = fn()
        film.write(name, x)
        pk, dur = film.peak_time(x)
        meta[name] = {'file': f'{name}.wav', 'peak_s': round(pk, 4), 'duration_s': round(dur, 3),
                      'source': 'synthesised for the shorts (build/sfx.py), no samples', 'use': why}
    (OUT / 'peaks.json').write_text(json.dumps(meta, indent=1))
    print(f'{len(meta)} effects -> {OUT}')


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else str(FILM / 'node_modules' / 'uisfx'))
