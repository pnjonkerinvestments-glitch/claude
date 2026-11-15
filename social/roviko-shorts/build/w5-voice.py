"""Voice the week-5 explainers with Kokoro-82M (Apache-2.0), locally.

  python3 build/w5-voice.py <kokoro_dir> [day ...]
    kokoro_dir holds kokoro-q8.onnx and voices.npz (see social/roviko-shorts/README or the week-5 notes in roviko-week5/PLAN.md)
  -> audio/w5ex-<d>/voice.wav (48 kHz stereo, each line placed where its scene starts) and data/w5voice.js (each line's length)

The scene timing in src/w5-explain.js follows the voice: scene i starts 0.5 s in, and each scene lasts its line + 0.45 s.
"""
import json, re, subprocess, sys
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
KDIR = Path(sys.argv[1])
DAYS = [int(d) for d in sys.argv[2:]] or [1, 2, 3, 4, 5, 6, 7]
VOICE, SPEED, SR = 'af_heart', 1.05, 48000

from kokoro_onnx import Kokoro
k = Kokoro(str(KDIR / 'kokoro-q8.onnx'), str(KDIR / 'voices.npz'))

# the scene lines, straight from data/w5ex.js
lines = json.loads(subprocess.run(['node', '-e', '''
global.window = {}; eval(require("fs").readFileSync("data/w5ex.js", "utf8"));
const r = {}; for (const d in window.W5EX) r[d] = window.W5EX[d].scenes.map(s => s.say); console.log(JSON.stringify(r));'''],
    cwd=ROOT, check=True, capture_output=True, text=True).stdout)

# a few words the phonemiser reads better when spelled the way they're said
SAY = [(r'Türkiye', 'Turkiyeh'), (r'São Tomé', 'Sao Tomay'), (r'Mileștii Mici', 'Mileshtee Meechee'), (r'Cayambe', 'Kai-yambay'), (r'Kiribati', 'Kiribass')]
def spoken(t):
    for a, b in SAY: t = re.sub(a, b, t)
    return t

vjs = ROOT / 'data' / 'w5voice.js'
old = {}
if vjs.exists():
    m = re.search(r'window\.W5VO = (\{.*\});', vjs.read_text(), re.S)
    if m: old = json.loads(m.group(1))
for d in DAYS:
    clips = []
    for line in lines[str(d)]:
        audio, sr = k.create(spoken(line), voice=VOICE, speed=SPEED, lang='en-us')
        audio = np.asarray(audio, dtype=np.float32)
        # trim silence at both ends, then resample to 48 kHz
        nz = np.where(np.abs(audio) > 0.01)[0]
        audio = audio[max(0, nz[0] - int(0.03 * sr)):nz[-1] + int(0.08 * sr)] if len(nz) else audio
        idx = np.arange(0, len(audio), sr / SR)
        clips.append(np.interp(idx, np.arange(len(audio)), audio).astype(np.float32))
    durs = [round(len(c) / SR, 3) for c in clips]
    starts = [0.5]
    for x in durs[:-1]: starts.append(starts[-1] + x + 0.45)
    total = starts[-1] + durs[-1] + 0.45 + 0.4
    track = np.zeros(int(total * SR) + SR, dtype=np.float32)
    for s, c in zip(starts, clips): track[int(s * SR):int(s * SR) + len(c)] += c
    track /= max(1e-6, np.abs(track).max()) / 0.89
    out = ROOT / 'audio' / f'w5ex-{d}'; out.mkdir(parents=True, exist_ok=True)
    pcm = (np.clip(np.stack([track, track], 1), -1, 1) * 32767).astype('<i2')
    import wave
    with wave.open(str(out / 'voice.wav'), 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
    old[str(d)] = {'voice': VOICE, 'durs': durs}
    print(d, 'lines', len(durs), 'total', round(total, 1), 's')
vjs.write_text('// written by build/w5-voice.py: per explainer, the length in seconds of each spoken line (Kokoro-82M, voice af_heart)\nwindow.W5VO = '
               + json.dumps(old, indent=1) + ';\n')
