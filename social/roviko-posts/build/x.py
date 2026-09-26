"""Builds build/x.html: images for X (1600x900, 16:9) plus the profile header (1500x500).

Run `python3 build/x.py && node build/render.mjs x/` from social/roviko-posts/. Post texts live in build/copy.py.
X shows a single 16:9 image uncropped in the timeline, so each Instagram carousel becomes one landscape image
(and, for quizzes, a second image for the answer).
"""
import os
from slides import (CREAM, CSS, FOREST, GOLD, GREEN, SHAPES, art, card, dot, flag_chip, glow, icon, mascot, pin,
                    plane, route, silhouette, star, world)

HERE = os.path.dirname(os.path.abspath(__file__))
W, H = 1600, 900
IMAGES = []

def image(path, body, bg=CREAM, w=W, h=H):
    IMAGES.append(f'<section class="slide x" data-out="x/{path}" style="background:{bg};width:{w}px;height:{h}px">{body}</section>')

def brand(dark=False):
    return (f'<div class="brand abs" style="top:52px;left:64px;color:{CREAM if dark else FOREST};font-size:40px">'
            f'{mascot(56)}<span>roviko</span></div>')

def url(dark=False, right=False):
    side = 'right:64px' if right else 'left:64px'
    return f'<div class="abs xurl" style="bottom:48px;{side};color:{GOLD if dark else GREEN}">roviko.app</div>'

def text(inner, left, top, width, size=88, color=FOREST, align='left'):
    return f'<div class="abs" style="left:{left}px;top:{top}px;width:{width}px;text-align:{align}"><div class="h1" style="font-size:{size}px;color:{color}">{inner}</div></div>'

def sub(inner, left, top, width, color='#3d5a52', size=34):
    return f'<div class="abs sub" style="left:{left}px;top:{top}px;width:{width}px;color:{color};font-size:{size}px">{inner}</div>'

def col(parts, left, top, width, gap=30):
    """Stacks headline, text and chips so they never overlap, however the text wraps."""
    return f'<div class="abs" style="left:{left}px;top:{top}px;width:{width}px;display:flex;flex-direction:column;align-items:flex-start;gap:{gap}px">{"".join(parts)}</div>'

def head(inner, size=88, color=FOREST):
    return f'<div class="h1" style="font-size:{size}px;color:{color}">{inner}</div>'

def para(inner, color='#3d5a52', size=34):
    return f'<div class="sub" style="color:{color};font-size:{size}px">{inner}</div>'

def eyebrow(t, color=GREEN):
    return f'<div class="eyebrow" style="margin:0;color:{color}">{t}</div>'

def estonia(w):
    # Proportions 7:11 and blue PMS 285C (#0072CE), as specified by the Government Office of Estonia.
    return (f'<div class="flagcard"><svg width="{w}" height="{int(w * 7 / 11)}" viewBox="0 0 11 7" preserveAspectRatio="none" '
            'style="display:block;border-radius:26px"><rect width="11" height="7" fill="#fff"/><rect width="11" height="4.667" fill="#000"/>'
            '<rect width="11" height="2.333" fill="#0072CE"/></svg></div>')

def xglow(dark=False):
    return glow(dark).replace('760px 620px at 100% 0%', '900px 700px at 100% 0%')


def build():
    # 1 Meet Roviko
    b = xglow() + brand()
    b += col([head('A small geography trip.<br><span style="color:#1F806B">Every day. <span class="emo">🌍</span></span>', 84),
              para('A free daily geography game with flags, capitals, maps and a little trip around the world.'),
              '<span class="pill" style="margin-top:14px">Play at roviko.app</span>'], 64, 200, 800)
    b += route('M960 640 C 930 400, 1080 190, 1260 170', W, H, dash='2 18') + plane(1240, 134, 70, rot=-5)
    b += route('M1500 300 C 1560 460, 1540 620, 1440 720', W, H, dash='2 18') + pin(1480, 220, 48)
    b += f'<div class="abs" style="left:990px;top:190px">{mascot(540, "happy")}</div>'
    b += star(930, 700, 44) + star(1520, 110, 34) + star(1510, 780, 28) + dot(990, 250, 14, op=.7)
    image('01-meet-roviko.png', b)

    # 2 Daily Detour
    rows = [('flags', 'Flags'), ('capitals', 'Capitals'), ('pinpoint', 'The map'), ('borders', 'Neighbours'), ('order', 'Sizes')]
    chips = ''.join(f'<div class="xchip">{icon(m, 64)}<span>{t}</span></div>' for m, t in rows)
    b = xglow() + brand()
    b += col([eyebrow('DAILY DETOUR'), head('Your daily geography detour <span class="emo">✈️</span>', 76),
              para('20 questions. Everyone gets the same Detour today.'), f'<div class="xchips">{chips}</div>'], 64, 170, 780, 24)
    b += f'<div class="abs" style="left:880px;top:170px;width:656px">{card(art("daily-detour", "width:100%;border-radius:40px"), "padding:0;overflow:hidden")}</div>'
    b += star(1500, 120, 40) + star(850, 640, 30) + url(right=True)
    image('02-daily-detour.png', b)

    # 3 Guess the flag
    b = xglow() + brand()
    b += text('Guess the flag <span class="emo">👀</span>', 0, 70, W, 88, align='center')
    b += f'<div class="abs center" style="left:0;right:0;top:210px">{estonia(720)}</div>'
    b += text('No hints. Yet.', 0, 710, W, 60, GREEN, 'center')
    b += f'<div class="abs" style="right:-40px;bottom:-90px;transform:rotate(-14deg)">{mascot(330, "curious")}</div>'
    b += star(290, 260, 44) + dot(1250, 690, 14, op=.8)
    image('03-guess-the-flag.png', b)

    # 4a/4b Canada or Australia
    def side(code, flag, name):
        return (f'<div class="card sidecard xside">{silhouette(code, 330)}'
                f'<div class="cname">{flag_chip(flag, 46)}<span>{name}</span></div></div>')
    b = xglow() + brand()
    b += text('Which has more people?', 0, 70, W, 84, align='center')
    b += f'<div class="abs xsplit" style="left:0;right:0;top:230px">{side("CAN", "ca", "Canada")}<div class="or">or</div>{side("AUS", "au", "Australia")}</div>'
    b += text('Reply with your first guess ↓', 0, 770, W, 44, GREEN, 'center')
    b += star(260, 300, 40) + star(1320, 640, 32)
    image('04a-which-has-more-people.png', b)

    can, aus = 41.29, 27.2
    def bar(flag, name, val, label, color):
        return (f'<div class="bar"><div class="blabel">{flag_chip(flag, 48)}<span>{name}</span><b>{label}</b></div>'
                f'<div class="track"><div class="fill" style="width:{val / can * 100:.1f}%;background:{color}"></div></div></div>')
    b = xglow() + brand()
    b += col([head('Canada.', 130, GREEN), para('Not always the one that looks bigger on the map.')], 64, 200, 540, 20)
    b += f'<div class="abs" style="left:40px;top:560px">{mascot(230, "cheer")}</div>'
    b += (f'<div class="abs" style="left:660px;top:180px;width:876px">'
          + card('<div class="eyebrow">POPULATION, 2024</div>' + bar('ca', 'Canada', can, '41.3 million', GREEN)
                 + bar('au', 'Australia', aus, '27.2 million', '#8FBFB1'), 'padding:50px 52px 14px') + '</div>')
    b += '<div class="abs note" style="left:660px;top:690px;width:876px">Source: World Bank, World Development Indicators (population, total, 2024).</div>'
    image('04b-answer-canada.png', b)

    # 5 Rank Radar (dark)
    b = xglow(True) + brand(True)
    b += col([eyebrow('A DAILY GAME', GOLD), head('Meet Rank Radar. <span class="emo">📡</span>', 88, CREAM),
              para('One country. Four subjects. Tap where it ranks highest in the world, then see how close your radar was.', 'rgba(246,243,233,.85)')],
             64, 190, 760, 26)
    b += f'<div class="abs" style="left:880px;top:170px;width:656px">{card(art("rank-radar", "width:100%;border-radius:40px"), "padding:0;overflow:hidden;background:#F6F3E9")}</div>'
    b += star(1500, 120, 40) + star(840, 700, 30, op=.8) + url(True)
    image('05-rank-radar.png', b, bg=FOREST)

    # 6 Lesotho
    z = SHAPES['_za']; x, y, w, h = z['bbox']; pad = .6
    cx, cy = z['lso_center']
    m = (f'<svg viewBox="{x - pad} {y - pad} {w + 2 * pad} {h + 2 * pad}" style="width:580px;display:block">'
         f'<path d="{z["ZAF"]}" fill="#1F806B" fill-rule="evenodd" stroke="#F6F3E9" stroke-width=".06" stroke-linejoin="round"/>'
         f'<path d="{z["LSO"]}" fill="#F6B84B" stroke="#163B32" stroke-width=".07" stroke-linejoin="round"/>'
         f'<circle cx="{cx}" cy="{cy}" r="1.25" fill="none" stroke="#F6B84B" stroke-width=".09" stroke-dasharray=".05 .22" stroke-linecap="round"/>'
         f'<text x="{cx}" y="{cy - 1.55}" text-anchor="middle" font-family="Fredoka" font-weight="700" font-size=".78" fill="#163B32" '
         'stroke="#F6F3E9" stroke-width=".22" paint-order="stroke" stroke-linejoin="round">Lesotho</text>'
         f'<text x="{x + w * .23}" y="{y + h * .52}" font-family="Fredoka" font-weight="600" font-size=".72" fill="#F6F3E9">South Africa</text></svg>')
    b = xglow() + brand()
    b += col([eyebrow('A COUNTRY INSIDE A COUNTRY?'),
              head('<span style="color:#1F806B">Lesotho</span> is completely surrounded by South Africa. <span class="emo">🌍</span>', 72),
              para('One little geography detail worth keeping.')], 64, 170, 740, 26)
    b += f'<div class="abs" style="left:880px;top:120px">{card(m, "padding:30px 36px")}</div>'
    b += '<div class="abs note" style="left:880px;top:760px;width:650px;text-align:center">Simplified illustration, not to scale.</div>'
    b += url()
    image('06-lesotho.png', b)

    # 7 Country Mosaic
    b = xglow() + brand()
    b += col([eyebrow('A DAILY GAME'), head('A country, piece by piece. <span class="emo">🧩</span>', 84),
              para('Meet Country Mosaic. Look at the clues, connect the pieces and find the countries hiding in the tiles.')], 64, 190, 760, 26)
    b += f'<div class="abs" style="left:880px;top:170px;width:656px">{card(art("country-mosaic", "width:100%;border-radius:40px"), "padding:0;overflow:hidden")}</div>'
    b += star(1500, 120, 40) + url(right=True)
    image('07-country-mosaic.png', b)

    # 8 Guess the country (three candidate shapes, as in the Instagram post)
    for code, letter in [('ISL', 'a'), ('ITA', 'b'), ('MDG', 'c')]:
        b = xglow() + brand()
        b += col([head('Know this shape? <span class="emo">👀</span>', 92), para('No flag. No capital. Just the shape.'),
                  head('Guess the country ↓', 52, GREEN)], 64, 230, 620, 26)
        b += f'<div class="abs" style="left:720px;top:130px">{silhouette(code, 800)}</div>'
        b += ('<svg class="abs" style="left:1440px;top:100px;width:110px;height:110px" viewBox="-12 -12 24 24">'
              f'<circle r="11" fill="none" stroke="{GOLD}" stroke-width="1.2"/><path d="M0 -8 2 0 0 8 -2 0Z" fill="{GOLD}"/>'
              f'<path d="M-8 0 0 -2 8 0 0 2Z" fill="{GOLD}" opacity=".5"/><circle r="1.3" fill="{FOREST}"/></svg>')
        b += f'<div class="abs" style="left:500px;top:640px;transform:scaleX(-1)">{mascot(200, "curious")}</div>'
        image(f'08-guess-the-country-shape-{letter}.png', b)

    # 9 Better together
    ways = [('wink', 'room', 'With friends', 'Make a room, share the code'), ('cheer', 'mixed', 'A random player', 'Quick match'),
            ('curious', 'duel', 'The computer', 'Easy, medium or hard')]
    cards = ''.join(f'<div class="way">{mascot(170, mood)}<b>{t}</b><small>{s}</small></div>' for mood, _, t, s in ways)
    b = xglow() + brand()
    b += text('Geography is better together. <span class="emo">🌍</span>', 0, 150, W, 84, align='center')
    b += f'<div class="abs ways" style="left:120px;right:120px;top:330px">{cards}</div>'
    b += text('Just for fun · roviko.app', 0, 780, W, 42, GREEN, 'center')
    b += star(140, 380, 40) + star(1450, 640, 32)
    image('09-better-together.png', b)

    # Profile header, 1500x500. The avatar covers the lower left on X, so the content sits on the right.
    b = ('<div class="abs" style="inset:0;background:radial-gradient(700px 500px at 100% 0%,rgba(221,237,230,.95),transparent 70%),'
         'radial-gradient(600px 400px at 30% 100%,rgba(246,184,75,.14),transparent 70%)"></div>')
    b += world(.07, 'left:120px;top:-40px;width:1300px')
    b += col([head('A small geography trip.<br><span style="color:#1F806B">Every day.</span>', 64),
              para('Flags, capitals, maps and more.', size=30)], 480, 120, 660, 18)
    b += route('M1180 380 C 1160 220, 1250 110, 1350 100', 1500, 500, dash='2 16') + plane(1330, 66, 60, rot=-5)
    b += f'<div class="abs" style="left:1190px;top:130px">{mascot(290, "happy")}</div>'
    b += star(1450, 380, 34) + star(1150, 90, 26)
    image('profile-header.png', b, w=1500, h=500)


X_CSS = f"""
.x{{margin:0 0 40px}}
.xurl{{font-family:Fredoka;font-weight:600;font-size:34px}}
.xchips{{display:flex;flex-wrap:wrap;gap:16px 20px}}
.xchip{{display:flex;align-items:center;gap:14px;background:#fff;border-radius:999px;padding:8px 26px 8px 8px;font-family:Fredoka;font-weight:600;font-size:32px;box-shadow:0 8px 20px rgba(22,59,50,.07)}}
.xsplit{{display:flex;align-items:center;justify-content:center}}
.xside{{width:440px;padding:34px 24px 30px}}
.xside .cname{{font-size:46px}}
.ways{{display:flex;justify-content:space-between}}
.way{{width:400px;background:#fff;border-radius:44px;padding:34px 20px 34px;display:flex;flex-direction:column;align-items:center;gap:8px;box-shadow:0 18px 40px rgba(22,59,50,.1)}}
.way b{{font-family:Fredoka;font-weight:600;font-size:46px}} .way small{{font-size:28px;font-weight:600;color:#5b7069}}
"""

if __name__ == '__main__':
    build()
    html = f'<!doctype html><html><head><meta charset="utf-8"><style>{CSS}{X_CSS}</style></head><body>' + ''.join(IMAGES) + '</body></html>'
    open(os.path.join(HERE, 'x.html'), 'w').write(html)
    print(len(IMAGES), 'images')
