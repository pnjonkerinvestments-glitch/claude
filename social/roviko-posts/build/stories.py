"""Builds build/stories.html: Instagram Stories (1080x1920) for six profile Highlights, plus Highlight covers.

Run `python3 build/stories.py && node build/render.mjs stories` from social/roviko-posts/.
Instagram covers roughly the top 250px (progress bar, name) and the bottom 320px (reply bar), so all text
stays between y=250 and y=1600. Empty areas marked in README.md are meant for stickers (quiz, poll, link).
"""
import os
from slides import (A, CREAM, CSS, FOREST, GOLD, GREEN, SHAPES, art, card, dot, flag_chip, glow, icon, mascot,
                    pin, plane, route, silhouette, star, world, ICONS, TONES)

HERE = os.path.dirname(os.path.abspath(__file__))
H = 1920
STORIES = []

def story(path, body, bg=CREAM):
    STORIES.append(f'<section class="slide story" data-out="stories/{path}" style="background:{bg}">{body}</section>')

def top(label, dark=False):
    """Brand on the left and the Highlight name on the right, just below Instagram's own header."""
    c = CREAM if dark else FOREST
    chip = ('background:rgba(246,243,233,.12);color:' + CREAM) if dark else ('background:#fff;color:' + FOREST)
    return (f'<div class="brand abs" style="top:250px;left:72px;color:{c};font-size:46px">{mascot(64)}<span>roviko</span></div>'
            f'<div class="abs hl" style="top:258px;right:72px;{chip}">{label}</div>')

def h1(text, top_px, size=112, color=FOREST, center=False):
    align = 'text-align:center;' if center else ''
    return f'<div class="abs" style="left:72px;right:72px;top:{top_px}px;{align}"><div class="h1" style="font-size:{size}px;color:{color}">{text}</div></div>'

def sub(text, top_px, center=False, color='#3d5a52'):
    align = 'text-align:center;' if center else ''
    return f'<div class="abs sub" style="left:72px;right:72px;top:{top_px}px;{align}color:{color}">{text}</div>'

def centered(inner, top_px):
    return f'<div class="abs center" style="left:0;right:0;top:{top_px}px">{inner}</div>'

def steps(items, top_px, dark=False):
    rows = ''.join(f'<div class="step"><i>{n}</i><span>{t}</span></div>' for n, t in enumerate(items, 1))
    return f'<div class="abs steps{" dark" if dark else ""}" style="left:72px;right:72px;top:{top_px}px">{rows}</div>'

def estonia(w):
    # Proportions 7:11 and blue PMS 285C (#0072CE), as specified by the Government Office of Estonia.
    return (f'<div class="flagcard"><svg width="{w}" height="{int(w * 7 / 11)}" viewBox="0 0 11 7" preserveAspectRatio="none" '
            'style="display:block;border-radius:28px"><rect width="11" height="7" fill="#fff"/><rect width="11" height="4.667" fill="#000"/>'
            '<rect width="11" height="2.333" fill="#0072CE"/></svg></div>')

def tall(code, h, color=FOREST):
    """A narrow country cropped to its own width, so it can fill the story's height."""
    import re
    xs = [float(x) for x, _ in re.findall(r'(-?[\d.]+),(-?[\d.]+)', SHAPES[code])]
    x0, w = min(xs) - 1, max(xs) - min(xs) + 2
    return f'<svg viewBox="{x0} 3 {w} 74" style="height:{h}px;width:{h * w / 74:.0f}px;display:block"><path d="{SHAPES[code]}" fill="{color}"/></svg>'

def sticker_hint(top_px, text):
    """A small line pointing at the empty sticker area underneath it."""
    return f'<div class="abs center" style="left:0;right:0;top:{top_px}px"><span class="hint">{text}</span></div>'


# START: what Roviko is -------------------------------------------------------
GAMES = [  # daily order on roviko.app; steps follow roviko/lib/how-to-play.ts
    ('daily', 'Daily Detour', 'daily-detour', ['Twenty questions, all mixed: flags, capitals, the map, neighbours and sizes.',
                                                'Tap the answer you think is right. There is no timer.',
                                                'After every answer you see if it was right, with a fun fact.']),
    ('rank', 'Rank Radar', 'rank-radar', ['You see one country and four subjects, like coastline, forest or population.',
                                          'Tap the subject where this country ranks highest in the world.',
                                          'Best choice: gold. Second best: silver. Third: bronze.']),
    ('duel', 'World Duel', 'world-duel', ['You get five country cards. Each round Roviko plays a country on a subject.',
                                          'Pick a card from your hand that scores higher than Roviko’s country.',
                                          'Every card only once. There is always one perfect route.']),
    ('compare', 'Side by Side', 'side-by-side', ['Two countries and one subject of the day.',
                                                 'Tap the country with the higher value.',
                                                 'One country stays, a new one joins. Ten rounds.']),
    ('mosaic', 'Country Mosaic', 'country-mosaic', ['Four countries hide in the tiles: names, flags, shapes and facts.',
                                                    'Tap one tile of each kind that belong together, then check your match.',
                                                    'Every country you solve is worth up to 250 points.']),
    ('trail', 'Clue Trail', 'clue-trail', ['Find the mystery country. Clues come one by one: continent, a neighbour, capital, flag.',
                                           'Only open the next clue when you need it.',
                                           'The fewer clues you need, the more points you get.']),
]

def start():
    b = glow() + top('START')
    b += route('M130 1180 C 110 950, 200 760, 330 690', h=H, dash='2 18') + plane(318, 652, 70, rot=-30)
    b += route('M930 760 C 990 940, 960 1100, 880 1180', h=H, dash='2 18') + pin(905, 680, 50)
    b += star(140, 940, 54) + star(890, 560, 40) + star(960, 1180, 34) + dot(120, 760, 16, op=.7)
    b += h1('Hi, I’m Roviko! <span class="emo">👋</span>', 420, 120, center=True)
    b += centered(mascot(600, 'cheer'), 640)
    b += h1('A small geography trip.<br><span style="color:#1F806B">Every day.</span>', 1300, 80, center=True)
    story('1-start/01.png', b)

    tiles = ''.join(f'<div class="gtile">{icon(m, 120)}<b>{name}</b></div>' for m, name, _, _ in GAMES)
    b = glow() + top('START')
    b += h1('Six little games.<br><span style="color:#1F806B">New every day.</span>', 420, 108)
    b += f'<div class="abs ggrid" style="left:72px;right:72px;top:720px">{tiles}</div>'
    b += sub('The same trip for everyone, up to 1,000 points per game.', 1420)
    story('1-start/02.png', b)

    b = glow() + top('START')
    b += h1('No timer.<br>No rush.', 440, 150)
    b += centered(mascot(520, 'sleepy'), 790)
    b += sub('Take your time. After every answer you see if you were right, and why.', 1390)
    b += star(860, 800, 44) + star(150, 1180, 32)
    story('1-start/03.png', b)

    b = glow() + top('START')
    b += h1('Ready for today’s trip?', 420, 120, center=True)
    b += route('M140 1060 C 280 760, 800 760, 940 1060', h=H, width=6, dash='2 18') + plane(890, 980, 80, rot=50)
    b += centered(mascot(460, 'wink'), 700)
    b += centered('<span class="pill big">Play at roviko.app</span>', 1260)
    b += sticker_hint(1440, 'Tap the link ↓')
    b += star(150, 760, 48) + star(900, 700, 36)
    story('1-start/04.png', b)


# GAMES: one story per daily game ---------------------------------------------
def games():
    b = glow() + top('GAMES')
    b += h1('Today’s trip:<br><span style="color:#1F806B">six stops.</span>', 420, 120)
    # a dotted route that visits the six game logos
    pts = [(170, 820), (540, 760), (900, 860), (820, 1160), (440, 1120), (200, 1420)]
    d = 'M' + ' L'.join(f'{x} {y}' for x, y in pts)
    b += route(d, h=H, width=6, dash='2 18')
    for n, ((x, y), (m, name, _, _)) in enumerate(zip(pts, GAMES), 1):
        b += (f'<div class="abs stop" style="left:{x - 70}px;top:{y - 70}px">{icon(m, 140)}<i>{n}</i>'
              f'<b>{name}</b></div>')
    b += f'<div class="abs" style="right:60px;top:1330px">{mascot(220, "happy")}</div>'
    story('2-games/01.png', b)

    for n, (m, name, pic, text) in enumerate(GAMES, 1):
        b = glow() + top('GAMES')
        b += f'<div class="abs eyebrow" style="left:72px;top:410px">STOP {n} OF 6 · UP TO 1,000 POINTS</div>'
        b += f'<div class="abs row big" style="left:72px;right:72px;top:470px">{icon(m, 130)}<div class="h1" style="font-size:104px">{name}</div></div>'
        b += f'<div class="abs" style="left:100px;right:100px;top:660px">{card(art(pic, "width:100%;border-radius:40px"), "padding:0;overflow:hidden")}</div>'
        b += steps(text, 1290)
        story(f'2-games/{n + 1:02}.png', b)


# QUIZ: question + answer pairs, with room for Instagram's quiz/poll stickers -------
def quiz():
    b = glow() + top('QUIZ')
    b += h1('Guess the flag <span class="emo">👀</span>', 420, 120, center=True)
    b += centered(estonia(820), 650)
    b += sticker_hint(1230, 'Your guess ↓')
    b += f'<div class="abs" style="right:-70px;top:1500px;transform:rotate(-14deg)">{mascot(360, "curious")}</div>'
    b += star(90, 600, 44)
    story('3-quiz/01.png', b)

    b = glow() + top('QUIZ')
    b += h1('It’s Estonia! <span class="emo">🇪🇪</span>', 420, 120, center=True)
    b += centered(estonia(640), 660)
    b += sub('Blue, black and white: three equal bands.', 1150, center=True)
    b += centered(mascot(300, 'cheer'), 1270)
    b += star(160, 1300, 46) + star(880, 1360, 34)
    story('3-quiz/02.png', b)

    b = glow() + top('QUIZ')
    b += h1('Which has more people?', 420, 112, center=True)
    b += (f'<div class="abs split" style="top:720px;left:60px;right:60px">'
          f'<div class="card sidecard small">{silhouette("CAN", 330)}<div class="cname">{flag_chip("ca", 46)}<span>Canada</span></div></div>'
          f'<div class="or">or</div>'
          f'<div class="card sidecard small">{silhouette("AUS", 330)}<div class="cname">{flag_chip("au", 46)}<span>Australia</span></div></div></div>')
    b += sticker_hint(1200, 'Vote ↓')
    story('3-quiz/03.png', b)

    can, aus = 41.29, 27.2
    def bar(flag, name, val, label, color):
        return (f'<div class="bar"><div class="blabel">{flag_chip(flag, 48)}<span>{name}</span><b>{label}</b></div>'
                f'<div class="track"><div class="fill" style="width:{val / can * 100:.1f}%;background:{color}"></div></div></div>')
    b = glow() + top('QUIZ')
    b += h1('Canada! <span class="emo">🇨🇦</span>', 420, 130)
    b += sub('About 14 million more people than Australia.', 590)
    b += (f'<div class="abs" style="left:72px;right:72px;top:760px">'
          + card('<div class="eyebrow">POPULATION, 2024</div>' + bar('ca', 'Canada', can, '41.3 million', GREEN)
                 + bar('au', 'Australia', aus, '27.2 million', '#8FBFB1'), 'padding:56px 56px 20px') + '</div>')
    b += '<div class="abs note" style="left:72px;right:72px;top:1270px">Source: World Bank, World Development Indicators.</div>'
    b += f'<div class="abs" style="right:70px;top:1330px">{mascot(250, "cheer")}</div>'
    story('3-quiz/04.png', b)

    b = glow() + top('QUIZ')
    b += h1('Know this shape? <span class="emo">👀</span>', 420, 100, center=True)
    b += f'<div class="abs" style="left:150px;top:600px">{tall("CHL", 920)}</div>'
    b += ('<svg class="abs" style="left:430px;top:640px;width:130px;height:130px" viewBox="-12 -12 24 24">'
          f'<circle r="11" fill="none" stroke="{GOLD}" stroke-width="1.2"/><path d="M0 -8 2 0 0 8 -2 0Z" fill="{GOLD}"/>'
          f'<path d="M-8 0 0 -2 8 0 0 2Z" fill="{GOLD}" opacity=".5"/><circle r="1.3" fill="{FOREST}"/></svg>')
    b += f'<div class="abs" style="left:700px;top:1300px">{mascot(260, "curious")}</div>'
    b += '<div class="abs" style="left:480px;right:72px;top:820px;text-align:center"><span class="hint">Your guess ↓</span></div>'
    story('3-quiz/05.png', b)

    b = glow() + top('QUIZ')
    b += h1(f'It’s Chile! {flag_chip("cl", 84)}', 420, 120, center=True)
    b += f'<div class="abs" style="left:190px;top:600px">{tall("CHL", 920, GREEN)}</div>'
    b += f'<div class="abs" style="left:560px;top:760px">{mascot(340, "cheer")}</div>'
    b += star(880, 700, 46) + star(620, 1180, 30)
    b += f'<div class="abs" style="left:500px;top:1260px"><span class="pill">More at roviko.app</span></div>'
    story('3-quiz/06.png', b)


# FACTS -----------------------------------------------------------------------
def facts():
    b = glow() + top('FACTS')
    b += h1('A country inside a country?', 420, 120)
    b += f'<div class="abs" style="left:72px;right:72px;top:760px">{card(art("africa", "width:100%;border-radius:40px"), "padding:0;overflow:hidden")}</div>'
    b += f'<div class="abs" style="right:40px;top:1300px">{mascot(250, "curious")}</div>'
    b += sub('Tap for the answer →', 1500, color='#1F806B')
    story('4-facts/01.png', b)

    z = SHAPES['_za']; x, y, w, h = z['bbox']; pad = .6
    cx, cy = z['lso_center']
    m = (f'<svg viewBox="{x - pad} {y - pad} {w + 2 * pad} {h + 2 * pad}" style="width:820px;display:block">'
         f'<path d="{z["ZAF"]}" fill="#1F806B" fill-rule="evenodd" stroke="#F6F3E9" stroke-width=".06" stroke-linejoin="round"/>'
         f'<path d="{z["LSO"]}" fill="#F6B84B" stroke="#163B32" stroke-width=".07" stroke-linejoin="round"/>'
         f'<circle cx="{cx}" cy="{cy}" r="1.25" fill="none" stroke="#F6B84B" stroke-width=".09" stroke-dasharray=".05 .22" stroke-linecap="round"/>'
         f'<text x="{cx}" y="{cy - 1.55}" text-anchor="middle" font-family="Fredoka" font-weight="700" font-size=".78" fill="#163B32" '
         'stroke="#F6F3E9" stroke-width=".22" paint-order="stroke" stroke-linejoin="round">Lesotho</text>'
         f'<text x="{x + w * .23}" y="{y + h * .52}" font-family="Fredoka" font-weight="600" font-size=".72" fill="#F6F3E9">South Africa</text></svg>')
    b = glow() + top('FACTS')
    b += h1('<span style="color:#1F806B">Lesotho</span> is completely surrounded by South Africa. <span class="emo">🌍</span>', 420, 92)
    b += centered(card(m, 'padding:40px 50px'), 780)
    b += '<div class="abs note center" style="left:0;right:0;top:1570px">Simplified illustration. Source: South African Government.</div>'
    story('4-facts/02.png', b)

    b = glow() + top('FACTS')
    b += h1('Canada has about <span style="color:#1F806B">14 million</span> more people than Australia.', 420, 96)
    b += (f'<div class="abs" style="left:110px;top:900px">{silhouette("CAN", 480, GREEN)}</div>'
          f'<div class="abs" style="left:560px;top:1000px">{silhouette("AUS", 420, "#8FBFB1")}</div>')
    b += '<div class="abs note" style="left:72px;right:72px;top:1450px">Population, 2024: 41.3 vs 27.2 million. Source: World Bank, World Development Indicators.</div>'
    b += star(900, 850, 40) + star(120, 1320, 30)
    story('4-facts/03.png', b)


# EXPLORE: the country pages --------------------------------------------------
REGIONS = [('europe', 'Europe', 45), ('africa', 'Africa', 54), ('asia', 'Asia', 47),
           ('north-america', 'North America', 23), ('south-america', 'South America', 12), ('oceania', 'Oceania', 14)]

def explore():
    b = glow() + top('EXPLORE')
    b += h1('195 countries.<br><span style="color:#1F806B">One at a time.</span>', 420, 116)
    b += f'<div class="abs" style="left:40px;right:40px;top:780px">{art("explore-hero", "width:100%")}</div>'
    b += sub('Every country has its own page: flag, capital, neighbours and more.', 1260)
    b += star(900, 740, 44)
    story('5-explore/01.png', b)

    cards = ''.join(f'<div class="region">{art(k, "width:100%;height:230px;object-fit:cover;border-radius:34px 34px 0 0")}'
                    f'<div><b>{name}</b><small>{n} countries</small></div></div>' for k, name, n in REGIONS)
    b = glow() + top('EXPLORE')
    b += h1('Browse by region', 410, 108)
    b += f'<div class="abs rgrid" style="left:72px;right:72px;top:590px">{cards}</div>'
    story('5-explore/02.png', b)

    b = glow() + top('EXPLORE')
    b += world(.09, 'left:-60px;top:760px;width:1200px')
    b += h1('Where do you want to go?', 420, 120, center=True)
    b += pin(170, 820, 60) + pin(830, 900, 60, GOLD) + pin(930, 1160, 50, '#c4553a')
    b += centered(mascot(380, 'curious'), 860)
    b += centered('<span class="pill big">Explore at roviko.app</span>', 1320)
    b += sticker_hint(1470, 'Tap the link ↓')
    story('5-explore/03.png', b)


# FRIENDS: multiplayer --------------------------------------------------------
def friends():
    b = glow() + top('FRIENDS')
    b += h1('Geography is better together. <span class="emo">🌍</span>', 420, 116)
    b += art('friends-hero', 'position:absolute;left:30px;top:900px;width:1020px')
    b += star(920, 820, 44)
    story('6-friends/01.png', b)

    b = glow() + top('FRIENDS')
    b += h1('Play with friends.', 420, 100)
    b += f'<div class="abs" style="left:110px;right:110px;top:600px">{card(art("lobby-create", "width:100%;border-radius:40px"), "padding:0;overflow:hidden")}</div>'
    b += steps(['Create a room and share the code or link. 2 to 12 players, guests welcome.',
                'The host picks the games, the number of questions and the timer.',
                'Everyone gets the same question. The ranking shows who is on top.'], 1190)
    story('6-friends/02.png', b)

    b = glow() + top('FRIENDS')
    b += h1('Or meet a random player.', 420, 116)
    b += world(.08, 'left:-40px;top:800px;width:1160px')
    b += route('M270 1000 C 420 780, 660 780, 810 1000', h=H, width=6, dash='2 18')
    b += f'<div class="abs" style="left:80px;top:960px">{mascot(340, "wink")}</div><div class="abs" style="left:660px;top:960px">{mascot(340, "cheer")}</div>'
    b += centered('<span class="chip">Quick match</span>', 1400)
    b += star(520, 1040, 44) + star(120, 840, 30)
    story('6-friends/03.png', b)

    lvl = ''.join(f'<div class="lvl">{mascot(200, mood)}<b>{name}</b></div>'
                  for mood, name in [('sleepy', 'Easy'), ('curious', 'Medium'), ('wink', 'Hard')])
    b = glow() + top('FRIENDS')
    b += h1('Or challenge the computer.', 420, 116)
    b += f'<div class="abs lvls" style="left:72px;right:72px;top:820px">{lvl}</div>'
    b += sub('Pick a level. Just for fun: games against the computer never count for the rankings.', 1290)
    story('6-friends/04.png', b)

    b = glow() + top('FRIENDS')
    b += h1('Who will you play with today?', 420, 116, center=True)
    b += centered(mascot(440, 'cheer'), 760)
    b += centered('<span class="pill big">roviko.app</span>', 1300)
    b += sticker_hint(1460, 'Tap the link ↓')
    b += star(160, 820, 48) + star(890, 900, 36)
    story('6-friends/05.png', b)


# HIGHLIGHT COVERS: Instagram crops these to a centred circle ------------------
BULB = ('<path d="M16 3a9 9 0 0 0-5.2 16.4c.9.7 1.4 1.6 1.4 2.6v1h7.6v-1c0-1 .5-1.9 1.4-2.6A9 9 0 0 0 16 3Z" fill="currentColor"/>'
        '<rect x="12.2" y="24.6" width="7.6" height="2.4" rx="1.2" fill="currentColor" opacity=".6"/>'
        '<rect x="13.4" y="28" width="5.2" height="2.2" rx="1.1" fill="currentColor" opacity=".6"/>'
        f'<path d="M13 12.5a3.5 3.5 0 0 1 3-3" stroke="{CREAM}" stroke-width="1.8" stroke-linecap="round" fill="none"/>')

def covers():
    for name, glyph in [('1-start', None), ('2-games', 'mixed'), ('3-quiz', 'mystery'),
                        ('4-facts', 'bulb'), ('5-explore', 'trail'), ('6-friends', 'room')]:
        if glyph is None:
            inner = mascot(430, 'happy')
        else:
            svg = BULB if glyph == 'bulb' else ICONS[glyph].replace('var(--gi-bg,#fff)', CREAM)
            inner = f'<svg viewBox="0 0 32 32" style="width:360px;height:360px;color:{FOREST}">{svg}</svg>'
        b = (f'<div class="abs" style="left:190px;top:{(H - 700) // 2}px;width:700px;height:700px;border-radius:50%;background:{CREAM};'
             f'display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 18px rgba(246,184,75,.9)">{inner}</div>')
        story(f'covers/{name}.png', b, bg=FOREST)


STORY_CSS = f"""
.story{{height:1920px}}
.hl{{font-weight:800;font-size:26px;letter-spacing:.14em;padding:14px 26px;border-radius:999px;box-shadow:0 6px 20px rgba(22,59,50,.08)}}
.hint{{font-family:Fredoka;font-weight:600;font-size:40px;color:{GREEN}}}
.steps{{display:flex;flex-direction:column;gap:26px}}
.step{{display:flex;gap:26px;align-items:flex-start;font-size:36px;font-weight:600;line-height:1.35;color:#2c4a42}}
.step i{{flex:none;width:60px;height:60px;border-radius:50%;background:{GOLD};color:{FOREST};font-style:normal;font-family:Fredoka;font-weight:700;font-size:34px;display:flex;align-items:center;justify-content:center;margin-top:-4px}}
.ggrid{{display:grid;grid-template-columns:1fr 1fr;gap:26px}}
.gtile{{background:#fff;border-radius:40px;padding:34px;display:flex;align-items:center;gap:26px;box-shadow:0 18px 40px rgba(22,59,50,.08)}}
.gtile b{{font-family:Fredoka;font-weight:600;font-size:44px;line-height:1.05}}
.stop{{width:140px;display:flex;flex-direction:column;align-items:center}}
.stop i{{position:absolute;top:-14px;right:-14px;width:52px;height:52px;border-radius:50%;background:{FOREST};color:#fff;font-style:normal;font-family:Fredoka;font-weight:700;font-size:28px;display:flex;align-items:center;justify-content:center}}
.stop b{{margin-top:14px;white-space:nowrap;font-family:Fredoka;font-weight:600;font-size:34px;background:{CREAM};padding:2px 12px;border-radius:14px}}
.sidecard.small{{width:420px;padding:36px 24px 30px}}
.sidecard.small .cname{{font-size:46px}}
.rgrid{{display:grid;grid-template-columns:1fr 1fr;gap:26px}}
.region{{background:#fff;border-radius:34px;box-shadow:0 16px 36px rgba(22,59,50,.1);overflow:hidden}}
.region>div{{padding:20px 28px 26px}} .region b{{display:block;font-family:Fredoka;font-weight:600;font-size:42px}}
.region small{{font-size:28px;font-weight:600;color:#5b7069}}
.lvls{{display:flex;justify-content:space-between}}
.lvl{{width:290px;background:#fff;border-radius:44px;padding:34px 0 30px;display:flex;flex-direction:column;align-items:center;gap:10px;box-shadow:0 18px 40px rgba(22,59,50,.1)}}
.lvl b{{font-family:Fredoka;font-weight:600;font-size:48px}}
"""

if __name__ == '__main__':
    start(); games(); quiz(); facts(); explore(); friends(); covers()
    html = f'<!doctype html><html><head><meta charset="utf-8"><style>{CSS}{STORY_CSS}</style></head><body>' + ''.join(STORIES) + '</body></html>'
    open(os.path.join(HERE, 'stories.html'), 'w').write(html)
    print(len(STORIES), 'stories')
