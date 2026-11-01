"""Content week 3 (2-8 Nov 2026): the 35 posts, their captions and banner texts. Same build as week 2 (build/w2_pack.py WEEK=3).
Captions are ready to paste: English, exactly 5 hashtags, always with #fyp (as asked)."""

DAYS = {
    1: ('ma-2-nov', 'MON 2 NOV'), 2: ('di-3-nov', 'TUE 3 NOV'), 3: ('wo-4-nov', 'WED 4 NOV'), 4: ('do-5-nov', 'THU 5 NOV'),
    5: ('vr-6-nov', 'FRI 6 NOV'), 6: ('za-7-nov', 'SAT 7 NOV'), 7: ('zo-8-nov', 'SUN 8 NOV'),
}
SLOTS = {'P1': ('Flag twins', 'car', '19:00'), 'P2': ('Map challenge', 'map', '15:00'), 'P3': ('Flag twins reel', 'reel', '12:30'),
         'P4': ('Guess the country in 3 facts', 'reel', '08:00'), 'P5': ('Map facts', 'reel', '21:00')}
MAPN = {1: 35, 2: 36, 3: 37, 4: 38, 5: 39, 6: 40, 7: 41}
MAPR = {35: 'Europe', 36: 'Africa', 37: 'Asia', 38: 'The Americas', 39: 'Islands only', 40: 'Europe', 41: 'Around the world'}
MAPE = {35: '🇪🇺', 36: '🌍', 37: '🌏', 38: '🌎', 39: '🏝️', 40: '🇪🇺', 41: '🌐'}

TAGS = {
    'twins': '#fyp #flags #geography #flagquiz #foryou',
    'map': '#fyp #geography #maps #guessthecountry #quiz',
    'flag': '#fyp #flags #vexillology #geography #quiz',
    'clue': '#fyp #geography #guessthecountry #funfacts #foryou',
    'find': '#fyp #maps #geography #mapchallenge #quiz',
    'size': '#fyp #maps #mercator #geography #funfacts',
}

def map_caption(n):
    return (f"Map challenge #{n}: {MAPR[n]} {MAPE[n]}\n5 countries, no names, from Easy to Legend. Every answer comes with a fact.\n"
            f"Guess before you swipe, then comment your score: __/5 👇\n{TAGS['map']}")

# post id -> (caption without hashtags, hashtag set, banner line 1, banner line 2)
_P = {
    'D1P1': ("Croatia, Russia or Serbia? Name all 3 🇭🇷🇷🇺🇷🇸\nSame three colours, stacked three different ways. Swipe for how to tell.\nComment your score 👇", 'twins',
             'Croatia, Russia', 'or Serbia? Name all 3'),
    'D1P3': ("Our most-watched post was Monaco vs Indonesia. So here’s the reel 😏\nWhich one is Monaco: A or B?", 'flag',
             'Our most-watched flags.', 'Which one is Monaco?'),
    'D1P4': ("3 clues, 1 country. Clue 1 is the hard one 🌍\nWhen did you get it: clue 1, 2 or 3? 👇", 'clue',
             '3 clues. 1 country.', 'Got it on clue 1?'),
    'D1P5': ("Slovenia or Slovakia? Roviko still can’t tell 😅\nWhich number is Slovenia? Lock it in before the reveal.", 'find',
             'Which number', 'is Slovenia?'),
    'D2P1': ("Bangladesh, Palau or Japan? Name all 3 🇧🇩🇵🇼🇯🇵\nSlide 4: two of these circles aren’t in the middle. On purpose.\nComment your score 👇", 'twins',
             'Bangladesh, Palau', 'or Japan? Name all 3'),
    'D2P3': ("Same colours, mirrored. One is Mali, one is Guinea 👀\nWhich one is Guinea: A or B?", 'flag',
             'Same colours, mirrored.', 'Which one is Guinea?'),
    'D2P4': ("Hard clues first 🏜️\nDid you know clue 1? Comment when you got it: 1, 2 or 3 👇", 'clue',
             'Hard clues first.', 'When did you get it?'),
    'D2P5': ("Mongolia or Iran: which one is bigger? 🗺️\nYour map has been lying to you.", 'size',
             'Mongolia or Iran:', 'which one is bigger?'),
    'D3P1': ("Uruguay, Argentina or Greece? Name all 3 🇺🇾🇦🇷🇬🇷\nTwo of them have exactly 9 stripes. Swipe.\nComment your score 👇", 'twins',
             'Uruguay, Argentina', 'or Greece? Name all 3'),
    'D3P3': ("Red, green, white and black. One is the UAE, one is Kuwait 🔍\nWhich one is Kuwait: A or B?", 'flag',
             'Red, green, white, black.', 'Which one is Kuwait?'),
    'D3P4': ("Only 3 clues. Can you name it before clue 3? ☀️\nComment the clue that gave it away 👇", 'clue',
             'Only 3 clues.', 'Name this country'),
    'D3P5': ("Roviko is very sure it’s number 2 😎\nWhich number is Nepal? Comment yours 👇", 'find',
             'Which number', 'is Nepal?'),
    'D4P1': ("Philippines, Czechia or Chile? Name all 3 🇵🇭🇨🇿🇨🇱\nSlide 4: the flag that gets flipped upside down in war.\nComment your score 👇", 'twins',
             'Philippines, Czechia', 'or Chile? Name all 3'),
    'D4P3': ("Same three colours. One is Iran, one is Tajikistan 🤔\nWhich one is Tajikistan: A or B?", 'flag',
             'Same three colours.', 'Which one is Tajikistan?'),
    'D4P4': ("Easy? Prove it 🌮\nClue 1 is about a capital that’s sinking. Did you know that? 👇", 'clue',
             'Easy? Prove it.', 'Name it in 3 clues'),
    'D4P5': ("Norway or Vietnam: which one is bigger? 🇳🇴🇻🇳\nHint: it’s all about how web maps work.", 'size',
             'Norway or Vietnam:', 'which one is bigger?'),
    'D5P1': ("Niger, Ivory Coast or India? Name all 3 🇳🇪🇨🇮🇮🇳\nOne of these flags is almost a square. Swipe.\nComment your score 👇", 'twins',
             'Niger, Ivory Coast', 'or India? Name all 3'),
    'D5P3': ("Red, white and blue stripes. One is Thailand, one is Costa Rica 👀\nWhich one is Costa Rica: A or B?", 'flag',
             'Red, white, blue stripes.', 'Which one is Costa Rica?'),
    'D5P4': ("Guess the country before clue 3 🦘\nClue 1 sounds fake. It isn’t.", 'clue',
             'Guess the country', 'before clue 3'),
    'D5P5': ("Belgium, Luxembourg, the Netherlands… Roviko picks number 3 😅\nWhich number is Belgium? Comment yours 👇", 'find',
             'Which number', 'is Belgium?'),
    'D6P1': ("Iraq, Yemen or Egypt? Name all 3 🇮🇶🇾🇪🇪🇬\nSame stripes, one detail each. Swipe for how to tell.\nComment your score 👇", 'twins',
             'Iraq, Yemen', 'or Egypt? Name all 3'),
    'D6P3': ("Two flags, three colours. One is Hungary, one is Bulgaria 🇭🇺🇧🇬\nWhich one is Bulgaria: A or B?", 'flag',
             'Two flags, three colours.', 'Which one is Bulgaria?'),
    'D6P4': ("3 clues, hard first 🚲\nWhich clue gave it away: 1, 2 or 3? 👇", 'clue',
             '3 clues, hard first.', 'Name this country'),
    'D6P5': ("Moldova or the Maldives? Roviko gets them mixed up 🙈\nWhich number is Moldova? Comment yours 👇", 'find',
             'Which number', 'is Moldova?'),
    'D7P1': ("Monaco, Indonesia and Poland is our most-watched post. Here’s level 2 😈\nMonaco, Indonesia, Poland or Singapore: name all 4.\nComment your score 👇", 'twins',
             'Our most-watched post,', 'level 2. Name all 4'),
    'D7P3': ("Green, white and a crescent. One is Pakistan, one is Algeria 🔍\nWhich one is Algeria: A or B?", 'flag',
             'Green, white, crescent.', 'Which one is Algeria?'),
    'D7P4': ("Week finale 🏁 Name it before clue 3.\nHow many did you get right this week? Comment your total 👇", 'clue',
             'Week finale.', 'Name it before clue 3'),
    'D7P5': ("Germany or Zimbabwe: which one is bigger? 🇩🇪🇿🇼\nMost maps make this one look easy.", 'size',
             'Germany or Zimbabwe:', 'which one is bigger?'),
}
POSTS = {pid: (f'{cap}\n{TAGS[tag]}', l1, l2) for pid, (cap, tag, l1, l2) in _P.items()}
for d, n in MAPN.items():
    POSTS[f'D{d}P2'] = (map_caption(n), f'Map challenge #{n}:', f'{MAPR[n]}. Score __/5')
