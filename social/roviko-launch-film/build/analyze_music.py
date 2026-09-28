"""Blind beat-grid and drop analysis of a music file (numpy only, no prior knowledge).

  python3 build/analyze_music.py audio/music/small-trip-130.wav  ->  audio/music/beatgrid.json

1. Onset strength: half-wave rectified spectral flux of a log-magnitude STFT (5.3 ms hop).
2. Tempo: autocorrelation of the onset envelope, 70-180 BPM, parabolic peak refinement.
3. Phase: the grid offset that maximises low-band (kick) onset energy on the beat positions.
4. Drop: the beat with the largest jump in low-band energy (next 2 s vs previous 2 s),
   refined to the first transient on that beat.
"""
import json
import subprocess
import sys
from pathlib import Path

import numpy as np

SR = 48000
HOP = 256


def load(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).astype(np.float64)


def stft_mag(x, n=2048):
    win = np.hanning(n)
    frames = np.lib.stride_tricks.sliding_window_view(np.pad(x, (n // 2, n // 2)), n)[::HOP]
    return np.abs(np.fft.rfft(frames * win, axis=1)), np.fft.rfftfreq(n, 1 / SR)


def main(path):
    x = load(path)
    S, f = stft_mag(x)
    L = np.log1p(100 * S)
    flux = np.maximum(0, np.diff(L, axis=0, prepend=L[:1])).sum(1)
    low = np.maximum(0, np.diff(L[:, f < 150], axis=0, prepend=L[:1, f < 150])).sum(1)
    fps = SR / HOP
    env = flux - np.convolve(flux, np.ones(64) / 64, 'same')
    env = np.maximum(env, 0)

    # Tempo by autocorrelation
    ac = np.correlate(env, env, 'full')[len(env) - 1:]
    lags = np.arange(len(ac))
    bpm_of = lambda lag: 60 * fps / lag
    lo, hi = int(60 * fps / 180), int(60 * fps / 70)
    k = lo + np.argmax(ac[lo:hi])
    a, b, c = ac[k - 1], ac[k], ac[k + 1]
    k_ref = k + 0.5 * (a - c) / (a - 2 * b + c)
    period = k_ref / fps
    bpm = bpm_of(k_ref)
    # Refine: least-squares fit of onset peaks to the grid over the whole track
    # Phase: maximise kick energy sampled at grid positions
    t = np.arange(len(low)) / fps
    best = (0, -1)
    for off in np.arange(0, period, 0.001):
        idx = np.round((np.arange(off, t[-1], period)) * fps).astype(int)
        idx = idx[idx < len(low)]
        score = low[idx].sum() + 0.3 * env[idx].sum()
        if score > best[1]:
            best = (off, score)
    phase = best[0]
    # Snap each grid point to the nearest onset peak within 20 ms and refit period/phase
    grid = np.arange(phase, len(x) / SR, period)
    hits = []
    for g in grid:
        i0, i1 = int((g - 0.02) * fps), int((g + 0.02) * fps)
        if i1 >= len(env) or i0 < 0:
            continue
        w = env[i0:i1]
        if w.max() > np.percentile(env, 90):
            hits.append((round((g - phase) / period), (i0 + np.argmax(w)) / fps))
    # Time-domain refinement: each hit moves to its exact transient (first sample above 30% of
    # the local peak of the low-passed signal), then period and phase come from a straight-line fit.
    from scipy import signal as sg
    xl = sg.sosfilt(sg.butter(2, 200, 'lowpass', fs=SR, output='sos'), x)
    xl = np.convolve(np.abs(sg.hilbert(xl)), np.ones(48) / 48, 'same')   # 1 ms smoothing
    rise = np.diff(xl, prepend=xl[0])

    def transient(t_i, w=0.025):
        i0 = max(0, int((t_i - w) * SR))
        return (i0 + np.argmax(rise[i0:i0 + int(2 * w * SR)])) / SR

    refined = []
    strong = np.percentile(low, 97)
    hits = [(n_i, t_i) for n_i, t_i in hits if low[int(t_i * fps) - 3:int(t_i * fps) + 4].max() > strong] or hits
    for n_i, t_i in hits:
        refined.append((n_i, transient(t_i)))
    n_, tt = np.array(refined).T
    slope, icpt = np.polyfit(n_, tt, 1)
    keep = np.abs(tt - (slope * n_ + icpt)) < 0.010          # drop outliers, refit once
    if keep.sum() >= 4:
        n_, tt = n_[keep], tt[keep]
        slope, icpt = np.polyfit(n_, tt, 1)
    period, phase = slope, icpt % slope
    if phase > period - 0.03:      # a beat a hair before zero is the downbeat at 0
        phase -= period
    bpm = 60 / period
    beats = np.arange(max(phase, 0.0) if phase > -0.03 else phase + period, len(x) / SR - 1e-6, period)
    resid = (tt - (slope * n_ + icpt)) * 1000

    # Drop: the beat with the biggest energy jump (full band and low band, 4 beats after vs 4 before)
    band_low = (S[:, f < 150] ** 2).sum(1)
    band_all = (S ** 2).sum(1)
    def mean_between(band, t0, t1):
        i0, i1 = max(0, int(t0 * fps)), min(len(band), int(t1 * fps))
        return band[i0:i1].mean() + 1e-12
    # A drop is a step: loud right after the beat compared with just before it (short windows),
    # and it lasts (4 beats after vs 4 beats before must rise by at least 3 dB).
    jumps = []
    for i, bt in enumerate(beats):
        if bt < 4 * period or bt > len(x) / SR - 4 * period:
            continue
        def jump(band, a, b):
            return 10 * np.log10(mean_between(band, bt, bt + a * period) / mean_between(band, bt - b * period, bt - 0.01))
        sustained = 0.5 * jump(band_low, 4, 4) + 0.5 * jump(band_all, 4, 4)
        step = 0.5 * jump(band_low, 1, 0.5) + 0.5 * jump(band_all, 1, 0.5)
        if sustained > 3:
            jumps.append((step, i, bt, jump(band_low, 4, 4), jump(band_all, 4, 4)))
    score, drop_beat, drop_t, jump_low, jump_all = max(jumps)
    drop_exact = transient(drop_t)
    jump_db = jump_low

    out = {
        'file': Path(path).name,
        'bpm': round(bpm, 3),
        'beat_period_s': round(period, 6),
        'first_beat_s': round(phase, 4),
        'drop': {'beat': int(drop_beat), 'time_s': round(drop_exact, 4), 'low_band_jump_db': round(jump_low, 1), 'full_band_jump_db': round(jump_all, 1)},
        'grid_fit_residual_ms': {'mean_abs': round(float(np.abs(resid).mean()), 2), 'max_abs': round(float(np.abs(resid).max()), 2), 'beats_used': len(resid)},
        'beats_s': [round(b, 4) for b in beats],
        'downbeats_s': [round(b, 4) for b in beats[::4]],
    }
    dst = Path(path).with_name('beatgrid.json')
    dst.write_text(json.dumps(out, indent=1))
    print(f"tempo {out['bpm']} BPM, period {period * 1000:.2f} ms, first beat {phase * 1000:.1f} ms")
    print(f"grid fit on {len(resid)} beats: mean |error| {np.abs(resid).mean():.2f} ms, max {np.abs(resid).max():.2f} ms")
    print(f"drop on beat {drop_beat} at {drop_exact:.4f} s (low band +{jump_low:.1f} dB, full band +{jump_all:.1f} dB)")
    print('beats:', ' '.join(f'{b:.3f}' for b in beats))
    print('wrote', dst)


if __name__ == '__main__':
    main(sys.argv[1])
