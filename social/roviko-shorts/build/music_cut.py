"""Cut each short's song to picture on beat lines.

  python3 build/music_cut.py sydney|streak|gamenight|flagaday  ->  audio/<short>/music.wav (48 kHz stereo, 24-bit)

Every short plays at its song's measured tempo, so one film beat is one song beat. A piece is
(film beat, song beat[, film beat where it stops with a tape-stop]). Grids from build/analyze_music.py.
"""
import json
import subprocess
import sys
import wave
from pathlib import Path

import numpy as np

SR = 48000
ROOT = Path(__file__).resolve().parent.parent
MUSIC = ROOT / 'audio' / 'music'
SHORTS = {
    # 1. "POV: you're 100% sure it's Sydney": the hook plays, stops dead on the wrong answer (tape stop), and comes back
    'sydney': dict(song='funkee-monkeee', end=15, fade=0.6, pieces=[(0, 48, 3.2), (7, 48, None)]),
    # 2. "23:58, my streak": full beat while he panics, the song's break under 23:59:57-59, the drop on "streak saved"
    'streak': dict(song='take-this-higher', end=32, fade=0.9, pieces=[(0, 38, None)]),
    # 3. "Game night": groove from the first frame; 16 beats skipped (song 32 -> 48, similarity 0.91);
    #    the song's dip under "Lucas left the room" (film 40), back to full for the rematch (film 48)
    'gamenight': dict(song='life-is-a-dream', end=54, fade=1.2, pieces=[(0, 16, None), (16, 48, None)]),
    # Flag a Day: 3-2-1 on the groove, "time's up" on the song's break (film 7 = song 56), the reveal on the drop (film 10 = song 59)
    'flagaday': dict(song='take-this-higher', end=15, fade=0.5, pieces=[(0, 49, None)]),
}
XF = 0.02          # crossfade at each cut (s)
STOP = 0.42        # tape stop length (s)


def load(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(path), '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).T.astype(np.float64)


def main(name):
    cfg = SHORTS[name]
    grid = json.loads((MUSIC / f"beatgrid-{cfg['song']}.json").read_text())
    P, B0 = grid['beat_period_s'], grid['first_beat_s']
    x = load(MUSIC / f"mixkit-{cfg['song']}.mp3")
    n = int(round(cfg['end'] * P * SR))
    out = np.zeros((2, n))
    k = int(XF * SR)
    pieces = cfg['pieces']
    for i, (fb, sb, stop) in enumerate(pieces):
        a = int(round(fb * P * SR))
        nxt = int(round(pieces[i + 1][0] * P * SR)) if i + 1 < len(pieces) else n
        b = int(round(stop * P * SR)) if stop is not None else nxt
        s0 = int(round((B0 + sb * P) * SR))
        a0, b1 = max(0, a - k), min(n, b + k)
        seg = x[:, s0 - (a - a0):s0 - (a - a0) + (b1 - a0)]
        seg = np.pad(seg, ((0, 0), (0, (b1 - a0) - seg.shape[1])))
        env = np.ones(b1 - a0)
        if i > 0 and a0 > 0:
            env[:2 * k] = np.sin(np.linspace(0, np.pi / 2, 2 * k))
        if stop is None and i + 1 < len(pieces):
            env[-2 * k:] = np.cos(np.linspace(0, np.pi / 2, 2 * k))
        if stop is not None:
            # tape stop: playback speed falls from 1 to 0 over STOP seconds (pitch and tempo drop together)
            m = int(STOP * SR)
            u = np.arange(m) / SR
            pos = s0 + (b - a) + np.cumsum((1 - u / STOP) ** 1.6)
            tail = np.stack([np.interp(pos, np.arange(x.shape[1]), c) for c in x]) * np.linspace(1, 0.2, m) ** 0.5
            seg = seg[:, :b - a0]; env = env[:b - a0]
            e1 = min(n, b + m)
            out[:, b:e1] += tail[:, :e1 - b]
        out[:, a0:a0 + seg.shape[1]] += seg * env
        print(f"film {fb:5.1f}-{(b / SR / P):5.1f} <- song beat {sb} ({B0 + sb * P:.3f} s){' + tape stop' if stop is not None else ''}")
    f = int(cfg['fade'] * SR)
    out[:, -f:] *= np.linspace(1, 0, f) ** 2
    dst = ROOT / 'audio' / name / 'music.wav'
    dst.parent.mkdir(parents=True, exist_ok=True)
    pcm = (np.clip(out.T, -1, 1) * (2 ** 23 - 1)).astype('<i4')
    with wave.open(str(dst), 'wb') as w:
        w.setnchannels(2); w.setsampwidth(3); w.setframerate(SR)
        w.writeframes(np.ascontiguousarray(pcm).view(np.uint8).reshape(-1, 4)[:, :3].tobytes())
    print(f'wrote {dst.relative_to(ROOT)}: {n / SR:.3f} s at {60 / P:.3f} BPM')


if __name__ == '__main__':
    main(sys.argv[1])
