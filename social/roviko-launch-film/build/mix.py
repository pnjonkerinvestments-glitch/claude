"""Mix the score and every sound effect, then normalise to -14 LUFS / -1 dBTP.

  python3 build/mix.py  ->  audio/mix.wav (48 kHz stereo 24-bit) + audio/mix-report.json

* Each event in audio/events.json (exported from film.html) names an effect and a time.
  The effect is placed so that its measured peak (audio/sfx/peaks.json) lands on that time;
  a `rate` resamples it (pitch and length), shifting the peak accordingly.
* Balance: every effect is set relative to the music playing under it. For each event the
  RMS of the effect around its peak is compared with the music's RMS in the same window
  (both high-passed at 200 Hz, where masking happens; the bed over 0.4 s around the peak) and the gain is chosen so the effect
  sits TARGET dB above (or below) the bed. The event's own `gain` nudges that result.
* Loudness: two-pass ffmpeg loudnorm (linear) to -14 LUFS integrated, true peak -1 dBTP.
"""
import json
import subprocess
import wave
from pathlib import Path

import numpy as np
from scipy import signal
from scipy.ndimage import minimum_filter1d

SR = 48000
ROOT = Path(__file__).resolve().parent.parent
A = ROOT / 'audio'
DUR = 36.545        # film length (67 beats at 110 BPM)

# effect-over-music level in the 150 ms around its peak (dB). Positive = on top of the bed.
TARGET = {'key': -3, 'pop': -4, 'land': 1, 'tap': 3, 'correct': 4, 'pin': 4, 'coin': 2, 'tick': 1, 'morph': -2,
          'impact': 2, 'swoosh': 1, 'reorder': 1, 'levelup': 2, 'collapse': 0, 'streak': 3, 'cheer': 2, 'open': 0,
          'join': 2, 'whoosh': 3, 'send': 0, 'sparkle': 4, 'expand': -1,
          'full': 3, 'start': 3, 'snap': -5, 'win': 4}
PAN = {'coin': 0.15, 'key': -0.05, 'swoosh': 0.0, 'whoosh': 0.0}
MUSIC_GAIN_DB = -3.0


def read_wav(path):
    with wave.open(str(path)) as w:
        n, ch, sw = w.getnframes(), w.getnchannels(), w.getsampwidth()
        raw = w.readframes(n)
    if sw == 3:
        b = np.frombuffer(raw, np.uint8).reshape(-1, 3)
        x = (b[:, 0].astype(np.int32) | (b[:, 1].astype(np.int32) << 8) | (b[:, 2].astype(np.int32) << 16))
        x = np.where(x & 0x800000, x - 0x1000000, x) / 2 ** 23
    else:
        x = np.frombuffer(raw, '<i2') / 32768
    return x.reshape(-1, ch).T.astype(np.float64)


def write_wav(path, x):
    pcm = (np.clip(x.T, -1, 1) * (2 ** 23 - 1)).astype('<i4')
    b24 = np.ascontiguousarray(pcm).view(np.uint8).reshape(-1, 4)[:, :3].tobytes()
    with wave.open(str(path), 'wb') as w:
        w.setnchannels(2); w.setsampwidth(3); w.setframerate(SR); w.writeframes(b24)


HP = signal.butter(2, 200, 'highpass', fs=SR, output='sos')


def rms_db(x):
    y = signal.sosfilt(HP, x.mean(0) if x.ndim == 2 else x)
    return 10 * np.log10((y ** 2).mean() + 1e-12)


def measure(x):
    """Integrated loudness (LUFS) and true peak (dBTP) via ffmpeg's EBU R128 meter."""
    tmp = A / '.measure.wav'
    write_wav(tmp, x)
    r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', str(tmp), '-af', 'ebur128=peak=true', '-f', 'null', '-'],
                       capture_output=True, text=True).stderr
    tmp.unlink()
    summ = r[r.rindex('Summary:'):]
    return float(summ.split('I:')[1].split('LUFS')[0]), float(summ.split('Peak:')[1].split('dBFS')[0])


def limit(x, ceiling, look=0.002, rel=0.06):
    """Look-ahead peak limiter on the 4x oversampled signal (true peak)."""
    up = signal.resample_poly(x, 4, 1, axis=1)
    pk = np.abs(up).max(0).reshape(-1, 4).max(1)[:x.shape[1]]
    need = np.minimum(1.0, ceiling / np.maximum(pk, 1e-9))
    L = int(look * SR)
    g = minimum_filter1d(need, size=2 * L + 1)          # minimum over the look-ahead window

    a = np.exp(-1 / (rel * SR))
    sm = np.empty_like(g)
    cur = 1.0
    for i in range(len(g)):
        cur = g[i] if g[i] < cur else a * cur + (1 - a) * g[i]
        sm[i] = cur
    limit.max_gr_db = float(-20 * np.log10(sm.min()))
    return x * sm


def main():
    events = json.loads((A / 'events.json').read_text())
    peaks = json.loads((A / 'sfx' / 'peaks.json').read_text())
    music = read_wav(A / 'music' / 'score-edit.wav')[:, :int(DUR * SR)] * 10 ** (MUSIC_GAIN_DB / 20)
    n = int(DUR * SR)
    if music.shape[1] < n:
        music = np.pad(music, ((0, 0), (0, n - music.shape[1])))
    sfx_bus = np.zeros((2, n + SR * 2))
    cache = {}
    report = []
    for e in events:
        name = e['sfx']
        if name not in cache:
            cache[name] = read_wav(A / 'sfx' / peaks[name]['file'])
        x = cache[name]
        rate = e.get('rate', 1.0)
        if rate != 1.0:   # resample: rate > 1 = higher and shorter
            m = int(x.shape[1] / rate)
            src = np.arange(m) * rate
            x = np.stack([np.interp(src, np.arange(x.shape[1]), c) for c in x])
        peak = peaks[name]['peak_s'] / rate
        start = int(round((e['t'] - peak) * SR))
        # balance against the bed around the peak
        hw = 0.5 if name == 'key' else 0.2                             # typing is a run: judge it against a steadier bed
        w0, w1 = int((e['t'] - hw) * SR), int((e['t'] + hw) * SR)
        bed = rms_db(music[:, max(0, w0):max(w0 + 1, min(n, w1))])
        pk = int(peak * SR)
        own = rms_db(x[:, max(0, pk - int(0.05 * SR)):pk + int(0.10 * SR)])
        gain_db = bed + TARGET.get(name, 0) - own + (e.get('gain', 0) + 6) * 0.35
        gain_db = float(np.clip(gain_db, -30, -2))
        pan = PAN.get(name, 0.0)
        a = (pan + 1) * np.pi / 4
        g = 10 ** (gain_db / 20)
        s0 = max(0, start)
        seg = x[:, s0 - start:]
        s1 = min(sfx_bus.shape[1], s0 + seg.shape[1])
        sfx_bus[0, s0:s1] += seg[0, :s1 - s0] * g * np.cos(a) * np.sqrt(2)
        sfx_bus[1, s0:s1] += seg[1, :s1 - s0] * g * np.sin(a) * np.sqrt(2)
        report.append({'t': e['t'], 'beat': e.get('beat'), 'sfx': name, 'rate': round(rate, 3), 'start_s': round(start / SR, 4),
                       'peak_lands_at_s': round(start / SR + peak, 4), 'bed_db': round(bed, 1), 'gain_db': round(gain_db, 1)})
    mix = music + sfx_bus[:, :n]
    fade = int(0.03 * SR)
    mix[:, -fade:] *= np.linspace(1, 0, fade)
    pre = A / 'mix-pre.wav'
    write_wav(pre, mix / max(1.0, np.abs(mix).max() / 0.98))

    # loudness: static gain to -14 LUFS, then a 4x-oversampled look-ahead limiter holds true peak at -1 dBTP
    out = A / 'mix.wav'
    y = mix.copy()
    for _ in range(3):
        I = measure(y)[0]
        y = limit(y * 10 ** ((-14.0 - I) / 20), 10 ** (-1.2 / 20))
    write_wav(out, y)
    I, TP = measure(y)
    m2 = {'normalization_type': 'static gain + true-peak limiter'}
    (A / 'mix-report.json').write_text(json.dumps({'loudness_lufs': I, 'true_peak_dbfs': TP, 'normalization_type': m2.get('normalization_type'),
                                                   'music_gain_db': MUSIC_GAIN_DB, 'events': report}, indent=1))
    print(f'{len(report)} effects placed; final {I:.1f} LUFS, true peak {TP:.1f} dBTP, limiter at most -{limit.max_gr_db:.1f} dB')
    worst = max(abs(r['peak_lands_at_s'] - r['t']) for r in report)
    print(f'largest peak placement error: {worst * 1000:.2f} ms')


if __name__ == '__main__':
    main()
