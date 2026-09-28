"""Build the sound-effect library and measure where every effect peaks.

Sources
  * uisfx 0.4.0 (npm, audio CC0 1.0): most effects, decoded from its Ogg files.
  * Synthesised here (no samples): coin tick (tuned to the score, C major), whoosh, impact.

  python3 build/sfx.py [path/to/uisfx/package]  ->  audio/sfx/*.wav + audio/sfx/peaks.json

"Peak" = the time of the loudest point of the 5 ms RMS envelope. The mixer places each
effect so that this point lands exactly on its event in the film.
"""
import json
import subprocess
import sys
import wave
from pathlib import Path

import numpy as np
from scipy import signal

SR = 48000
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'audio' / 'sfx'
rng = np.random.default_rng(11)

UISFX = {  # name: (pack, cue, why)
    'key': ('soft', 'typing', 'one keystroke'),
    'tap': ('soft', 'press', 'finger taps an answer or button'),
    'correct': ('glass', 'success', 'soft correct chime'),
    'pop': ('rubber', 'select', 'answer pills and chips springing in'),
    'land': ('soft', 'drop', 'the flag landing on the card'),
    'tick': ('soft', 'check', 'an answer turning green'),
    'pin': ('organic', 'drop', 'map pin dropping onto Japan'),
    'morph': ('soft', 'swipe', 'question card changing type'),
    'swoosh': ('cinematic', 'swipe', 'leaderboard cards bursting in'),
    'reorder': ('soft', 'reorder', 'You climbing past Emma'),
    'levelup': ('soft', 'level-up', 'Today #3 pill'),
    'collapse': ('soft', 'collapse', 'gold shrinking into the flame chip'),
    'streak': ('soft', 'streak', 'streak number flipping 6 to 7'),
    'cheer': ('glass', 'badge', 'mascot popping up, cheering'),
    'open': ('soft', 'open', 'room code card springing in'),
    'join': ('soft', 'receive', 'Emma joined'),
    'send': ('soft', 'send', 'paper plane taking off'),
    'sparkle': ('glass', 'achievement', 'pin becoming the mascot'),
    'expand': ('soft', 'expand', 'wordmark wiping out'),
}


def decode(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(path), '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).T.astype(np.float64)


def write(name, x):
    if x.ndim == 1:
        x = np.stack([x, x])
    x = x / max(1e-9, np.abs(x).max()) * 10 ** (-1 / 20)
    pcm = (x.T * 32767).astype('<i2')
    with wave.open(str(OUT / f'{name}.wav'), 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())


def peak_time(x):
    m = x.mean(0) if x.ndim == 2 else x
    n = int(0.005 * SR)
    env = np.sqrt(np.convolve(m * m, np.ones(n) / n, 'same'))
    return env.argmax() / SR, len(m) / SR


def bp(x, lo, hi):
    return signal.sosfilt(signal.butter(2, [lo, hi], 'bandpass', fs=SR, output='sos'), x)


def coin():
    """Two quick bell blips a fourth apart (B5 -> E6), like a small coin."""
    t = np.arange(int(0.45 * SR)) / SR
    out = np.zeros_like(t)
    for start, f, g in [(0.0, 987.77, 0.7), (0.055, 1318.51, 1.0)]:
        s = t >= start
        tt = t[s] - start
        out[s] += g * (np.sin(2 * np.pi * f * tt) + 0.25 * np.sin(2 * np.pi * f * 2.76 * tt) * np.exp(-tt / 0.03)) \
            * np.exp(-tt / 0.12) * np.minimum(1, tt / 0.0008)
    return out


def whoosh(sec=0.9, peak_at=0.55):
    """Noise through a sweeping band-pass, swelling to a peak and falling away."""
    t = np.arange(int(sec * SR)) / SR
    n = rng.standard_normal(len(t))
    env = np.where(t < peak_at, (t / peak_at) ** 2.2, np.exp(-(t - peak_at) / 0.12))
    out = np.zeros((2, len(t)))
    steps = 60
    for k in range(steps):
        a, b = k * len(t) // steps, (k + 1) * len(t) // steps
        c = 300 * (2600 / 300) ** min(1, t[a] / peak_at) if t[a] < peak_at else 2600 * np.exp(-(t[a] - peak_at) / 0.3)
        seg = bp(n[max(0, a - 3000):b], max(60, c * 0.6), min(c * 1.8, 20000))[-(b - a):]
        pan = -0.6 + 1.2 * t[a] / sec
        out[0, a:b] = seg * np.cos((pan + 1) * np.pi / 4)
        out[1, a:b] = seg * np.sin((pan + 1) * np.pi / 4)
    return out * env


def impact():
    """Low thump + sub drop + a short bright crack, for the gold flood."""
    t = np.arange(int(1.3 * SR)) / SR
    sub = np.sin(2 * np.pi * np.cumsum(38 + 70 * np.exp(-t / 0.05)) / SR) * np.exp(-t / 0.45)
    thump = bp(rng.standard_normal(len(t)), 60, 400) * np.exp(-t / 0.06) * 0.8
    crack = bp(rng.standard_normal(len(t)), 1500, 9000) * np.exp(-t / 0.018) * 0.45
    x = np.tanh(1.4 * (sub + thump + crack)) * np.minimum(1, t / 0.001)
    return x


def main(pkg):
    OUT.mkdir(parents=True, exist_ok=True)
    meta = {}
    for name, (pack, cue, why) in UISFX.items():
        x = decode(Path(pkg) / 'sounds' / pack / f'{cue}.ogg')
        write(name, x)
        pk, dur = peak_time(x)
        meta[name] = {'file': f'{name}.wav', 'peak_s': round(pk, 4), 'duration_s': round(dur, 3),
                      'source': f'uisfx 0.4.0, pack "{pack}", cue "{cue}" (CC0 1.0)', 'use': why}
    for name, fn, why in [('coin', coin, 'each +50 chip arriving in the points counter'),
                          ('whoosh', whoosh, 'the button filling the page'),
                          ('impact', impact, 'the drop: gold flood')]:
        x = fn()
        write(name, x)
        pk, dur = peak_time(x)
        meta[name] = {'file': f'{name}.wav', 'peak_s': round(pk, 4), 'duration_s': round(dur, 3),
                      'source': 'synthesised for this film (build/sfx.py), no samples', 'use': why}
    (OUT / 'peaks.json').write_text(json.dumps(meta, indent=1))
    w = max(len(k) for k in meta)
    for k, v in meta.items():
        print(f"{k:{w}s}  peak {v['peak_s'] * 1000:6.1f} ms  of {v['duration_s']:.2f} s   {v['use']}")


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else str(ROOT / 'node_modules' / 'uisfx'))
