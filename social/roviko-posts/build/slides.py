"""Builds build/slides.html: every Roviko social slide as a 1080x1350 element.

Run `python3 build/slides.py && node build/render.mjs` from social/roviko-posts/.
All artwork comes from the Roviko brand kit (assets/) and the site's own data.
"""
import json, os

HERE = os.path.dirname(os.path.abspath(__file__))
ICONS = json.load(open(os.path.join(HERE, 'icons.json')))
SHAPES = json.load(open(os.path.join(HERE, 'shapes.json')))
A = '../assets/'

FOREST, GREEN, MINT, GOLD, CREAM = '#163B32', '#1F806B', '#DDEDE6', '#F6B84B', '#F6F3E9'
TONES = {  # game icon colours from roviko/app/design.css
    'rank': ('#c4553a', '#f9e4dc'), 'daily': ('#1f806b', '#ddede6'), 'compare': ('#a8650f', '#f7e8ce'),
    'mosaic': ('#4b5fa8', '#e3e7f6'), 'trail': ('#1e7a8c', '#daeef1'), 'duel': ('#9a4470', '#f4dde7'), 'capitals': ('#4b5fa8', '#e3e7f6'),
    'flags': ('#c4553a', '#f9e4dc'), 'pinpoint': ('#1f806b', '#ddede6'), 'borders': ('#a8650f', '#f7e8ce'),
    'order': ('#9a4470', '#f4dde7'), 'mixed': ('#163b32', '#ddede6'), 'room': ('#8a5a00', '#fbeccb'),
    'mystery': ('#6b5aa8', '#e7e2f6'),
}

# ---------------------------------------------------------------- building blocks

INK, OCEAN = '#06224f', '#33b3fa'
def _eye(x, y=126, r=10): return f'<circle cx="{x}" cy="{y}" r="{r}" fill="{INK}"/><circle cx="{x+3}" cy="{y-4}" r="{r*.32}" fill="#fff"/>'
def _happy_eye(x): return f'<path d="M{x-11} 130q11 -14 22 0" stroke="{INK}" stroke-width="6" stroke-linecap="round" fill="none"/>'
_CHEEKS = '<g fill="#ff8fa3" opacity=".55"><ellipse cx="86" cy="142" rx="9" ry="5"/><ellipse cx="170" cy="142" rx="9" ry="5"/></g>'
FACES = {  # the same moods as roviko/components/ds/Mascot.tsx
    'cheer': _happy_eye(100) + _happy_eye(156) + _CHEEKS + f'<path d="M110 138q18 22 36 0z" fill="{INK}"/><path d="M118 146q10 6 20 0" fill="#ff8fa3"/>',
    'wink': _eye(100) + _happy_eye(156) + _CHEEKS + f'<path d="M114 139q14 11 28 0" stroke="{INK}" stroke-width="5" stroke-linecap="round" fill="none"/>',
    'worried': _eye(100, 128, 9) + _eye(156, 128, 9) + f'<path d="M88 112l20 -5M168 112l-20 -5" stroke="{INK}" stroke-width="4.5" stroke-linecap="round"/><path d="M116 146q6 -6 12 0t12 0" stroke="{INK}" stroke-width="4.5" stroke-linecap="round" fill="none"/>',
    'sleepy': ''.join(f'<path d="M{x-10} 124q10 9 20 0" stroke="{INK}" stroke-width="5" stroke-linecap="round" fill="none"/>' for x in (100, 156)) + f'<ellipse cx="128" cy="143" rx="6" ry="5" fill="{INK}"/><g fill="{INK}" font-family="Fredoka" font-weight="700"><text x="196" y="70" font-size="22">z</text><text x="214" y="48" font-size="16">z</text></g>',
    'curious': _eye(100, 126, 10) + _eye(156, 124, 12) + f'<path d="M150 106l18 -4" stroke="{INK}" stroke-width="4.5" stroke-linecap="round"/><ellipse cx="130" cy="143" rx="7" ry="6" fill="{INK}"/>',
}

def mascot(size, mood='happy', style=''):
    face = '' if mood == 'happy' else f'<ellipse cx="128" cy="128" rx="52" ry="23" fill="{OCEAN}"/>{FACES[mood]}'
    return (f'<svg class="mascot" viewBox="0 0 256 256" width="{size}" height="{size}" style="{style}">'
            f'<ellipse cx="128" cy="246" rx="70" ry="7" fill="{FOREST}" opacity=".08"/>'
            f'<image href="{A}roviko-globe.svg" width="256" height="256"/>{face}</svg>')

def star(x, y, s, color=GOLD, rot=0, op=1):
    return (f'<svg class="abs" style="left:{x}px;top:{y}px;width:{s}px;height:{s}px;transform:rotate({rot}deg);opacity:{op}" viewBox="0 0 24 24">'
            f'<path d="M12 0C13 7.5 16.5 11 24 12 16.5 13 13 16.5 12 24 11 16.5 7.5 13 0 12 7.5 11 11 7.5 12 0Z" fill="{color}"/></svg>')

def dot(x, y, s, color=GOLD, op=1):
    return f'<div class="abs" style="left:{x}px;top:{y}px;width:{s}px;height:{s}px;border-radius:50%;background:{color};opacity:{op}"></div>'

PLANE = 'M-7 0 5.6-1.5Q8.6 0 5.6 1.5Z M-1-.9-4.6-7h2.4l4.6 6.1Z M-1 .9-4.6 7h2.4l4.6-6.1Z M-6-.6-7.8-3.6h1.4l2.2 3Z M-6 .6-7.8 3.6h1.4l2.2-3Z'
def plane(x, y, s, rot=-20, color=FOREST):
    return (f'<svg class="abs" style="left:{x}px;top:{y}px;width:{s}px;height:{s}px" viewBox="-9 -9 18 18">'
            f'<path d="{PLANE}" fill="{color}" transform="rotate({rot})"/></svg>')

def pin(x, y, s, color=GREEN):
    return (f'<svg class="abs" style="left:{x}px;top:{y}px;width:{s}px;height:{s*1.3}px" viewBox="0 0 20 26">'
            f'<path d="M10 25S1 15.5 1 9.5a9 9 0 0 1 18 0C19 15.5 10 25 10 25Z" fill="{color}"/><circle cx="10" cy="9.5" r="3.4" fill="#fff"/></svg>')

def route(d, w=1080, h=1350, color=GOLD, width=5, dash='2 16', op=1):
    return (f'<svg class="abs" style="left:0;top:0;width:{w}px;height:{h}px;opacity:{op}" viewBox="0 0 {w} {h}">'
            f'<path d="{d}" fill="none" stroke="{color}" stroke-width="{width}" stroke-linecap="round" stroke-dasharray="{dash}"/></svg>')

def icon(mode, size=120):
    g, soft = TONES[mode]
    svg = ICONS[mode].replace('var(--gi-bg,#fff)', soft)
    return (f'<span class="gicon" style="width:{size}px;height:{size}px;border-radius:{size*.3}px;color:{g};'
            f'background:linear-gradient(180deg,#fff 0%,{soft} 70%)"><svg viewBox="0 0 32 32" style="width:64%;height:64%">{svg}</svg></span>')

def silhouette(code, w, color=FOREST, style=''):
    return f'<svg viewBox="0 0 100 80" style="width:{w}px;height:{w*.8}px;{style}"><path d="{SHAPES[code]}" fill="{color}" fill-rule="evenodd"/></svg>'

def flag_chip(code, h=56):
    return f'<img src="{A}{code}.svg" style="height:{h}px;width:{h*4/3}px;border-radius:{h*.18}px;box-shadow:0 0 0 2px rgba(22,59,50,.08);object-fit:cover">'

def brand(dark=False, center=False, size=1.0):
    c = CREAM if dark else FOREST
    pos = 'left:50%;transform:translateX(-50%)' if center else 'left:72px'
    return (f'<div class="brand abs" style="top:66px;{pos};color:{c};font-size:{44*size}px">'
            f'{mascot(int(62*size))}<span>roviko</span></div>')

def counter(i, n, dark=False):
    bg, fg = ('rgba(246,243,233,.12)', CREAM) if dark else ('#fff', FOREST)
    dots = ''.join(f'<i style="background:{(GOLD if k == i else (CREAM if dark else FOREST))};opacity:{1 if k == i else .22}"></i>' for k in range(1, n + 1))
    return f'<div class="counter abs" style="background:{bg};color:{fg}">{dots}</div>'

def footer(text='roviko.app', swipe=False, dark=False):
    c = GOLD if dark else GREEN
    right = f'<span class="swipe" style="color:{CREAM if dark else FOREST}">Swipe <b>→</b></span>' if swipe else ''
    return f'<div class="footer abs" style="color:{c}"><span>{text}</span>{right}</div>'

def card(inner, style=''):
    return f'<div class="card" style="{style}">{inner}</div>'

def art(name, style=''):
    return f'<img src="{A}art/{name}.webp" style="display:block;{style}">'

# ---------------------------------------------------------------- slides

SLIDES = []  # (output path, html)
def slide(path, body, bg=CREAM, cls=''):
    SLIDES.append((path, f'<section class="slide {cls}" data-out="{path}" style="background:{bg}">{body}</section>'))

def glow(dark=False):
    if dark:
        return ('<div class="abs" style="inset:0;background:radial-gradient(900px 700px at 90% 0%,rgba(31,128,107,.55),transparent 70%),'
                'radial-gradient(700px 600px at 0% 100%,rgba(246,184,75,.16),transparent 70%)"></div>')
    return ('<div class="abs" style="inset:0;background:radial-gradient(760px 620px at 100% 0%,rgba(221,237,230,.95),transparent 70%),'
            'radial-gradient(700px 560px at 0% 100%,rgba(246,184,75,.16),transparent 70%)"></div>')

def world(op=.07, style='left:-60px;top:360px;width:1200px'):
    return f'<img class="abs" src="{A}world.svg" style="{style};opacity:{op}">'


# POST 1 - Meet Roviko ---------------------------------------------------------
def post1():
    b = glow() + '<div class="brand abs center" style="left:0;right:0;top:70px;font-size:64px;color:#163B32"><span>roviko</span></div>'
    b += route('M150 620 C 180 400, 360 260, 520 260', dash='2 18', op=.9)
    b += plane(508, 222, 70, rot=-8)
    b += route('M930 480 C 990 640, 970 760, 900 840', dash='2 18', op=.9)
    b += pin(905, 400, 50, GREEN)
    b += star(150, 660, 54) + star(880, 300, 40) + star(80, 880, 30, op=.8) + star(960, 820, 40)
    b += dot(118, 520, 16, op=.7) + dot(960, 640, 12, op=.7) + dot(300, 330, 12, GREEN, .35) + dot(160, 1180, 14, GREEN, .3)
    b += f'<div class="abs center" style="left:0;right:0;top:250px">{mascot(620, "happy")}</div>'
    b += ('<div class="abs center" style="left:0;right:0;top:920px"><div class="h1" style="font-size:90px">A small geography trip.</div>'
          '<div class="h1" style="font-size:88px;color:#1F806B">Every day. <span class="emo">🌍</span></div></div>')
    b += '<div class="abs center" style="left:0;right:0;bottom:66px"><span class="pill">Play at roviko.app</span></div>'
    slide('post-01-meet-roviko/01.png', b)


# POST 2 - Daily Detour --------------------------------------------------------
def post2():
    n = 4; P = 'post-02-daily-detour/'
    b = glow() + brand() + counter(1, n)
    b += '<div class="abs" style="left:72px;top:200px;right:72px"><div class="eyebrow">DAILY DETOUR</div><div class="h1" style="font-size:100px">Your daily geography detour <span class="emo">✈️</span></div></div>'
    b += f'<div class="abs" style="left:72px;right:72px;top:560px">{card(art("daily-detour", "width:100%;border-radius:40px"), "padding:0;overflow:hidden")}</div>'
    b += star(930, 520, 50) + star(60, 1150, 34)
    b += footer(swipe=True)
    slide(P + '01.png', b)

    rows = [('flags', 'Flags'), ('capitals', 'Capitals'), ('pinpoint', 'The map'), ('borders', 'Neighbours'), ('order', 'Sizes')]
    items = ''.join(f'<div class="row">{icon(m, 104)}<span>{t}</span></div>' for m, t in rows)
    b = glow() + brand() + counter(2, n)
    b += ('<div class="abs" style="left:72px;top:200px"><div class="h1" style="font-size:230px;line-height:.9;color:#1F806B">20</div>'
          '<div class="h1" style="font-size:96px;margin-top:6px">questions.</div></div>')
    b += f'<div class="abs list" style="left:72px;right:72px;top:590px">{items}</div>'
    b += f'<div class="abs" style="right:40px;top:170px">{mascot(330, "wink")}</div>' + star(700, 250, 44) + star(1000, 520, 30)
    b += footer(swipe=True)
    slide(P + '02.png', b)

    b = glow() + brand() + counter(3, n)
    b += world(.09, 'left:-40px;top:520px;width:1160px')
    b += route('M110 1010 C 260 700, 420 690, 540 780 S 860 900, 980 620', width=6, dash='2 18')
    b += pin(86, 950, 52, GREEN) + pin(955, 555, 52, GREEN) + plane(700, 832, 76, rot=-25)
    b += f'<div class="abs center" style="left:0;right:0;top:620px">{mascot(360, "cheer")}</div>'
    b += '<div class="abs" style="left:72px;right:72px;top:210px"><div class="h1" style="font-size:100px">Everyone gets the same Detour today.</div></div>'
    b += '<div class="abs center" style="left:0;right:0;top:1060px"><span class="chip">Same 20 questions · new every day</span></div>'
    b += footer(swipe=True)
    slide(P + '03.png', b)

    b = glow() + brand() + counter(4, n)
    b += '<div class="abs" style="left:72px;right:72px;top:210px"><div class="h1" style="font-size:106px">How far around the world can you get?</div></div>'
    b += route('M110 960 C 250 640, 830 640, 970 960', width=6, dash='2 18')
    b += plane(920, 880, 80, rot=55)
    b += f'<div class="abs center" style="left:0;right:0;top:560px">{mascot(420, "happy")}</div>'
    b += star(170, 700, 48) + star(880, 640, 36) + dot(110, 900, 14, op=.8)
    b += '<div class="abs center" style="left:0;right:0;top:1096px"><span class="pill big">Play at roviko.app</span></div>'
    slide(P + '04.png', b)


# POST 3 - Guess the flag ------------------------------------------------------
def post3():
    b = glow() + brand()
    b += '<div class="abs center" style="left:0;right:0;top:220px"><div class="h1" style="font-size:112px">Guess the flag <span class="emo">👀</span></div></div>'
    # Proportions 7:11 and blue PMS 285C (#0072CE), as specified by the Government Office of Estonia.
    fw, fh = 800, int(800 * 7 / 11)
    flag = (f'<svg width="{fw}" height="{fh}" viewBox="0 0 11 7" preserveAspectRatio="none" style="display:block;border-radius:30px">'
            '<rect width="11" height="7" fill="#fff"/><rect width="11" height="4.667" fill="#000"/><rect width="11" height="2.333" fill="#0072CE"/></svg>')
    b += f'<div class="abs center" style="left:0;right:0;top:470px"><div class="flagcard">{flag}</div></div>'
    b += '<div class="abs center" style="left:0;right:0;top:1030px"><div class="h1" style="font-size:72px;color:#1F806B">No hints. Yet.</div></div>'
    b += star(96, 410, 46) + star(960, 960, 34) + dot(110, 1000, 14, op=.8)
    b += f'<div class="abs" style="right:-60px;bottom:-80px;transform:rotate(-14deg)">{mascot(380, "curious")}</div>'
    b += '<div class="footer abs" style="color:#1F806B"><span>Guess in the comments ↓</span></div>'
    slide('post-03-guess-the-flag/01.png', b)


# POST 4 - Which is bigger? ----------------------------------------------------
def side(code, flag, name, extra='', hl=None):
    border = f'box-shadow:0 0 0 8px {hl},0 24px 50px rgba(22,59,50,.12);' if hl else ''
    return (f'<div class="card sidecard" style="{border}">{silhouette(code, 380, FOREST)}'
            f'<div class="cname">{flag_chip(flag, 52)}<span>{name}</span></div>{extra}</div>')

def post4():
    n = 5; P = 'post-04-canada-or-australia/'
    b = glow() + brand() + counter(1, n)
    b += '<div class="abs center" style="left:0;right:0;top:200px"><div class="h1" style="font-size:108px">Which has more people?</div></div>'
    b += (f'<div class="abs split" style="top:540px">{side("CAN", "ca", "Canada")}'
          f'<div class="or">or</div>{side("AUS", "au", "Australia")}</div>')
    b += star(80, 480, 40) + star(960, 1120, 34)
    b += footer(swipe=True)
    slide(P + '01.png', b)

    b = glow() + brand() + counter(2, n)
    b += '<div class="abs center" style="left:0;right:0;top:220px"><div class="h1" style="font-size:96px">Lock in your guess. <span class="emo">👀</span></div></div>'
    b += f'<div class="abs center" style="left:0;right:0;top:470px">{mascot(360, "curious")}</div>'
    b += (f'<div class="abs choice" style="left:110px;right:110px;top:890px">'
          f'<div class="opt">{flag_chip("ca", 56)}<span>Canada</span></div>'
          f'<div class="opt">{flag_chip("au", 56)}<span>Australia</span></div></div>')
    b += star(170, 520, 44) + star(880, 600, 36)
    b += footer(swipe=True)
    slide(P + '02.png', b)

    check = ('<div class="check"><svg viewBox="0 0 24 24" width="46" height="46"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="#fff" '
             'stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg></div>')
    b = glow() + brand() + counter(3, n)
    b += '<div class="abs center" style="left:0;right:0;top:210px"><div class="h1" style="font-size:150px;color:#1F806B">Canada.</div></div>'
    b += f'<div class="abs center" style="left:0;right:0;top:470px">{side("CAN", "ca", "Canada", check, hl=GREEN)}</div>'
    b += f'<div class="abs" style="left:40px;top:930px">{mascot(250, "cheer")}</div>'
    b += star(120, 520, 50) + star(930, 440, 40) + star(900, 1010, 30)
    b += footer(swipe=True)
    slide(P + '03.png', b)

    # Population total, 2024: World Bank WDI (SP.POP.TOTL). Bars share one zero baseline.
    can, aus = 41.29, 27.2
    def bar(flag, name, val, label, color):
        return (f'<div class="bar"><div class="blabel">{flag_chip(flag, 48)}<span>{name}</span><b>{label}</b></div>'
                f'<div class="track"><div class="fill" style="width:{val / can * 100:.1f}%;background:{color}"></div></div></div>')
    b = glow() + brand() + counter(4, n)
    b += '<div class="abs" style="left:72px;right:72px;top:220px"><div class="eyebrow">CANADA OR AUSTRALIA?</div><div class="h1" style="font-size:120px">Population, 2024</div></div>'
    b += (f'<div class="abs" style="left:72px;right:72px;top:560px">'
          + card(bar('ca', 'Canada', can, '41.3 million', GREEN) + bar('au', 'Australia', aus, '27.2 million', '#8FBFB1'), 'padding:56px 56px 30px')
          + '</div>')
    b += '<div class="abs" style="left:72px;right:72px;top:1060px"><div class="note">Source: World Bank, World Development Indicators (population, total, 2024).</div></div>'
    b += footer(swipe=True)
    slide(P + '04.png', b)

    b = glow() + brand() + counter(5, n)
    b += '<div class="abs" style="left:72px;right:72px;top:210px"><div class="h1" style="font-size:96px">Not always the one that looks bigger on the map.</div></div>'
    b += (f'<div class="abs" style="left:90px;top:620px;opacity:.9">{silhouette("CAN", 440, "#1F806B")}</div>'
          f'<div class="abs" style="left:560px;top:700px;opacity:.9">{silhouette("AUS", 420, "#8FBFB1")}</div>')
    b += f'<div class="abs" style="right:70px;top:1000px">{mascot(230, "wink")}</div>'
    b += star(520, 640, 40) + star(140, 1080, 32)
    b += '<div class="abs" style="left:72px;top:1120px"><span class="pill">Play at roviko.app</span></div>'
    slide(P + '05.png', b)


# POST 5 - Rank Radar ----------------------------------------------------------
def post5():
    n = 4; P = 'post-05-rank-radar/'; D = FOREST
    b = glow(True) + brand(dark=True) + counter(1, n, True)
    b += route('M540 880 m -270 0 a 270 270 0 1 0 540 0 a 270 270 0 1 0 -540 0', color=GOLD, width=4, dash='2 16', op=.5)
    b += route('M540 880 m -175 0 a 175 175 0 1 0 350 0 a 175 175 0 1 0 -350 0', color=CREAM, width=3, dash='2 14', op=.25)
    b += ('<svg class="abs" style="left:270px;top:610px;width:540px;height:540px" viewBox="-1 -1 2 2">'
          '<path d="M0 0 0 -1 A1 1 0 0 1 .87 -.5Z" fill="#F6B84B" opacity=".22"/>'
          '<circle cx=".55" cy="-.5" r=".06" fill="#F6B84B"/></svg>')
    b += '<div class="abs" style="left:72px;right:72px;top:200px"><div class="h1" style="font-size:100px;color:#F6F3E9">Think you know where a country ranks? <span class="emo">📡</span></div></div>'
    b += f'<div class="abs center" style="left:0;right:0;top:790px">{mascot(180, "wink")}</div>'
    b += footer(swipe=True, dark=True)
    slide(P + '01.png', b, bg=D)

    b = glow(True) + brand(dark=True) + counter(2, n, True)
    b += '<div class="abs" style="left:72px;right:72px;top:210px"><div class="eyebrow" style="color:#F6B84B">A DAILY GAME</div><div class="h1" style="font-size:120px;color:#F6F3E9">Meet Rank Radar.</div></div>'
    b += f'<div class="abs" style="left:72px;right:72px;top:560px">{card(art("rank-radar", "width:100%;border-radius:40px"), "padding:0;overflow:hidden;background:#F6F3E9")}</div>'
    b += star(940, 500, 50) + star(50, 1170, 34, op=.8)
    b += footer(swipe=True, dark=True)
    slide(P + '02.png', b, bg=D)

    subs = [('Population', '👥'), ('Forest', '🌲'), ('Coastline', '🌊'), ('Area', '📐')]
    tiles = ''.join(f'<div class="stile"><span class="emo">{e}</span><b>{t}</b></div>' for t, e in subs)
    b = glow(True) + brand(dark=True) + counter(3, n, True)
    b += '<div class="abs" style="left:72px;right:72px;top:210px"><div class="h1" style="font-size:108px;color:#F6F3E9">One country. Four subjects.</div></div>'
    b += ('<div class="abs center" style="left:0;right:0;top:470px"><div class="mystery"><span>?</span>'
          '<div><b>Mystery country</b><small>Where does it rank highest?</small></div></div></div>')
    b += f'<div class="abs sgrid" style="left:72px;right:72px;top:680px">{tiles}</div>'
    b += footer(swipe=True, dark=True)
    slide(P + '03.png', b, bg=D)

    medal = lambda c, t: f'<i class="medal" style="background:{c}">{t}</i>'
    tiles = (f'<div class="stile win"><span class="emo">🌲</span><b>Forest</b>{medal(GOLD, "1")}</div>'
             f'<div class="stile"><span class="emo">📐</span><b>Area</b>{medal("#C9CFCB", "2")}</div>'
             f'<div class="stile"><span class="emo">🌊</span><b>Coastline</b>{medal("#D9A276", "3")}</div>'
             f'<div class="stile dim"><span class="emo">👥</span><b>Population</b></div>')
    b = glow(True) + brand(dark=True) + counter(4, n, True)
    b += '<div class="abs" style="left:72px;right:72px;top:210px"><div class="h1" style="font-size:84px;color:#F6F3E9">Tap where it ranks highest. Then see how close your radar was.</div></div>'
    b += f'<div class="abs sgrid" style="left:72px;right:72px;top:560px">{tiles}</div>'
    b += '<div class="abs center" style="left:0;right:0;top:1150px"><span class="pill gold">Play at roviko.app</span></div>'
    slide(P + '04.png', b, bg=D)


# POST 6 - Lesotho -------------------------------------------------------------
def post6():
    n = 3; P = 'post-06-country-inside-a-country/'
    b = glow() + brand() + counter(1, n)
    b += '<div class="abs" style="left:72px;right:72px;top:210px"><div class="h1" style="font-size:112px">A country inside a country?</div></div>'
    b += f'<div class="abs" style="left:72px;right:72px;top:500px">{card(art("africa", "width:100%;border-radius:40px"), "padding:0;overflow:hidden")}</div>'
    b += f'<div class="abs" style="right:30px;top:990px">{mascot(210, "curious")}</div>'
    b += star(80, 450, 40)
    b += footer(swipe=True)
    slide(P + '01.png', b)

    z = SHAPES['_za']; x, y, w, h = z['bbox']; pad = .6
    cx, cy = z['lso_center']
    m = (f'<svg viewBox="{x - pad} {y - pad} {w + 2 * pad} {h + 2 * pad}" style="width:660px;display:block">'
         f'<path d="{z["ZAF"]}" fill="#1F806B" fill-rule="evenodd" stroke="#F6F3E9" stroke-width=".06" stroke-linejoin="round"/>'
         f'<path d="{z["LSO"]}" fill="#F6B84B" stroke="#163B32" stroke-width=".07" stroke-linejoin="round"/>'
         f'<circle cx="{cx}" cy="{cy}" r="1.25" fill="none" stroke="#F6B84B" stroke-width=".09" stroke-dasharray=".05 .22" stroke-linecap="round"/>'
         f'<text x="{cx}" y="{cy - 1.55}" text-anchor="middle" font-family="Fredoka" font-weight="700" font-size=".78" fill="#163B32" stroke="#F6F3E9" stroke-width=".22" paint-order="stroke" stroke-linejoin="round">Lesotho</text>'
         f'<text x="{x + w * .23}" y="{y + h * .52}" font-family="Fredoka" font-weight="600" font-size=".72" fill="#F6F3E9">South Africa</text></svg>')
    b = glow() + brand() + counter(2, n)
    b += '<div class="abs" style="left:72px;right:72px;top:200px"><div class="h1" style="font-size:84px"><span style="color:#1F806B">Lesotho</span> is completely surrounded by South Africa. <span class="emo">🌍</span></div></div>'
    b += f'<div class="abs center" style="left:0;right:0;top:480px">{card(m, "padding:40px 50px")}</div>'
    b += '<div class="abs center" style="left:0;right:0;top:1200px"><div class="note">Simplified illustration, not to scale.</div></div>'
    b += footer(swipe=True)
    slide(P + '02.png', b)

    b = glow() + brand() + counter(3, n)
    b += '<div class="abs center" style="left:0;right:0;top:230px"><div class="h1" style="font-size:104px">One little geography detail worth keeping.</div></div>'
    b += f'<div class="abs center" style="left:0;right:0;top:600px">{mascot(420, "cheer")}</div>'
    b += star(180, 640, 52) + star(860, 720, 38) + star(830, 540, 24) + dot(200, 930, 14, op=.7)
    b += '<div class="abs center" style="left:0;right:0;top:1110px"><span class="pill big">Play at roviko.app</span></div>'
    slide(P + '03.png', b)


# POST 7 - Country Mosaic ------------------------------------------------------
BLOB = 'M18 20c10-8 30-6 40-12s26 0 30 12-4 18 2 26-4 20-18 22-22 8-34 6-26-2-28-14 0-26 8-40Z'
def tile(kind, rot=0, extra=''):
    inner = {
        'flag': '<div class="tflag"><i style="background:#C9D9D2"></i><i style="background:#F6B84B"></i><i style="background:#1F806B"></i></div>',
        'shape': f'<svg viewBox="0 0 100 80" style="width:74%"><path d="{BLOB}" fill="#163B32"/></svg>',
        'fact': '<div class="tfact"><small>HIGHEST POINT</small><b>?,??? m</b></div>',
        'name': '<div class="tname">? ? ? ?</div>',
    }[kind]
    return f'<div class="mtile {extra}" style="transform:rotate({rot}deg)">{inner}</div>'

def post7():
    n = 4; P = 'post-07-country-mosaic/'
    b = glow() + brand() + counter(1, n)
    b += '<div class="abs" style="left:72px;right:72px;top:210px"><div class="h1" style="font-size:112px">A country, piece by piece. <span class="emo">🧩</span></div></div>'
    for (x, y, k, r) in [(120, 620, 'flag', -9), (430, 560, 'shape', 6), (740, 650, 'fact', -5), (270, 900, 'name', 8), (600, 910, 'shape', -7)]:
        b += f'<div class="abs" style="left:{x}px;top:{y}px">{tile(k, r)}</div>'
    b += star(940, 560, 40) + star(90, 1150, 30) + dot(520, 860, 14, op=.8)
    b += footer(swipe=True)
    slide(P + '01.png', b)

    b = glow() + brand() + counter(2, n)
    b += '<div class="abs" style="left:72px;right:72px;top:210px"><div class="eyebrow">A DAILY GAME</div><div class="h1" style="font-size:118px">Meet Country Mosaic.</div></div>'
    b += f'<div class="abs" style="left:72px;right:72px;top:560px">{card(art("country-mosaic", "width:100%;border-radius:40px"), "padding:0;overflow:hidden")}</div>'
    b += star(940, 500, 46)
    b += footer(swipe=True)
    slide(P + '02.png', b)

    grid = ''
    order = ['flag', 'fact', 'name', 'shape', 'name', 'shape', 'flag', 'fact', 'shape', 'flag', 'fact', 'name', 'fact', 'name', 'shape', 'flag']
    sel = {0, 1, 4, 5}  # one flag, fact, name and shape
    for i, k in enumerate(order):
        grid += tile(k, 0, 'small sel' if i in sel else 'small')
    b = glow() + brand() + counter(3, n)
    b += '<div class="abs" style="left:72px;right:72px;top:200px"><div class="h1" style="font-size:96px">Look at the clues.<br><span style="color:#1F806B">Connect the pieces.</span></div></div>'
    b += f'<div class="abs mgrid" style="left:187px;top:480px">{grid}</div>'
    b += footer(swipe=True)
    slide(P + '03.png', b)

    group = ''.join(tile(k, 0, 'sel') for k in ['flag', 'name', 'shape', 'fact'])
    b = glow() + brand() + counter(4, n)
    b += '<div class="abs" style="left:72px;right:72px;top:210px"><div class="h1" style="font-size:108px">What country are you looking at?</div></div>'
    b += f'<div class="abs mgroup" style="left:110px;top:520px">{group}</div>'
    b += f'<div class="abs" style="right:50px;top:640px">{mascot(260, "curious")}</div>'
    b += star(80, 490, 40) + star(960, 960, 34)
    b += '<div class="abs center" style="left:0;right:0;top:1130px"><span class="pill big">Play at roviko.app</span></div>'
    slide(P + '04.png', b)


# POST 8 - Guess the country (one image per candidate shape) -----------------
def post8(code, letter):
    b = glow() + brand()
    b += '<div class="abs center" style="left:0;right:0;top:220px"><div class="h1" style="font-size:112px">Know this shape? <span class="emo">👀</span></div></div>'
    b += f'<div class="abs center" style="left:0;right:0;top:430px">{silhouette(code, 780, FOREST)}</div>'
    b += ('<svg class="abs" style="left:830px;top:390px;width:150px;height:150px" viewBox="-12 -12 24 24">'
          f'<circle r="11" fill="none" stroke="{GOLD}" stroke-width="1.2"/><path d="M0 -8 2 0 0 8 -2 0Z" fill="{GOLD}"/>'
          f'<path d="M-8 0 0 -2 8 0 0 2Z" fill="{GOLD}" opacity=".5"/><circle r="1.3" fill="{FOREST}"/></svg>')
    b += star(110, 420, 40) + dot(930, 980, 14, op=.8)
    b += f'<div class="abs" style="left:40px;top:1000px;transform:scaleX(-1)">{mascot(250, "curious")}</div>'
    b += '<div class="abs" style="right:72px;top:1110px"><div class="h1" style="font-size:72px;color:#1F806B">Guess the country ↓</div></div>'
    slide(f'post-08-guess-the-country/shape-{letter}.png', b)


# POST 9 - Multiplayer ---------------------------------------------------------
def post9():
    n = 4; P = 'post-09-better-together/'
    b = glow() + brand() + counter(1, n)
    b += '<div class="abs" style="left:72px;right:72px;top:210px"><div class="h1" style="font-size:112px">Geography is better together. <span class="emo">🌍</span></div></div>'
    b += art('friends-hero', 'position:absolute;left:40px;top:640px;width:1000px')
    b += star(930, 560, 44)
    b += footer(swipe=True)
    slide(P + '01.png', b)

    b = glow() + brand() + counter(2, n)
    b += f'<div class="abs" style="left:72px;right:72px;top:210px"><div class="row big">{icon("room", 120)}<div class="h1" style="font-size:112px">Play with friends.</div></div></div>'
    b += f'<div class="abs" style="left:72px;right:72px;top:500px">{card(art("lobby-create", "width:100%;border-radius:40px"), "padding:0;overflow:hidden")}</div>'
    b += '<div class="abs" style="left:72px;right:72px;top:1110px"><div class="sub">Make a room, share the code. 2 to 12 players.</div></div>'
    b += footer(swipe=True)
    slide(P + '02.png', b)

    b = glow() + brand() + counter(3, n)
    b += '<div class="abs" style="left:72px;right:72px;top:210px"><div class="h1" style="font-size:112px">Or meet a random player.</div></div>'
    b += world(.08, 'left:-40px;top:580px;width:1160px')
    b += route('M270 760 C 420 560, 660 560, 810 760', width=6, dash='2 18')
    b += f'<div class="abs" style="left:80px;top:720px">{mascot(340, "wink")}</div><div class="abs" style="left:660px;top:720px">{mascot(340, "cheer")}</div>'
    b += '<div class="abs center" style="left:0;right:0;top:1100px"><span class="chip">Quick match · someone new to play with</span></div>'
    b += star(520, 800, 44) + star(120, 600, 30) + star(940, 600, 26)
    b += footer(swipe=True)
    slide(P + '03.png', b)

    b = glow() + brand() + counter(4, n)
    b += '<div class="abs" style="left:72px;right:72px;top:210px"><div class="h1" style="font-size:112px">Or challenge the computer.</div></div>'
    b += f'<div class="abs" style="left:72px;right:72px;top:480px">{card(art("world-duel", "width:100%;height:560px;object-fit:cover;object-position:50% 78%;border-radius:40px"), "padding:0;overflow:hidden")}</div>'
    b += '<div class="abs center" style="left:0;right:0;top:1110px"><span class="pill big">roviko.app</span></div>'
    b += star(940, 420, 40)
    slide(P + '04.png', b)


CSS = f"""
@font-face{{font-family:Fredoka;src:url({A}fonts/fredoka-latin-wght-normal.woff2) format('woff2');font-weight:300 700}}
@font-face{{font-family:Manrope;src:url({A}fonts/manrope-variable.woff2) format('woff2');font-weight:200 800}}
*{{box-sizing:border-box;margin:0}}
body{{background:#999;font-family:Manrope,sans-serif;color:{FOREST}}}
.slide{{width:1080px;height:1350px;position:relative;overflow:hidden;margin:0 0 40px}}
.abs{{position:absolute}} .center{{display:flex;flex-direction:column;align-items:center;text-align:center}}
.center>div{{text-align:center}}
.emo{{font-family:'Noto Color Emoji';font-size:.8em;vertical-align:.04em}}
.h1{{font-family:Fredoka;font-weight:600;line-height:1.04;letter-spacing:-.01em;color:{FOREST};text-wrap:balance}}
.sub{{font-size:40px;font-weight:600;color:#3d5a52;line-height:1.35}}
.eyebrow{{font-weight:800;font-size:30px;letter-spacing:.14em;color:{GREEN};margin-bottom:18px}}
.note{{font-size:26px;font-weight:600;color:#5b7069}}
.brand{{display:flex;align-items:center;gap:.28em;font-family:Fredoka;font-weight:700;letter-spacing:-.01em}}
.counter{{top:78px;right:72px;display:flex;gap:10px;padding:16px 20px;border-radius:40px;box-shadow:0 6px 20px rgba(22,59,50,.08)}}
.counter i{{width:14px;height:14px;border-radius:50%}}
.footer{{left:72px;right:72px;bottom:62px;display:flex;justify-content:space-between;align-items:center;font-family:Fredoka;font-weight:600;font-size:38px}}
.swipe{{font-size:32px;opacity:.7}}
.card{{background:#fff;border-radius:48px;box-shadow:0 24px 60px rgba(22,59,50,.12)}}
.pill{{display:inline-block;background:{GREEN};color:#fff;font-weight:800;font-size:38px;padding:24px 48px;border-radius:999px;box-shadow:0 14px 30px rgba(31,128,107,.28)}}
.pill.big{{font-size:44px;padding:30px 60px}}
.pill.gold{{background:{GOLD};color:{FOREST};box-shadow:0 14px 30px rgba(0,0,0,.25)}}
.chip{{display:inline-block;background:#fff;color:{FOREST};font-weight:800;font-size:32px;padding:18px 34px;border-radius:999px;box-shadow:0 10px 26px rgba(22,59,50,.1)}}
.gicon{{display:inline-flex;align-items:center;justify-content:center;flex:none;box-shadow:inset 0 0 0 2px rgba(255,255,255,.7),0 8px 20px rgba(22,59,50,.08)}}
.list{{display:flex;flex-direction:column;gap:18px}}
.row{{display:flex;align-items:center;gap:36px;font-family:Fredoka;font-weight:600;font-size:60px}}
.row.big{{gap:30px}}
.split{{left:40px;right:40px;display:flex;align-items:center;justify-content:space-between}}
.sidecard{{width:450px;padding:40px 30px 36px;display:flex;flex-direction:column;align-items:center;position:relative}}
.cname{{display:flex;align-items:center;gap:18px;margin-top:22px;font-family:Fredoka;font-weight:600;font-size:52px}}
.or{{width:96px;height:96px;margin:0 -28px;z-index:2;border-radius:50%;background:{GOLD};display:flex;align-items:center;justify-content:center;font-family:Fredoka;font-weight:700;font-size:40px;box-shadow:0 10px 24px rgba(168,101,15,.3)}}
.choice{{display:flex;flex-direction:column;gap:26px}}
.opt{{background:#fff;border-radius:36px;padding:30px 40px;display:flex;align-items:center;gap:28px;font-family:Fredoka;font-weight:600;font-size:56px;box-shadow:0 0 0 3px rgba(22,59,50,.08),0 14px 30px rgba(22,59,50,.08)}}
.check{{position:absolute;top:-26px;right:-26px;width:84px;height:84px;border-radius:50%;background:{GREEN};display:flex;align-items:center;justify-content:center;box-shadow:0 8px 20px rgba(31,128,107,.35)}}
.bar{{margin-bottom:44px}}
.blabel{{display:flex;align-items:center;gap:18px;font-family:Fredoka;font-weight:600;font-size:48px;margin-bottom:18px}}
.blabel b{{margin-left:auto;font-weight:600}}
.track{{height:64px;border-radius:12px;background:#F1EEE3}}
.fill{{height:100%;border-radius:12px}}
.flagcard{{border-radius:30px;box-shadow:0 0 0 3px rgba(22,59,50,.10),0 30px 70px rgba(22,59,50,.18)}}
.sgrid{{display:grid;grid-template-columns:1fr 1fr;gap:28px}}
.stile{{position:relative;background:{CREAM};border-radius:40px;padding:44px 40px;display:flex;flex-direction:column;gap:14px;font-family:Fredoka;font-size:52px;color:{FOREST};box-shadow:0 18px 40px rgba(0,0,0,.25)}}
.stile .emo{{font-size:64px}} .stile b{{font-weight:600}}
.stile.win{{box-shadow:0 0 0 8px {GOLD},0 18px 40px rgba(0,0,0,.25)}}
.stile.dim{{opacity:.55}}
.medal{{position:absolute;top:32px;right:32px;width:74px;height:74px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-style:normal;font-weight:700;font-size:40px;color:{FOREST};box-shadow:inset 0 -5px 0 rgba(0,0,0,.12)}}
.mystery{{display:flex;align-items:center;gap:30px;background:rgba(246,243,233,.1);border:3px dashed rgba(246,184,75,.7);border-radius:40px;padding:26px 44px 26px 26px;color:{CREAM};text-align:left}}
.mystery>span{{width:110px;height:110px;border-radius:30px;background:{GOLD};color:{FOREST};display:flex;align-items:center;justify-content:center;font-family:Fredoka;font-weight:700;font-size:72px}}
.mystery b{{display:block;font-family:Fredoka;font-weight:600;font-size:52px}} .mystery small{{font-size:32px;font-weight:600;opacity:.8}}
.mtile{{width:260px;height:260px;background:#fff;border-radius:44px;display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 3px rgba(22,59,50,.06),0 22px 44px rgba(22,59,50,.14)}}
.mtile.small{{width:160px;height:160px;border-radius:30px}}
.mtile.sel{{box-shadow:0 0 0 7px {GOLD},0 22px 44px rgba(22,59,50,.14)}}
.tflag{{width:62%;aspect-ratio:3/2;border-radius:10%;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 0 0 2px rgba(22,59,50,.08)}} .tflag i{{flex:1}}
.tfact{{text-align:center;font-family:Fredoka;line-height:1.15}} .tfact small{{display:block;font-family:Manrope;font-weight:800;font-size:19px;letter-spacing:.08em;color:{GREEN};margin-bottom:8px}}
.tfact b{{font-weight:600;font-size:46px}} .mtile.small .tfact small{{font-size:12px;margin-bottom:4px}} .mtile.small .tfact b{{font-size:30px}}
.tname{{font-family:Fredoka;font-weight:700;font-size:44px;color:{GREEN};letter-spacing:.06em}}
.mtile.small .tname{{font-size:28px}}
.mgrid{{display:grid;grid-template-columns:repeat(4,160px);gap:22px}}
.mgroup{{display:grid;grid-template-columns:repeat(2,240px);gap:28px}} .mgroup .mtile{{width:240px;height:240px}}
"""

if __name__ == '__main__':
    post1(); post2(); post3(); post4(); post5(); post6(); post7()
    for code, letter in [('ISL', 'a'), ('ITA', 'b'), ('MDG', 'c')]:
        post8(code, letter)
    post9()
    html = f'<!doctype html><html><head><meta charset="utf-8"><style>{CSS}</style></head><body>' + ''.join(h for _, h in SLIDES) + '</body></html>'
    open(os.path.join(HERE, 'slides.html'), 'w').write(html)
    print(len(SLIDES), 'slides')
