"""Cut the Mixkit track to the film: an edit on bar lines, so the drop and the ending land on picture.

  "Swings and Slides" by Ahjay Stelino (Mixkit, Mixkit Stock Music Free License), 110.0 BPM, C major.
  Beat grid from build/analyze_music.py: beat 0 at -4.8 ms, period 545.458 ms; drop on bar 36 (78.54 s).

  film beats  0-40  = song bars 32-42   (the build, the drop on film beat 16 = bar 36, the main section)
  film beats 40-end = song bars 59-end  (cut on a downbeat into the song's own ending; the last bar
                                         lands on film beat 44)

  python3 build/music_edit.py  ->  audio/music/score-edit.wav (48 kHz stereo, 24-bit)
"""
import subprocess
import wave
from pathlib import Path

import numpy as np

SR = 48000
ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'audio' / 'music' / 'mixkit-swings-and-slides.mp3'
P, B0 = 0.545458, -0.0048            # beat period and first beat (s), from beatgrid.json
FILM_END_BEATS = 47.0
XF = 0.03                            # crossfade at the cut (s)


def bar_t(bar):
    return B0 + bar * 4 * P


def main():
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(SRC), '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-'],
                         capture_output=True, check=True).stdout
    x = np.frombuffer(raw, np.float32).reshape(-1, 2).T.astype(np.float64)
    n_film = int(round(FILM_END_BEATS * P * SR))
    out = np.zeros((2, n_film))
    a0, a1 = bar_t(32), bar_t(42)                  # segment A
    b0 = bar_t(59)                                 # segment B starts here, placed at film beat 40
    cut = int(round(40 * P * SR))
    segA = x[:, int(round(a0 * SR)):int(round(a0 * SR)) + cut + int(XF * SR)]
    segB = x[:, int(round(b0 * SR)) - int(XF * SR):]
    out[:, :cut] = segA[:, :cut]
    # equal-power crossfade centred on the downbeat
    k = int(XF * SR)
    fade = np.linspace(0, np.pi / 2, 2 * k)
    s = cut - k
    tailA = segA[:, cut - k:cut + k]
    headB = segB[:, :2 * k]
    out[:, s:s + 2 * k] = tailA * np.cos(fade) + headB * np.sin(fade)
    rest = segB[:, 2 * k:]
    m = min(rest.shape[1], n_film - (s + 2 * k))
    out[:, s + 2 * k:s + 2 * k + m] = rest[:, :m]
    # short fade at the very end of the film
    f = int(0.5 * SR)
    out[:, -f:] *= np.linspace(1, 0, f) ** 2
    pcm = (np.clip(out.T, -1, 1) * (2 ** 23 - 1)).astype('<i4')
    b24 = np.ascontiguousarray(pcm).view(np.uint8).reshape(-1, 4)[:, :3].tobytes()
    dst = ROOT / 'audio' / 'music' / 'score-edit.wav'
    with wave.open(str(dst), 'wb') as w:
        w.setnchannels(2); w.setsampwidth(3); w.setframerate(SR); w.writeframes(b24)
    print(f'wrote {dst.name}: {n_film / SR:.3f} s; song {a0:.3f}-{a1:.3f} s then {b0:.3f} s-end, cut at {cut / SR:.3f} s')


if __name__ == '__main__':
    main()
