"""Frame-level QA for a rendered film: single-frame pops, sudden jumps, and filmstrips of the fast moments.

  python3 build/qa.py out/master-16x9.mkv [out/qa-16x9]

* A single-frame pop is a frame that differs from both neighbours while the neighbours agree with
  each other: score = min(|f-prev|, |f-next|) - |next-prev|, computed per block on a 24x14 grid
  (so a small element flashing for one frame is caught, not averaged away).
* A jump is a frame-to-frame change far above its local median (a cut or a teleport).
* Filmstrips: every frame through each fast moment, so it can be stepped through by eye.
"""
import json
import subprocess
import sys
from pathlib import Path

import numpy as np

BPM, FPS = 110, 60
B = 60 / BPM
FAST = {  # name: (first beat, last beat)
    'tap + pull-back': (5.95, 7.8), 'pin drop': (8.8, 9.3), 'answer montage': (10.2, 15.2),
    'gold flood': (15.9, 16.6), 'cards burst': (16.1, 17.0), 'climb + swap': (18.1, 19.2),
    'gold -> flame chip': (19.7, 20.7), 'click + room card': (25.9, 26.9), 'lounge + host settings': (27.9, 31.7),
    'round 1': (33.2, 36.6), 'leaderboard rounds 2-10': (37.0, 42.8), 'podium': (42.9, 44.2), 'button -> page': (46.5, 48.3),
    'plane + pin -> mascot': (55.0, 56.3), 'cream flood + wordmark': (55.8, 57.2),
}


def frames(path, w, h):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-vf', f'scale={w}:{h}:flags=area,format=gray', '-f', 'rawvideo', '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, h, w).astype(np.float32)


def blocks(d, gy=14, gx=24):
    n, h, w = d.shape
    return d[:, :h // gy * gy, :w // gx * gx].reshape(n, gy, h // gy, gx, w // gx).mean((2, 4))


def main(path, outdir):
    out = Path(outdir); out.mkdir(parents=True, exist_ok=True)
    probe = json.loads(subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-count_frames', '-show_entries',
                                       'stream=width,height,r_frame_rate,nb_read_frames', '-of', 'json', path], capture_output=True, text=True).stdout)['streams'][0]
    W, H = probe['width'], probe['height']
    w, h = (480, 270) if W > H else (270, 480)
    f = frames(path, w, h)
    n = len(f)
    # Motion-tolerant: after a blur wider than a frame's motion, a moving element sits halfway between
    # its neighbours (f ~ (prev+next)/2), while a one-frame flash does not. Scored per block.
    from scipy.ndimage import gaussian_filter
    bf = gaussian_filter(f, sigma=(0, 5, 5))
    resid = np.abs(bf[1:-1] - 0.5 * (bf[:-2] + bf[2:]))
    move = np.abs(bf[2:] - bf[:-2])
    br, bm = blocks(resid), blocks(move)
    pop_score = np.where(br > 1.2 * bm + 1.0, br - bm, 0).reshape(n - 2, -1).max(1)
    pops = [{'frame': int(i + 1), 'time_s': round((i + 1) / FPS, 3), 'beat': round((i + 1) / FPS / B, 2), 'score': round(float(s), 2)}
            for i, s in enumerate(pop_score) if s > 4]
    diff = np.abs(np.diff(f, axis=0)).mean((1, 2))
    jumps = []
    for i in range(len(diff)):
        med = np.median(diff[max(0, i - 4):i + 5])
        if diff[i] > 8 * (med + 0.05) and diff[i] > 1.5:
            jumps.append({'frame': i + 1, 'time_s': round((i + 1) / FPS, 3), 'beat': round((i + 1) / FPS / B, 2), 'mean_change': round(float(diff[i]), 2)})
    report = {'file': path, 'size': f'{W}x{H}', 'fps': probe['r_frame_rate'], 'frames': int(probe['nb_read_frames']),
              'duration_s': round(int(probe['nb_read_frames']) / FPS, 3), 'single_frame_pops': pops, 'jumps': jumps,
              'max_pop_score': round(float(pop_score.max()), 2), 'max_frame_change': round(float(diff.max()), 2),
              'max_change_at_s': round((int(diff.argmax()) + 1) / FPS, 3)}
    (out / 'qa-report.json').write_text(json.dumps(report, indent=1))
    print(f"{report['frames']} frames {report['size']} @ {report['fps']}: {len(pops)} single-frame pops, {len(jumps)} jumps "
          f"(max pop score {report['max_pop_score']}, biggest change {report['max_frame_change']} at {report['max_change_at_s']} s)")
    for p in pops[:20]: print('  pop ', p)
    for j in jumps[:20]: print('  jump', j)
    # filmstrips: every frame of each fast moment, 8 per row (frames decoded once)
    import matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt
    tw = 320 if W > H else 180
    th = tw * H // W
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-vf', f'scale={tw}:{th}:flags=area', '-pix_fmt', 'rgb24', '-f', 'rawvideo', '-'],
                         capture_output=True, check=True).stdout
    rgb = np.frombuffer(raw, np.uint8).reshape(-1, th, tw, 3)
    for name, (b0, b1) in FAST.items():
        i0, i1 = int(b0 * B * FPS), min(n - 1, int(b1 * B * FPS))
        if i0 >= n:
            continue
        idx = list(range(i0, i1 + 1)); cols = 8; rows = (len(idx) + cols - 1) // cols
        sheet = np.zeros((rows * (th + 4), cols * (tw + 4), 3), np.uint8) + 255
        for k, i in enumerate(idx):
            r, c = divmod(k, cols)
            sheet[r * (th + 4):r * (th + 4) + th, c * (tw + 4):c * (tw + 4) + tw] = rgb[i]
        slug = name.replace(' ', '-').replace('>', '').replace('+', 'and')
        plt.imsave(out / f'strip-{slug}-f{i0}-{i1}.png', sheet)
    # change-over-time plot
    fig, ax = plt.subplots(figsize=(24, 3.2), dpi=100)
    t = (np.arange(len(diff)) + 1) / FPS
    ax.plot(t, diff, color='#163B32', lw=1)
    ax.plot(t[1:-1] if len(pop_score) == len(t) - 2 else t[:len(pop_score)], pop_score[:len(t)], color='#E5484D', lw=1, alpha=.8)
    for k in range(int(n / FPS / B) + 1): ax.axvline(k * B, color='#F6B84B', lw=.6, alpha=.6)
    ax.axvline(16 * B, color='#1F806B', lw=1.4)
    ax.set_xlim(0, n / FPS); ax.set_xlabel('seconds (gold lines = beats, green = drop)'); ax.set_ylabel('mean change / pop score')
    ax.set_title('Frame-to-frame change (dark) and single-frame pop score (red)')
    fig.tight_layout(); fig.savefig(out / 'change-plot.png')


if __name__ == '__main__':
    src = sys.argv[1]
    main(src, sys.argv[2] if len(sys.argv) > 2 else str(Path(src).with_suffix('')) + '-qa')
