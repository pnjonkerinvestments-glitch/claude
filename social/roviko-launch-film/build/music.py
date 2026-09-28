"""Original score for the Roviko launch film: "Small Trip", 130 BPM, C major.

Composed and synthesised here from scratch (no samples), so it is royalty-free by
construction. The arrangement is written against the film's beat map:

  beats  0-12  intro: marimba arpeggios, snaps, shaker; F-G build with riser and clap roll
  beat   11.75 a quaver of silence (the breath)
  beat   12    the drop: kick, sub impact, crash, ukulele strum, bass, whistle hook
  beats 12-28  C | G | Am | F, whistle + glockenspiel melody
  beat   28    pin becomes the mascot: hit, then marimba climbs G-A-B
  beat   30    final C chord for the end card, beat 31 a glockenspiel ding

  python3 build/music.py   ->  audio/music/small-trip-130.wav (48 kHz, stereo, 24-bit)
"""
import numpy as np
from scipy import signal
from pathlib import Path
import wave

SR = 48000
BPM = 130
B = 60 / BPM
DUR = 15.0
N = int(SR * DUR)
rng = np.random.default_rng(7)
ROOT = Path(__file__).resolve().parent.parent

NOTE = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}


def midi(name):
    """'C#5' -> 73."""
    n = NOTE[name[0]]
    rest = name[1:]
    if rest.startswith('#'):
        n += 1; rest = rest[1:]
    elif rest.startswith('b'):
        n -= 1; rest = rest[1:]
    return 12 * (int(rest) + 1) + n


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def at(beat):
    return int(round(beat * B * SR))


def tvec(sec):
    return np.arange(int(sec * SR)) / SR


def bp(x, lo, hi, order=2):
    sos = signal.butter(order, [lo, hi], 'bandpass', fs=SR, output='sos')
    return signal.sosfilt(sos, x)


def hp(x, f, order=2):
    return signal.sosfilt(signal.butter(order, f, 'highpass', fs=SR, output='sos'), x)


def lp(x, f, order=2):
    return signal.sosfilt(signal.butter(order, f, 'lowpass', fs=SR, output='sos'), x)


def noise(sec):
    return rng.standard_normal(int(sec * SR))


class Bus:
    def __init__(self):
        self.x = np.zeros((2, N + SR * 3))

    def add(self, sig, beat, gain=1.0, pan=0.0, offset_s=0.0):
        i = at(beat) + int(offset_s * SR)
        if i < 0:
            sig = sig[-i:]; i = 0
        j = min(i + len(sig), self.x.shape[1])
        a = (pan + 1) * np.pi / 4
        self.x[0, i:j] += sig[:j - i] * gain * np.cos(a)
        self.x[1, i:j] += sig[:j - i] * gain * np.sin(a)


# ---------------------------------------------------------------- drums
def kick(v=1.0):
    t = tvec(0.5)
    f = 46 + 150 * np.exp(-t / 0.026) + 24 * np.exp(-t / 0.15)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.2) * np.minimum(1, t / 0.0008)
    click = hp(noise(0.5), 2500) * np.exp(-t / 0.0025) * 0.25
    x = body + click
    return v * np.tanh(1.6 * x) / np.tanh(1.6)


def sub_boom():
    t = tvec(1.4)
    f = 52 * np.exp(-t / 1.5) + 8
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.55) * np.minimum(1, t / 0.004)


def clap(v=1.0):
    t = tvec(0.45)
    env = np.zeros_like(t)
    for k, d in enumerate([0, 0.008, 0.017]):
        s = t >= d
        env[s] += np.exp(-(t[s] - d) / 0.0045) * (0.8 + 0.1 * k)
    s = t >= 0.024
    env[s] += 0.9 * np.exp(-(t[s] - 0.024) / 0.1)
    return v * bp(noise(0.45), 850, 2600) * env * 0.9


def snap(v=1.0):
    t = tvec(0.2)
    return v * (bp(noise(0.2), 1500, 4200) * np.exp(-t / 0.016) + 0.35 * np.sin(2 * np.pi * 2100 * t) * np.exp(-t / 0.008))


def hat(open_=False, v=1.0):
    d = 0.5 if open_ else 0.12
    t = tvec(d)
    return v * hp(noise(d), 7200, 4) * np.exp(-t / (0.16 if open_ else 0.03))


def shaker(v=1.0):
    t = tvec(0.14)
    env = np.minimum(1, t / 0.012) * np.exp(-np.maximum(0, t - 0.012) / 0.035)
    return v * bp(noise(0.14), 4500, 11000) * env


def tambourine(v=1.0):
    t = tvec(0.3)
    n = noise(0.3)
    x = sum(bp(n, f * 0.97, f * 1.03) for f in (5900, 7800, 10400)) * 2.2 + hp(n, 8000) * 0.4
    env = np.exp(-t / 0.09)
    s = t >= 0.018
    env[s] += 0.6 * np.exp(-(t[s] - 0.018) / 0.07)
    return v * x * env


def crash(v=1.0, dur=2.6):
    t = tvec(dur)
    n = noise(dur)
    ring = sum(np.sin(2 * np.pi * f * t + rng.uniform(0, 6)) for f in (3210, 4470, 5530, 6970, 8340)) * 0.06
    x = hp(n, 4000, 2) * 0.8 + bp(n, 6000, 12000) * 0.6 + ring
    return v * x * np.exp(-t / 0.9) * np.minimum(1, t / 0.002)


def riser(sec):
    t = tvec(sec)
    n = noise(sec)
    out = np.zeros_like(t)
    steps = 48
    for k in range(steps):
        a, b = int(k * len(t) / steps), int((k + 1) * len(t) / steps)
        c = 350 * (7500 / 350) ** (k / steps)
        seg = bp(n[max(0, a - 2000):b], c * 0.8, min(c * 1.25, 20000))[-(b - a):]
        out[a:b] = seg
    return out * (t / sec) ** 2.2


# ---------------------------------------------------------------- tonal
def marimba(m, v=1.0):
    f = hz(m)
    t = tvec(1.2)
    dec = 0.55 * (hz(60) / f) ** 0.35
    x = (np.sin(2 * np.pi * f * t) * np.exp(-t / dec)
         + 0.3 * np.sin(2 * np.pi * f * 3.93 * t) * np.exp(-t / (dec * 0.22))
         + 0.1 * np.sin(2 * np.pi * f * 9.2 * t) * np.exp(-t / (dec * 0.07)))
    x += lp(noise(1.2), 3000) * np.exp(-t / 0.002) * 0.15
    return v * x * np.minimum(1, t / 0.0015)


def glock(m, v=1.0, dur=1.8):
    f = hz(m)
    t = tvec(dur)
    x = (np.sin(2 * np.pi * f * t) * np.exp(-t / 0.9)
         + 0.28 * np.sin(2 * np.pi * f * 2.756 * t) * np.exp(-t / 0.28)
         + 0.08 * np.sin(2 * np.pi * f * 5.404 * t) * np.exp(-t / 0.09))
    x += hp(noise(dur), 5000) * np.exp(-t / 0.0015) * 0.2
    return v * x * np.minimum(1, t / 0.001)


def ks(m, dur=1.6, bright=0.5, decay=0.996):
    """Karplus-Strong pluck, tuned exactly by synthesising at f*(L+0.5) Hz and resampling."""
    f = hz(m)
    L = max(8, int(round(SR / f - 0.5)))
    sr2 = f * (L + 0.5)
    n2 = int(dur * sr2)
    exc = rng.uniform(-1, 1, L)
    exc = np.convolve(exc, np.ones(3) / 3, 'same') if bright < 0.7 else exc
    exc = exc - exc.mean()
    y = np.zeros(n2 + L + 1)
    y[:L] = exc
    k = L
    prev_last = 0.0
    while k < n2 + L:
        e = min(k + L, n2 + L)
        seg = y[k - L:e - L]
        seg1 = np.concatenate(([y[k - L - 1] if k - L - 1 >= 0 else prev_last], seg[:-1]))
        y[k:e] = decay * (bright * seg + (1 - bright) * 0.5 * (seg + seg1))
        k = e
    y = y[L:L + n2]
    tt = np.arange(int(dur * SR)) / SR
    out = np.interp(tt * sr2, np.arange(n2), y)
    return out * np.minimum(1, tt / 0.001)


def uke(m, v=1.0):
    x = ks(m, 1.5, bright=0.55, decay=0.9975)
    return v * hp(x, 180) * 0.8


UKE = {  # re-entrant GCEA voicings, string order G C E A
    'C': ['G4', 'C4', 'E4', 'C5'],
    'G': ['G4', 'D4', 'G4', 'B4'],
    'Am': ['A4', 'C4', 'E4', 'A4'],
    'F': ['A4', 'C4', 'F4', 'A4'],
}


def strum(bus, chord, beat, down=True, v=1.0, pan=-0.25):
    notes = UKE[chord] if down else UKE[chord][::-1]
    for i, nm in enumerate(notes):
        bus.add(uke(midi(nm), v * (1 - 0.07 * i)), beat, 1.0, pan + 0.05 * i, offset_s=i * 0.011)


def bass(m, dur_beats, v=1.0):
    f = hz(m)
    d = dur_beats * B
    t = tvec(d + 0.08)
    ph = 2 * np.pi * np.cumsum(f * (1 + 0.03 * np.exp(-t / 0.02))) / SR
    x = np.sin(ph) + 0.28 * np.sin(2 * ph) + 0.1 * np.sin(3 * ph) + 0.04 * np.sin(4 * ph)
    env = np.minimum(1, t / 0.003) * (0.45 + 0.55 * np.exp(-t / 0.18))
    env *= np.clip((d + 0.04 - t) / 0.04, 0, 1)
    return v * x * env


def pad(chord_midis, beats):
    d = beats * B
    t = tvec(d + 0.6)
    x = np.zeros_like(t)
    for m in chord_midis:
        for det in (-0.0045, 0, 0.0045):
            f = hz(m) * (1 + det)
            ph0 = rng.uniform(0, 6.28)
            for h in range(1, 10):
                if f * h > 7000:
                    break
                x += np.sin(2 * np.pi * f * h * t + ph0 * h) / h * (0.8 ** h)
    env = np.minimum(1, t / 0.35) * np.clip((d + 0.5 - t) / 0.5, 0, 1)
    return x * env / (len(chord_midis) * 3)


def whistle(line, bus, gain=1.0, pan=0.12):
    """line: list of (beat, midi, beats). Continuous phase with short glides between notes."""
    if not line:
        return
    start = line[0][0]
    end = line[-1][0] + line[-1][2]
    t = np.arange(at(end) - at(start) + int(0.12 * SR)) / SR
    f = np.zeros_like(t)
    amp = np.zeros_like(t)
    for i, (b0, m, db) in enumerate(line):
        a = at(b0) - at(start)
        e = at(b0 + db) - at(start)
        f[a:e] = hz(m)
        tl = np.arange(e - a) / SR
        rel = (db * B) - tl
        env = np.minimum(1, tl / 0.02) * np.clip(rel / 0.05, 0.0, 1)
        legato = i + 1 < len(line) and abs(line[i + 1][0] - (b0 + db)) < 1e-6
        if legato:
            env = np.minimum(1, tl / 0.02) * np.clip(0.75 + rel / 0.2, 0.75, 1)
        amp[a:e] = np.maximum(amp[a:e], env)
    f[f == 0] = np.maximum.accumulate(np.where(f > 0, f, 0))[f == 0] if (f > 0).any() else 440
    # glide: smooth the pitch contour over ~25 ms
    k = int(0.025 * SR)
    fs = np.convolve(np.log(np.maximum(f, 1)), np.ones(k) / k, 'same')
    fs = np.exp(fs)
    fs[:k] = f[:k]
    vib = 1 + 0.004 * np.sin(2 * np.pi * 5.6 * t) * np.clip((t - 0.1) / 0.2, 0, 1)
    ph = 2 * np.pi * np.cumsum(fs * vib) / SR
    x = np.sin(ph) + 0.06 * np.sin(2 * ph) + 0.02 * np.sin(3 * ph)
    breath = bp(rng.standard_normal(len(t)), 1800, 6000) * 0.035
    y = (x + breath) * amp
    bus.add(y * gain, start, 1.0, pan)


def parse(line, start_beat, octave_shift=0):
    """'C6:2 G5:2 A5 G5 E5:2 r' in quavers -> [(beat, midi, beats)]"""
    out = []
    b = start_beat
    for tok in line.split():
        nm, _, d = tok.partition(':')
        d = float(d or 1) / 2
        if nm != 'r':
            out.append((b, midi(nm) + octave_shift, d))
        b += d
    return out


# ---------------------------------------------------------------- arrangement
drums = Bus(); keys = Bus(); lead = Bus(); low = Bus(); fx = Bus()

CH = {'C': ['C4', 'E4', 'G4'], 'G': ['B3', 'D4', 'G4'], 'Am': ['A3', 'C4', 'E4'], 'F': ['A3', 'C4', 'F4']}
ROOTS = {'C': 'C2', 'G': 'G1', 'Am': 'A1', 'F': 'F1'}

# Intro marimba arpeggios (quavers), beats 0-11.75
ARP = {
    'C': ['C5', 'E5', 'G5', 'E5', 'C6', 'G5', 'E5', 'G5'],
    'Am': ['A4', 'C5', 'E5', 'C5', 'A5', 'E5', 'C5', 'E5'],
    'F': ['F4', 'A4', 'C5', 'A4'],
    'G': ['G4', 'B4', 'D5', 'B4'],
}
seq = [(0, 'C'), (4, 'Am'), (8, 'F'), (10, 'G')]
for b0, ch in seq:
    for i, nm in enumerate(ARP[ch]):
        b = b0 + i * 0.5
        if b >= 11.75:
            continue
        v = 0.95 if i % 2 == 0 else 0.7
        keys.add(marimba(midi(nm), v), b, 0.5, 0.2 if i % 2 else -0.1)
# Low marimba roots on each bar, and at the two build chords
for b0, ch in seq:
    keys.add(marimba(midi(ROOTS[ch]) + 24, 0.8), b0, 0.4, 0)

drums.add(kick(0.55), 0)  # soft opening thump
for b in (1, 3, 5, 7, 9):
    drums.add(snap(0.55), b, 1.0, 0.3)
for k in range(int((11.5 - 4) * 4)):
    b = 4 + k * 0.25
    drums.add(shaker(0.22 if k % 2 else 0.32), b, 1.0, 0.45)
for b0, ch in [(4, 'Am'), (8, 'F'), (10, 'G')]:
    low.add(bass(midi(ROOTS[ch]) + 12, 1.8 if b0 < 8 else 1.8, 0.45), b0)
keys.add(pad([midi(n) for n in CH['C']], 4), 0, 0.22)
keys.add(pad([midi(n) for n in CH['Am']], 4), 4, 0.22)
keys.add(pad([midi(n) for n in CH['F']], 2), 8, 0.26)
keys.add(pad([midi(n) for n in CH['G']], 1.75), 10, 0.3)

# Build: clap roll + riser + reverse crash into the drop
for k in range(4):
    drums.add(clap(0.35 + 0.08 * k), 10 + k * 0.5, 1.0, -0.1)
for k in range(3):
    drums.add(clap(0.6 + 0.1 * k), 11 + k * 0.25, 1.0, 0.1)
fx.add(riser(3.75 * B), 8, 0.22, 0)
rc = crash(0.5, 1.0)[::-1][-int(0.25 * B * SR):]
fx.add(rc * np.linspace(0.2, 1, len(rc)) ** 2, 11.75, 0.35, 0)

# The drop: beats 12-28
PROG = [(12, 'C'), (16, 'G'), (20, 'Am'), (24, 'F')]
drums.add(sub_boom(), 12, 0.9, 0)
drums.add(crash(0.6), 12, 0.55, 0.1)
drums.add(crash(0.45), 20, 0.4, -0.1)
kicks = []
for b in range(12, 28):
    drums.add(kick(1.0), b)
    kicks.append(b)
    if b % 2 == 1:
        drums.add(clap(0.85), b, 1.0, 0.05)
        drums.add(tambourine(0.25), b, 1.0, 0.35)
    drums.add(hat(True, 0.18), b + 0.5, 1.0, -0.35)
    for s in (0.25, 0.75):
        drums.add(hat(False, 0.12), b + s, 1.0, -0.3)
    for s in range(4):
        drums.add(shaker(0.2 if s % 2 else 0.12), b + s * 0.25, 1.0, 0.5)
# fill into beat 28
for k in range(4):
    drums.add(clap(0.45 + 0.12 * k), 27 + k * 0.25, 1.0, 0)

BASSLINE = [(0, 0), (0.5, 12), (1.5, 0), (2, 0), (2.5, 12), (3, 7), (3.5, 12)]
for b0, ch in PROG:
    r = midi(ROOTS[ch])
    for off, st in BASSLINE:
        low.add(bass(r + st, 0.42, 0.9), b0 + off)
    for off, down in [(0, True), (1, True), (1.5, False), (2.5, False), (3, True), (3.5, False)]:
        strum(keys, ch, b0 + off, down, 0.8 if down else 0.55)
    keys.add(pad([midi(n) for n in CH[ch]], 4), b0, 0.2)

hook = (parse('C6:2 G5:2 A5 G5 E5:2', 12) + parse('D5:2 G5:2 B5 A5 G5:2', 16)
        + parse('E6:2 C6:2 D6 C6 A5:2', 20) + parse('F5 A5 C6:2 D6 C6 A5 G5', 24)
        + parse('C6:4', 28))
whistle(hook, lead, 0.42)
for b, m, d in hook:
    lead.add(glock(m + 12, 0.5), b, 0.16, 0.35)

# Beat 28: the pin becomes the mascot. Hit, then climb to the final chord at 30.
drums.add(kick(1.0), 28)
drums.add(crash(0.5), 28, 0.45, 0)
drums.add(sub_boom(), 28, 0.45, 0)
strum(keys, 'C', 28, True, 0.9)
low.add(bass(midi('C2'), 1.6, 0.9), 28)
keys.add(pad([midi(n) for n in CH['C']], 4.4), 28, 0.24)
for b in (29, ):
    drums.add(snap(0.5), b, 1.0, 0.3)
for k in range(8):
    drums.add(shaker(0.16 if k % 2 else 0.1), 28 + k * 0.25, 1.0, 0.5)
for b, nm in [(28.5, 'G5'), (29, 'A5'), (29.5, 'B5')]:
    keys.add(marimba(midi(nm), 0.9), b, 0.55, 0.1)
    lead.add(glock(midi(nm) + 12, 0.5), b, 0.12, 0.35)
# Final chord at 30
drums.add(kick(0.9), 30)
drums.add(crash(0.35, 2.0), 30, 0.3, 0)
strum(keys, 'C', 30, True, 1.0)
strum(keys, 'C', 30.02, True, 0.4, pan=0.3)
low.add(bass(midi('C2'), 2.2, 0.85), 30)
for nm in ('C6', 'E6', 'G6'):
    lead.add(glock(midi(nm), 0.6, 2.4), 30, 0.18, 0.2)
keys.add(marimba(midi('C6'), 1.0), 30, 0.55, 0)
lead.add(glock(midi('C7'), 0.7, 2.0), 31, 0.2, 0.4)  # the wink

# ---------------------------------------------------------------- mix
def reverb(x, rt=0.9, pre=0.018, lpf=6000):
    n = int(rt * SR * 1.2)
    t = np.arange(n) / SR
    irs = []
    for c in range(2):
        ir = rng.standard_normal(n) * np.exp(-t * 6.9 / rt)
        ir = lp(ir, lpf)
        ir = np.concatenate([np.zeros(int(pre * SR)), ir])
        irs.append(ir / np.sqrt((ir ** 2).sum()))
    return np.stack([signal.fftconvolve(x[c], irs[c])[:x.shape[1]] for c in range(2)])


def sidechain(x, depth=0.45, rel=0.13):
    g = np.ones(x.shape[1])
    tt = np.arange(x.shape[1]) / SR
    for b in kicks + [28, 30]:
        t0 = b * B
        s = tt >= t0
        d = tt[s] - t0
        g[s] = np.minimum(g[s], 1 - depth * np.exp(-d / rel) * np.minimum(1, d / 0.004 + 0.3))
    return x * g


keys.x = sidechain(keys.x, 0.35)
low.x = sidechain(low.x, 0.6, 0.11)
lead.x = sidechain(lead.x, 0.12)

send = keys.x * 0.25 + lead.x * 0.3 + drums.x * 0.06 + fx.x * 0.2
wet = reverb(hp(send, 250), 1.1)
mix = drums.x * 0.9 + keys.x * 0.85 + lead.x * 0.9 + low.x * 0.95 + fx.x + wet * 0.55
mix = mix[:, :N]

# gentle glue: soft clip, then normalise to -1 dBFS peak (loudness is set in the final mix)
def biquad(x, kind, f0, gain_db, q=0.707):
    A = 10 ** (gain_db / 40); w = 2 * np.pi * f0 / SR; al = np.sin(w) / (2 * q); c = np.cos(w)
    if kind == 'peak':
        b = [1 + al * A, -2 * c, 1 - al * A]; a = [1 + al / A, -2 * c, 1 - al / A]
    else:  # high shelf
        sq = 2 * np.sqrt(A) * al
        b = [A * ((A + 1) + (A - 1) * c + sq), -2 * A * ((A - 1) + (A + 1) * c), A * ((A + 1) + (A - 1) * c - sq)]
        a = [(A + 1) - (A - 1) * c + sq, 2 * ((A - 1) - (A + 1) * c), (A + 1) - (A - 1) * c - sq]
    return signal.lfilter(np.array(b) / a[0], np.array(a) / a[0], x, axis=-1)


# master tone: warmth in the low mids, presence and air on top
mix = biquad(mix, 'peak', 380, 3.5, 0.7)
mix = biquad(mix, 'peak', 1000, -1.5, 1.0)
mix = biquad(mix, 'shelf', 2800, 6.0, 0.6)
mix = biquad(mix, 'peak', 60, -2.0, 0.9)

mix *= 0.5 / np.percentile(np.abs(mix), 99.95)       # most peaks at -6 dBFS
knee = 0.6                                          # soft limiter above the knee
a = np.abs(mix)
over = a > knee
mix[over] = np.sign(mix[over]) * (knee + (1 - knee) * np.tanh((a[over] - knee) / (1 - knee)))
fade = int(0.25 * SR)
mix[:, -fade:] *= np.linspace(1, 0, fade) ** 2
mix *= 10 ** (-1 / 20) / np.abs(mix).max()

out = ROOT / 'audio' / 'music' / 'small-trip-130.wav'
pcm = (np.clip(mix.T, -1, 1) * (2 ** 23 - 1)).astype('<i4')
b24 = np.ascontiguousarray(pcm).view(np.uint8).reshape(-1, 4)[:, :3].tobytes()
with wave.open(str(out), 'wb') as w:
    w.setnchannels(2); w.setsampwidth(3); w.setframerate(SR); w.writeframes(b24)
print('wrote', out, f'{mix.shape[1] / SR:.2f}s')

if __name__ == '__main__' and __import__('os').environ.get('STEMS'):
    for name, bus in [('drums', drums), ('keys', keys), ('lead', lead), ('low', low), ('fx', fx)]:
        x = bus.x[:, :N]
        print(f'{name:6s} peak {20*np.log10(np.abs(x).max()+1e-9):6.1f} dB  rms {20*np.log10(np.sqrt((x**2).mean())+1e-9):6.1f} dB')
    x = wet[:, :N]
    print(f'wet    peak {20*np.log10(np.abs(x).max()+1e-9):6.1f} dB  rms {20*np.log10(np.sqrt((x**2).mean())+1e-9):6.1f} dB')
