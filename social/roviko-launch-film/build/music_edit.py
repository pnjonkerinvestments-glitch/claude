"""Cut the Mixkit track to the film: edits on bar lines, so the drop and the ending land on picture.

  "Aerobic Fashion" by Arulo (Mixkit, Mixkit Stock Music Free License), 110.0 BPM.
  Beat grid from build/analyze_music.py: beat 0 at 0.2606 s, period 545.403 ms; bars start on song beats 3, 7, 11, ...
  Song map (bars): intro 0-15 s, groove from beat 31, a one-bar break on beat 59, the drop on beat 63 (34.60 s),
  chorus to beat 123, then a softer breakdown from beat 127.

  film beats  0-32  = song beats 47-79    (the groove, the one-bar break under Q4/Q5, the drop on film beat 16)
  film beats 32-end = song beats 95-end   (4 chorus bars are skipped; bars 79-95 and 95-111 match at 0.99, so the cut
                                           is seamless. The chorus ends on film beat 60-62 under the end card, and
                                           the breakdown starts on film beat 64, where Roviko hops)

  python3 build/music_edit.py  ->  audio/music/score-edit.wav (48 kHz stereo, 24-bit)
"""
import subprocess
import wave
from pathlib import Path

import numpy as np

SR = 48000
ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'audio' / 'music' / 'mixkit-aerobic-fashion.mp3'
P, B0 = 0.545403, 0.2606             # beat period and first beat (s), from beatgrid.json
FILM_P = 60 / 110                    # the film's beat
FILM_END_BEATS = 67.0
SEGMENTS = [(0, 47), (32, 95)]       # (film beat, song beat) where each piece starts
XF = 0.03                            # crossfade at each cut (s)
FADE = 1.6                           # fade at the very end (s)


def song_t(beat):
    return B0 + beat * P


def main():
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(SRC), '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-'],
                         capture_output=True, check=True).stdout
    x = np.frombuffer(raw, np.float32).reshape(-1, 2).T.astype(np.float64)
    n_film = int(round(FILM_END_BEATS * FILM_P * SR))
    out = np.zeros((2, n_film))
    k = int(XF * SR)
    for i, (fb, sb) in enumerate(SEGMENTS):
        start = int(round(fb * FILM_P * SR))
        end = int(round(SEGMENTS[i + 1][0] * FILM_P * SR)) if i + 1 < len(SEGMENTS) else n_film
        s0 = int(round(song_t(sb) * SR))
        a, b = max(0, start - k), min(n_film, end + k)            # each piece overlaps its neighbours by XF
        seg = x[:, s0 - (start - a):s0 - (start - a) + (b - a)]
        seg = np.pad(seg, ((0, 0), (0, (b - a) - seg.shape[1])))
        env = np.ones(b - a)
        if i > 0:
            env[:2 * k] = np.sin(np.linspace(0, np.pi / 2, 2 * k))   # equal-power fade in, centred on the downbeat
        if i + 1 < len(SEGMENTS):
            env[-2 * k:] = np.cos(np.linspace(0, np.pi / 2, 2 * k))
        out[:, a:b] += seg * env
        print(f'film {fb:5.1f}-{(end / SR / FILM_P):5.1f} beats <- song {song_t(sb):7.3f} s (beat {sb})')
    f = int(FADE * SR)
    out[:, -f:] *= np.linspace(1, 0, f) ** 2
    pcm = (np.clip(out.T, -1, 1) * (2 ** 23 - 1)).astype('<i4')
    b24 = np.ascontiguousarray(pcm).view(np.uint8).reshape(-1, 4)[:, :3].tobytes()
    dst = ROOT / 'audio' / 'music' / 'score-edit.wav'
    with wave.open(str(dst), 'wb') as w:
        w.setnchannels(2); w.setsampwidth(3); w.setframerate(SR); w.writeframes(b24)
    print(f'wrote {dst.name}: {n_film / SR:.3f} s')


if __name__ == '__main__':
    main()
