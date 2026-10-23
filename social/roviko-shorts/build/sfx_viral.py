"""Viral sound cues for the trend videos: Mixkit sound effects (Mixkit Sound Effects Free License), added to audio/sfx.

  python3 build/sfx_viral.py <download_dir>  ->  audio/sfx/<name>.wav + entries in audio/sfx/peaks.json

Each file is downloaded to <download_dir> (keep it outside the repo), trimmed to `max_s` with a short fade, and its
peak measured like the other effects, so build/mix.py lands the loudest point on the event.
"""
import json
import subprocess
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT.parent / 'roviko-launch-film' / 'build'))
import sfx as film  # noqa: E402  (decode, write, peak_time, SR)

OUT = ROOT / 'audio' / 'sfx'
film.OUT = OUT
SR = film.SR
CUES = {  # name: (mixkit id, title, keep seconds, use)
    'scratch': (704, 'Vinyl stop fast scratch', 1.2, 'the record scratch before "wait, what?"'),
    'drumroll': (566, 'Drum Roll', 3.0, 'suspense before a reveal'),
    'fanfare': (722, 'Successful horns fanfare', 2.6, 'the winner'),
    'sadhorn': (973, 'Party sad horn', 1.2, 'a flop'),
    'trombone': (744, 'Trombone disappoint', 2.2, 'wah wah wah'),
    'laugh': (424, 'Crowd laugh', 2.4, 'the crowd laughing'),
    'crowdcheer': (459, 'Male crowd cheering short', 2.6, 'the crowd cheering'),
    'kaching': (2067, 'Casino bling achievement', 2.0, 'a big number landing'),
    'coin2': (2069, 'Winning a coin, video game', 0.8, 'a point'),
    'boom': (2299, 'Short bass hit', 1.2, 'the deep boom on a punchline'),
    'impactbig': (2909, 'Cool impact movie trailer', 2.5, 'the big reveal'),
    'badumtss': (2893, 'Bad joke drums', 1.8, 'ba-dum-tss'),
    'boinghit': (2894, 'Boing hit sound', 0.9, 'a cartoon boing'),
    'fallwhistle': (395, 'Cartoon falling whistle', 1.8, 'something dropping'),
    'yes': (2012, 'Males yes victory', 1.0, '"yes!"'),
    'ticktock': (1046, 'Bell tick tock timer', 3.0, 'the guessing clock'),
    'clownhorn': (715, 'Clown horn at circus', 1.4, 'honk'),
    'swish': (1490, 'Fast whoosh transition', 0.9, 'a fast transition'),
    'levelup2': (2059, 'Game level completed', 2.4, 'level complete'),
    'slot': (1928, 'Slot machine win', 3.0, 'the score counter'),
    'heartbeat': (490, 'Human single heart beat', 1.0, 'tension while nothing happens'),
    'giggle': (108, 'Cartoon monkey mocking and giggling', 2.0, 'mocking laugh'),
}


def main(dl):
    dl = Path(dl); dl.mkdir(parents=True, exist_ok=True)
    meta = json.loads((OUT / 'peaks.json').read_text())
    for name, (mid, title, keep, use) in CUES.items():
        src = dl / f'{mid}.mp3'
        if not src.exists():
            subprocess.run(['curl', '-sS', '-m', '60', '-o', str(src), f'https://assets.mixkit.co/active_storage/sfx/{mid}/{mid}-preview.mp3'], check=True)
        x = film.decode(src)
        # skip leading silence, keep `keep` s, fade the tail
        env = np.abs(x).max(0); start = max(0, int(np.argmax(env > 0.02 * env.max())) - int(0.005 * SR))
        x = x[:, start:start + int(keep * SR)]
        f = min(x.shape[1], int(0.08 * SR)); x[:, -f:] *= np.linspace(1, 0, f)
        film.write(name, x)
        pk, dur = film.peak_time(x)
        meta[name] = {'file': f'{name}.wav', 'peak_s': round(pk, 4), 'duration_s': round(dur, 3),
                      'source': f'Mixkit sound effect {mid} "{title}" (Mixkit Sound Effects Free License)', 'use': use}
        print(f'{name:12s} peak {pk:5.2f}s  len {dur:4.2f}s  {title}')
    (OUT / 'peaks.json').write_text(json.dumps(meta, indent=1))


if __name__ == '__main__':
    main(sys.argv[1])
