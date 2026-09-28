"""Crop the most suspicious block of flagged frames (N-2..N+2) at full resolution: python3 build/qa_zoom.py master.mkv 185 98 ..."""
import subprocess, sys
import numpy as np
from scipy.ndimage import gaussian_filter
path, frames = sys.argv[1], [int(x) for x in sys.argv[2:]]
probe = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', path], capture_output=True, text=True).stdout.strip().split(',')
W, H = int(probe[0]), int(probe[1])
w, h = (480, 270) if W > H else (270, 480)
k = W // w
for c in frames:
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-vf', f"select='between(n\\,{c-1}\\,{c+1})',scale={w}:{h}:flags=area,format=gray", '-vsync', '0', '-f', 'rawvideo', '-'], capture_output=True).stdout
    f = np.frombuffer(raw, np.uint8).reshape(-1, h, w).astype(np.float32)
    bf = gaussian_filter(f, sigma=(0, 5, 5))
    r = np.abs(bf[1] - 0.5 * (bf[0] + bf[2])); m = np.abs(bf[2] - bf[0])
    gy, gx = 14, 24; by, bx = h // gy, w // gx
    R = r[:gy * by, :gx * bx].reshape(gy, by, gx, bx).mean((1, 3)); M = m[:gy * by, :gx * bx].reshape(gy, by, gx, bx).mean((1, 3))
    sc = np.where(R > 1.2 * M + 1, R - M, 0)
    iy, ix = np.unravel_index(sc.argmax(), sc.shape)
    cx, cy = min(max(0, ix * bx * k + bx * k // 2 - 200), W - 400), min(max(0, iy * by * k + by * k // 2 - 200), H - 400)
    out = f'out/zoom-{c}.png'
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', path, '-vf', f"select='between(n\\,{c-2}\\,{c+2})',crop=400:400:{cx}:{cy},tile=5x1", '-frames:v', '1', out])
    print(c, 'block', (iy, ix), 'score', round(float(sc.max()), 1), '->', out)
