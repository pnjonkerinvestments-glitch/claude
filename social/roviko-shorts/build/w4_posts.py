"""Content week 4 (9-15 Nov 2026): the 35 posts, their captions and banner texts. Same build as week 2 (build/w2_pack.py WEEK=4).
Captions are ready to paste: English, exactly 5 hashtags, always with #fyp (as asked)."""

DAYS = {
    1: ('ma-9-nov', 'MON 9 NOV'), 2: ('di-10-nov', 'TUE 10 NOV'), 3: ('wo-11-nov', 'WED 11 NOV'), 4: ('do-12-nov', 'THU 12 NOV'),
    5: ('vr-13-nov', 'FRI 13 NOV'), 6: ('za-14-nov', 'SAT 14 NOV'), 7: ('zo-15-nov', 'SUN 15 NOV'),
}
SLOTS = {'P1': ('Flag twins', 'car', '19:00'), 'P2': ('Map challenge', 'map', '15:00'), 'P3': ('Flag twins reel', 'reel', '12:30'),
         'P4': ('Guess the country in 3 facts', 'reel', '08:00'), 'P5': ('Map facts', 'reel', '21:00')}
MAPN = {1: 42, 2: 43, 3: 44, 4: 45, 5: 46, 6: 47, 7: 48}
MAPR = {42: 'Europe', 43: 'Africa', 44: 'Asia', 45: 'The Americas', 46: 'Islands only', 47: 'Europe', 48: 'Around the world'}
MAPE = {42: '🇪🇺', 43: '🌍', 44: '🌏', 45: '🌎', 46: '🏝️', 47: '🇪🇺', 48: '🌐'}

TAGS = {
    'twins': '#fyp #flags #geography #flagquiz #foryou',
    'map': '#fyp #geography #maps #guessthecountry #quiz',
    'flag': '#fyp #flags #vexillology #geography #quiz',
    'clue': '#fyp #geography #guessthecountry #funfacts #foryou',
    'find': '#fyp #maps #geography #mapchallenge #quiz',
    'size': '#fyp #maps #mercator #geography #funfacts',
}

def map_caption(n):
    return (f"Map challenge {n}: {MAPR[n]} {MAPE[n]}\n5 countries, no names, from Easy to Legend. Every answer comes with a fact.\n"
            f"Guess before you swipe, then comment your score: __/5 👇\n{TAGS['map']}")

# post id -> (caption without hashtags, hashtag set, banner line 1, banner line 2)
_P = {
    'D1P1': ("Sweden, Kazakhstan or Ukraine? Name all 3 🇸🇪🇰🇿🇺🇦\nBlue and yellow, three very different flags. Swipe for how to tell.\nComment your score 👇", 'twins',
             'Sweden, Kazakhstan', 'or Ukraine? Name all 3'),
    'D1P3': ("Red and white, flipped. One is Indonesia, one is Poland 👀\nWhich one is Poland: A or B?", 'flag',
             'Red and white, flipped.', 'Which one is Poland?'),
    'D1P4': ("3 clues, 1 country. Clue 1 is the hard one 🌋\nWhen did you get it: clue 1, 2 or 3? 👇", 'clue',
             '3 clues. 1 country.', 'Got it on clue 1?'),
    'D1P5': ("Roviko is very sure it’s number 1 😎\nWhich number is Botswana? Lock it in before the reveal.", 'find',
             'Which number', 'is Botswana?'),
    'D2P1': ("Liberia, Malaysia or the USA? Name all 3 🇱🇷🇲🇾🇺🇸\nSlide 4: why Liberia’s flag looks American on purpose.\nComment your score 👇", 'twins',
             'Liberia, Malaysia or', 'the USA? Name all 3'),
    'D2P3': ("Yellow, blue and red. One is Colombia, one is Ecuador 🔍\nWhich one is Ecuador: A or B?", 'flag',
             'Yellow, blue, red.', 'Which one is Ecuador?'),
    'D2P4': ("Hard clues first 🐅\nComment when you got it: 1, 2 or 3 👇", 'clue',
             'Hard clues first.', 'When did you get it?'),
    'D2P5': ("Poland or the Philippines: which one is bigger? 🗺️\nYour map has been lying to you.", 'size',
             'Poland or the Philippines:', 'which one is bigger?'),
    'D3P1': ("China, Morocco or Vietnam? Name all 3 🇨🇳🇲🇦🇻🇳\nThree red flags, one star or five. Swipe.\nComment your score 👇", 'twins',
             'China, Morocco', 'or Vietnam? Name all 3'),
    'D3P3': ("A triangle and three stripes. One is Sudan, one is Jordan 🤔\nWhich one is Jordan: A or B?", 'flag',
             'A triangle and stripes.', 'Which one is Jordan?'),
    'D3P4': ("Only 3 clues. Can you name it before clue 3? 🏜️\nComment the clue that gave it away 👇", 'clue',
             'Only 3 clues.', 'Name this country'),
    'D3P5': ("Five -stans, one question. Roviko picks number 4 😅\nWhich number is Kyrgyzstan? Comment yours 👇", 'find',
             'Which number', 'is Kyrgyzstan?'),
    'D4P1': ("Malawi, South Sudan or Kenya? Name all 3 🇲🇼🇸🇸🇰🇪\nBlack, red and green, three different countries. Swipe for how to tell.\nComment your score 👇", 'twins',
             'Malawi, South Sudan', 'or Kenya? Name all 3'),
    'D4P3': ("Black, red and gold. One is Germany, one is Belgium 🇩🇪🇧🇪\nToo easy? Tag someone who would still get it wrong.", 'flag',
             'Black, red, gold.', 'Which one is Belgium?'),
    'D4P4': ("Easy? Prove it 🏛️\nDid you know clue 2? Comment when you got it 👇", 'clue',
             'Easy? Prove it.', 'Name it in 3 clues'),
    'D4P5': ("Sweden or Cameroon: which one is bigger? 🇸🇪🇨🇲\nHint: it’s all about how web maps work.", 'size',
             'Sweden or Cameroon:', 'which one is bigger?'),
    'D5P1': ("Hungary, Mexico or Italy? Name all 3 🇭🇺🇲🇽🇮🇹\nSlide 4: the story behind Mexico’s eagle.\nComment your score 👇", 'twins',
             'Hungary, Mexico', 'or Italy? Name all 3'),
    'D5P3': ("Same cross, colours swapped. One is Norway, one is Iceland 🔍\nWhich one is Iceland: A or B?", 'flag',
             'Red, white, blue, a cross.', 'Which one is Iceland?'),
    'D5P4': ("Guess the country before clue 3 🏝️\nClue 2 is wild. Did you know it?", 'clue',
             'Guess the country', 'before clue 3'),
    'D5P5': ("Central America, five countries. Roviko picks number 3 😅\nWhich number is El Salvador? Comment yours 👇", 'find',
             'Which number', 'is El Salvador?'),
    'D6P1': ("DR Congo, Tanzania or Congo? Name all 3 🇨🇩🇹🇿🇨🇬\nSlide 4: two capitals that face each other across a river.\nComment your score 👇", 'twins',
             'DR Congo, Tanzania', 'or Congo? Name all 3'),
    'D6P3': ("Blue, yellow, red and a shield. One is Andorra, one is Moldova 👀\nWhich one is Moldova: A or B?", 'flag',
             'Blue, yellow, red, a shield.', 'Which one is Moldova?'),
    'D6P4': ("3 clues, hard first 🏔️\nWhich clue gave it away: 1, 2 or 3? 👇", 'clue',
             '3 clues, hard first.', 'Name this country'),
    'D6P5': ("West Africa, five countries. Roviko picks number 4 🙈\nWhich number is Togo? Comment yours 👇", 'find',
             'Which number', 'is Togo?'),
    'D7P1': ("Ethiopia, Ghana or Bolivia? Name all 3 🇪🇹🇬🇭🇧🇴\nSlide 4: where the African flag colours come from.\nComment your score 👇", 'twins',
             'Ethiopia, Ghana', 'or Bolivia? Name all 3'),
    'D7P3': ("Yellow, green, red. One is Myanmar, one is Lithuania 🔍\nWhich one is Lithuania: A or B?", 'flag',
             'Yellow, green, red.', 'Which one is Lithuania?'),
    'D7P4': ("Week finale 🏁 Name it before clue 3.\nHow many did you get right this week? Comment your total 👇", 'clue',
             'Week finale.', 'Name it before clue 3'),
    'D7P5': ("Spain or Thailand: which one is bigger? 🇪🇸🇹🇭\nIt’s closer than you think.", 'size',
             'Spain or Thailand:', 'which one is bigger?'),
}
POSTS = {pid: (f'{cap}\n{TAGS[tag]}', l1, l2) for pid, (cap, tag, l1, l2) in _P.items()}
for d, n in MAPN.items():
    POSTS[f'D{d}P2'] = (map_caption(n), f'Map challenge {n}:', f'{MAPR[n]}. Score __/5')
