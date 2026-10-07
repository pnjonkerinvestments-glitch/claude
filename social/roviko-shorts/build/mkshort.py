"""Wrap a short's script (src/short-N-name.js) in the shared page: fonts, mascot, geo data, core.js and extras.js.

  python3 build/mkshort.py src/short-11-groupchat.js   ->  short-11-groupchat.html
The first comment block of the script becomes the page's description; its first line is the title.
"""
import re
import sys
from pathlib import Path

HEAD = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>{title}</title>
<!--
{doc}
-->
<style>
@font-face {{ font-family: 'Fredoka'; src: url(../roviko-launch-film/assets/fonts/fredoka-latin-wght-normal.woff2) format('woff2'); font-weight: 300 700; font-display: block; }}
@font-face {{ font-family: 'Manrope'; src: url(../roviko-launch-film/assets/fonts/manrope-variable.woff2) format('woff2'); font-weight: 200 800; font-display: block; }}
* {{ box-sizing: border-box; margin: 0; padding: 0; }}
html, body {{ overflow: hidden; background: #F6F3E9; }}
body {{ -webkit-font-smoothing: antialiased; font-family: Manrope, sans-serif; color: #163B32; }}
#stage {{ position: absolute; left: 0; top: 0; overflow: hidden; }}
.a {{ position: absolute; left: 0; top: 0; }}
svg {{ overflow: visible; }}
</style>
<script src="../roviko-launch-film/assets/mascot.js"></script>
<script src="../roviko-carousels/data/geo.js"></script>
<script src="data/special.js"></script>
</head>
<body>
<div id="stage"></div>
<script src="lib/core.js"></script>
<script src="lib/extras.js"></script>
<script>
{body}
</script>
</body>
</html>
"""

for src in sys.argv[1:]:
    p = Path(src)
    js = p.read_text()
    m = re.match(r'/\*(.*?)\*/\s*', js, re.S)
    doc = m.group(1).strip('\n') if m else ''
    body = js[m.end():] if m else js
    title = doc.strip().splitlines()[0].strip() if doc else p.stem
    out = p.parent.parent / (p.stem + '.html')
    out.write_text(HEAD.format(title=title, doc=doc.rstrip(), body=body.rstrip()))
    print(out)
