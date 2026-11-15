"""Content week 5 (16-22 Nov 2026): 4 posts a day. Captions ready to paste: English, exactly 5 hashtags, always with #fyp.
P1 flag twins (carousel) · P2 map challenge with A/B/C (12 slides) · P3 Roviko explains (voiced reel) · P4 What flag is this? (16 slides)"""

DAYS = {
    1: ('ma-16-nov', 'MON 16 NOV'), 2: ('di-17-nov', 'TUE 17 NOV'), 3: ('wo-18-nov', 'WED 18 NOV'), 4: ('do-19-nov', 'THU 19 NOV'),
    5: ('vr-20-nov', 'FRI 20 NOV'), 6: ('za-21-nov', 'SAT 21 NOV'), 7: ('zo-22-nov', 'SUN 22 NOV'),
}
SLOTS = {'P1': ('Flag twins', 'car', '19:00'), 'P2': ('Map challenge', 'map', '12:30'), 'P3': ('Roviko explains', 'reel', '17:30'),
         'P4': ('What flag is this?', 'gtf', '08:00')}
MAPN = {1: 49, 2: 50, 3: 51, 4: 52, 5: 53, 6: 54, 7: 55}
MAPR = {49: 'Europe', 50: 'Africa', 51: 'Asia', 52: 'The Americas', 53: 'Islands only', 54: 'Europe', 55: 'Around the world'}
MAPE = {49: '🇪🇺', 50: '🌍', 51: '🌏', 52: '🌎', 53: '🏝️', 54: '🇪🇺', 55: '🌐'}
GTFL = {1: 'Medium', 2: 'Hard', 3: 'Medium', 4: 'Hard', 5: 'Medium', 6: 'Hard', 7: 'Legend'}
TAGS = {
    'twins': '#fyp #flags #geography #flagquiz #foryou',
    'map': '#fyp #geography #maps #guessthecountry #quiz',
    'gtf': '#fyp #flags #guesstheflag #vexillology #quiz',
    'ex': '#fyp #geography #maps #learnontiktok #funfacts',
}

_P = {
    # P1 flag twins: (caption, banner line 1, line 2)
    'D1P1': ('Cameroon, Guinea, Mali or Senegal? Name all 4 🌍\nTwo of them are mirror images. Swipe for how to tell.\nComment your score 👇', 'twins', 'Same three colours.', 'Can you name all 4?'),
    'D2P1': ('Canada, Austria, Peru or Latvia? Name all 4 🍁\nRed, white, red, four different ways.\nComment your score 👇', 'twins', 'Red, white, red.', 'Can you name all 4?'),
    'D3P1': ('France, the Netherlands or Russia? Name all 3 🇫🇷🇳🇱🇷🇺\nSlide 4: which one might be the oldest tricolour.\nComment your score 👇', 'twins', 'Three tricolours.', 'Can you name all 3?'),
    'D4P1': ('Tunisia, Türkiye or Azerbaijan? Name all 3 🌙\nOne crescent, three countries. Swipe.\nComment your score 👇', 'twins', 'One crescent,', 'three countries'),
    'D5P1': ('Nicaragua, El Salvador or Honduras? Name all 3 🔍\nThey all come from one old country.\nComment your score 👇', 'twins', 'Blue, white, blue.', 'Can you name all 3?'),
    'D6P1': ('Belgium, Germany or Uganda? Name all 3 🇧🇪🇩🇪🇺🇬\nSlide 4: the bird that stands on one leg.\nComment your score 👇', 'twins', 'Black, yellow, red.', 'Can you name all 3?'),
    'D7P1': ('Algeria, Mauritania or Pakistan? Name all 3 🌙\nSlide 4: the flag that changed in 2017.\nComment your score 👇', 'twins', 'Crescent and star.', 'Can you name all 3?'),
    # P3 explainers
    'D1P3': ('Latin America, South America, Central America… what’s the actual difference? 🌎\nSave this for the next time someone mixes them up.', 'ex', 'Latin America vs', 'South America?'),
    'D2P3': ('Scandinavia and the Nordic countries are not the same thing 🇸🇪🇳🇴🇩🇰🇫🇮🇮🇸\nWhich one surprised you? 👇', 'ex', 'Scandinavia vs the', 'Nordic countries?'),
    'D3P3': ('Where does Europe end and Asia begin? 🗺️\nThe line cuts right through five countries.', 'ex', 'Where does Europe', 'end and Asia begin?'),
    'D4P3': ('Africa is way bigger than your map shows you 🌍\nThe USA, China and India all fit inside it.', 'ex', 'Africa is way bigger', 'than you think'),
    'D5P3': ('Only 13 countries sit on the equator. Can you name them before the video does? 🌐', 'ex', 'The 13 countries', 'on the equator'),
    'D6P3': ('Australia, Australasia or Oceania? Three names, three different things 🦘\nTag the friend who uses them wrong.', 'ex', 'Australia, Australasia', 'or Oceania?'),
    'D7P3': ('Only 3 countries are completely surrounded by one other country. Can you name them? 🧐👇', 'ex', 'Countries inside', 'other countries'),
}
POSTS = {pid: (f'{cap}\n{TAGS[tag]}', l1, l2) for pid, (cap, tag, l1, l2) in _P.items()}
for d, n in MAPN.items():
    POSTS[f'D{d}P2'] = (f"Map challenge {n}: {MAPR[n]} {MAPE[n]}\nNew: pick A, B or C for every country. Every answer comes with a fact.\n"
                        f"Comment your letters before you swipe 👇\n{TAGS['map']}", f'Map challenge {n}:', f'{MAPR[n]}. A, B or C?')
    POSTS[f'D{d}P4'] = (f"What flag is this? 7 flags, level: {GTFL[d]} 🏳️\nEvery answer gets a passport stamp and a fact.\nComment your score: __/7 👇\n{TAGS['gtf']}",
                        'What flag is this?', f'7 flags. Level: {GTFL[d]}')
